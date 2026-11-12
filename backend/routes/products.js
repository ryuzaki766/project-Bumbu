import express from 'express';
import { db } from '../db.js';
import { authenticate, authorize, getActor } from '../middleware/auth.js';

const router = express.Router();

// GET all products
router.get('/', (req, res) => {
  try {
    const products = db.getProducts();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single product
router.get('/:id', (req, res) => {
  try {
    const product = db.getProducts().find(p => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }
    const batches = db.data.batches.filter(b => b.productId === req.params.id);
    res.json({ success: true, data: { ...product, batches } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create product (khusus Owner)
router.post('/', authenticate, authorize('owner'), (req, res) => {
  try {
    const { name, category, unit, priceRetail, priceWholesale, minStock, description, icon } = req.body;
    if (!name || !unit || !priceRetail || !priceWholesale) {
      return res.status(400).json({ success: false, message: 'Nama, satuan, harga eceran, dan harga grosir wajib diisi.' });
    }

    const newProduct = {
      id: 'prod-' + Date.now(),
      name,
      category: category || 'Bumbu Kering / Bubuk',
      unit,
      priceRetail: Number(priceRetail),
      priceWholesale: Number(priceWholesale),
      minStock: Number(minStock) || 10,
      description: description || '',
      icon: icon || '🌶️'
    };

    db.data.products.push(newProduct);
    db.save();
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST goods in / penerimaan supplier (FR-13, FR-27, FR-18)
router.post('/goods-in', authenticate, authorize('warehouse', 'owner'), (req, res) => {
  try {
    const { productId, batchNumber, expiryDate, qty, supplierName, notes } = req.body;
    const receiverName = getActor(req, 'Staf Gudang');

    if (!productId || !batchNumber || !expiryDate || !qty || Number(qty) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Produk, Nomor Batch, Tanggal Kedaluwarsa, dan Jumlah Masuk valid wajib diisi.'
      });
    }

    const product = db.data.products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    const quantityNum = Number(qty);

    // Check if batch already exists for this product
    let batch = db.data.batches.find(b => b.productId === productId && b.batchNumber.trim().toUpperCase() === batchNumber.trim().toUpperCase());

    if (batch) {
      batch.currentQty += quantityNum;
      batch.initialQty += quantityNum;
      batch.expiryDate = expiryDate; // update expiry if provided
    } else {
      batch = {
        id: 'batch-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        productId,
        batchNumber: batchNumber.trim().toUpperCase(),
        expiryDate,
        initialQty: quantityNum,
        currentQty: quantityNum,
        supplierName: supplierName || 'Supplier Mitra',
        receivedAt: new Date().toISOString()
      };
      db.data.batches.push(batch);
    }

    const stockSummary = db.getProductStockSummary(productId);

    // Add Audit Log (FR-15)
    db.addStockLog({
      type: 'MASUK',
      productId: product.id,
      productName: product.name,
      batchNumber: batch.batchNumber,
      qtyChange: quantityNum,
      stockAfter: stockSummary.totalPhysicalStock,
      reference: `Penerimaan Supplier: ${supplierName || 'Umum'}`,
      actor: receiverName || 'Staf Gudang',
      notes: notes || `Batch ${batch.batchNumber}, Exp: ${expiryDate}`
    });

    // Send WhatsApp notification to Owner (FR-18, FR-22)
    const waMessage = `📦 *NOTIFIKASI BARANG MASUK* 📦\n\n` +
      `Halo Owner, staf gudang baru saja mencatat barang masuk:\n` +
      `• *Produk*: ${product.name}\n` +
      `• *Nomor Batch*: ${batch.batchNumber}\n` +
      `• *Tanggal Kedaluwarsa*: ${expiryDate}\n` +
      `• *Jumlah Masuk*: +${quantityNum} ${product.unit}\n` +
      `• *Supplier*: ${supplierName || '-'}\n` +
      `• *Total Stok Sekarang*: ${stockSummary.totalPhysicalStock} ${product.unit}\n` +
      `• *Dicatat Oleh*: ${receiverName || 'Staf Gudang'}\n` +
      `• *Waktu*: ${new Date().toLocaleString('id-ID')}\n\n` +
      `_Sistem Otomatis Alur Bumbu_`;

    db.addNotification({
      recipientType: 'OWNER',
      type: 'BARANG_MASUK',
      title: '📦 Notifikasi Barang Masuk',
      message: waMessage
    });

    db.save();

    res.json({
      success: true,
      message: `Berhasil menambahkan ${quantityNum} ${product.unit} ke batch ${batch.batchNumber}`,
      data: {
        batch,
        newStock: stockSummary
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Manual stock opname adjustment (FR-16) - mandatory reason (khusus Owner)
router.post('/adjust-stock', authenticate, authorize('owner'), (req, res) => {
  try {
    const { batchId, newQty, reason } = req.body;
    const actor = getActor(req, 'Owner');

    if (!batchId || newQty === undefined || newQty === null || !reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Batch, Jumlah Stok Baru, dan Alasan Koreksi Wajib diisi (FR-16: Penyesuaian stok manual wajib mencantumkan alasan).'
      });
    }

    const batch = db.data.batches.find(b => b.id === batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch tidak ditemukan.' });
    }

    const product = db.data.products.find(p => p.id === batch.productId);
    const newQtyNum = Number(newQty);
    if (newQtyNum < 0) {
      return res.status(400).json({ success: false, message: 'Stok tidak boleh bernilai negatif.' });
    }

    const diff = newQtyNum - batch.currentQty;
    const oldQty = batch.currentQty;
    batch.currentQty = newQtyNum;

    const stockSummary = db.getProductStockSummary(batch.productId);

    // Audit Log (FR-15, FR-16)
    db.addStockLog({
      type: 'KOREKSI_OPNAME',
      productId: product ? product.id : batch.productId,
      productName: product ? product.name : 'Produk',
      batchNumber: batch.batchNumber,
      qtyChange: diff,
      stockAfter: stockSummary.totalPhysicalStock,
      reference: 'Stok Opname / Koreksi Fisik',
      actor: actor || 'Owner / Admin',
      notes: `Koreksi dari ${oldQty} menjadi ${newQtyNum}. Alasan: ${reason}`
    });

    // Notify owner if adjustment was made
    db.addNotification({
      recipientType: 'OWNER',
      type: 'OPNAME_ADJUSTMENT',
      title: '⚖️ Penyesuaian Stok Opname',
      message: `Perubahan stok manual pada produk ${product ? product.name : ''} (Batch: ${batch.batchNumber}):\n` +
        `• Stok Lama: ${oldQty}\n• Stok Baru: ${newQtyNum} (Selisih: ${diff > 0 ? '+' : ''}${diff})\n` +
        `• Alasan: ${reason}\n• Oleh: ${actor || 'Owner / Admin'}`
    });

    db.save();

    res.json({
      success: true,
      message: 'Koreksi stok berhasil disimpan beserta audit log.',
      data: { batch, newStock: stockSummary }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all batches with FEFO status (khusus staf & owner)
router.get('/batches/all', authenticate, authorize('warehouse', 'packing', 'admin', 'owner'), (req, res) => {
  try {
    const now = new Date();
    const warningDays = db.data.settings.warningDaysExpiry || 30;

    const enrichedBatches = db.data.batches.map(b => {
      const product = db.data.products.find(p => p.id === b.productId);
      const exp = new Date(b.expiryDate);
      const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

      let expiryStatus = 'Aman';
      let statusColor = 'green';

      if (diffDays <= 0) {
        expiryStatus = 'Kedaluwarsa';
        statusColor = 'red';
      } else if (diffDays <= warningDays) {
        expiryStatus = `Mendekati Kedaluwarsa (${diffDays} hari)`;
        statusColor = 'amber';
      }

      return {
        ...b,
        productName: product ? product.name : 'Unknown',
        productUnit: product ? product.unit : '',
        productCategory: product ? product.category : '',
        daysUntilExpiry: diffDays,
        expiryStatus,
        statusColor,
        isShippable: diffDays > 0 // FR-29: batch expired cannot be shipped
      };
    });

    // Sort by expiry date ascending (FEFO priority)
    enrichedBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    res.json({ success: true, data: enrichedBatches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

