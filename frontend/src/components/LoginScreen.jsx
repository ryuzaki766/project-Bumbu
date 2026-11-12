import React, { useState } from 'react';
import {
  LogIn,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Package,
  ClipboardCheck,
  Receipt,
  Store
} from 'lucide-react';
import api, { setToken } from '../services/api';

const DEMO_ACCOUNTS = [
  { username: 'owner', password: 'owner123', label: 'Owner', icon: ShieldCheck, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { username: 'admin', password: 'admin123', label: 'Staf Admin', icon: Receipt, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { username: 'gudang', password: 'gudang123', label: 'Staf Gudang', icon: Package, color: 'text-orange-700 bg-orange-50 border-orange-200' },
  { username: 'packing', password: 'packing123', label: 'Staf Packing', icon: ClipboardCheck, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { username: 'customer', password: 'customer123', label: 'Customer Reseller', icon: Store, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  { username: 'customer_umum', password: 'customer123', label: 'Customer Umum', icon: Store, color: 'text-slate-700 bg-slate-100 border-slate-200' }
];

export default function LoginScreen({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Username dan password wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.login(username.trim(), password);
      if (res.success) {
        setToken(res.data.token);
        onLoggedIn(res.data.user);
      } else {
        setErrorMessage(res.message || 'Login gagal.');
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (account) => {
    setUsername(account.username);
    setPassword(account.password);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-10 font-sans selection:bg-orange-500 selection:text-white">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Brand & explanation */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-7 sm:p-10 text-white shadow-xl flex flex-col justify-between gap-8">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20">
                🌿
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Alur Bumbu</h1>
                <p className="text-xs text-amber-200">Sistem Alur Pesanan & Stok Rempah</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Akses aman berbasis peran</span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Setiap pengguna hanya dapat mengakses menu dan API sesuai perannya.
              Customer memesan, gudang menyiapkan, packing menyerahkan ke kurir,
              admin mencatat COD, dan owner memantau seluruh operasional.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {[
                { icon: Store, text: 'Customer: katalog & pesanan sendiri' },
                { icon: Package, text: 'Gudang: FIFO & barang masuk' },
                { icon: ClipboardCheck, text: 'Packing: verifikasi & slip kurir' },
                { icon: Receipt, text: 'Admin: pembayaran COD' },
                { icon: ShieldCheck, text: 'Owner: laporan & audit log' }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-slate-200">
                    <Icon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-white/10 pt-4">
            Token login disimpan di browser dan dikirim melalui header
            <code className="mx-1 bg-black/30 px-1.5 py-0.5 rounded text-amber-300">Authorization: Bearer</code>
            ke setiap permintaan API.
          </div>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-3xl p-7 sm:p-10 border border-slate-200 shadow-xl flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Masuk ke Akun Anda</h2>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan akun yang sesuai dengan peran Anda. Pemilihan peran tidak lagi dilakukan lewat tombol di antarmuka.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="owner / admin / gudang / packing / customer"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Memverifikasi akun...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-7 pt-5 border-t border-slate-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Akun demo (klik untuk mengisi form)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(account => {
                const Icon = account.icon;
                return (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => fillDemo(account)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition hover:shadow-xs ${account.color}`}
                    title={`${account.username} / ${account.password}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-[11px] font-bold truncate">{account.label}</span>
                      <span className="block text-[10px] opacity-70 font-mono truncate">{account.username}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Ganti seluruh password demo sebelum digunakan di production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
