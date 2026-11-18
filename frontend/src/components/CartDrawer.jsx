import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Truck, 
  Banknote, 
  ShieldCheck, 
  CheckCircle,
  AlertCircle,
  Layers,
  Sparkles,
  Clock
} from 'lucide-react';
import api from '../services/api';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cart, 
  setCart, 
  customerType, 
  user,
  onOrderCreated 
}) {
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerAddress, setCustomerAddress] = useState(user?.address || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  // Kalkulasi pesanan per kategori bumbu
  const qtyCat47k = cart
    .filter(item => {
      const p = item.price;
      return item.spiceCategoryGroup === 'CAT_47K' || p === 47000 || p === 24000 || p === 12750;
    })
    .reduce((acc, it) => acc + it.qty, 0);

  const qtyCat43k = cart
    .filter(item => {
      const p = item.price;
      return item.spiceCategoryGroup === 'CAT_43K' || p === 43000 || p === 22000 || p === 11750;
    })
    .reduce((acc, it) => acc + it.qty, 0);

  const updateQty = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.qty + delta;
        if (newQty <= 0) return null;
        if (newQty > item.maxStock) {
          alert(`Maksimal stok tersedia adalah ${item.maxStock} ${item.unit}.`);
          return item;
        }
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeItem = (productId) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (cart.length === 0) {
      setErrorMessage('Keranjang belanja Anda masih kosong.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setErrorMessage('Mohon lengkapi Nama, Nomor WhatsApp, dan Alamat Pengiriman.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        customerType,
        notes: notes.trim(),
        items: cart.map(i => ({
          productId: i.productId,
          qty: i.qty,
          isPreOrder: Boolean(i.isPreOrder)
        }))
      };

      const res = await api.createOrder(payload);
      if (res.success) {
        setCart([]);
        // Kembalikan form ke data profil akun.
        setCustomerName(user?.name || '');
        setCustomerPhone(user?.phone || '');
        setCustomerAddress(user?.address || '');
        setNotes('');
        setErrorMessage('');
        onOrderCreated(res.data);
        onClose();
      } else {
        setErrorMessage(res.message || 'Gagal membuat pesanan.');
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan jaringan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-600" />
            <h2 className="font-extrabold text-slate-900 text-base">Keranjang & Checkout COD</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cart items list */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Item Pesanan ({cart.length})
            </h3>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Keranjang masih kosong. Pilih rempah dari katalog!
              </div>
            ) : (
              <div className="space-y-2.5">
                {cart.map(item => (
                  <div
                    key={item.productId}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-slate-800">{item.productName}</h4>
                        {item.isPreOrder && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                            Pre-Order
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Rp {item.price.toLocaleString('id-ID')} / {item.unit}
                      </div>
                      <div className="font-bold text-orange-700 mt-1">
                        Subtotal: Rp {(item.price * item.qty).toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* Qty controller */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-lg">
                      <button
                        onClick={() => updateQty(item.productId, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-slate-800">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.productId, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Form */}
          {cart.length > 0 && (
            <form onSubmit={handleCheckout} id="checkout-form" className="space-y-4 pt-4 border-t border-slate-200">
              {/* Rekapitulasi Standar Kategori Bumbu Masak & Kuota Pesanan */}
              <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-700" />
                    <span>Kategori &amp; Kuota Produksi Bumbu</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    {customerType === 'reseller' ? 'Customer Reseller (Grosir)' : 'Customer Umum (Eceran)'}
                  </span>
                </div>

                {/* Tabel mini rekap 3 baris */}
                <div className="overflow-hidden rounded-xl border border-amber-200/80 bg-white text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-amber-100/60 text-amber-950 font-bold border-b border-amber-200">
                      <tr>
                        <th className="py-1.5 px-2">Kategori</th>
                        <th className="py-1.5 px-1 text-center">Jenis</th>
                        <th className="py-1.5 px-1 text-center">Hitung</th>
                        <th className="py-1.5 px-2 text-right">Total</th>
                        <th className="py-1.5 px-2 text-right">Dipesan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 text-slate-700">
                      <tr>
                        <td className="py-1.5 px-2 font-medium">Rp 47.000/kg (1-9)</td>
                        <td className="py-1.5 px-1 text-center">9</td>
                        <td className="py-1.5 px-1 text-center font-mono text-[10px]">9 × 500</td>
                        <td className="py-1.5 px-2 text-right font-bold text-amber-800">4.500 pcs</td>
                        <td className="py-1.5 px-2 text-right font-bold text-orange-600">{qtyCat47k} pcs</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-medium">Rp 43.000/kg (10-16)</td>
                        <td className="py-1.5 px-1 text-center">7</td>
                        <td className="py-1.5 px-1 text-center font-mono text-[10px]">7 × 500</td>
                        <td className="py-1.5 px-2 text-right font-bold text-orange-800">3.500 pcs</td>
                        <td className="py-1.5 px-2 text-right font-bold text-orange-600">{qtyCat43k} pcs</td>
                      </tr>
                      <tr className="bg-slate-900 text-white font-bold">
                        <td className="py-1.5 px-2">Total keseluruhan</td>
                        <td className="py-1.5 px-1 text-center">16</td>
                        <td className="py-1.5 px-1 text-center font-mono text-[10px]">16 × 500</td>
                        <td className="py-1.5 px-2 text-right text-amber-300">8.000 pcs</td>
                        <td className="py-1.5 px-2 text-right text-amber-300">{qtyCat47k + qtyCat43k} pcs</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Informasi Pemesan &amp; Pengiriman (FR-02)
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap / Nama Usaha *
                </label>
                <input
                  type="text"
                  required
                  readOnly
                  value={customerName}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600"
                  title="Nama mengikuti akun yang login"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Aktif *
                </label>
                <input
                  type="tel"
                  required
                  readOnly
                  value={customerPhone}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600"
                  title="Nomor WhatsApp mengikuti akun yang login"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Pengiriman Tujuan *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Alamat lengkap tujuan pengiriman pesanan"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Kurir jemput jam 13.00, packing karung tebal"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Delivery & Payment Badges */}
              <div className="space-y-2 pt-2">
                {cart.some(i => i.isPreOrder) && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-950">Memuat Bumbu Pre-Order (Menunggu Produksi)</strong>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        Pesanan ini memuat bumbu yang stok fisiknya habis. Bumbu akan dimasak/diproduksi khusus untuk pesanan Anda, berstatus awal <strong>MENUNGGU PRODUKSI</strong>, dan segera disiapkan setelah batch selesai.
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <Truck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Pengiriman: Kurir Jemput di Gudang</strong>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Sesuai model operasional, kurir mengambil pesanan sendiri di gudang tanpa ongkir (Ongkir Rp 0).
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                  <Banknote className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Metode Pembayaran: COD (Cash On Delivery)</strong>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Pembayaran tunai dilakukan kepada staf saat kurir/customer menerima barang.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer & Submit */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({customerType === 'reseller' ? 'Grosir' : 'Eceran'}):</span>
                <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Ongkos Kirim:</span>
                <span className="text-emerald-700 font-bold">GRATIS (Rp 0 - Kurir Jemput)</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Tagihan COD:</span>
                <span className="text-orange-600 text-base">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Memproses Pesanan & Kunci Stok...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Konfirmasi Pesanan (Bayar COD)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

