import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Printer, 
  Truck, 
  CheckCircle2, 
  Square, 
  CheckSquare, 
  User, 
  Clock, 
  Package,
  Layers,
  FileText
} from 'lucide-react';
import api from '../services/api';
import PrintSlipModal from './PrintSlipModal';

export default function PackingStaff({ user, onDataChanged }) {
  const [ordersToPack, setOrdersToPack] = useState([]);
  const [ordersWaitingPickup, setOrdersWaitingPickup] = useState([]);
  const [loading, setLoading] = useState(false);
  const staffName = user?.name || 'Staf Packing';

  // Selected order for printing slip
  const [slipOrder, setSlipOrder] = useState(null);

  // Form states per order: courier input
  const [courierInputs, setCourierInputs] = useState({});
  const [verificationChecks, setVerificationChecks] = useState({});

  const loadPackingOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getOrders();
      if (res.success) {
        // Orders ready for packing (FR-08)
        const ready = res.data.filter(o => o.status === 'SIAP_DIPACKING');
        // Orders already packed, waiting courier pickup & ship (FR-11)
        const packed = res.data.filter(o => o.status === 'SUDAH_DIPACKING');

        setOrdersToPack(ready);
        setOrdersWaitingPickup(packed);

        // Prepopulate courier name if exists
        const inputs = {};
        const checks = {};
        res.data.forEach(o => {
          if (o.courierName) inputs[o.id] = o.courierName;
          checks[o.id] = o.items.map(() => false);
        });
        setCourierInputs(prev => ({ ...inputs, ...prev }));
        setVerificationChecks(checks);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackingOrders();
  }, []);

  const toggleVerify = (orderId, idx) => {
    setVerificationChecks(prev => {
      const current = prev[orderId] || [];
      const updated = [...current];
      updated[idx] = !updated[idx];
      return { ...prev, [orderId]: updated };
    });
  };

  // Step 1: Pack order & assign courier (FR-08, FR-09, FR-10)
  const handlePackOrder = async (order) => {
    const courier = (courierInputs[order.id] || '').trim();
    if (!courier) {
      alert('Mohon catat nama kurir atau armada yang akan mengambil pesanan (FR-10).');
      return;
    }

    const checks = verificationChecks[order.id] || [];
    const allVerified = checks.length === order.items.length && checks.every(Boolean);
    if (!allVerified) {
      if (!window.confirm('Ada item yang belum dicentang pada verifikasi packing. Tetap simpan?')) {
        return;
      }
    }

    try {
      const res = await api.packOrder(order.id, {
        courierName: courier,
        actor: staffName,
        packNotes: 'Item dan kemasan diverifikasi utuh.'
      });

      if (res.success) {
        alert(`Pesanan #${order.id} berhasil ditandai SUDAH DIPACKING. Anda dapat mencetak slip pesanan sekarang.`);
        loadPackingOrders();
        onDataChanged();
      }
    } catch (e) {
      alert('Gagal memproses packing: ' + e.message);
    }
  };

  // Step 2: Handover to courier & Ship (Kurir jemput di gudang -> DIKIRIM) (FR-11, FR-14, FR-28)
  const handleShipOrder = async (order) => {
    const courier = courierInputs[order.id] || order.courierName || 'Kurir Jemput Sendiri';

    if (!window.confirm(
      `Konfirmasi Kurir "${courier}" mengambil pesanan #${order.id}?\n\n` +
      `Sistem akan secara otomatis:\n` +
      `1. Memotong stok dari batch kedaluwarsa terdekat (FEFO)\n` +
      `2. Mencatat mutasi keluar pada audit log\n` +
      `3. Mengirim notifikasi WhatsApp ke Owner & Customer!`
    )) {
      return;
    }

    try {
      const res = await api.shipOrder(order.id, {
        actor: staffName,
        courierName: courier
      });

      if (res.success) {
        alert(
          `Pesanan #${order.id} berhasil DIKIRIM!\n` +
          `• Stok otomatis terpotong secara FEFO\n` +
          `• Notifikasi WhatsApp terkirim ke Owner & Customer.`
        );
        loadPackingOrders();
        onDataChanged();
      } else {
        alert('Gagal pengiriman: ' + res.message);
      }
    } catch (e) {
      alert('Terjadi kesalahan: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-blue-200 mb-2">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Meja Kerja Packing & Serah Terima Kurir</span>
          </div>
          <h2 className="text-2xl font-black">Staf Packing: Verifikasi, Slip & Serah Kurir</h2>
          <p className="text-xs text-blue-200/90 mt-1">
            Verifikasi fisik bumbu, input kurir jemput, cetak slip pesanan, serahkan ke kurir (stok FEFO terpotong otomatis).
          </p>
        </div>

        {/* Staff Identity (dari sesi login) */}
        <div className="bg-black/20 p-2.5 rounded-2xl border border-white/10 text-xs">
          <span className="text-[11px] text-blue-200 block mb-1 font-semibold">Petugas Packing (akun login):</span>
          <div className="bg-white/90 text-slate-900 font-bold px-3 py-1.5 rounded-xl text-xs w-48 truncate">
            {staffName}
          </div>
        </div>
      </div>

      {/* Grid of 2 Sections: Ready for Packing VS Ready for Courier Pickup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: ORDERS READY FOR PACKING (FR-08, FR-09, FR-10) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <h3 className="font-extrabold text-slate-900 text-sm">
                1. Pesanan Siap Dipacking ({ordersToPack.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Verifikasi item & tentukan kurir</span>
          </div>

          {ordersToPack.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
              Tidak ada pesanan antre untuk dipacking.
            </div>
          ) : (
            <div className="space-y-4">
              {ordersToPack.map(order => {
                const checks = verificationChecks[order.id] || [];
                const allVerified = checks.length === order.items.length && checks.every(Boolean);

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-extrabold text-slate-900 text-sm">
                          {order.id}
                        </span>
                        <p className="text-xs text-slate-600 font-semibold mt-0.5">
                          {order.customerName} ({order.customerType})
                        </p>
                      </div>
                      <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                        COD: Rp {order.totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Verification Checklist (FR-09) */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                        <span>Verifikasi Item & Jumlah Sebelum Segel:</span>
                        <span className="text-blue-600 text-[11px]">
                          {checks.filter(Boolean).length}/{order.items.length} Sesuai
                        </span>
                      </div>
                      <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        {order.items.map((it, idx) => {
                          const isV = !!checks[idx];
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleVerify(order.id, idx)}
                              className={`w-full flex justify-between items-center p-2 rounded-lg text-xs text-left transition ${
                                isV
                                  ? 'bg-blue-50 text-blue-900 font-semibold border border-blue-200'
                                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isV ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                )}
                                <span>{it.productName}</span>
                              </div>
                              <span className="font-bold">{it.qty} {it.unit}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Courier Name Input (FR-10) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Catat Nama Kurir Penjemput (FR-10) *
                      </label>
                      <input
                        type="text"
                        placeholder="Misal: Budi (Kurir Toko) / Pak Joko (Kurir Reseller) / JNE"
                        value={courierInputs[order.id] || ''}
                        onChange={(e) => setCourierInputs({ ...courierInputs, [order.id]: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setSlipOrder({ ...order, courierName: courierInputs[order.id] || 'Belum diisi' })}
                        className="px-3 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Lihat Slip</span>
                      </button>

                      <button
                        onClick={() => handlePackOrder(order)}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tandai Sudah Dipacking (FR-10)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: ORDERS PACKED, WAITING COURIER PICKUP & SHIPMENT (FR-11, FR-14, FR-28) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <h3 className="font-extrabold text-slate-900 text-sm">
                2. Siap Serah Terima ke Kurir ({ordersWaitingPickup.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Kurir ambil di gudang → Dikirim</span>
          </div>

          {ordersWaitingPickup.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
              Belum ada pesanan yang menunggu diambil kurir.
            </div>
          ) : (
            <div className="space-y-4">
              {ordersWaitingPickup.map(order => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border-2 border-blue-100 p-5 shadow-xs space-y-4 bg-gradient-to-b from-blue-50/20 to-white"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-slate-900 text-sm">
                          {order.id}
                        </span>
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          SUDAH DIPACKING
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold mt-1">
                        Customer: {order.customerName}
                      </p>
                    </div>

                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      COD: Rp {order.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Courier Info Box */}
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs space-y-1">
                    <div className="font-bold text-blue-950 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Kurir Penjemput: {order.courierName}</span>
                    </div>
                    <p className="text-[11px] text-blue-800">
                      Barang sudah rapi dalam dus/kemasan bersegel dengan slip pesanan.
                    </p>
                  </div>

                  {/* Items summary */}
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Rincian: </span>
                    {order.items.map(i => `${i.productName} (${i.qty} ${i.unit})`).join(', ')}
                  </div>

                  {/* Handover & Ship Action */}
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSlipOrder(order)}
                      className="px-3 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition"
                    >
                      <Printer className="w-4 h-4 text-slate-500" />
                      <span>Cetak Slip Kurir</span>
                    </button>

                    <button
                      onClick={() => handleShipOrder(order)}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Serahkan ke Kurir & Berangkat (Dikirim)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slip Modal */}
      <PrintSlipModal
        order={slipOrder}
        isOpen={!!slipOrder}
        onClose={() => setSlipOrder(null)}
      />
    </div>
  );
}

