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
  AlertCircle
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
        items: cart.map(i => ({ productId: i.productId, qty: i.qty }))
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
                      <h4 className="font-bold text-slate-800">{item.productName}</h4>
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
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Informasi Pemesan & Pengiriman (FR-02)
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

