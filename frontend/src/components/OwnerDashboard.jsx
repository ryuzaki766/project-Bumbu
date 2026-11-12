import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Layers, 
  FileSpreadsheet, 
  MessageSquare, 
  Calendar, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  Clock, 
  SlidersHorizontal,
  ExternalLink,
  DollarSign,
  PackageCheck,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';

export default function OwnerDashboard({ user, onDataChanged }) {
  const [activeTab, setActiveTab] = useState('ringkasan'); // 'ringkasan', 'stok-fefo', 'audit-log', 'whatsapp', 'ekspor'
  const [downloading, setDownloading] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [batches, setBatches] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  // Stock Opname modal state (FR-16)
  const [opnameBatch, setOpnameBatch] = useState(null);
  const [opnameNewQty, setOpnameNewQty] = useState('');
  const [opnameReason, setOpnameReason] = useState('');

  // Audit log filter
  const [logTypeFilter, setLogTypeFilter] = useState('');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Expanded batch rows
  const [expandedProducts, setExpandedProducts] = useState({});

  const loadAllOwnerData = async () => {
    setLoading(true);
    try {
      const [dashRes, batchRes, logsRes, notifRes, setRes, prodRes] = await Promise.all([
        api.getDashboardData(),
        api.getAllBatches(),
        api.getStockLogs(),
        api.getNotifications({ recipientType: 'OWNER' }),
        api.getSettings(),
        api.getProducts()
      ]);

      if (dashRes.success) setDashboardData(dashRes.data);
      if (batchRes.success) setBatches(batchRes.data);
      if (logsRes.success) setStockLogs(logsRes.data);
      if (notifRes.success) setNotifications(notifRes.data);
      if (setRes.success) setSettings(setRes.data);
      if (prodRes.success) setProductsList(prodRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllOwnerData();
  }, []);

  const toggleExpandProduct = (pId) => {
    setExpandedProducts(prev => ({ ...prev, [pId]: !prev[pId] }));
  };

  // Submit Stock Opname (FR-16)
  const handleSubmitOpname = async (e) => {
    e.preventDefault();
    if (!opnameBatch || opnameNewQty === '' || !opnameReason.trim()) {
      alert('Jumlah stok baru dan alasan wajib diisi (FR-16: Penyesuaian stok manual wajib mencantumkan alasan).');
      return;
    }

    try {
      const res = await api.adjustStockOpname({
        batchId: opnameBatch.id,
        newQty: Number(opnameNewQty),
        reason: opnameReason.trim(),
        actor: user?.name || settings?.ownerName || 'Owner'
      });

      if (res.success) {
        alert('Koreksi stok opname berhasil disimpan dan dicatat pada audit log!');
        setOpnameBatch(null);
        setOpnameNewQty('');
        setOpnameReason('');
        loadAllOwnerData();
        onDataChanged();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Gagal: ' + err.message);
    }
  };

  // Trigger Daily Summary WA (FR-20)
  const handleTriggerDailySummary = async () => {
    try {
      const res = await api.sendDailySummary();
      if (res.success) {
        alert('Ringkasan harian mutasi stok berhasil dikirim ke nomor WhatsApp Owner!');
        loadAllOwnerData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Gagal mengirim ringkasan harian: ' + err.message);
    }
  };

  // Download export dengan header Authorization (bukan link biasa)
  const handleDownload = async (type, format) => {
    const key = `${type}-${format}`;
    setDownloading(key);
    try {
      await api.downloadExport(type, format);
    } catch (err) {
      alert(err.message || 'Gagal mengunduh laporan.');
    } finally {
      setDownloading('');
    }
  };

  // Open Direct WhatsApp Link
  const openWhatsAppUrl = (phone, text) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  // Filtered Stock Logs
  const filteredLogs = stockLogs.filter(l => {
    const matchesType = !logTypeFilter || l.type === logTypeFilter;
    const matchesSearch = !logSearchQuery ||
      l.productName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      l.batchNumber.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      l.reference.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      l.actor.toLowerCase().includes(logSearchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-xs font-semibold text-amber-300 mb-2 border border-amber-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Owner & Management Control Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            Dashboard Eksekutif & Monitoring Alur Bumbu
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Real-time tracking stok, mutasi masuk/keluar, FEFO expiry warning, notifikasi WhatsApp, dan laporan keuangan COD.
          </p>
        </div>

        {/* Quick Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTriggerDailySummary}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            title="Kirim Ringkasan Harian Mutasi Stok ke WhatsApp Owner (FR-20)"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Kirim Ringkasan WA (FR-20)</span>
          </button>

          <button
            onClick={loadAllOwnerData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        {[
          { id: 'ringkasan', label: 'Ringkasan & Metrik (FR-24)', icon: BarChart3 },
          { id: 'stok-fefo', label: 'Stok & Batch FEFO (FR-28, 29)', icon: Layers },
          { id: 'audit-log', label: 'Audit Log Mutasi (FR-15, 16)', icon: Clock },
          { id: 'whatsapp', label: 'Log Notifikasi WhatsApp (FR-22)', icon: MessageSquare },
          { id: 'ekspor', label: 'Ekspor Excel / CSV (FR-25)', icon: FileSpreadsheet }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SUMMARY & METRICS (FR-24) */}
      {activeTab === 'ringkasan' && dashboardData && (
        <div className="space-y-6">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Fisik Stok */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-medium block">Total Stok Fisik Gudang</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">
                  {dashboardData.stockSummary.totalPhysicalStock}
                </span>
                <span className="text-[11px] font-bold text-slate-400">Semua Item</span>
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                <span>Tersedia: <strong>{dashboardData.stockSummary.totalAvailableStock}</strong></span>
                <span>Dicadangkan: <strong>{dashboardData.stockSummary.totalReservedStock}</strong></span>
              </div>
            </div>

            {/* Pendapatan COD */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-medium block">Total COD Diterima (Lunas)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-emerald-700">
                  Rp {dashboardData.financials.totalRevenueCOD.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="text-[11px] text-amber-700 pt-1 border-t border-slate-100 font-medium">
                Pending Tagihan COD: Rp {dashboardData.financials.pendingCOD.toLocaleString('id-ID')}
              </div>
            </div>

            {/* Stok Menipis */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-medium block">Produk Stok Menipis (FR-17)</span>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black ${
                  dashboardData.stockSummary.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'
                }`}>
                  {dashboardData.stockSummary.lowStockCount}
                </span>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Batas Min
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                {dashboardData.stockSummary.lowStockCount > 0
                  ? 'Perlu pesan ke supplier segera!'
                  : 'Seluruh stok di atas batas aman.'}
              </div>
            </div>

            {/* Near Expiry Batches */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-medium block">Batch Mendekati Kedaluwarsa (FR-29)</span>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black ${
                  dashboardData.stockSummary.nearExpiryBatchesCount > 0 ? 'text-rose-600' : 'text-slate-900'
                }`}>
                  {dashboardData.stockSummary.nearExpiryBatchesCount}
                </span>
                <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Prioritas FEFO
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                Kadaluwarsa: <strong>{dashboardData.stockSummary.expiredBatchesCount}</strong> batch terkunci
              </div>
            </div>
          </div>

          {/* Workflow Orders Status Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Distribusi Status Seluruh Pesanan (End-to-End Workflow)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: 'Menunggu Disiapkan', key: 'MENUNGGU_DISIAPKAN', color: 'bg-amber-100 text-amber-800' },
                { label: 'Siap Dipacking', key: 'SIAP_DIPACKING', color: 'bg-orange-100 text-orange-800' },
                { label: 'Sudah Dipacking', key: 'SUDAH_DIPACKING', color: 'bg-blue-100 text-blue-800' },
                { label: 'Sedang Dikirim', key: 'DIKIRIM', color: 'bg-indigo-100 text-indigo-800' },
                { label: 'Selesai (Lunas)', key: 'SELESAI', color: 'bg-emerald-100 text-emerald-800' },
                { label: 'Bermasalah', key: 'BERMASALAH', color: 'bg-rose-100 text-rose-800' }
              ].map(st => (
                <div key={st.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium block truncate">{st.label}</span>
                  <span className={`inline-block px-2 py-0.5 rounded-md font-extrabold text-sm ${st.color}`}>
                    {dashboardData.orderStatusCounts[st.key] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts Highlight */}
          {dashboardData.lowStockProducts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Peringatan Stok Menipis (FR-17, FR-21):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {dashboardData.lowStockProducts.map(p => (
                  <div key={p.id} className="bg-white p-3 rounded-xl border border-amber-200 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">{p.name}</div>
                      <div className="text-slate-500 text-[11px]">Batas Minimum: {p.minStock} {p.unit}</div>
                    </div>
                    <span className="font-black text-rose-600 text-sm">
                      {p.totalPhysicalStock} {p.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REAL-TIME STOCK & FEFO BATCHES (FR-28, FR-29, FR-16) */}
      {activeTab === 'stok-fefo' && dashboardData && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Stok Produk & Rincian Batch FEFO (First Expired First Out)
              </h3>
              <p className="text-xs text-slate-500">
                Klik produk untuk melihat rincian batch. Gunakan tombol 'Koreksi Stok Opname' untuk penyesuaian manual wajib alasan (FR-16).
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {dashboardData.stockSummary.totalProducts > 0 && dashboardData.recentLogs && (
              <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                <div className="divide-y divide-slate-100">
                  {productsList.map(prod => {
                    const productBatches = batches.filter(b => b.productId === prod.id);
                    const totalPhysical = prod.totalPhysicalStock !== undefined
                      ? prod.totalPhysicalStock
                      : productBatches.reduce((a, b) => a + b.currentQty, 0);
                    const isExpanded = !!expandedProducts[prod.id];

                    return (
                      <div key={prod.id} className="transition">
                        {/* Product Header Row */}
                        <div
                          onClick={() => toggleExpandProduct(prod.id)}
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 select-none text-xs"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{prod.name}</div>
                              <span className="text-[11px] text-slate-500">{prod.category} • {productBatches.length} batch</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-slate-400 block text-[10px]">TOTAL STOK FISIK</span>
                              <span className="font-extrabold text-slate-900 text-sm">
                                {totalPhysical} {prod.unit}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Batches List */}
                        {isExpanded && (
                          <div className="bg-slate-50/80 p-4 border-t border-slate-100 space-y-2">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                              Rincian Batch FEFO (Diurutkan dari kedaluwarsa terdekat):
                            </div>
                            {productBatches.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                                Belum ada batch barang masuk untuk produk ini.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {productBatches.map(batch => (
                                  <div
                                    key={batch.id}
                                    className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-2 shadow-2xs"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <span className="font-mono font-bold text-slate-900">
                                          {batch.batchNumber}
                                        </span>
                                        <div className="text-[11px] text-slate-500">
                                          Exp: {batch.expiryDate} ({batch.daysUntilExpiry} hari lagi)
                                        </div>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        batch.statusColor === 'red'
                                          ? 'bg-rose-100 text-rose-800'
                                          : batch.statusColor === 'amber'
                                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                            : 'bg-emerald-100 text-emerald-800'
                                      }`}>
                                        {batch.expiryStatus}
                                      </span>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                      <span className="text-slate-600 font-bold">
                                        Stok Batch: {batch.currentQty} {prod.unit}
                                      </span>

                                      <button
                                        onClick={() => {
                                          setOpnameBatch(batch);
                                          setOpnameNewQty(batch.currentQty);
                                          setOpnameReason('');
                                        }}
                                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                                        title="Koreksi Stok Opname Manual (FR-16)"
                                      >
                                        <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                                        <span>Koreksi Opname</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOG MUTASI STOK (FR-15, FR-16) */}
      {activeTab === 'audit-log' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari produk, batch, referensi, aktor..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Log Type Filters */}
            <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { id: '', label: 'Semua Mutasi' },
                { id: 'MASUK', label: '📦 Masuk (Supplier)' },
                { id: 'KELUAR', label: '🚚 Keluar (Pesanan)' },
                { id: 'RETUR', label: '🔄 Retur' },
                { id: 'KOREKSI_OPNAME', label: '⚖️ Opname' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setLogTypeFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    logTypeFilter === f.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Waktu & Tanggal</th>
                    <th className="p-3.5">Jenis</th>
                    <th className="p-3.5">Produk & Batch</th>
                    <th className="p-3.5">Perubahan (+/-)</th>
                    <th className="p-3.5">Stok Akhir</th>
                    <th className="p-3.5">Referensi</th>
                    <th className="p-3.5">Pelaku (Aktor)</th>
                    <th className="p-3.5">Catatan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        <div>{new Date(l.timestamp).toLocaleTimeString('id-ID')} WIB</div>
                        <div className="text-[10px] text-slate-400">{new Date(l.timestamp).toLocaleDateString('id-ID')}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          l.type === 'MASUK'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.type === 'KELUAR'
                              ? 'bg-blue-100 text-blue-800'
                              : l.type === 'RETUR'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                        }`}>
                          {l.type}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{l.productName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{l.batchNumber}</div>
                      </td>
                      <td className="p-3.5 font-bold font-mono text-xs">
                        <span className={l.qtyChange > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {l.qtyChange > 0 ? `+${l.qtyChange}` : l.qtyChange}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 font-mono">
                        {l.stockAfter}
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">
                        {l.reference}
                      </td>
                      <td className="p-3.5 text-slate-700 font-semibold">
                        {l.actor}
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px] max-w-xs">
                        {l.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WHATSAPP NOTIFICATION CENTER (FR-18, FR-19, FR-20, FR-21, FR-22) */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-4">
          <div className="bg-emerald-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Saluran Notifikasi WhatsApp Owner (FR-22)</h3>
              </div>
              <p className="text-xs text-emerald-200 mt-1">
                Nomor Tujuan Owner: <strong>{settings?.ownerPhone || '081288990011'}</strong> • Provider: {settings?.whatsappProvider}
              </p>
            </div>

            <button
              onClick={handleTriggerDailySummary}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <span>Test Kirim Ringkasan Harian (FR-20)</span>
            </button>
          </div>

          {/* List of Sent WhatsApp Messages */}
          <div className="space-y-3">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 hover:border-emerald-300 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-slate-900 text-xs">
                      {notif.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      STATUS: {notif.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(notif.createdAt).toLocaleTimeString('id-ID')} WIB ({new Date(notif.createdAt).toLocaleDateString('id-ID')})
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono text-xs whitespace-pre-line text-slate-800">
                  {notif.message}
                </div>

                <div className="flex justify-between items-center pt-1 text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Dikirim ke: <strong>{notif.recipientPhone}</strong> ({notif.recipientType})
                  </span>

                  <button
                    onClick={() => openWhatsAppUrl(notif.recipientPhone, notif.message)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Buka Pesan di WhatsApp (wa.me)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: EXPORT TO EXCEL / CSV (FR-25) */}
      {activeTab === 'ekspor' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Ekspor Laporan ke Excel / CSV (FR-25)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Unduh data operasional lengkap dalam format spreadsheet Microsoft Excel (.xlsx) atau CSV untuk keperluan rekapitulasi, pembukuan, atau audit fisik.
            </p>
          </div>

          <div className="space-y-4">
            {/* Report 1: Stock & Batch */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-slate-800 text-xs">1. Laporan Stok & Batch Saat Ini</h4>
                <p className="text-[11px] text-slate-500">Rincian per produk, nomor batch, sisa masa kedaluwarsa, harga eceran & grosir.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload('stock', 'xlsx')}
                  disabled={downloading === 'stock-xlsx'}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  {downloading === 'stock-xlsx' ? 'Mengunduh...' : 'Unduh .xlsx'}
                </button>
                <button
                  onClick={() => handleDownload('stock', 'csv')}
                  disabled={downloading === 'stock-csv'}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-60 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  {downloading === 'stock-csv' ? 'Mengunduh...' : '.csv'}
                </button>
              </div>
            </div>

            {/* Report 2: Stock Logs */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-slate-800 text-xs">2. Laporan Riwayat Mutasi Stok</h4>
                <p className="text-[11px] text-slate-500">Log lengkap barang masuk, keluar pesanan, retur, dan penyesuaian stok opname beserta aktor.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload('logs', 'xlsx')}
                  disabled={downloading === 'logs-xlsx'}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  {downloading === 'logs-xlsx' ? 'Mengunduh...' : 'Unduh .xlsx'}
                </button>
                <button
                  onClick={() => handleDownload('logs', 'csv')}
                  disabled={downloading === 'logs-csv'}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-60 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  {downloading === 'logs-csv' ? 'Mengunduh...' : '.csv'}
                </button>
              </div>
            </div>

            {/* Report 3: Orders & COD */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-slate-800 text-xs">3. Rekapitulasi Pesanan & Pembayaran COD</h4>
                <p className="text-[11px] text-slate-500">Daftar transaksi, nama customer, alamat, kurir penjemput, dan status pelunasan COD.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload('orders', 'xlsx')}
                  disabled={downloading === 'orders-xlsx'}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  {downloading === 'orders-xlsx' ? 'Mengunduh...' : 'Unduh .xlsx'}
                </button>
                <button
                  onClick={() => handleDownload('orders', 'csv')}
                  disabled={downloading === 'orders-csv'}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-60 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  {downloading === 'orders-csv' ? 'Mengunduh...' : '.csv'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STOCK OPNAME ADJUSTMENT (FR-16) */}
      {opnameBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-purple-700">
              <SlidersHorizontal className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 text-base">
                Koreksi Stok Opname Manual (FR-16)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Koreksi fisik untuk produk <strong>{opnameBatch.productName}</strong> (Batch: <code>{opnameBatch.batchNumber}</code>). Stok lama: <strong>{opnameBatch.currentQty}</strong>.
            </p>

            <form onSubmit={handleSubmitOpname} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Stok Fisik Baru (Hasil Hitung Opname) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={opnameNewQty}
                  onChange={(e) => setOpnameNewQty(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Koreksi (FR-16: Wajib Dicantumkan) *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Misal: Hasil stok opname fisik akhir pekan, ditemukan selisih timbangan atau kemasan rusak."
                  value={opnameReason}
                  onChange={(e) => setOpnameReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setOpnameBatch(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-xs"
                >
                  Simpan Koreksi & Catat Log (FR-16)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

