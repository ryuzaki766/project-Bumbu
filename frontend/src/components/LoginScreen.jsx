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
  Store,
  UserPlus,
  Phone,
  ChevronRight
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

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner / Pemilik', desc: 'Laporan & audit penuh' },
  { value: 'admin', label: 'Staf Admin', desc: 'Pembayaran COD & laporan' },
  { value: 'gudang', label: 'Staf Gudang', desc: 'Penerimaan barang & FEFO' },
  { value: 'packing', label: 'Staf Packing', desc: 'Packing & kurir' },
  { value: 'customer', label: 'Customer Reseller (Grosir)', desc: 'Harga grosir, beli dalam jumlah besar' },
  { value: 'customer_umum', label: 'Customer Umum (Eceran)', desc: 'Harga eceran, pembelian satuan' }
];

function PasswordInput({ value, onChange, placeholder, autoComplete, id }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
      />
      <button
        type="button"
        onClick={() => setShow(p => !p)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
        title={show ? 'Sembunyikan password' : 'Tampilkan password'}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function LoginScreen({ onLoggedIn }) {
  const [activeTab, setActiveTab] = useState('login');

  // --- Login state ---
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // --- Register state ---
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regRole, setRegRole] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);

  // ---- Handlers ----

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUsername.trim() || !loginPassword) {
      setLoginError('Username dan password wajib diisi.');
      return;
    }
    setLoginSubmitting(true);
    try {
      const res = await api.login(loginUsername.trim(), loginPassword);
      if (res.success) {
        setToken(res.data.token);
        onLoggedIn(res.data.user);
      } else {
        setLoginError(res.message || 'Login gagal.');
      }
    } catch (err) {
      setLoginError('Terjadi kesalahan: ' + err.message);
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    // Validasi frontend dasar
    if (!regName.trim() || !regUsername.trim() || !regPassword || !regConfirm || !regRole) {
      setRegError('Semua field wajib diisi kecuali No. HP.');
      return;
    }
    if (regName.trim().length < 2) {
      setRegError('Nama minimal 2 karakter.');
      return;
    }
    if (regPassword.length < 8) {
      setRegError('Password minimal 8 karakter.');
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError('Konfirmasi password tidak cocok.');
      return;
    }

    setRegSubmitting(true);
    try {
      const res = await api.register({
        name: regName.trim(),
        username: regUsername.trim(),
        password: regPassword,
        confirmPassword: regConfirm,
        role: regRole,
        phone: regPhone.trim()
      });

      if (res.success) {
        setToken(res.data.token);
        onLoggedIn(res.data.user);
      } else {
        setRegError(res.message || 'Pendaftaran gagal.');
      }
    } catch (err) {
      setRegError('Terjadi kesalahan: ' + err.message);
    } finally {
      setRegSubmitting(false);
    }
  };

  const fillDemo = (account) => {
    setLoginUsername(account.username);
    setLoginPassword(account.password);
    setLoginError('');
    setActiveTab('login');
  };

  // ---- UI ----
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-10 font-sans selection:bg-orange-500 selection:text-white">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        {/* Brand panel kiri */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-7 sm:p-10 text-white shadow-xl flex flex-col justify-between gap-8">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20">
                🌿
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Alur Bumbu</h1>
                <p className="text-xs text-amber-200">Sistem Alur Pesanan &amp; Stok Bumbu</p>
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
                { icon: Package, text: 'Gudang: FEFO & barang masuk' },
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

          
        </div>

        {/* Panel kanan: tab Login / Daftar */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl flex flex-col overflow-hidden">

          {/* Tab switcher */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => { setActiveTab('login'); setLoginError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${activeTab === 'login'
                ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
              <LogIn className="w-4 h-4" />
              Masuk
            </button>
            <button
              onClick={() => { setActiveTab('register'); setRegError(''); setRegSuccess(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${activeTab === 'register'
                ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
              <UserPlus className="w-4 h-4" />
              Daftar Akun
            </button>
          </div>

          {/* ===== TAB LOGIN ===== */}
          {activeTab === 'login' && (
            <div className="p-7 sm:p-10 flex flex-col flex-1">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Masuk ke Akun Anda</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Gunakan akun yang sesuai dengan peran Anda. Peran ditentukan saat pendaftaran.
                </p>
              </div>

              {loginError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoComplete="username"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="owner / admin / gudang / packing / customer"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                  <PasswordInput
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2"
                >
                  {loginSubmitting ? (
                    <span>Memverifikasi akun...</span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Masuk</span>
                    </>
                  )}
                </button>
              </form>

              <p className="mt-4 text-xs text-center text-slate-400">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-orange-600 font-semibold hover:underline"
                >
                  Daftar di sini
                </button>
              </p>

              <div className="mt-6 pt-5 border-t border-slate-200">
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
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition hover:shadow-sm ${account.color}`}
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
          )}

          {/* ===== TAB REGISTER ===== */}
          {activeTab === 'register' && (
            <div className="p-7 sm:p-10 flex flex-col flex-1 overflow-y-auto">
              <div className="mb-5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Daftar Akun Baru</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Isi data di bawah. Peran menentukan menu &amp; hak akses API Anda.
                </p>
              </div>

              {regError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}
              {regSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-3.5">

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoComplete="name"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Contoh: Warung Bu Dewi"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username *</label>
                  <div className="relative">
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoComplete="username"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Minimal 3 karakter (huruf, angka, _ . -)"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Peran */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Peran *</label>
                  <select
                    required
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700"
                  >
                    <option value="">— Pilih peran —</option>
                    {ROLE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {regRole && (
                    <p className="mt-1 text-[11px] text-slate-400 pl-1">
                      {ROLE_OPTIONS.find(o => o.value === regRole)?.desc}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                  <PasswordInput
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                    id="reg-password"
                  />
                </div>

                {/* Konfirmasi Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Konfirmasi Password *</label>
                  <PasswordInput
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    placeholder="Ulangi password"
                    autoComplete="new-password"
                    id="reg-confirm"
                  />
                </div>

                {/* No. HP (opsional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. HP / WhatsApp <span className="font-normal text-slate-400">(opsional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      autoComplete="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="Contoh: 08123456789"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2"
                >
                  {regSubmitting ? (
                    <span>Mendaftarkan akun...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Daftar &amp; Masuk</span>
                    </>
                  )}
                </button>
              </form>

              <p className="mt-4 text-xs text-center text-slate-400">
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-orange-600 font-semibold hover:underline"
                >
                  Masuk di sini
                </button>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
