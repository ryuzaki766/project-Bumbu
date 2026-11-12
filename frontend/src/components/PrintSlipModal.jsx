import React from 'react';
import { Printer, X, CheckCircle, Truck, MapPin, Phone, User, Calendar } from 'lucide-react';

export default function PrintSlipModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 my-8">
        {/* Modal Actions Bar (No Print) */}
        <div className="no-print p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Printer className="w-4 h-4 text-orange-600" />
            <span>Slip Pesanan & Surat Jalan Kurir (FR-10)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Slip Sekarang</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 text-slate-900 bg-white print:p-0 print:m-0 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">ALUR BUMBU</span>
                <span className="text-xs bg-slate-900 text-white font-bold px-2 py-0.5 rounded">
                  SLIP KURIR
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pusat Grosir & Kulakan Rempah Nusantara • Jl. Sentra Rempah Blok B3
              </p>
              <p className="text-xs text-slate-500">
                Layanan Customer / WhatsApp: 0812-8899-0011
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase font-mono block">NO. PESANAN</span>
              <span className="font-mono text-xl font-extrabold text-slate-900 tracking-wider">
                {order.id}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Tgl: {new Date(order.createdAt).toLocaleDateString('id-ID')}
              </p>
            </div>
          </div>

          {/* Barcode Mockup */}
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3 text-center">
            <div className="font-mono tracking-[0.5em] text-lg font-bold text-slate-800">
              *||| | |||| || ||| |||| | |||*
            </div>
            <span className="font-mono text-[10px] text-slate-500">{order.id}</span>
          </div>

          {/* Info Customer & Kurir */}
          <div className="grid grid-cols-2 gap-6 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                PENERIMA (CUSTOMER)
              </span>
              <p className="font-bold text-sm text-slate-900">{order.customerName}</p>
              <p className="text-slate-600 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> {order.customerPhone}
              </p>
              <p className="text-slate-600 flex items-start gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span>{order.customerAddress}</span>
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Tipe Akun: <span className="uppercase font-bold">{order.customerType}</span>
              </p>
            </div>

            <div className="space-y-1 border-l pl-4 border-slate-200">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                INFORMASI PENGIRIMAN
              </span>
              <p className="font-bold text-sm text-orange-700">
                Kurir: {order.courierName || 'Kurir Penjemput Gudang'}
              </p>
              <p className="text-slate-600">Metode: Kurir Ambil Sendiri di Gudang</p>
              <p className="text-slate-600 font-bold text-emerald-700">Ongkir: GRATIS (Rp 0)</p>
              {order.notes && (
                <p className="text-slate-500 italic mt-1">
                  Catatan: "{order.notes}"
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800 text-slate-800 font-bold">
                  <th className="py-2">No</th>
                  <th className="py-2">Nama Bumbu & Kemasan</th>
                  <th className="py-2 text-center">Jumlah</th>
                  <th className="py-2 text-right">Harga Satuan</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2 text-slate-400">{idx + 1}</td>
                    <td className="py-2 font-semibold text-slate-900">{it.productName}</td>
                    <td className="py-2 text-center font-bold">{it.qty} {it.unit}</td>
                    <td className="py-2 text-right">Rp {it.price.toLocaleString('id-ID')}</td>
                    <td className="py-2 text-right font-bold">Rp {it.subtotal.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment COD Highlight */}
          <div className="p-4 rounded-xl bg-orange-50 border-2 border-orange-300 flex justify-between items-center text-xs">
            <div>
              <span className="font-black text-orange-900 text-sm block">
                TOTAL PEMBAYARAN COD (CASH ON DELIVERY)
              </span>
              <span className="text-[11px] text-orange-800">
                *Kurir wajib menagih uang tunai pas kepada customer saat serah terima barang.
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-orange-950 font-mono">
                Rp {order.totalAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Signature Sign-offs */}
          <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs text-slate-600">
            <div className="space-y-12">
              <p className="text-[11px]">Diserahkan oleh (Packing):</p>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                ( Staf Packing )
              </div>
            </div>

            <div className="space-y-12">
              <p className="text-[11px]">Dibawa oleh (Kurir):</p>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                ( {order.courierName || 'Kurir Penjemput'} )
              </div>
            </div>

            <div className="space-y-12">
              <p className="text-[11px]">Diterima Customer:</p>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                ( {order.customerName.slice(0, 15)} )
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

