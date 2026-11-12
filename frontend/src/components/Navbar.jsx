import React from 'react';
import {
  ShoppingBag,
  Package,
  ClipboardCheck,
  Receipt,
  ShieldCheck,
  MessageSquare,
  Store,
  LogOut
} from 'lucide-react';

const ROLE_META = {
  customer: {
    label: 'Customer',
    desc: 'Katalog & Pesanan',
    icon: Store,
    badge: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  warehouse: {
    label: 'Staf Gudang',
    desc: 'Penyiapan & Barang Masuk',
    icon: Package,
    badge: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  packing: {
    label: 'Staf Packing',
    desc: 'Packing & Slip Kurir',
    icon: ClipboardCheck,
    badge: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  admin: {
    label: 'Staf Admin',
    desc: 'Pembayaran COD',
    icon: Receipt,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  owner: {
    label: 'Owner',
    desc: 'Dashboard & Log',
    icon: ShieldCheck,
    badge: 'bg-slate-100 text-slate-800 border-slate-300'
  }
};

export default function Navbar({
  user,
  onLogout,
  cartCount,
  setIsCartOpen,
  unreadNotifsCount,
  setIsNotifOpen,
  customerType,
  canViewNotifications
}) {
  const role = ROLE_META[user?.role] || ROLE_META.customer;
  const RoleIcon = role.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner: authenticated identity */}
      <div className="bg-slate-900 text-white px-4 py-1.5 text-xs font-medium flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Sistem Alur Pesanan Bumbu & Manajemen Stok Otomatis</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 hidden sm:inline">Masuk sebagai:</span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${role.badge}`}>
            <RoleIcon className="w-3 h-3" />
            <span>{role.label}</span>
          </span>
          <span className="text-slate-300 font-semibold max-w-[10rem] truncate" title={user?.name}>
            {user?.name}
          </span>
          <button
            onClick={onLogout}
            className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-bold transition"
            title="Keluar dari akun"
          >
            <LogOut className="w-3 h-3" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-bold text-xl shrink-0">
            🌿
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">AlurBumbu</span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block truncate">
              {role.desc} • WhatsApp Real-Time • COD
            </p>
          </div>
        </div>

        {/* Active workspace label */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <RoleIcon className="w-4 h-4 text-slate-500" />
          <span className="font-bold text-slate-700">{role.label}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">{role.desc}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {/* Customer Type Badge */}
          {user?.role === 'customer' && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-400 font-medium">Akun:</span>
              <span className={`font-bold ${customerType === 'reseller' ? 'text-orange-700' : 'text-slate-800'}`}>
                {customerType === 'reseller' ? 'Reseller (Grosir)' : 'Perorangan (Eceran)'}
              </span>
            </div>
          )}

          {/* WhatsApp Notification Center Trigger (admin/owner only) */}
          {canViewNotifications && (
            <button
              onClick={() => setIsNotifOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
              title="Buka Log Notifikasi WhatsApp Real-Time"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp Log</span>
              {unreadNotifsCount > 0 && (
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                  {unreadNotifsCount}
                </span>
              )}
            </button>
          )}

          {/* Cart Button (For Customer) */}
          {user?.role === 'customer' && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-sm shadow-orange-500/20 transition">

              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Keranjang</span>
              {cartCount > 0 && (
                <span className="bg-white text-orange-600 text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
