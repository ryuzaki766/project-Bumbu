import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ShoppingBag, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Clock, 
  Truck, 
  PackageCheck, 
  AlertCircle, 
  ArrowRight,
  Info,
  MapPin,
  Phone,
  User,
  FileText
} from 'lucide-react';

export default function CustomerStore({ 
  products, 
  customerType, 
  cart, 
  setCart, 
  onCheckoutSuccess,
  trackedOrder,
  setTrackedOrder,
  onSearchTrackOrder
}) {
  const [activeTab, setActiveTab] = useState('katalog'); // 'katalog' or 'lacak'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [isSearchingTrack, setIsSearchingTrack] = useState(false);

  // Dynamic categories from products
  const categories = ['Semua', ...new Set(products.map(p => p.category).filter(Boolean))];
  
  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (product) => {
    if (product.availableStock <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.qty >= product.availableStock) {
          alert(`Maksimal stok tersedia untuk ${product.name} adalah ${product.availableStock} ${product.unit}.`);
          return prev;
        }
        return prev.map(item =>
          item.productId === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        const unitPrice = customerType === 'reseller' ? product.priceWholesale : product.priceRetail;
        return [...prev, {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          price: unitPrice,
          category: product.category,
          maxStock: product.availableStock,
          qty: 1
        }];
      }
    });
  };

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!trackingIdInput.trim()) return;
    setIsSearchingTrack(true);
    await onSearchTrackOrder(trackingIdInput.trim());
    setIsSearchingTrack(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub-header Tabs & Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-orange-900/10">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-orange-50">
            <span>✨ Sistem Pemesanan Kulakan & Eceran Bumbu Tradisional</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Pusat Pesanan Bumbu Masak Machmuda
          </h1>
          <p className="text-sm sm:text-base text-orange-100/90 leading-relaxed">
            Stok tercatat otomatis per batch dengan sistem FEFO. Melayani pembelian grosir reseller dan perorangan dengan bayar di tempat (COD) dan kurir jemput langsung ke gudang tanpa ongkir.
          </p>

          {/* Account Type Badge (mengikuti akun yang login) */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-orange-200">Tipe Akun Anda:</span>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
              customerType === 'reseller'
                ? 'bg-amber-400 text-amber-950 border-amber-300'
                : 'bg-white text-orange-900 border-white/50'
            }`}>
              {customerType === 'reseller'
                ? '🏪 Reseller (Harga Grosir Kulakan)'
                : '👤 Perorangan (Harga Eceran)'}
            </span>
            {customerType === 'reseller' && (
              <span className="text-xs bg-amber-400/30 text-amber-100 border border-amber-300/40 px-2.5 py-1 rounded-lg font-medium">
                Harga grosir otomatis diterapkan pada pesanan Anda.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation sub-tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('katalog')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'katalog'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Katalog Bumbu</span>
        </button>
        <button
          onClick={() => setActiveTab('lacak')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'lacak'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Lacak Status Pesanan</span>
          {trackedOrder && (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          )}
        </button>
      </div>

      {/* TAB 1: CATALOG (FR-01, FR-02, FR-04, FR-26) */}
      {activeTab === 'katalog' && (
        <div className="space-y-6">
          {/* Search & Category Filter */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari bumbu rendang, kunyit, ketumbar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex overflow-x-auto w-full md:w-auto gap-2 pb-1 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map(product => {
              const activePrice = customerType === 'reseller' ? product.priceWholesale : product.priceRetail;
              const isOutOfStock = product.availableStock <= 0;
              const cartItem = cart.find(c => c.productId === product.id);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div className="p-5 space-y-3">
                    {/* Header icon and category badge */}
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl group-hover:scale-110 transition duration-200">
                        {product.icon || '🌿'}
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {product.category}
                      </span>
                    </div>

                    {/* Product Name & Description */}
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-orange-600 transition text-base">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Stock Status Indicator (FR-04, FR-17) */}
                    <div className="pt-1 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          isOutOfStock 
                            ? 'bg-rose-500' 
                            : product.availableStock <= product.minStock 
                              ? 'bg-amber-500 animate-pulse' 
                              : 'bg-emerald-500'
                        }`} />
                        <span className="text-slate-500 font-medium">
                          Stok Tersedia:
                        </span>
                      </div>
                      <span className={`font-bold ${
                        isOutOfStock 
                          ? 'text-rose-600' 
                          : product.availableStock <= product.minStock 
                            ? 'text-amber-700' 
                            : 'text-emerald-700'
                      }`}>
                        {product.availableStock} {product.unit}
                      </span>
                    </div>

                    {/* Expiry Warning if near expiry */}
                    {product.nearExpiryCount > 0 && (
                      <div className="bg-amber-50 text-amber-800 border border-amber-200/60 rounded-lg px-2.5 py-1 text-[11px] font-medium flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Tersedia batch segar (FEFO terjamin)</span>
                      </div>
                    )}
                  </div>

                  {/* Price & Add to Cart Action */}
                  <div className="p-5 pt-0 border-t border-slate-100 mt-2 bg-slate-50/50">
                    <div className="py-3 flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-400 font-medium block">
                          Harga {customerType === 'reseller' ? 'Grosir Reseller' : 'Eceran'} / {product.unit}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-slate-900">
                            Rp {activePrice.toLocaleString('id-ID')}
                          </span>
                          {customerType === 'reseller' && (
                            <span className="text-xs line-through text-slate-400">
                              Rp {product.priceRetail.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isOutOfStock ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-400 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Stok Habis (FR-04)</span>
                      </button>
                    ) : cartItem ? (
                      <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl p-1 text-xs font-bold text-orange-950">
                        <button
                          onClick={() => {
                            setCart(prev => {
                              if (cartItem.qty <= 1) {
                                return prev.filter(c => c.productId !== product.id);
                              }
                              return prev.map(c => c.productId === product.id ? { ...c, qty: c.qty - 1 } : c);
                            });
                          }}
                          className="w-8 h-8 rounded-lg bg-white text-orange-600 hover:bg-orange-100 flex items-center justify-center shadow-xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2">
                          {cartItem.qty} {product.unit} di Keranjang
                        </span>
                        <button
                          onClick={() => addToCart(product)}
                          className="w-8 h-8 rounded-lg bg-orange-600 text-white hover:bg-orange-700 flex items-center justify-center shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs group-hover:bg-orange-600"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah ke Keranjang</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ORDER TRACKING (FR-03) */}
      {activeTab === 'lacak' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Tracking Search Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-600" />
              <span>Cek Status & Riwayat Alur Pesanan (FR-03)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Masukkan Nomor ID Pesanan Anda (contoh: <code className="bg-slate-100 text-orange-700 px-1.5 py-0.5 rounded font-mono">ORD-20261109-001</code>) untuk memantau status secara langsung:
            </p>

            <form onSubmit={handleTrackSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Masukkan ID Pesanan (misal: ORD-20261109-001)"
                value={trackingIdInput}
                onChange={(e) => setTrackingIdInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 uppercase font-mono"
              />
              <button
                type="submit"
                disabled={isSearchingTrack}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2"
              >
                {isSearchingTrack ? 'Mencari...' : 'Lacak Sekarang'}
              </button>
            </form>
          </div>

          {/* Tracked Order Details Card */}
          {trackedOrder ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              {/* Header Info */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xl font-extrabold text-slate-900">
                      {trackedOrder.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                      trackedOrder.status === 'SELESAI' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : trackedOrder.status === 'BERMASALAH'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : trackedOrder.status === 'DIKIRIM'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {trackedOrder.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Waktu Pesan: {new Date(trackedOrder.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 font-medium block">Total Pembayaran (COD)</span>
                  <span className="text-xl font-black text-slate-900">
                    Rp {trackedOrder.totalAmount?.toLocaleString('id-ID')}
                  </span>
                  <span className={`block text-[11px] font-bold mt-0.5 ${
                    trackedOrder.paymentStatus === 'LUNAS' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {trackedOrder.paymentStatus === 'LUNAS' ? '✓ LUNAS (Diterima Admin)' : '⏳ COD - Belum Bayar'}
                  </span>
                </div>
              </div>

              {/* Progress Timeline (End-to-End Workflow) */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Tahapan Alur Pesanan (End-to-End)
                </h3>
                
                {(() => {
                  const steps = [
                    { key: 'MENUNGGU_DISIAPKAN', label: '1. Pesanan Diterima', desc: 'Stok dicadangkan otomatis' },
                    { key: 'SIAP_DIPACKING', label: '2. Disiapkan Gudang', desc: 'Item dicek dari rak' },
                    { key: 'SUDAH_DIPACKING', label: '3. Dipacking', desc: 'Slip kurir dicetak' },
                    { key: 'DIKIRIM', label: '4. Dikirim (Kurir Ambil)', desc: 'Stok FEFO dipotong' },
                    { key: 'SELESAI', label: '5. Selesai Diterima', desc: 'Uang COD diterima admin' }
                  ];

                  const statusOrder = ['MENUNGGU_DISIAPKAN', 'SIAP_DIPACKING', 'SUDAH_DIPACKING', 'DIKIRIM', 'SELESAI'];
                  const currentIndex = statusOrder.indexOf(trackedOrder.status);

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {steps.map((st, i) => {
                        const isDone = currentIndex >= i;
                        const isCurrent = currentIndex === i;

                        return (
                          <div 
                            key={st.key}
                            className={`p-3.5 rounded-2xl border text-xs space-y-1 transition ${
                              isCurrent
                                ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-500/20'
                                : isDone
                                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold">
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span className={isCurrent ? 'text-orange-900 font-extrabold' : ''}>{st.label}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight">
                              {st.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Kurir & Detail Penerima */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Data Pemesan ({trackedOrder.customerType === 'reseller' ? 'Reseller / Kulakan' : 'Perorangan'})</span>
                  </div>
                  <p className="text-slate-800 font-semibold">{trackedOrder.customerName}</p>
                  <p className="text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {trackedOrder.customerPhone}
                  </p>
                  <p className="text-slate-500 flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" /> {trackedOrder.customerAddress}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pengiriman & Kurir (Tanpa Ongkir)</span>
                  </div>
                  <p className="text-slate-800">
                    <span className="text-slate-500">Kurir: </span>
                    <strong className="text-orange-700">{trackedOrder.courierName || 'Belum ditugaskan'}</strong>
                  </p>
                  <p className="text-slate-500">
                    Metode: Kurir jemput sendiri di gudang (Tanpa Ongkir)
                  </p>
                  {trackedOrder.notes && (
                    <p className="text-slate-600 italic">
                      Catatan: "{trackedOrder.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Ordered Items Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Daftar Rempah / Bumbu Dipesan
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Produk</th>
                        <th className="p-3">Jumlah</th>
                        <th className="p-3">Harga Satuan</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {trackedOrder.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-800">{it.productName}</td>
                          <td className="p-3">{it.qty} {it.unit}</td>
                          <td className="p-3">Rp {it.price.toLocaleString('id-ID')}</td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            Rp {it.subtotal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Log Timeline (Siapa & Kapan) */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Riwayat Aktivitas & Audit Perubahan Status (PRD: tercatat siapa & kapan)
                </h4>
                <div className="space-y-2 border-l-2 border-orange-200 pl-4 ml-2">
                  {trackedOrder.statusHistory?.map((h, i) => (
                    <div key={i} className="text-xs space-y-0.5 relative">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 absolute -left-[21px] top-1"></span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{h.status}</span>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(h.timestamp).toLocaleTimeString('id-ID')} WIB ({new Date(h.timestamp).toLocaleDateString('id-ID')})
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{h.note}</p>
                      <p className="text-slate-400 text-[10px]">Pelaku: {h.actor}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 text-sm">
              <PackageCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <span>Masukkan nomor pesanan di atas untuk melihat status pelacakan langsung.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

