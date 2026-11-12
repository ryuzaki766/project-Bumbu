# 🌿 Alur Bumbu - Frontend Web App

Modul frontend independen untuk antarmuka pengguna **Alur Bumbu** (React, Vite, Tailwind CSS v4, Lucide Icons).

## 🚀 Fitur Frontend
- **Katalog & Pemesanan Customer**: Dukungan harga eceran & harga grosir kulakan, keranjang belanja, checkout COD tanpa ongkir.
- **Pelacakan Alur Pesanan**: Progress timeline interaktif end-to-end.
- **Operasional Staf Gudang**: Antrean checklist pengambilan rak FIFO, pelaporan kendala stok, dan pencatatan barang masuk supplier per batch.
- **Staf Packing**: Verifikasi item & kemasan, penetapan kurir, dan pencetakan **Slip Pesanan Kurir** siap cetak.
- **Staf Admin**: Pencatatan uang tunai COD lunas dan penyelesaian pesanan.
- **Owner Dashboard**: Visualisasi metrik stok, FEFO status kedaluwarsa, koreksi stok opname manual dengan alasan wajib, audit log, dan ekspor laporan ke Excel/CSV.
- **WhatsApp Notification Center**: Live notification stream dengan link langsung ke `wa.me`.

## 📦 Menjalankan Frontend
Jalankan file batch:
```bash
jalankan-frontend.bat
```
Atau via command line:
```bash
npm run dev
```
Akses di browser:
👉 **http://localhost:3000**
*(Pastikan Backend sudah berjalan di port 5000 agar data dapat dimuat)*

## 🛠️ Build Produksi
Untuk mengompilasi kode menjadi berkas statis:
```bash
npm run build
```
Hasil build akan tersimpan di folder `dist/`.
