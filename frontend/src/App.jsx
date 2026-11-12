import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LoginScreen from './components/LoginScreen';
import CustomerStore from './components/CustomerStore';
import WarehouseStaff from './components/WarehouseStaff';
import PackingStaff from './components/PackingStaff';
import AdminStaff from './components/AdminStaff';
import OwnerDashboard from './components/OwnerDashboard';
import CartDrawer from './components/CartDrawer';
import WhatsAppDrawer from './components/WhatsAppDrawer';
import api, { getToken, setToken, setUnauthorizedHandler } from './services/api';
import { ArrowRight, MessageSquare, PackageCheck, ShieldCheck } from 'lucide-react';

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Tracking state
  const [trackedOrder, setTrackedOrder] = useState(null);

  // Success order notification modal
  const [createdOrderModal, setCreatedOrderModal] = useState(null);

  const customerType = authUser?.customerType || 'perorangan';
  const canViewNotifications = authUser && ['admin', 'owner'].includes(authUser.role);

  const loadInitialData = useCallback(async () => {
    if (!authUser) return;

    try {
      const prodRes = await api.getProducts();
      if (prodRes.success) setProducts(prodRes.data);

      if (['admin', 'owner'].includes(authUser.role)) {
        const notifRes = await api.getNotifications();
        if (notifRes.success) setUnreadNotifsCount(notifRes.data.length);
      } else {
        setUnreadNotifsCount(0);
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  }, [authUser]);

  // Restore session from localStorage and validate it against /auth/me.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setAuthUser(null);
      setCart([]);
      setTrackedOrder(null);
      setCreatedOrderModal(null);
    });

    const token = getToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }

    let cancelled = false;
    api.getCurrentUser()
      .then(res => {
        if (cancelled) return;
        if (res.success) {
          setAuthUser(res.data);
        } else {
          setToken(null);
        }
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (authUser) loadInitialData();
  }, [authUser, loadInitialData]);

  // Synchronize cart item prices whenever customerType changes (Perorangan vs Reseller)
  useEffect(() => {
    setCart(prev => {
      if (prev.length === 0 || products.length === 0) return prev;

      return prev.map(item => {
        const prod = products.find(p => p.id === item.productId);
        if (!prod) return item;
        const newPrice = customerType === 'reseller' ? prod.priceWholesale : prod.priceRetail;
        return { ...item, price: newPrice };
      });
    });
  }, [customerType, products, setCart]);

  const handleLoggedIn = (user) => {
    setAuthUser(user);
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Token stateless; tetap bersihkan sesi lokal walau request gagal.
    }
    setToken(null);
    setAuthUser(null);
    setProducts([]);
    setCart([]);
    setTrackedOrder(null);
    setUnreadNotifsCount(0);
    setCreatedOrderModal(null);
    setIsCartOpen(false);
    setIsNotifOpen(false);
  };

  const handleSearchTrackOrder = async (orderId) => {
    try {
      const res = await api.getOrderById(orderId);
      if (res.success) {
        setTrackedOrder(res.data);
      } else {
        alert(res.message || 'Pesanan tidak ditemukan.');
      }
    } catch (err) {
      alert('Gagal melacak pesanan: ' + err.message);
    }
  };

  const handleOrderCreated = (order) => {
    setCreatedOrderModal(order);
    setTrackedOrder(order);
    loadInitialData();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-orange-500/20 animate-pulse">
          🌿
        </div>
        <p className="text-sm font-semibold">Memeriksa sesi login...</p>
      </div>
    );
  }

  if (!authUser) {
    return <LoginScreen onLoggedIn={handleLoggedIn} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navbar with authenticated user identity */}
      <Navbar
        user={authUser}
        onLogout={handleLogout}
        cartCount={cart.reduce((a, b) => a + b.qty, 0)}
        setIsCartOpen={setIsCartOpen}
        unreadNotifsCount={unreadNotifsCount}
        setIsNotifOpen={setIsNotifOpen}
        customerType={customerType}
        canViewNotifications={canViewNotifications}
      />

      {/* Main Role Content View */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {authUser.role === 'customer' && (
          <CustomerStore
            products={products}
            customerType={customerType}
            cart={cart}
            setCart={setCart}
            onCheckoutSuccess={handleOrderCreated}
            trackedOrder={trackedOrder}
            setTrackedOrder={setTrackedOrder}
            onSearchTrackOrder={handleSearchTrackOrder}
          />
        )}

        {authUser.role === 'warehouse' && (
          <WarehouseStaff
            user={authUser}
            products={products}
            onDataChanged={loadInitialData}
          />
        )}

        {authUser.role === 'packing' && (
          <PackingStaff
            user={authUser}
            onDataChanged={loadInitialData}
          />
        )}

        {authUser.role === 'admin' && (
          <AdminStaff
            user={authUser}
            onDataChanged={loadInitialData}
          />
        )}

        {authUser.role === 'owner' && (
          <OwnerDashboard
            user={authUser}
            onDataChanged={loadInitialData}
          />
        )}
      </main>

      {/* Slide-over Cart & Checkout Drawer (customer only) */}
      {authUser.role === 'customer' && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          setCart={setCart}
          customerType={customerType}
          user={authUser}
          onOrderCreated={handleOrderCreated}
        />
      )}

      {/* Slide-over WhatsApp Notification Log Drawer (admin/owner only) */}
      {canViewNotifications && (
        <WhatsAppDrawer
          isOpen={isNotifOpen}
          onClose={() => setIsNotifOpen(false)}
          canManageSettings={authUser.role === 'owner'}
        />
      )}

      {/* Modal: Order Creation Success Banner */}
      {createdOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
              ✓
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Pesanan Berhasil Masuk ke Sistem (FR-01, FR-02)
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 pt-2">
                Terima Kasih, Pesanan Diterima!
              </h3>
              <p className="text-xs text-slate-500">
                Stok telah dikunci/dicadangkan secara otomatis dan staf gudang telah menerima antrean penyiapan pesanan.
              </p>
            </div>

            {/* Order Details Preview */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Pesanan:</span>
                <span className="font-mono font-bold text-slate-900">{createdOrderModal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tipe Pelanggan:</span>
                <span className="font-bold text-orange-700 uppercase">{createdOrderModal.customerType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total COD:</span>
                <span className="font-bold text-slate-900 text-sm">
                  Rp {createdOrderModal.totalAmount?.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-200 pt-1">
                <span>Pengiriman:</span>
                <span className="text-slate-700 font-semibold">Kurir Jemput Sendiri (Tanpa Ongkir)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => setCreatedOrderModal(null)}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-orange-500/20"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Tutup & Lihat Status Pesanan</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {canViewNotifications && (
                <button
                  onClick={() => {
                    setCreatedOrderModal(null);
                    setIsNotifOpen(true);
                  }}
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Lihat Notifikasi WhatsApp yang Terkirim</span>
                </button>
              )}

              <button
                onClick={() => setCreatedOrderModal(null)}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-700"
              >
                Tutup Jendela Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">🌿 Alur Bumbu</span>
            <span>•</span>
            <span>Sistem Alur Pesanan Bumbu & Manajemen Stok Otomatis</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Role-based Access</span>
            </span>
            <span>•</span>
            <span>Atomic Stock Lock</span>
            <span>•</span>
            <span>WhatsApp Real-time Notification</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
