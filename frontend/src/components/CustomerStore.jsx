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
  FileText,
  Edit2,
  Trash2,
  Eye,
  Layers,
  Sparkles,
  X,
  Package,
  Check
} from 'lucide-react';
import api from '../services/api';

const EMOJI_OPTIONS = ['🌶️', '🍲', '🥘', '🥣', '🍛', '🧂', '🌿', '✨', '🔥', '🍜', '🥄', '🍃'];

export default function CustomerStore({ 
  user,
  products = [], 
  customerType = 'perorangan', 
  cart = [], 
  setCart, 
  onOpenCart,
  onCheckoutSuccess,
  trackedOrder,
  setTrackedOrder,
  onSearchTrackOrder,
  onProductChanged
}) {
  const [activeTab, setActiveTab] = useState('katalog'); // 'katalog' or 'lacak'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedSpiceFilter, setSelectedSpiceFilter] = useState('Semua'); // 'Semua', 'CAT_47K', 'CAT_43K'
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [isSearchingTrack, setIsSearchingTrack] = useState(false);

  // CRUD State
  const [detailProduct, setDetailProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [crudError, setCrudError] = useState('');
  const [crudSuccess, setCrudSuccess] = useState('');

  // Form State untuk Tambah / Edit Produk
  const [formData, setFormData] = useState({
    name: '',
    category: 'Bumbu Masak',
    unit: 'pack (1 Kg)',
    priceRetail: 47000,
    priceWholesale: 47000,
    minStock: 10,
    description: '',
    icon: '🌶️',
    spiceNumber: 1,
    spiceCategoryGroup: 'CAT_47K'
  });

  // Role permissions
  const canManage = user && (user.role === 'owner' || user.role === 'admin');

  // Dynamic categories from products
  const categories = ['Semua', ...new Set(products.map(p => p.category).filter(Boolean))];
  
  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpiceCat = selectedSpiceFilter === 'Semua' || p.spiceCategoryGroup === selectedSpiceFilter;
    return matchesCat && matchesSearch && matchesSpiceCat;
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
          qty: 1,
          isPreOrder: false,
          spiceCategoryGroup: product.spiceCategoryGroup
        }];
      }
    });
  };

  const handlePreOrder = (product) => {
    const unitPrice = customerType === 'reseller' ? product.priceWholesale : product.priceRetail;

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id ? { ...item, qty: item.qty + 1, isPreOrder: true } : item
        );
      } else {
        return [...prev, {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          price: unitPrice,
          category: product.category,
          maxStock: 9999, // Pre-order tidak dibatasi stok fisik
          qty: 1,
          isPreOrder: true,
          spiceCategoryGroup: product.spiceCategoryGroup
        }];
      }
    });

    // Otomatis buka drawer keranjang & checkout
    if (onOpenCart) {
      onOpenCart();
    }
  };

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!trackingIdInput.trim()) return;
    setIsSearchingTrack(true);
    await onSearchTrackOrder(trackingIdInput.trim());
    setIsSearchingTrack(false);
  };

  // Buka Modal Tambah
  const openCreateModal = () => {
    setFormData({
      name: '',
      category: 'Bumbu Masak',
      unit: 'pack (1 Kg)',
      priceRetail: 47000,
      priceWholesale: 47000,
      minStock: 10,
      description: '',
      icon: '🌶️',
      spiceNumber: 1,
      spiceCategoryGroup: 'CAT_47K'
    });
    setEditingProduct(null);
    setCrudError('');
    setCrudSuccess('');
    setIsCreateModalOpen(true);
  };

  // Buka Modal Edit
  const openEditModal = (product) => {
    setFormData({
      name: product.name,
      category: product.category || 'Bumbu Masak',
      unit: product.unit,
      priceRetail: product.priceRetail,
      priceWholesale: product.priceWholesale,
      minStock: product.minStock || 10,
      description: product.description || '',
      icon: product.icon || '🌶️',
      spiceNumber: product.spiceNumber || 1,
      spiceCategoryGroup: product.spiceCategoryGroup || 'CAT_47K'
    });
    setEditingProduct(product);
    setCrudError('');
    setCrudSuccess('');
    setIsCreateModalOpen(true);
  };

  // Handle Submit Form Tambah / Edit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setCrudError('');
    setCrudSuccess('');

    if (!formData.name.trim() || !formData.unit.trim()) {
      setCrudError('Nama produk dan satuan wajib diisi.');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingProduct) {
        // Update
        const res = await api.updateProduct(editingProduct.id, formData);
        if (res.success) {
          setCrudSuccess(res.message || 'Produk berhasil diperbarui.');
          setTimeout(() => {
            setIsCreateModalOpen(false);
            setEditingProduct(null);
            if (onProductChanged) onProductChanged();
          }, 800);
        } else {
          setCrudError(res.message || 'Gagal memperbarui produk.');
        }
      } else {
        // Create
        const res = await api.addProduct(formData);
        if (res.success) {
          setCrudSuccess(res.message || 'Produk baru berhasil ditambahkan.');
          setTimeout(() => {
            setIsCreateModalOpen(false);
            if (onProductChanged) onProductChanged();
          }, 800);
        } else {
          setCrudError(res.message || 'Gagal menambahkan produk.');
        }
      }
    } catch (err) {
      setCrudError('Terjadi kesalahan: ' + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Hapus Produk
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setFormSubmitting(true);
    try {
      const res = await api.deleteProduct(deletingProduct.id);
      if (res.success) {
        setDeletingProduct(null);
        if (onProductChanged) onProductChanged();
      } else {
        alert(res.message || 'Gagal menghapus produk.');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus: ' + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-header Tabs & Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-orange-900/10">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-orange-50">
            <span>✨ Sistem Pemesanan Kulakan &amp; Eceran Bumbu Tradisional</span>
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

      {/* WIDGET REKAPITULASI KATEGORI PERHITUNGAN BUMBU MASAK */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold mb-1">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>Standar Produksi &amp; Perhitungan Bumbu</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Kategori &amp; Kuota Produksi Bumbu Masak
            </h2>
            <p className="text-xs text-slate-500">
              Klasifikasi harga kemasan 1 Kg, jumlah jenis bumbu, dan target kalkulasi 500 pcs per batch bumbu.
            </p>
          </div>
          
          {/* Tombol Tambah Produk (Create) */}
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Produk Baru</span>
          </button>
        </div>

        {/* TABEL REKAPITULASI 3 BARIS */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3">Kategori</th>
                <th className="p-3 text-center">Jumlah jenis</th>
                <th className="p-3 text-center">Perhitungan</th>
                <th className="p-3 text-right">Total pcs</th>
                <th className="p-3 text-center">Aksi Filter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Baris 1: Rp 47.000/kg (nomor 1-9) */}
              <tr className={`hover:bg-amber-50/50 transition ${selectedSpiceFilter === 'CAT_47K' ? 'bg-amber-50/80 font-semibold' : ''}`}>
                <td className="p-3">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Rp 47.000/kg (nomor 1-9)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 pl-3.5 block">
                    Bumbu Bali, Sambel Goreng, Rendang, Rujak, Ayam Panggang, Rica-Rica, Krengsengan, Opor, Mie
                  </span>
                </td>
                <td className="p-3 text-center font-bold text-slate-800">9</td>
                <td className="p-3 text-center font-mono font-medium text-slate-700">9 × 500</td>
                <td className="p-3 text-right font-extrabold text-amber-700 text-sm">4.500 pcs</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => setSelectedSpiceFilter(selectedSpiceFilter === 'CAT_47K' ? 'Semua' : 'CAT_47K')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                      selectedSpiceFilter === 'CAT_47K'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {selectedSpiceFilter === 'CAT_47K' ? '✓ Sedang Tampil' : 'Filter Kategori'}
                  </button>
                </td>
              </tr>

              {/* Baris 2: Rp 43.000/kg (nomor 10-16) */}
              <tr className={`hover:bg-orange-50/50 transition ${selectedSpiceFilter === 'CAT_43K' ? 'bg-orange-50/80 font-semibold' : ''}`}>
                <td className="p-3">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span>Rp 43.000/kg (nomor 10-16)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 pl-3.5 block">
                    Bumbu Rawon, Soto, Lodeh, Kare, Gule, Ukep/Bacem, Nasi Goreng
                  </span>
                </td>
                <td className="p-3 text-center font-bold text-slate-800">7</td>
                <td className="p-3 text-center font-mono font-medium text-slate-700">7 × 500</td>
                <td className="p-3 text-right font-extrabold text-orange-700 text-sm">3.500 pcs</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => setSelectedSpiceFilter(selectedSpiceFilter === 'CAT_43K' ? 'Semua' : 'CAT_43K')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                      selectedSpiceFilter === 'CAT_43K'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {selectedSpiceFilter === 'CAT_43K' ? '✓ Sedang Tampil' : 'Filter Kategori'}
                  </button>
                </td>
              </tr>

              {/* Baris 3: Total keseluruhan */}
              <tr className="bg-slate-900 text-white font-extrabold">
                <td className="p-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Total keseluruhan</span>
                  </div>
                  <span className="text-[11px] text-slate-300 font-normal pl-5 block">
                    16 Varian Utama Bumbu Masak Tradisional Machmuda
                  </span>
                </td>
                <td className="p-3 text-center text-sm">16</td>
                <td className="p-3 text-center font-mono text-sm">16 × 500</td>
                <td className="p-3 text-right text-amber-300 text-sm">8.000 pcs</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => setSelectedSpiceFilter('Semua')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                      selectedSpiceFilter === 'Semua'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Tampilkan Semua
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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
          <span>Katalog Bumbu ({filteredProducts.length} Varian)</span>
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
                placeholder="Cari bumbu rendang, rawon, soto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Filter Pills Kategori Harga */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-slate-400 font-semibold">Filter:</span>
              <button
                onClick={() => setSelectedSpiceFilter('Semua')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedSpiceFilter === 'Semua'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Semua Kategori
              </button>
              <button
                onClick={() => setSelectedSpiceFilter('CAT_47K')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedSpiceFilter === 'CAT_47K'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Rp 47.000/kg (1-9)
              </button>
              <button
                onClick={() => setSelectedSpiceFilter('CAT_43K')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedSpiceFilter === 'CAT_43K'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Rp 43.000/kg (10-16)
              </button>
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
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group relative"
                >
                  <div className="p-5 space-y-3">
                    {/* Header icon, nomor bumbu, dan aksi CRUD */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl group-hover:scale-110 transition duration-200">
                        {product.icon || '🌿'}
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {/* Badge Kategori & Nomor Bumbu */}
                        <div className="flex items-center gap-1">
                          {product.spiceNumber && (
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-200 font-mono">
                              #{product.spiceNumber}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            product.spiceCategoryGroup === 'CAT_47K'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-orange-50 text-orange-800 border-orange-200'
                          }`}>
                            {product.spiceCategoryGroup === 'CAT_47K' ? 'Rp 47k/kg' : 'Rp 43k/kg'}
                          </span>
                        </div>

                        {/* Aksi CRUD Toolbar pada Kartu Produk */}
                        <div className="flex items-center gap-1 pt-1">
                          {/* Read / Detail */}
                          <button
                            onClick={() => setDetailProduct(product)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
                            title="Lihat Detail Produk"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Update / Edit */}
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:text-amber-900 hover:bg-amber-100 transition"
                            title="Edit Produk (Update)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete / Hapus */}
                          <button
                            onClick={() => setDeletingProduct(product)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:text-rose-800 hover:bg-rose-100 transition"
                            title="Hapus Produk (Delete)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Product Name & Description */}
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-orange-600 transition text-base">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {product.description || `Bumbu masak kemasan ${product.unit}`}
                      </p>
                    </div>

                    {/* Info Kuota Batch Standar */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-[11px] flex items-center justify-between text-slate-600">
                      <span className="font-medium text-slate-500">Target Produksi:</span>
                      <span className="font-bold text-slate-800">500 pcs/batch</span>
                    </div>

                    {/* Stock Status Indicator (FR-04, FR-17) */}
                    <div className="pt-1 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          isOutOfStock 
                            ? 'bg-amber-500 animate-pulse' 
                            : product.availableStock <= product.minStock 
                              ? 'bg-amber-500 animate-pulse' 
                              : 'bg-emerald-500'
                        }`} />
                        <span className="text-slate-500 font-medium">
                          {isOutOfStock ? 'Status Stok:' : 'Stok Tersedia:'}
                        </span>
                      </div>
                      <span className={`font-bold ${
                        isOutOfStock 
                          ? 'text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]' 
                          : product.availableStock <= product.minStock 
                            ? 'text-amber-700' 
                            : 'text-emerald-700'
                      }`}>
                        {isOutOfStock ? 'Stok Habis (Pre-Order)' : `${product.availableStock} ${product.unit}`}
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
                          {customerType === 'reseller' && product.priceRetail !== product.priceWholesale && (
                            <span className="text-xs line-through text-slate-400">
                              Rp {product.priceRetail.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isOutOfStock ? (
                      cartItem ? (
                        <div className="flex items-center justify-between bg-amber-50 border border-amber-300 rounded-xl p-1 text-xs font-bold text-amber-950">
                          <button
                            onClick={() => {
                              setCart(prev => {
                                if (cartItem.qty <= 1) {
                                  return prev.filter(c => c.productId !== product.id);
                                }
                                return prev.map(c => c.productId === product.id ? { ...c, qty: c.qty - 1 } : c);
                              });
                            }}
                            className="w-8 h-8 rounded-lg bg-white text-amber-700 hover:bg-amber-100 flex items-center justify-center shadow-xs"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 text-center">
                            <span className="block text-[9px] text-amber-600 font-extrabold uppercase tracking-wider">Pre-Order</span>
                            <span>{cartItem.qty} {product.unit}</span>
                          </span>
                          <button
                            onClick={() => handlePreOrder(product)}
                            className="w-8 h-8 rounded-lg bg-amber-600 text-white hover:bg-amber-700 flex items-center justify-center shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePreOrder(product)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                          title="Stok saat ini kosong, klik untuk memesan Pre-Order / Indent langsung ke keranjang dan checkout"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pre-Order / Pesan Indent</span>
                        </button>
                      )
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
              <span>Cek Status &amp; Riwayat Alur Pesanan (FR-03)</span>
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
                  const isPreOrderOrder = trackedOrder.status === 'MENUNGGU_PRODUKSI' || trackedOrder.hasPreOrder || trackedOrder.items?.some(i => i.isPreOrder);

                  const steps = isPreOrderOrder ? [
                    { key: 'MENUNGGU_PRODUKSI', label: '0. Pre-Order Produksi', desc: 'Bumbu dimasak khusus' },
                    { key: 'MENUNGGU_DISIAPKAN', label: '1. Pesanan Diterima', desc: 'Stok batch siap disiapkan' },
                    { key: 'SIAP_DIPACKING', label: '2. Disiapkan Gudang', desc: 'Item dicek dari rak' },
                    { key: 'SUDAH_DIPACKING', label: '3. Dipacking', desc: 'Slip kurir dicetak' },
                    { key: 'DIKIRIM', label: '4. Dikirim (Kurir Ambil)', desc: 'Stok FEFO dipotong' },
                    { key: 'SELESAI', label: '5. Selesai Diterima', desc: 'Uang COD diterima admin' }
                  ] : [
                    { key: 'MENUNGGU_DISIAPKAN', label: '1. Pesanan Diterima', desc: 'Stok dicadangkan otomatis' },
                    { key: 'SIAP_DIPACKING', label: '2. Disiapkan Gudang', desc: 'Item dicek dari rak' },
                    { key: 'SUDAH_DIPACKING', label: '3. Dipacking', desc: 'Slip kurir dicetak' },
                    { key: 'DIKIRIM', label: '4. Dikirim (Kurir Ambil)', desc: 'Stok FEFO dipotong' },
                    { key: 'SELESAI', label: '5. Selesai Diterima', desc: 'Uang COD diterima admin' }
                  ];

                  const statusOrder = isPreOrderOrder
                    ? ['MENUNGGU_PRODUKSI', 'MENUNGGU_DISIAPKAN', 'SIAP_DIPACKING', 'SUDAH_DIPACKING', 'DIKIRIM', 'SELESAI']
                    : ['MENUNGGU_DISIAPKAN', 'SIAP_DIPACKING', 'SUDAH_DIPACKING', 'DIKIRIM', 'SELESAI'];
                  const currentIndex = statusOrder.indexOf(trackedOrder.status);

                  return (
                    <div className={`grid grid-cols-1 ${isPreOrderOrder ? 'sm:grid-cols-6' : 'sm:grid-cols-5'} gap-3`}>
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
                    <span>Pengiriman &amp; Kurir (Tanpa Ongkir)</span>
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
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 text-sm">
              <PackageCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <span>Masukkan nomor pesanan di atas untuk melihat status pelacakan langsung.</span>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL CRUD: TAMBAH / EDIT PRODUK ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{formData.icon || '🌶️'}</span>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {editingProduct ? 'Edit Data Produk Bumbu' : 'Tambah Produk Bumbu Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingProduct ? `ID: ${editingProduct.id}` : 'Daftarkan bumbu ke katalog sistem'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {crudError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{crudError}</span>
              </div>
            )}

            {crudSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{crudSuccess}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5 mt-4 text-xs">
              {/* Nama Produk */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bumbu Rendang 1 Kg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Nomor Bumbu & Kategori Harga */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Bumbu (1-16)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.spiceNumber || ''}
                    onChange={(e) => setFormData({ ...formData, spiceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Standar *</label>
                  <select
                    value={formData.spiceCategoryGroup}
                    onChange={(e) => setFormData({ ...formData, spiceCategoryGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="CAT_47K">Rp 47.000/kg (nomor 1-9)</option>
                    <option value="CAT_43K">Rp 43.000/kg (nomor 10-16)</option>
                  </select>
                </div>
              </div>

              {/* Satuan Kemasan & Batas Stok Minimum */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan Kemasan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: pack (1 Kg)"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stok Minimum Peringatan</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Harga Eceran & Harga Grosir */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Eceran (Umum) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rp</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.priceRetail}
                      onChange={(e) => setFormData({ ...formData, priceRetail: Number(e.target.value) })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Grosir (Reseller) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">Rp</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.priceWholesale}
                      onChange={(e) => setFormData({ ...formData, priceWholesale: Number(e.target.value) })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Pilihan Ikon Emoji */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ikon Bumbu</label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {EMOJI_OPTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: em })}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition ${
                        formData.icon === em ? 'bg-orange-500 shadow-xs' : 'hover:bg-slate-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Produk (Opsional)</label>
                <textarea
                  rows={2}
                  placeholder="Informasi komposisi, rasa, atau cara pemakaian"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Tombol Aksi Form */}
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-60"
                >
                  {formSubmitting ? 'Menyimpan...' : (editingProduct ? 'Simpan Perubahan' : 'Buat Produk Baru')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL READ: DETAIL PRODUK ================= */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl">
                  {detailProduct.icon || '🌿'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    {detailProduct.spiceNumber && (
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                        Bumbu #{detailProduct.spiceNumber}
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {detailProduct.category}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mt-0.5">
                    {detailProduct.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rincian Spesifikasi Kategori */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2 text-slate-700">
              <h4 className="font-bold text-amber-950 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>Spesifikasi Kategori Perhitungan Bumbu</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Kategori Harga:</span>
                  <span className="font-bold text-slate-900">
                    {detailProduct.spiceCategoryName || (detailProduct.spiceCategoryGroup === 'CAT_47K' ? 'Rp 47.000/kg (nomor 1-9)' : 'Rp 43.000/kg (nomor 10-16)')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Kalkulasi Produksi:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {detailProduct.calculationText || '500 pcs/batch'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Kuota Kategori:</span>
                  <span className="font-extrabold text-amber-800">
                    {detailProduct.categoryTotalPcs ? `${detailProduct.categoryTotalPcs.toLocaleString('id-ID')} pcs` : '4.500 pcs'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Satuan Kemasan:</span>
                  <span className="font-semibold text-slate-900">{detailProduct.unit}</span>
                </div>
              </div>
            </div>

            {/* Rincian Harga & Stok */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Harga Eceran (Customer Umum):</span>
                <span className="text-base font-black text-slate-900">
                  Rp {detailProduct.priceRetail.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 block text-[11px]">Harga Grosir (Reseller):</span>
                <span className="text-base font-black text-orange-700">
                  Rp {detailProduct.priceWholesale.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Stok Fisik:</span>
                <strong className="text-slate-900">{detailProduct.totalPhysicalStock || 0} {detailProduct.unit}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stok Dicadangkan (Pesanan Aktif):</span>
                <strong className="text-amber-700">{detailProduct.reservedStock || 0} {detailProduct.unit}</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                <span className="text-slate-700">Stok Siap Jual:</span>
                <strong className="text-emerald-700">{detailProduct.availableStock || 0} {detailProduct.unit}</strong>
              </div>
            </div>

            <div className="text-xs text-slate-600">
              <span className="font-bold block text-slate-700 mb-1">Deskripsi:</span>
              <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                {detailProduct.description || 'Tidak ada keterangan tambahan untuk bumbu ini.'}
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setDetailProduct(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DELETE: KONFIRMASI HAPUS ================= */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-base">Hapus Produk Bumbu?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Anda yakin ingin menghapus <strong className="text-slate-900">{deletingProduct.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={formSubmitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-60"
              >
                {formSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
