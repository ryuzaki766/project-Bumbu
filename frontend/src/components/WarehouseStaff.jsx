import React, { useState, useEffect } from 'react';
import { 
  Package, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  Truck, 
  PlusCircle, 
  Clock, 
  Calendar, 
  Layers, 
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

export default function WarehouseStaff({ user, products, onDataChanged }) {
  const [activeTab, setActiveTab] = useState('pesanan'); // 'pesanan', 'barang-masuk', 'batch-fefo'
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const staffName = user?.name || 'Staf Gudang';

  // Checklist state per order: { [orderId]: { [itemIndex]: boolean } }
  const [checklists, setChecklists] = useState({});

  // Issue reporting modal state
  const [reportingOrderId, setReportingOrderId] = useState(null);
  const [issueReason, setIssueReason] = useState('');

  // Goods-in form state (FR-13, FR-27)
  const [selectedProductId, setSelectedProductId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [qtyIn, setQtyIn] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [notesIn, setNotesIn] = useState('');
  const [goodsInMessage, setGoodsInMessage] = useState(null);

  // Load orders sorted oldest first (FR-05)
  const loadOrders = async () => {
    setLoading(true);
    try {
      // Fetch incoming orders with sort=oldest
      const res = await api.getOrders({ sort: 'oldest' });
      if (res.success) {
        // Filter orders that need preparation
        const needed = res.data.filter(o => o.status === 'MENUNGGU_DISIAPKAN' || o.status === 'BERMASALAH');
        setIncomingOrders(needed);

        // Initialize checklist state
        const initialChecks = {};
        needed.forEach(order => {
          initialChecks[order.id] = order.items.map(it => it.checked || false);
        });
        setChecklists(initialChecks);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const res = await api.getAllBatches();
      if (res.success) {
        setBatches(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadOrders();
    loadBatches();
  }, []);

  // Auto-generate batch number suggestion when product changes
  const handleProductSelect = (pId) => {
    setSelectedProductId(pId);
    const prod = products.find(p => p.id === pId);
    if (prod) {
      const prefix = prod.name.slice(0, 3).toUpperCase();
      const now = new Date();
      const ym = `${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const rand = Math.floor(10 + Math.random() * 90);
      setBatchNumber(`BMB-${prefix}-${ym}-${rand}`);
    }
  };

  // Toggle item check
  const toggleCheck = (orderId, itemIndex) => {
    setChecklists(prev => {
      const current = prev[orderId] || [];
      const updated = [...current];
      updated[itemIndex] = !updated[itemIndex];
      return { ...prev, [orderId]: updated };
    });
  };

  // Mark Ready for Packing (FR-06)
  const handleMarkReady = async (order) => {
    const checks = checklists[order.id] || [];
    const allChecked = checks.length === order.items.length && checks.every(c => c === true);

    if (!allChecked) {
      if (!window.confirm('Ada item yang belum dicentang pada checklist fisik. Tetap tandai Siap Dipacking?')) {
        return;
      }
    }

    try {
      const res = await api.prepareOrder(order.id, {
        actor: staffName,
        checklistItems: checks
      });
      if (res.success) {
        alert(`Pesanan #${order.id} berhasil ditandai Siap Dipacking!`);
        loadOrders();
        onDataChanged();
      }
    } catch (e) {
      alert('Gagal memperbarui status: ' + e.message);
    }
  };

  // Submit Shortage / Issue (FR-07)
  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    if (!issueReason.trim()) return;

    try {
      const res = await api.reportOrderIssue(reportingOrderId, {
        issueReason: issueReason.trim(),
        actor: staffName
      });
      if (res.success) {
        alert('Kendala pesanan berhasil dilaporkan dan notifikasi terkirim ke Owner.');
        setReportingOrderId(null);
        setIssueReason('');
        loadOrders();
        onDataChanged();
      }
    } catch (e) {
      alert('Gagal melaporkan kendala: ' + e.message);
    }
  };

  // Submit Goods In (FR-13, FR-27, FR-18)
  const handleGoodsInSubmit = async (e) => {
    e.preventDefault();
    setGoodsInMessage(null);

    if (!selectedProductId || !batchNumber || !expiryDate || !qtyIn || Number(qtyIn) <= 0) {
      setGoodsInMessage({ type: 'error', text: 'Mohon lengkapi semua kolom dengan benar.' });
      return;
    }

    try {
      const res = await api.recordGoodsIn({
        productId: selectedProductId,
        batchNumber: batchNumber.trim(),
        expiryDate,
        qty: Number(qtyIn),
        supplierName: supplierName.trim(),
        receiverName: staffName,
        notes: notesIn.trim()
      });

      if (res.success) {
        setGoodsInMessage({
          type: 'success',
          text: `${res.message}. Notifikasi WhatsApp otomatis terkirim ke Owner (FR-18)!`
        });
        // Reset form
        setSelectedProductId('');
        setBatchNumber('');
        setExpiryDate('');
        setQtyIn('');
        setSupplierName('');
        setNotesIn('');
        loadBatches();
        onDataChanged();
      } else {
        setGoodsInMessage({ type: 'error', text: res.message });
      }
    } catch (err) {
      setGoodsInMessage({ type: 'error', text: 'Kesalahan jaringan: ' + err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-900 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-amber-200 mb-2">
            <Package className="w-3.5 h-3.5" />
            <span>Dashboard Operasional Gudang</span>
          </div>
          <h2 className="text-2xl font-black">Staf Gudang: Penyiapan & Penerimaan Bumbu</h2>
          <p className="text-xs text-amber-200/90 mt-1">
            Penyiapan pesanan antrean FIFO tertua, checklist item, input barang masuk per batch (FEFO).
          </p>
        </div>

        {/* Staff Identity (dari sesi login) */}
        <div className="bg-black/20 p-2.5 rounded-2xl border border-white/10 text-xs">
          <span className="text-[11px] text-amber-300 block mb-1 font-semibold">Petugas Gudang (akun login):</span>
          <div className="bg-white/90 text-slate-900 font-bold px-3 py-1.5 rounded-xl text-xs w-48 truncate">
            {staffName}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pesanan')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'pesanan'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Antrean Penyiapan Pesanan FIFO (FR-05, FR-06)</span>
          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
            {incomingOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('barang-masuk')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'barang-masuk'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Catat Barang Masuk Supplier (FR-13, FR-27)</span>
        </button>

        <button
          onClick={() => setActiveTab('batch-fefo')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'batch-fefo'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Monitoring Batch & Kedaluwarsa (FR-28, FR-29)</span>
        </button>
      </div>

      {/* SUB-TAB 1: ORDER PREPARATION (FR-05, FR-06, FR-07) */}
      {activeTab === 'pesanan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Daftar pesanan masuk diurutkan otomatis dari yang paling lama masuk (FIFO).</span>
            <button
              onClick={loadOrders}
              className="text-amber-700 hover:underline font-bold"
            >
              Segarkan Daftar
            </button>
          </div>

          {incomingOrders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
              <p className="font-bold text-slate-700">Semua pesanan telah disiapkan!</p>
              <p className="text-xs text-slate-400 mt-1">Tidak ada pesanan tertunda di meja penyiapan gudang saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {incomingOrders.map(order => {
                const checks = checklists[order.id] || [];
                const allChecked = checks.length === order.items.length && checks.every(Boolean);

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition ${
                      order.status === 'BERMASALAH'
                        ? 'border-rose-300 ring-2 ring-rose-500/10'
                        : 'border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Card Header */}
                      <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-slate-900 text-base">
                              {order.id}
                            </span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              order.status === 'BERMASALAH'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Customer: <strong>{order.customerName}</strong> ({order.customerType})
                          </p>
                        </div>

                        {/* FIFO Time badge (FR-05) */}
                        <div className="text-right text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{new Date(order.createdAt).toLocaleTimeString('id-ID')} WIB</span>
                        </div>
                      </div>

                      {order.issueReason && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                          <strong>Kendala Sebelumnya:</strong> {order.issueReason}
                        </div>
                      )}

                      {/* Checklist items per order (FR-06) */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-700">
                            Checklist Pengambilan Barang dari Rak:
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {checks.filter(Boolean).length} dari {order.items.length} selesai
                          </span>
                        </div>

                        <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          {order.items.map((item, idx) => {
                            const isChecked = !!checks[idx];
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => toggleCheck(order.id, idx)}
                                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition border ${
                                  isChecked
                                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 line-through'
                                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                  )}
                                  <span className="font-semibold">{item.productName}</span>
                                </div>
                                <span className="font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-900">
                                  {item.qty} {item.unit}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {order.notes && (
                        <div className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                          Catatan Customer: "{order.notes}"
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => handleMarkReady(order)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs ${
                          allChecked
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Siap Dipacking (FR-06)</span>
                      </button>

                      <button
                        onClick={() => setReportingOrderId(order.id)}
                        className="px-3 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition"
                        title="Laporkan Stok Kurang / Rusak (FR-07)"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: GOODS IN / PENERIMAAN SUPPLIER (FR-13, FR-27, FR-18) */}
      {activeTab === 'barang-masuk' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-600" />
              <span>Formulir Penerimaan Barang Masuk dari Supplier</span>
            </h3>
            <p className="text-xs text-slate-500">
              Setiap barang masuk wajib dicatat per batch beserta tanggal kedaluwarsa. Stok bertambah otomatis dan Owner menerima notifikasi WhatsApp secara real-time.
            </p>
          </div>

          {goodsInMessage && (
            <div className={`p-4 rounded-2xl text-xs flex items-start gap-2.5 ${
              goodsInMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border border-rose-200 text-rose-900'
            }`}>
              {goodsInMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{goodsInMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleGoodsInSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Produk Rempah / Bumbu *
              </label>
              <select
                required
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                <option value="">-- Pilih Produk Bumbu --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit}) - Stok Fisik Saat Ini: {p.totalPhysicalStock}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Batch (FR-27) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: BMB-RDG-2611C"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Kedaluwarsa (FR-27) *
                </label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Barang Masuk *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Jumlah masuk (angka)"
                  value={qtyIn}
                  onChange={(e) => setQtyIn(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Supplier / Pengirim
                </label>
                <input
                  type="text"
                  placeholder="Misal: UD Rempah Nusantara Padang"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Penerimaan (Kondisi kemasan, no surat jalan, dll.)
              </label>
              <textarea
                rows={2}
                placeholder="Kemasan karung/dus utuh, segel baik"
                value={notesIn}
                onChange={(e) => setNotesIn(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-800 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-900/10 transition flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Simpan Penerimaan & Kirim Notifikasi WA ke Owner (FR-18)</span>
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: BATCH & EXPIRY MONITORING (FR-28, FR-29) */}
      {activeTab === 'batch-fefo' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Daftar Seluruh Batch & Status Kedaluwarsa FEFO (FR-28, FR-29)
              </h3>
              <p className="text-xs text-slate-500">
                Sistem otomatis mengurutkan batch berdasarkan tanggal kedaluwarsa terdekat. Batch kedaluwarsa dikunci dari pengiriman.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              Total {batches.length} Batch Aktif
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Produk</th>
                  <th className="p-3">No. Batch</th>
                  <th className="p-3">Tgl Kedaluwarsa</th>
                  <th className="p-3">Sisa Hari</th>
                  <th className="p-3">Stok Saat Ini</th>
                  <th className="p-3">Status FEFO</th>
                  <th className="p-3">Kelayakan Kirim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-800">{b.productName}</td>
                    <td className="p-3 font-mono font-bold text-slate-700">{b.batchNumber}</td>
                    <td className="p-3">{b.expiryDate}</td>
                    <td className="p-3 font-bold">
                      {b.daysUntilExpiry <= 0 ? (
                        <span className="text-rose-600">Lewat ({Math.abs(b.daysUntilExpiry)} hari)</span>
                      ) : (
                        <span>{b.daysUntilExpiry} hari</span>
                      )}
                    </td>
                    <td className="p-3 font-extrabold text-slate-900">
                      {b.currentQty} {b.productUnit}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.statusColor === 'red'
                          ? 'bg-rose-100 text-rose-800'
                          : b.statusColor === 'amber'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {b.expiryStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      {b.isShippable ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          ✓ Siap Kirim (FEFO)
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          ✕ Ditolak (Kedaluwarsa - FR-29)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Laporkan Kendala Stok / Masalah (FR-07) */}
      {reportingOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-slate-900">Laporkan Kendala Penyiapan (FR-07)</h3>
            </div>
            <p className="text-xs text-slate-500">
              Pesanan #{reportingOrderId} akan ditandai <strong>BERMASALAH</strong> dan notifikasi darurat akan langsung terkirim ke WhatsApp Owner.
            </p>

            <form onSubmit={handleSubmitIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Kendala / Kekurangan Stok Fisik: *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Misal: Stok fisik bumbu rendang di rak hanya ada 6 kg dari permintaan 10 kg, terdapat kemasan sobek."
                  value={issueReason}
                  onChange={(e) => setIssueReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setReportingOrderId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  Kirim Laporan Masalah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

