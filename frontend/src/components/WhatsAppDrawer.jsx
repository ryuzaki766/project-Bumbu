import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  ExternalLink, 
  RefreshCw, 
  CheckCheck, 
  Clock, 
  Phone, 
  Send,
  Sliders,
  Settings
} from 'lucide-react';
import api from '../services/api';

export default function WhatsAppDrawer({ isOpen, onClose, canManageSettings = false }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [settings, setSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editOwnerPhone, setEditOwnerPhone] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const nRes = await api.getNotifications();
      if (nRes.success) setNotifications(nRes.data);

      if (canManageSettings) {
        const sRes = await api.getSettings();
        if (sRes.success) {
          setSettings(sRes.data);
          setEditOwnerPhone(sRes.data.ownerPhone);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateSettings({ ownerPhone: editOwnerPhone });
      if (res.success) {
        setSettings(res.data);
        setShowSettings(false);
        alert('Nomor WhatsApp Owner berhasil disimpan.');
      }
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    }
  };

  const openWhatsAppUrl = (phone, text) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${clean}?text=${encoded}`, '_blank');
  };

  const filtered = notifications.filter(n => {
    if (filterType === 'ALL') return true;
    if (filterType === 'OWNER') return n.recipientType === 'OWNER';
    if (filterType === 'CUSTOMER') return n.recipientType === 'CUSTOMER';
    return n.type === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-slate-900 text-slate-100 h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header with WhatsApp Dark Style */}
        <div className="p-4 bg-emerald-950/90 border-b border-emerald-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>WhatsApp Notification Stream</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </h3>
              <p className="text-[11px] text-emerald-300">
                Notifikasi Real-Time Otomatis (FR-18, FR-19, FR-22, FR-23)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {canManageSettings && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-900/60"
                title="Pengaturan Nomor WhatsApp"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={loadNotifications}
              className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-900/60"
              title="Segarkan Log"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-900/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Settings Panel */}
        {canManageSettings && showSettings && (
          <form onSubmit={handleSaveSettings} className="p-4 bg-emerald-900/50 border-b border-emerald-800/80 space-y-2 text-xs">
            <label className="block text-emerald-200 font-semibold">Nomor WhatsApp Owner (FR-22):</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={editOwnerPhone}
                onChange={(e) => setEditOwnerPhone(e.target.value)}
                placeholder="081288990011"
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-emerald-700 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg"
              >
                Simpan
              </button>
            </div>
            <p className="text-[10px] text-emerald-300">
              Notifikasi barang masuk/keluar otomatis dialamatkan ke nomor ini.
            </p>
          </form>
        )}

        {/* Filter Badges */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex gap-1.5 overflow-x-auto text-[11px]">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'OWNER', label: 'Owner Saja' },
            { id: 'CUSTOMER', label: 'Customer' },
            { id: 'BARANG_MASUK', label: '📦 Masuk' },
            { id: 'BARANG_KELUAR', label: '🚚 Keluar' },
            { id: 'STOK_MENIPIS', label: '⚠️ Stok Menipis' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                filterType === f.id
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notification Stream Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Belum ada log pesan notifikasi.
            </div>
          ) : (
            filtered.map(notif => (
              <div
                key={notif.id}
                className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 space-y-2 text-xs hover:border-emerald-500/50 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs">{notif.title}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {notif.recipientType}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(notif.createdAt).toLocaleTimeString('id-ID')} WIB
                  </span>
                </div>

                {/* WhatsApp Chat Bubble Mockup */}
                <div className="p-3 bg-[#0b141a] rounded-xl border border-emerald-900/40 text-[11px] font-sans leading-relaxed text-slate-200 whitespace-pre-line relative">
                  {notif.message}
                  <div className="flex justify-end items-center gap-1 text-[9px] text-emerald-400 mt-1">
                    <span>{new Date(notif.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    <CheckCheck className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-[11px]">
                  <span className="text-slate-400">
                    Tujuan: <strong className="text-slate-200">{notif.recipientPhone}</strong>
                  </span>

                  <button
                    onClick={() => openWhatsAppUrl(notif.recipientPhone, notif.message)}
                    className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 hover:text-white rounded-lg font-semibold flex items-center gap-1 transition"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Buka di wa.me</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 text-slate-400 text-[11px] border-t border-slate-800 flex justify-between items-center">
          <span>Total {filtered.length} notifikasi tercatat</span>
          <span className="text-emerald-400 font-medium">WhatsApp Business Cloud API ready</span>
        </div>
      </div>
    </div>
  );
}

