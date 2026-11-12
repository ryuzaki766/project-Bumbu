import express from 'express';
import { db } from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET all WhatsApp notifications (Admin & Owner)
router.get('/whatsapp', authenticate, authorize('admin', 'owner'), (req, res) => {
  try {
    const { recipientType, limit } = req.query;
    let list = [...db.data.notifications];

    if (recipientType) {
      list = list.filter(n => n.recipientType === recipientType);
    }

    if (limit) {
      list = list.slice(0, parseInt(limit, 10));
    }

    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET settings (khusus Owner)
router.get('/settings', authenticate, authorize('owner'), (req, res) => {
  try {
    res.json({ success: true, data: db.data.settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update settings (khusus Owner)
router.put('/settings', authenticate, authorize('owner'), (req, res) => {
  try {
    const { ownerPhone, ownerName, warningDaysExpiry, autoSendWhatsapp } = req.body;

    if (ownerPhone) db.data.settings.ownerPhone = ownerPhone;
    if (ownerName) db.data.settings.ownerName = ownerName;
    if (warningDaysExpiry) db.data.settings.warningDaysExpiry = Number(warningDaysExpiry);
    if (autoSendWhatsapp !== undefined) db.data.settings.autoSendWhatsapp = !!autoSendWhatsapp;

    db.save();

    res.json({
      success: true,
      message: 'Pengaturan WhatsApp dan notifikasi berhasil diperbarui.',
      data: db.data.settings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST send daily summary to Owner (FR-20, khusus Owner)
router.post('/whatsapp/daily-summary', authenticate, authorize('owner'), (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Compute today's in and out
    const todayLogs = db.data.stockLogs.filter(l => l.timestamp.startsWith(today));
    const inLogs = todayLogs.filter(l => l.type === 'MASUK');
    const outLogs = todayLogs.filter(l => l.type === 'KELUAR');

    let summaryDetail = '';
    const productsMap = {};

    todayLogs.forEach(l => {
      if (!productsMap[l.productName]) {
        productsMap[l.productName] = { in: 0, out: 0 };
      }
      if (l.type === 'MASUK') {
        productsMap[l.productName].in += Math.abs(l.qtyChange);
      } else if (l.type === 'KELUAR') {
        productsMap[l.productName].out += Math.abs(l.qtyChange);
      }
    });

    const entries = Object.entries(productsMap);
    if (entries.length === 0) {
      summaryDetail = 'Belum ada mutasi barang yang dicatat hari ini.';
    } else {
      summaryDetail = entries.map(([pName, counts]) =>
        `• *${pName}*:\n   Masuk: +${counts.in} | Keluar: -${counts.out}`
      ).join('\n');
    }

    const message = `📊 *RINGKASAN HARIAN MUTASI BARANG (FR-20)* 📊\n` +
      `Tanggal: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n\n` +
      `Ringkasan Per Produk:\n${summaryDetail}\n\n` +
      `Total Aktivitas: ${inLogs.length} penerimaan masuk, ${outLogs.length} pengiriman keluar.\n` +
      `_Sistem Otomatis Alur Bumbu_`;

    const notif = db.addNotification({
      recipientType: 'OWNER',
      type: 'RINGKASAN_HARIAN',
      title: '📊 Ringkasan Harian Mutasi Stok',
      message
    });

    res.json({
      success: true,
      message: 'Ringkasan harian berhasil dibuat dan dikirim ke nomor Owner via WhatsApp.',
      data: notif
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

