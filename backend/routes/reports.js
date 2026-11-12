import express from 'express';
import XLSX from 'xlsx';
import { db } from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET dashboard metrics (FR-24, khusus Owner)
router.get('/dashboard', authenticate, authorize('owner'), (req, res) => {
  try {
    const products = db.getProducts();
    const orders = db.data.orders;
    const logs = db.data.stockLogs;
    const batches = db.data.batches;

    const totalPhysicalStock = products.reduce((acc, p) => acc + p.totalPhysicalStock, 0);
    const totalReservedStock = products.reduce((acc, p) => acc + p.reservedStock, 0);
    const totalAvailableStock = products.reduce((acc, p) => acc + p.availableStock, 0);

    const lowStockCount = products.filter(p => p.isLowStock).length;
    const nearExpiryBatchesCount = products.reduce((acc, p) => acc + p.nearExpiryCount, 0);
    const expiredBatchesCount = products.reduce((acc, p) => acc + p.expiredCount, 0);

    // Order counts by status
    const orderStatusCounts = {
      MENUNGGU_DISIAPKAN: 0,
      SIAP_DIPACKING: 0,
      SUDAH_DIPACKING: 0,
      DIKIRIM: 0,
      SELESAI: 0,
      BERMASALAH: 0,
      DIBATALKAN: 0
    };

    let totalRevenueCOD = 0;
    let pendingCOD = 0;

    orders.forEach(o => {
      if (orderStatusCounts[o.status] !== undefined) {
        orderStatusCounts[o.status]++;
      }
      if (o.paymentStatus === 'LUNAS') {
        totalRevenueCOD += o.totalAmount;
      } else if (o.status !== 'DIBATALKAN') {
        pendingCOD += o.totalAmount;
      }
    });

    res.json({
      success: true,
      data: {
        stockSummary: {
          totalProducts: products.length,
          totalPhysicalStock,
          totalReservedStock,
          totalAvailableStock,
          lowStockCount,
          nearExpiryBatchesCount,
          expiredBatchesCount
        },
        orderStatusCounts,
        financials: {
          totalRevenueCOD,
          pendingCOD
        },
        recentLogs: logs.slice(0, 10),
        recentOrders: orders.slice(0, 5),
        lowStockProducts: products.filter(p => p.isLowStock)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET stock audit logs with filters (FR-15, khusus Owner)
router.get('/stock-logs', authenticate, authorize('owner'), (req, res) => {
  try {
    const { type, productId, search } = req.query;
    let list = [...db.data.stockLogs];

    if (type) {
      list = list.filter(l => l.type === type);
    }
    if (productId) {
      list = list.filter(l => l.productId === productId);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.productName.toLowerCase().includes(q) ||
        l.batchNumber.toLowerCase().includes(q) ||
        l.reference.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET export report to Excel / CSV (FR-25, khusus Owner)
router.get('/export/:type', authenticate, authorize('owner'), (req, res) => {
  try {
    const { type } = req.params; // 'stock', 'logs', 'orders'
    const format = req.query.format === 'csv' ? 'csv' : 'xlsx';

    let dataToExport = [];
    let sheetName = 'Data';

    if (type === 'stock') {
      sheetName = 'Laporan Stok & Batch';
      const now = new Date();
      dataToExport = db.data.batches.map(b => {
        const product = db.data.products.find(p => p.id === b.productId);
        const exp = new Date(b.expiryDate);
        const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
        return {
          'Kode Produk': b.productId,
          'Nama Produk': product ? product.name : '-',
          'Kategori': product ? product.category : '-',
          'Satuan': product ? product.unit : '-',
          'Nomor Batch': b.batchNumber,
          'Tanggal Kedaluwarsa': b.expiryDate,
          'Sisa Hari Kedaluwarsa': diffDays,
          'Stok Awal': b.initialQty,
          'Stok Fisik Saat Ini': b.currentQty,
          'Harga Eceran (Rp)': product ? product.priceRetail : 0,
          'Harga Grosir (Rp)': product ? product.priceWholesale : 0,
          'Supplier': b.supplierName || '-'
        };
      });
    } else if (type === 'logs') {
      sheetName = 'Riwayat Mutasi Stok';
      dataToExport = db.data.stockLogs.map(l => ({
        'Waktu': new Date(l.timestamp).toLocaleString('id-ID'),
        'Jenis Mutasi': l.type,
        'Nama Produk': l.productName,
        'Nomor Batch': l.batchNumber,
        'Jumlah Perubahan': l.qtyChange,
        'Stok Akhir': l.stockAfter,
        'Referensi': l.reference,
        'Pelaku (Aktor)': l.actor,
        'Catatan': l.notes
      }));
    } else if (type === 'orders') {
      sheetName = 'Rekap Pesanan';
      dataToExport = db.data.orders.map(o => ({
        'ID Pesanan': o.id,
        'Waktu Pesan': new Date(o.createdAt).toLocaleString('id-ID'),
        'Nama Customer': o.customerName,
        'No WhatsApp': o.customerPhone,
        'Tipe Akun': o.customerType,
        'Alamat': o.customerAddress,
        'Status Pesanan': o.status,
        'Status Bayar': o.paymentStatus,
        'Total Tagihan (Rp)': o.totalAmount,
        'Kurir Penjemput': o.courierName || '-',
        'Jumlah Item': o.items.length
      }));
    } else {
      return res.status(400).json({ success: false, message: 'Jenis laporan tidak valid (pilih: stock, logs, orders).' });
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: format === 'csv' ? 'csv' : 'xlsx' });

    const filename = `AlurBumbu_${sheetName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.${format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

