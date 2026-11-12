import express from 'express';
import { db } from '../db.js';
import { authenticate, authorize, getActor } from '../middleware/auth.js';

const router = express.Router();

function isOrderOwnedBy(order, user) {
  if (!order || !user) return false;
  if (order.customerUserId) return order.customerUserId === user.id;
  // Kompatibilitas pesanan lama yang belum memiliki customerUserId.
  return Boolean(user.phone && order.customerPhone && order.customerPhone === user.phone);
}

// GET all orders with optional filter and sorting
router.get('/', authenticate, (req, res) => {
  try {
    const { status, sort, phone, search } = req.query;
    let list = [...db.data.orders];

    // Customer hanya boleh melihat pesanan miliknya sendiri.
    if (req.user.role === 'customer') {
      list = list.filter(o => isOrderOwnedBy(o, req.user));
    }

    if (status) {
      list = list.filter(o => o.status === status);
    }

    if (phone) {
      list = list.filter(o => o.customerPhone.includes(phone));
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        (o.courierName && o.courierName.toLowerCase().includes(q))
      );
    }

    // FR-05: Gudang sorting: oldest first (FIFO)
    if (sort === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      // Default: newest first
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET order by ID (customer tracking FR-03, hanya untuk pemilik atau staf)
router.get('/:id', authenticate, (req, res) => {
  try {
    const order = db.data.orders.find(o => o.id.toUpperCase() === req.params.id.toUpperCase());
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    if (req.user.role === 'customer' && !isOrderOwnedBy(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke pesanan ini.'
      });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create order (FR-01, FR-02, FR-04, FR-26) - khusus customer terautentikasi
router.post('/', authenticate, authorize('customer'), (req, res) => {
  try {
    const { customerAddress, notes, items } = req.body;

    const customerName = req.user.name;
    const customerPhone = req.user.phone;
    const deliveryAddress = String(customerAddress || req.user.address || '').trim();
    const type = req.user.customerType === 'reseller' ? 'reseller' : 'perorangan';

    if (!customerName || !customerPhone || !deliveryAddress || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nama, No WhatsApp, Alamat pengiriman, dan minimal 1 item pesanan wajib diisi.'
      });
    }

    // Validate stock and compute totals atomically (FR-04, Section 7)
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = db.data.products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Produk dengan ID ${item.productId} tidak ditemukan.`
        });
      }

      const qty = parseInt(item.qty, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Jumlah untuk produk ${product.name} harus berupa angka positif.`
        });
      }

      const stockSummary = db.getProductStockSummary(product.id);
      if (qty > stockSummary.availableStock) {
        return res.status(400).json({
          success: false,
          message: `Stok produk "${product.name}" tidak mencukupi. Tersedia: ${stockSummary.availableStock} ${product.unit}, diminta: ${qty} ${product.unit}. (FR-04)`
        });
      }

      // Reseller gets wholesale price, perorangan gets retail price (FR-26)
      const unitPrice = type === 'reseller' ? product.priceWholesale : product.priceRetail;
      const subtotal = unitPrice * qty;
      totalAmount += subtotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        category: product.category,
        qty,
        price: unitPrice,
        subtotal,
        checked: false
      });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ORD-${dateStr}-${randCode}`;

    const newOrder = {
      id: orderId,
      customerUserId: req.user.id,
      customerName,
      customerPhone,
      customerAddress: deliveryAddress,
      customerType: type,
      notes: notes || '',
      status: 'MENUNGGU_DISIAPKAN', // Step 1
      paymentMethod: 'COD',
      paymentStatus: 'BELUM_LUNAS',
      courierName: null,
      courierPickedUpAt: null,
      items: orderItems,
      totalAmount,
      createdAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'MENUNGGU_DISIAPKAN',
          actor: `Customer (${customerName})`,
          timestamp: new Date().toISOString(),
          note: `Pesanan dibuat online dengan pembayaran COD. Stok otomatis dikunci/dicadangkan.`
        }
      ]
    };

    db.data.orders.unshift(newOrder);

    // Customer WhatsApp confirmation notification (FR-23)
    const itemsListText = orderItems.map(i => `• ${i.productName} (${i.qty} ${i.unit}) - Rp ${i.subtotal.toLocaleString('id-ID')}`).join('\n');
    const waCustomerMsg = `Terima kasih *${customerName}*! Pesanan bumbu Anda telah kami terima:\n\n` +
      `🧾 *ID Pesanan*: ${orderId}\n` +
      `👤 *Tipe*: ${type === 'reseller' ? 'Reseller (Kulakan Harga Grosir)' : 'Perorangan (Harga Eceran)'}\n` +
      `📦 *Rincian Pesanan*:\n${itemsListText}\n\n` +
      `💰 *Total Pembayaran COD*: *Rp ${totalAmount.toLocaleString('id-ID')}*\n` +
      `🚚 *Pengiriman*: Kurir jemput sendiri di gudang (Tanpa Ongkir)\n` +
      `📌 *Status*: Menunggu Disiapkan Staf Gudang\n\n` +
      `Anda dapat memantau status pesanan kapan saja di website kami dengan ID ${orderId}.`;

    db.addNotification({
      recipientType: 'CUSTOMER',
      recipientPhone: customerPhone,
      type: 'PESANAN_BARU',
      title: '🛒 Konfirmasi Pesanan Baru',
      message: waCustomerMsg
    });

    db.save();

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat dan stok telah dicadangkan.',
      data: newOrder
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST prepare order (Gudang -> Siap Dipacking) (FR-06)
router.post('/:id/prepare', authenticate, authorize('warehouse', 'owner'), (req, res) => {
  try {
    const order = db.data.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    if (order.status !== 'MENUNGGU_DISIAPKAN' && order.status !== 'BERMASALAH') {
      return res.status(400).json({
        success: false,
        message: `Hanya pesanan berstatus Menunggu Disiapkan atau Bermasalah yang dapat ditandai Siap Dipacking (Status saat ini: ${order.status}).`
      });
    }

    const { checklistItems } = req.body;
    const actor = getActor(req, 'Staf Gudang');

    // Update checked state if provided
    if (checklistItems && Array.isArray(checklistItems)) {
      order.items.forEach((item, idx) => {
        item.checked = checklistItems[idx] !== undefined ? !!checklistItems[idx] : true;
      });
    } else {
      order.items.forEach(item => { item.checked = true; });
    }

    order.status = 'SIAP_DIPACKING';
    order.statusHistory.push({
      status: 'SIAP_DIPACKING',
      actor: actor || 'Staf Gudang',
      timestamp: new Date().toISOString(),
      note: 'Item pesanan selesai disiapkan dari rak gudang dan diletakkan di meja packing.'
    });

    db.save();

    res.json({
      success: true,
      message: 'Pesanan berhasil ditandai Siap Dipacking.',
      data: order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST report shortage / issue during prep (FR-07)
router.post('/:id/report-issue', authenticate, authorize('warehouse', 'owner'), (req, res) => {
  try {
    const order = db.data.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    const { issueReason } = req.body;
    const actor = getActor(req, 'Staf Gudang');
    if (!issueReason) {
      return res.status(400).json({ success: false, message: 'Alasan masalah / kekurangan stok wajib diisi.' });
    }

    order.status = 'BERMASALAH';
    order.issueReason = issueReason;
    order.statusHistory.push({
      status: 'BERMASALAH',
      actor: actor || 'Staf Gudang',
      timestamp: new Date().toISOString(),
      note: `Kendala penyiapan dilaporkan: ${issueReason}`
    });

    // Notify Owner
    db.addNotification({
      recipientType: 'OWNER',
      type: 'KENDALA_PESANAN',
      title: '⚠️ Kendala Pesanan Gudang',
      message: `Peringatan: Pesanan #${order.id} untuk customer ${order.customerName} ditandai BERMASALAH oleh ${actor || 'Staf Gudang'}.\nAlasan: ${issueReason}`
    });

    db.save();

    res.json({
      success: true,
      message: 'Pesanan ditandai Bermasalah dan notifikasi telah dikirim ke Owner.',
      data: order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST pack order (Staf Packing -> Sudah Dipacking) (FR-08, FR-09, FR-10)
router.post('/:id/pack', authenticate, authorize('packing', 'owner'), (req, res) => {
  try {
    const order = db.data.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    if (order.status !== 'SIAP_DIPACKING') {
      return res.status(400).json({
        success: false,
        message: `Hanya pesanan berstatus Siap Dipacking yang dapat diproses packing (Status: ${order.status}).`
      });
    }

    const { courierName, packNotes } = req.body;
    const actor = getActor(req, 'Staf Packing');
    if (!courierName || courierName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nama kurir yang akan mengambil pesanan wajib dicatat (FR-10).'
      });
    }

    order.status = 'SUDAH_DIPACKING';
    order.courierName = courierName.trim();
    order.packNotes = packNotes || '';
    order.packedAt = new Date().toISOString();

    order.statusHistory.push({
      status: 'SUDAH_DIPACKING',
      actor: actor || 'Staf Packing',
      timestamp: new Date().toISOString(),
      note: `Pesanan selesai dipacking dan diverifikasi. Kurir penjemput: ${order.courierName}. Slip pesanan siap dicetak.`
    });

    db.save();

    res.json({
      success: true,
      message: 'Pesanan berhasil ditandai Sudah Dipacking.',
      data: order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST ship order (Kurir Ambil di Gudang -> DIKIRIM) (FR-11, FR-14, FR-28, FEFO)
router.post('/:id/ship', authenticate, authorize('packing', 'owner'), (req, res) => {
  try {
    const order = db.data.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    if (order.status !== 'SUDAH_DIPACKING' && order.status !== 'SIAP_DIPACKING') {
      return res.status(400).json({
        success: false,
        message: `Pesanan harus sudah dipacking sebelum diserahkan ke kurir (Status: ${order.status}).`
      });
    }

    const { courierName } = req.body;
    const actor = getActor(req, 'Staf Packing');
    if (courierName) {
      order.courierName = courierName;
    }

    if (!order.courierName) {
      return res.status(400).json({
        success: false,
        message: 'Nama kurir yang mengambil pesanan wajib diisi sebelum status Dikirim.'
      });
    }

    // ATOMIC STOCK DEDUCTION USING FEFO (FR-14, FR-28, FR-29)
    // 1. Check allocations for each item first to ensure sufficient stock
    const itemAllocations = [];
    for (const item of order.items) {
      try {
        const allocations = db.allocateFEFO(item.productId, item.qty);
        itemAllocations.push({ item, allocations });
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: `Gagal memproses FEFO untuk ${item.productName}: ${err.message}`
        });
      }
    }

    // Set status to DIKIRIM first to release reservation and maintain exact stock consistency
    order.status = 'DIKIRIM';
    order.courierPickedUpAt = new Date().toISOString();
    order.statusHistory.push({
      status: 'DIKIRIM',
      actor: actor || 'Staf Packing',
      timestamp: new Date().toISOString(),
      note: `Kurir ${order.courierName} telah mengambil pesanan dari gudang. Stok otomatis berkurang via FEFO.`
    });

    // 2. Apply batch deductions and add stock logs
    for (const { item, allocations } of itemAllocations) {
      item.fefoAllocations = allocations;

      for (const alloc of allocations) {
        const batch = db.data.batches.find(b => b.id === alloc.batchId);
        if (batch) {
          batch.currentQty -= alloc.qty;
        }

        const stockSummary = db.getProductStockSummary(item.productId);

        db.addStockLog({
          type: 'KELUAR',
          productId: item.productId,
          productName: item.productName,
          batchNumber: alloc.batchNumber,
          qtyChange: -alloc.qty,
          stockAfter: stockSummary.totalPhysicalStock,
          reference: order.id,
          actor: actor || 'Staf Packing (Serah Terima Kurir)',
          notes: `Pengiriman kurir: ${order.courierName} (Batch Exp: ${alloc.expiryDate})`
        });
      }

      // Check for low stock warning (FR-17, FR-21)
      const product = db.data.products.find(p => p.id === item.productId);
      const updatedStock = db.getProductStockSummary(item.productId);
      if (product && updatedStock.totalPhysicalStock <= product.minStock) {
        db.addNotification({
          recipientType: 'OWNER',
          type: 'STOK_MENIPIS',
          title: '⚠️ Peringatan Stok Menipis',
          message: `⚠️ *STOK MENIPIS*: Produk *${product.name}* tersisa *${updatedStock.totalPhysicalStock} ${product.unit}* (Batas Minimum: ${product.minStock} ${product.unit}). Segera lakukan pemesanan ke supplier!`
        });
      }
    }

    // Real-time WhatsApp Notification to Owner (FR-19, FR-22)
    const itemsSummary = order.items.map(i => {
      const p = db.data.products.find(prod => prod.id === i.productId);
      const currentStock = p ? db.getProductStockSummary(p.id).totalPhysicalStock : 0;
      return `• ${i.productName}: ${i.qty} ${i.unit} (Sisa Stok: ${currentStock} ${i.unit})`;
    }).join('\n');

    const waOwnerMsg = `🚚 *NOTIFIKASI BARANG KELUAR (PESANAN DIKIRIM)* 🚚\n\n` +
      `Halo Owner! Kurir telah mengambil pesanan di gudang:\n` +
      `• *ID Pesanan*: ${order.id}\n` +
      `• *Customer*: ${order.customerName} (${order.customerType.toUpperCase()})\n` +
      `• *Kurir Penjemput*: ${order.courierName}\n` +
      `• *Barang Keluar (FEFO)*:\n${itemsSummary}\n\n` +
      `• *Total Tagihan COD*: Rp ${order.totalAmount.toLocaleString('id-ID')}\n` +
      `• *Waktu Jemput*: ${new Date().toLocaleTimeString('id-ID')} WIB\n\n` +
      `_Sistem Otomatis Alur Bumbu_`;

    db.addNotification({
      recipientType: 'OWNER',
      type: 'BARANG_KELUAR',
      title: '🚚 Barang Keluar / Dikirim',
      message: waOwnerMsg
    });

    // Customer Notification (FR-23)
    const waCustomerMsg = `Halo *${order.customerName}*, pesanan Anda *#${order.id}* saat ini *SEDANG DIKIRIM* oleh kurir *${order.courierName}*.\n\n` +
      `Mohon siapkan uang pembayaran COD sebesar *Rp ${order.totalAmount.toLocaleString('id-ID')}* saat kurir tiba. Terima kasih!`;

    db.addNotification({
      recipientType: 'CUSTOMER',
      recipientPhone: order.customerPhone,
      type: 'CUSTOMER_DIKIRIM',
      title: '🚚 Pesanan Anda Sedang Dikirim',
      message: waCustomerMsg
    });

    db.save();

    res.json({
      success: true,
      message: 'Pesanan berhasil ditandai Dikirim. Stok otomatis berkurang secara FEFO dan notifikasi terkirim ke Owner & Customer.',
      data: order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST complete order (Customer confirms receipt) (FR-11)
router.post('/:id/complete', authenticate, authorize('admin', 'owner'), (req, res) => {
  try {
    const order = db.data.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    if (order.status !== 'DIKIRIM') {
      return res.status(400).json({
        success: false,
        message: `Hanya pesanan yang sedang Dikirim yang dapat diselesaikan (Status saat ini: ${order.status}).`
      });
    }

    const actor = getActor(req, 'Staf Admin');
    order.status = 'SELESAI';
    order.completedAt = new Date().toISOString();

    order.statusHistory.push({
      status: 'SELESAI',
      actor: actor || 'Customer / Admin',
      timestamp: new Date().toISOString(),
      note: 'Pesanan telah diterima oleh customer dengan baik.'
    });

    // Customer Notification (FR-23)
    db.addNotification({
      recipientType: 'CUSTOMER',
      recipientPhone: order.customerPhone,
      type: 'CUSTOMER_SELESAI',
      title: '✅ Pesanan Selesai Diterima',
      message: `Terima kasih *${order.customerName}*! Pesanan #${order.id} telah berstatus Selesai. Selamat memasak hidangan istimewa dengan rempah pilihan kami!`
    });

    db.save();

    res.json({
      success: true,
      message: 'Pesanan telah selesai diterima customer.',
      data: order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST record COD cash receipt (Admin) (FR-30)
router.post('/:id/pay-cod', authenticate, authorize('admin', 'owner'), (req, res) => {
  try {
    const order = db.data.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    if (order.status === 'DIBATALKAN' || order.status === 'DIRETUR') {
      return res.status(400).json({
        success: false,
        message: `Tidak dapat memproses pembayaran COD untuk pesanan berstatus ${order.status}.`
      });
    }

    if (order.paymentStatus === 'LUNAS') {
      return res.status(400).json({
        success: false,
        message: 'Pesanan ini sudah berstatus LUNAS sebelumnya.'
      });
    }

    if (!['DIKIRIM', 'SELESAI', 'SUDAH_DIPACKING'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Pembayaran COD hanya dapat dicatat saat pesanan sudah dipacking/dikirim/selesai (Status saat ini: ${order.status}).`
      });
    }

    const { amountReceived, paymentDate, notes } = req.body;
    const receivedBy = getActor(req, 'Staf Admin');
    const amount = Number(amountReceived || order.totalAmount);

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah uang COD yang diterima wajib diisi angka valid.' });
    }

    order.paymentStatus = 'LUNAS';
    order.paymentDetails = {
      amountReceived: amount,
      paidAt: paymentDate || new Date().toISOString(),
      receivedBy: receivedBy || 'Staf Admin',
      notes: notes || 'Pembayaran COD tunai diterima penuh.'
    };

    // If order was in DIKIRIM, also mark as SELESAI
    if (order.status === 'DIKIRIM') {
      order.status = 'SELESAI';
      order.completedAt = new Date().toISOString();
    }

    order.statusHistory.push({
      status: 'LUNAS',
      actor: receivedBy || 'Staf Admin',
      timestamp: new Date().toISOString(),
      note: `Penerimaan uang COD sebesar Rp ${amount.toLocaleString('id-ID')} dicatat lunas oleh ${receivedBy || 'Staf Admin'}.`
    });

    db.save();

    res.json({
      success: true,
      message: `Pembayaran COD sebesar Rp ${amount.toLocaleString('id-ID')} berhasil dicatat Lunas (FR-30).`,
      data: order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST cancel order before shipment (FR-12) - automatically releases reserved stock
router.post('/:id/cancel', authenticate, authorize('admin', 'owner', 'customer'), (req, res) => {
  try {
    const order = db.data.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    if (req.user.role === 'customer' && !isOrderOwnedBy(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Anda hanya dapat membatalkan pesanan milik Anda sendiri.'
      });
    }

    if (['DIKIRIM', 'SELESAI', 'DIBATALKAN'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Pesanan dengan status ${order.status} tidak dapat dibatalkan (FR-12: Pembatalan hanya sebelum pesanan dikirim).`
      });
    }

    const { reason } = req.body;
    const actor = getActor(req, 'Staf Admin');
    order.status = 'DIBATALKAN';
    order.cancelReason = reason || 'Dibatalkan oleh staf/customer';

    order.statusHistory.push({
      status: 'DIBATALKAN',
      actor: actor || 'Staf Admin / Customer',
      timestamp: new Date().toISOString(),
      note: `Pesanan dibatalkan. Stok yang dicadangkan otomatis dilepas kembali ke stok tersedia. Alasan: ${order.cancelReason}`
    });

    db.save();

    res.json({
      success: true,
      message: 'Pesanan berhasil dibatalkan dan stok yang dicadangkan telah dilepas otomatis (FR-12).',
      data: order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST return goods received at warehouse (Retur barang) (Section 7)
router.post('/:id/return', authenticate, authorize('admin', 'warehouse', 'owner'), (req, res) => {
  try {
    const order = db.data.orders.find(o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    const { returnReason } = req.body;
    const actor = getActor(req, 'Staf Gudang');
    if (!returnReason || returnReason.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Alasan retur barang wajib dicatat (Section 7 Aturan Bisnis Stok).' });
    }

    // Restore stock back into batches if order was already shipped
    if (order.status === 'DIKIRIM' || order.status === 'SELESAI') {
      for (const item of order.items) {
        if (item.fefoAllocations && Array.isArray(item.fefoAllocations) && item.fefoAllocations.length > 0) {
          // Restore exact quantities to allocated batches
          for (const alloc of item.fefoAllocations) {
            let targetBatch = db.data.batches.find(b => b.id === alloc.batchId || b.batchNumber === alloc.batchNumber);
            if (!targetBatch) {
              targetBatch = db.data.batches.find(b => b.productId === item.productId);
            }
            if (targetBatch) {
              targetBatch.currentQty += alloc.qty;
            }

            const stockSummary = db.getProductStockSummary(item.productId);
            db.addStockLog({
              type: 'RETUR',
              productId: item.productId,
              productName: item.productName,
              batchNumber: targetBatch ? targetBatch.batchNumber : alloc.batchNumber,
              qtyChange: alloc.qty,
              stockAfter: stockSummary.totalPhysicalStock,
              reference: `Retur: ${order.id}`,
              actor: actor || 'Staf Gudang',
              notes: `Retur barang diterima gudang. Alasan: ${returnReason}`
            });
          }
        } else {
          // Fallback to active batch for this product
          const batch = db.data.batches.find(b => b.productId === item.productId);
          if (batch) {
            batch.currentQty += item.qty;
          }

          const stockSummary = db.getProductStockSummary(item.productId);
          db.addStockLog({
            type: 'RETUR',
            productId: item.productId,
            productName: item.productName,
            batchNumber: batch ? batch.batchNumber : '-',
            qtyChange: item.qty,
            stockAfter: stockSummary.totalPhysicalStock,
            reference: `Retur: ${order.id}`,
            actor: actor || 'Staf Gudang',
            notes: `Retur barang diterima gudang. Alasan: ${returnReason}`
          });
        }
      }
    }

    order.status = 'DIRETUR';
    order.returnReason = returnReason;
    order.statusHistory.push({
      status: 'DIRETUR',
      actor: actor || 'Staf Gudang',
      timestamp: new Date().toISOString(),
      note: `Retur barang diproses dan stok dikembalikan ke sistem. Alasan: ${returnReason}`
    });

    db.save();

    res.json({
      success: true,
      message: 'Retur barang berhasil diproses dan stok telah ditambahkan kembali dengan alasan tercatat.',
      data: order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

