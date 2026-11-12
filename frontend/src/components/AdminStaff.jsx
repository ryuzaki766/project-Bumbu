import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  CheckCircle, 
  Banknote, 
  RotateCcw, 
  XCircle, 
  Search, 
  Calendar, 
  User, 
  AlertCircle,
  Truck,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import api from '../services/api';

export default function AdminStaff({ user, onDataChanged }) {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const staffName = user?.name || 'Staf Admin';

  // Modal Pay COD state (FR-30)
  const [payingOrder, setPayingOrder] = useState(null);
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Cancel order state (FR-12)
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Return order state (Section 7)
  const [returningOrder, setReturningOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('');

  const loadAdminOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminOrders();
  }, []);

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchesFilter = filterStatus === 'ALL'
      ? true
      : filterStatus === 'BELUM_LUNAS'
        ? o.paymentStatus !== 'LUNAS' && o.status !== 'DIBATALKAN'
        : filterStatus === 'LUNAS'
          ? o.paymentStatus === 'LUNAS'
          : o.status === filterStatus;

    const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.customerPhone.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  // Open Pay COD Modal (FR-30)
  const handleOpenPayModal = (order) => {
    setPayingOrder(order);
    setAmountReceived(order.totalAmount);
    setPaymentNotes('Uang pas tunai COD diserahkan kurir ke admin.');
  };

  // Submit COD Payment (FR-30)
  const handleSubmitCODPayment = async (e) => {
    e.preventDefault();
    if (!payingOrder) return;

    try {
      const res = await api.recordCODPayment(payingOrder.id, {
        amountReceived: Number(amountReceived),
        receivedBy: staffName,
        paymentDate: new Date().toISOString(),
        notes: paymentNotes
      });

      if (res.success) {
        alert(`Pembayaran COD pesanan #${payingOrder.id} berhasil dicatat Lunas!`);
        setPayingOrder(null);
        loadAdminOrders();
        onDataChanged();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Gagal memproses pembayaran: ' + err.message);
    }
  };

  // Confirm Delivery / Complete Order (FR-11)
  const handleConfirmReceived = async (order) => {
    if (!window.confirm(`Konfirmasi customer "${order.customerName}" telah menerima pesanan #${order.id}?`)) {
      return;
    }

    try {
      const res = await api.completeOrder(order.id, { actor: staffName });
      if (res.success) {
        alert(`Pesanan #${order.id} berhasil diselesaikan.`);
        loadAdminOrders();
        onDataChanged();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Gagal menyelesaikan pesanan: ' + err.message);
    }
  };

  // Cancel order before shipping (FR-12)
  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancellingOrder || !cancelReason.trim()) return;

    try {
      const res = await api.cancelOrder(cancellingOrder.id, {
        reason: cancelReason.trim(),
        actor: staffName
      });

      if (res.success) {
        alert('Pesanan berhasil dibatalkan dan stok yang dicadangkan telah dilepas otomatis (FR-12).');
        setCancellingOrder(null);
        setCancelReason('');
        loadAdminOrders();
        onDataChanged();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Gagal membatalkan pesanan: ' + err.message);
    }
  };

  // Return order after shipping (Section 7)
  const handleReturnOrder = async (e) => {
    e.preventDefault();
    if (!returningOrder || !returnReason.trim()) return;

    try {
      const res = await api.returnOrder(returningOrder.id, {
        returnReason: returnReason.trim(),
        actor: staffName
      });

      if (res.success) {
        alert('Retur barang berhasil diproses dan stok dikembalikan ke sistem dengan alasan tercatat (Section 7).');
        setReturningOrder(null);
        setReturnReason('');
        loadAdminOrders();
        onDataChanged();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Gagal memproses retur: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-200 mb-2">
            <Receipt className="w-3.5 h-3.5" />
            <span>Administrasi Keuangan & Penerimaan COD</span>
          </div>
          <h2 className="text-2xl font-black">Staf Admin: Pencatatan Pembayaran COD & Pelunasan</h2>
          <p className="text-xs text-emerald-200/90 mt-1">
            Pencatatan kas masuk COD dari kurir (FR-30), konfirmasi penerimaan, pembatalan & retur barang.
          </p>
        </div>

        {/* Staff Identity (dari sesi login) */}
        <div className="bg-black/20 p-2.5 rounded-2xl border border-white/10 text-xs">
          <span className="text-[11px] text-emerald-300 block mb-1 font-semibold">Petugas Admin (akun login):</span>
          <div className="bg-white/90 text-slate-900 font-bold px-3 py-1.5 rounded-xl text-xs w-48 truncate">
            {staffName}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari ID Pesanan / Customer / No WA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex overflow-x-auto w-full sm:w-auto gap-1.5">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'BELUM_LUNAS', label: '⏳ Belum Lunas COD' },
            { id: 'LUNAS', label: '✓ Lunas' },
            { id: 'DIKIRIM', label: 'Dikirim' },
            { id: 'SELESAI', label: 'Selesai' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                filterStatus === f.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">ID Pesanan</th>
                <th className="p-3.5">Customer & Kontak</th>
                <th className="p-3.5">Status Alur</th>
                <th className="p-3.5">Kurir Penjemput</th>
                <th className="p-3.5">Tagihan COD</th>
                <th className="p-3.5">Status Pembayaran (FR-30)</th>
                <th className="p-3.5 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada pesanan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const isLunas = order.paymentStatus === 'LUNAS';
                  const canCancel = ['MENUNGGU_DISIAPKAN', 'SIAP_DIPACKING', 'SUDAH_DIPACKING', 'BERMASALAH'].includes(order.status);
                  const canReturn = order.status === 'DIKIRIM' || order.status === 'SELESAI';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition">
                      {/* Order ID & Date */}
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        <div>{order.id}</div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {new Date(order.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{order.customerName}</div>
                        <div className="text-slate-500 text-[11px]">{order.customerPhone}</div>
                        <span className="text-[10px] font-semibold text-orange-700 uppercase">
                          {order.customerType}
                        </span>
                      </td>

                      {/* Workflow Status */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          order.status === 'SELESAI'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'DIKIRIM'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'BERMASALAH'
                                ? 'bg-rose-100 text-rose-800'
                                : order.status === 'DIBATALKAN'
                                  ? 'bg-slate-200 text-slate-600'
                                  : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Courier */}
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-700">
                          {order.courierName || '-'}
                        </span>
                      </td>

                      {/* Tagihan COD */}
                      <td className="p-3.5 font-bold text-slate-900 font-mono text-xs">
                        Rp {order.totalAmount.toLocaleString('id-ID')}
                      </td>

                      {/* Payment Status (FR-30) */}
                      <td className="p-3.5">
                        {isLunas ? (
                          <div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 w-max">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>LUNAS</span>
                            </span>
                            {order.paymentDetails && (
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Dicatat: {order.paymentDetails.receivedBy}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            BELUM LUNAS
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="p-3.5 text-right space-x-1.5">
                        {!isLunas && order.status !== 'DIBATALKAN' && (
                          <button
                            onClick={() => handleOpenPayModal(order)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-xs inline-flex items-center gap-1 transition"
                            title="Catat Penerimaan Uang COD (FR-30)"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Catat COD Lunas</span>
                          </button>
                        )}

                        {order.status === 'DIKIRIM' && (
                          <button
                            onClick={() => handleConfirmReceived(order)}
                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-xs inline-flex items-center gap-1 transition"
                            title="Konfirmasi Pesanan Diterima Customer (FR-11)"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Diterima</span>
                          </button>
                        )}

                        {canCancel && (
                          <button
                            onClick={() => setCancellingOrder(order)}
                            className="px-2 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold text-[11px] transition"
                            title="Batalkan Pesanan & Lepas Stok (FR-12)"
                          >
                            Batal
                          </button>
                        )}

                        {canReturn && (
                          <button
                            onClick={() => setReturningOrder(order)}
                            className="px-2 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold text-[11px] transition"
                            title="Retur Barang Diterima Gudang (Section 7)"
                          >
                            Retur
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: RECORD COD PAYMENT (FR-30) */}
      {payingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-emerald-700">
              <Banknote className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 text-base">
                Catat Penerimaan Uang COD 
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Catat uang tunai COD yang diserahkan kurir untuk pesanan <strong>#{payingOrder.id}</strong> ({payingOrder.customerName}).
            </p>

            <form onSubmit={handleSubmitCODPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Uang Tunai Diterima (Rp) *
                </label>
                <input
                  type="number"
                  required
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Penerima (akun login)
                </label>
                <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                  {staffName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Penerimaan Kas
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setPayingOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  Simpan Lunas (FR-30)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CANCEL ORDER (FR-12) */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 text-base">
                Pembatalan Pesanan (FR-12)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Pembatalan sebelum pesanan dikirim akan <strong>melepas stok yang dicadangkan secara otomatis</strong> kembali ke stok tersedia.
            </p>

            <form onSubmit={handleCancelOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Pembatalan *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Misal: Customer membatalkan sebelum kurir jalan."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  Konfirmasi Batal & Lepas Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RETURN ORDER (Section 7) */}
      {returningOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-amber-600">
              <RotateCcw className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 text-base">
                Proses Retur Barang (Section 7 Aturan Bisnis)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Retur barang yang diterima gudang akan menambah stok kembali dengan alasan yang wajib dicatat di audit log.
            </p>

            <form onSubmit={handleReturnOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Retur Barang * (Wajib dicatat)
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Misal: Salah ukuran kemasan, bumbu basah dikembalikan customer utuh dan dimasukkan kembali ke stok."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setReturningOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  Simpan Retur & Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

