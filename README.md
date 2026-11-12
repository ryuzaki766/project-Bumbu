# 🌿 Alur Bumbu - Sistem Manajemen Alur Pesanan & Stok Rempah Otomatis

Website aplikasi full-stack (Frontend & Backend) yang mengelola alur pesanan bumbu masak dan rempah secara terintegrasi (end-to-end) sesuai **PRD Website Alur Pesanan Bumbu (Versi 1.1)**.

---

## 🌟 Fitur Utama Sesuai PRD

1. **Alur End-to-End Tanpa Putus**:
   - `Customer Memesan` (Stok dikunci) → `Staf Gudang Menyiapkan` (Checklist rak FIFO) → `Staf Packing Memverifikasi` (Cetak Slip Kurir) → `Dikirim` (Kurir ambil di gudang, stok FEFO dipotong) → `Selesai & Lunas` (Admin catat uang COD).
2. **Manajemen Stok Otomatis & FEFO (First Expired First Out)**:
   - Stok tercatat otomatis per batch: nomor batch, tanggal kedaluwarsa, dan jumlah (*FR-27*).
   - Pengurangan stok secara cerdas memprioritaskan batch dengan tanggal kedaluwarsa terdekat (*FR-28*).
   - Peringatan batch mendekati kedaluwarsa & proteksi batch kedaluwarsa tidak bisa dikirim (*FR-29*).
   - Penyesuaian stok opname manual wajib mencantumkan alasan (*FR-16*).
   - Log audit lengkap untuk semua mutasi (*FR-15*).
3. **Model Bisnis Kulakan & Reseller**:
   - Tipe akun **Perorangan (Harga Eceran)** dan **Reseller (Harga Grosir)** ditentukan oleh akun yang login dan divalidasi di server (*FR-26*).
   - Pembayaran **COD (Cash On Delivery)** tanpa ongkir karena kurir mengambil sendiri di gudang (*FR-02*).
4. **Login & Otorisasi Berbasis Peran (RBAC)**:
   - Setiap pengguna wajib login. Token ditandatangani HMAC-SHA256 dan dikirim melalui header `Authorization: Bearer <token>`.
   - API menolak permintaan tanpa token (`401`) dan menolak peran yang tidak berhak (`403`), bukan hanya menyembunyikan menu di UI.
   - Identitas pelaku audit (barang masuk, packing, pembayaran COD, opname) diambil dari sesi login, bukan dari body request.
5. **Notifikasi WhatsApp Real-Time**:
   - Notifikasi otomatis barang masuk ke Owner (*FR-18*).
   - Notifikasi otomatis barang keluar saat kurir jemput ke Owner (*FR-19*).
   - Peringatan stok menipis (*FR-21*).
   - Notifikasi status alur ke Customer (*FR-23*).
   - Trigger ringkasan harian mutasi stok (*FR-20*).
   - Tersedia Live Notification Center & tombol tes langsung ke `wa.me`.
6. **Pencetakan Slip Pesanan Kurir**:
   - Staf Packing dapat langsung mencetak Slip Kurir format termal/A4 lengkap dengan barcode mockup, rincian barang, dan nominal tagihan COD (*FR-10*).
7. **Laporan & Ekspor Excel / CSV**:
   - Ekspor Laporan Stok & Batch, Log Mutasi Stok, dan Rekapitulasi Pesanan COD ke format `.xlsx` atau `.csv` (*FR-25*).

---

## 🛠️ Arsitektur Teknologi

- **Backend**: Node.js, Express.js, REST API, Database Engine terstruktur dengan penguncian atomik dan algoritma FEFO (`backend/`), library `xlsx` untuk ekspor file Excel.
- **Autentikasi**: Modul bawaan Node.js `crypto` — password `scrypt` + salt, token HMAC-SHA256 (tanpa dependency tambahan seperti bcrypt/jsonwebtoken).
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React Icons, antarmuka responsif ramah smartphone (untuk staf gudang & kurir).

---

## 🚀 Cara Menjalankan Website

Aplikasi dapat dijalankan dengan dua cara mudah di komputer Anda:

### Opsi 1: Menjalankan Versi Produksi (Paling Mudah - 1 Perintah)
Frontend telah dibangun (`frontend/dist`). Anda cukup menjalankan server Express yang sekaligus menyajikan Web Frontend dan Backend API:

1. Buka Terminal / PowerShell di folder proyek ini (`Alur-bumbu`).
2. Jalankan perintah:
   ```bash
   npm start
   ```
3. Buka browser dan akses:
   👉 **http://localhost:5000**

---

### Opsi 2: Menjalankan Mode Pengembangan (Development)
Untuk mengedit kode sumber dengan Hot Module Reloading (Vite):

1. Buka Terminal / PowerShell di folder proyek ini.
2. Jalankan perintah gabungan:
   ```bash
   npm run dev
   ```
   *(Perintah ini akan menyalakan Backend API di port 5000 dan Vite Dev Server di port 3000)*
3. Buka browser dan akses:
   👉 **http://localhost:3000** (atau http://localhost:5000)

---

### Konfigurasi Environment & Keamanan

1. Salin `backend/.env.example` menjadi `backend/.env` bila belum ada.
2. Isi `AUTH_SECRET` dengan string acak yang kuat. Contoh membuat secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
3. Variabel penting:
   - `AUTH_SECRET` — kunci tanda tangan token. **Wajib di production**; server menolak start di production bila kosong.
   - `AUTH_TOKEN_TTL` — masa berlaku token, default `12h` (contoh: `30m`, `7d`).
   - `PORT` — port backend, default `5000`.
4. Jangan commit file `backend/.env` yang berisi secret asli.

---

## 🔐 Login & Akun Demo

Semua halaman dan API (kecuali katalog publik dan health check) memerlukan login. Akun demo berikut dibuat otomatis saat database pertama kali diinisialisasi:

| Peran | Username | Password | Tipe Akun |
|---|---|---|---|
| Owner | `owner` | `owner123` | — |
| Staf Admin | `admin` | `admin123` | — |
| Staf Gudang | `gudang` | `gudang123` | — |
| Staf Packing | `packing` | `packing123` | — |
| Customer Reseller | `customer` | `customer123` | Reseller (harga grosir) |
| Customer Umum | `customer_umum` | `customer123` | Perorangan (harga eceran) |

> ⚠️ **Ganti seluruh password demo sebelum digunakan di production.** Password disimpan sebagai hash `scrypt` + salt, bukan teks biasa.

### Matriks Hak Akses Singkat

| Endpoint / Aksi | Customer | Gudang | Packing | Admin | Owner |
|---|:---:|:---:|:---:|:---:|:---:|
| Katalog produk (GET) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Buat pesanan | ✅ | — | — | — | — |
| Lihat pesanan | Milik sendiri | ✅ | ✅ | ✅ | ✅ |
| Siapkan / laporkan kendala | — | ✅ | — | — | ✅ |
| Packing / serah kurir | — | — | ✅ | — | ✅ |
| Konfirmasi selesai / catat COD | — | — | — | ✅ | ✅ |
| Barang masuk / batch | — | ✅ | ✅ (lihat) | ✅ (lihat) | ✅ |
| Opname / tambah produk | — | — | — | — | ✅ |
| Log WhatsApp | — | — | — | ✅ | ✅ |
| Pengaturan & laporan/ekspor | — | — | — | — | ✅ |

---

## 🧭 Panduan Uji Coba Alur Peran (Login)

Login memakai akun sesuai peran, lalu **Keluar** untuk berpindah peran. Tombol pemilih peran di UI sudah dihapus agar hak akses benar-benar mengikuti akun.

### 1. Peran Customer 🛒
- Login sebagai `customer` (Reseller/grosir) atau `customer_umum` (Perorangan/eceran). Tipe akun dan harga otomatis mengikuti akun.
- Tambahkan produk rempah ke keranjang belanja (bumbu rendang, bubuk kunyit, kayu manis, dll.).
- Buka Keranjang, lengkapi alamat, lalu klik **Konfirmasi Pesanan (Bayar COD)**. Nama dan nomor WhatsApp mengikuti profil akun.
- Catat Nomor Pesanan (misal: `ORD-20261109-xxxx`).
- Masuk ke tab **Lacak Status Pesanan** untuk melihat linimasa interaktif alur pesanan Anda. Customer hanya dapat melihat pesanannya sendiri.

### 2. Peran Staf Gudang 📦
- Masuk ke tab **Antrean Penyiapan Pesanan (FIFO)**: Pesanan tertua muncul paling atas (*FR-05*).
- Centang checklist barang fisik yang diambil dari rak (*FR-06*).
- Klik tombol **Siap Dipacking** atau laporkan kekurangan stok dengan tombol kendala (*FR-07*).
- Buka tab **Catat Barang Masuk Supplier** untuk mencoba menginput barang masuk baru per batch; perhatikan stok bertambah dan notifikasi WhatsApp langsung terkirim ke Owner (*FR-13, FR-18*).

### 3. Peran Staf Packing 🏷️
- Lihat daftar pesanan berstatus **Siap Dipacking** (*FR-08*).
- Lakukan verifikasi item dan kemasan (*FR-09*).
- Masukkan nama kurir penjemput dan klik **Cetak Slip Kurir** (*FR-10*).
- Klik **Serahkan ke Kurir & Berangkat (Dikirim)**:
  - Status berubah menjadi `DIKIRIM`.
  - Stok otomatis dipotong dari batch dengan masa kedaluwarsa terdekat (**FEFO**) (*FR-14, FR-28*).
  - Notifikasi otomatis WhatsApp terkirim ke Owner dan Customer!

### 4. Peran Staf Admin 💰
- Memantau pesanan yang sedang diantar kurir.
- Klik **Diterima** saat customer telah menerima barang.
- Klik **Catat COD Lunas** (*FR-30*): masukkan nominal uang tunai yang diserahkan kurir ke admin dan tanggal. Nama penerima diambil dari akun admin yang login.
- Pesanan otomatis berstatus `LUNAS` dan `SELESAI`.

### 5. Peran Owner 👑
- Lihat **Ringkasan & Metrik**: Total stok fisik, stok dicadangkan, sisa COD pending, total uang tunai COD yang telah lunas.
- Tab **Stok & Batch FEFO**: Pantau status kedaluwarsa batch (*Aman*, *Mendekati Kedaluwarsa*, *Kedaluwarsa*).
- Uji coba **Koreksi Stok Opname** (*FR-16*): ubah stok fisik dan wajib isi alasan koreksi.
- Tab **Audit Log**: Audit trail siapa, kapan, jenis mutasi, dan referensi perubahan stok (*FR-15*).
- Tab **WhatsApp Log**: Lihat seluruh pesan WhatsApp yang dikirimkan sistem dan klik tautan **Buka di wa.me**.
- Tab **Ekspor Excel**: Klik tombol unduh file spreadsheet `.xlsx` atau `.csv` (*FR-25*).

---

## 📂 Struktur Direktori Proyek

```
Alur-bumbu/
├── package.json               # Konfigurasi npm root & scripts (start, dev, build, test:auth)
├── backend/                   # Backend Node.js / Express
│   ├── index.js               # Entry point server Express & static serving
│   ├── auth.js                # Hash password scrypt & token HMAC-SHA256
│   ├── db.js                  # Database file-backed, users, stok & algoritma FEFO
│   ├── middleware/
│   │   └── auth.js            # authenticate, authorize, getActor
│   ├── data/
│   │   └── database.json      # File database JSON persisten
│   ├── scripts/
│   │   ├── simulate_flow.js   # Simulasi alur pesanan (database sementara)
│   │   └── test_auth.js       # Uji login, token, dan otorisasi per peran
│   └── routes/
│       ├── auth.js            # Login, profil sesi, logout
│       ├── products.js        # API produk, barang masuk, dan batch FEFO
│       ├── orders.js          # API alur pesanan, reservasi stok, packing & kurir
│       ├── notifications.js   # API log WhatsApp & ringkasan harian
│       └── reports.js         # API dashboard metrik & ekspor Excel (.xlsx/.csv)
├── frontend/                  # Frontend React + Vite + Tailwind CSS
│   ├── index.html             # Template HTML
│   ├── vite.config.js         # Konfigurasi Vite & API Proxy
│   └── src/
│       ├── App.jsx            # State utama, sesi login & render per peran
│       ├── components/
│       │   ├── LoginScreen.jsx      # Form login & akun demo
│       │   ├── Navbar.jsx           # Identitas akun, logout, indikator WhatsApp
│       │   ├── CustomerStore.jsx    # Katalog bumbu & tracking pesanan
│       │   ├── CartDrawer.jsx       # Keranjang belanja & formulir COD
│       │   ├── WarehouseStaff.jsx   # Checklist gudang FIFO & barang masuk
│       │   ├── PackingStaff.jsx     # Verifikasi, kurir & serah terima
│       │   ├── AdminStaff.jsx       # Catat uang COD lunas & konfirmasi
│       │   ├── OwnerDashboard.jsx   # Metrik, opname, audit log & ekspor
│       │   ├── PrintSlipModal.jsx   # Slip pesanan kurir siap cetak
│       │   └── WhatsAppDrawer.jsx   # Live stream notifikasi WhatsApp
│       └── services/
│           └── api.js         # Fetch client API terpadu + token Bearer
└── README.md                  # Dokumentasi proyek lengkap
```

### Pengujian Otomatis

```bash
# Simulasi alur pesanan end-to-end (database sementara, tidak mengubah data operasional)
npm test

# Uji login, token, 401/403, isolasi pesanan customer, dan alur per peran
npm run test:auth
```

Dibuat dengan dedikasi untuk efisiensi bisnis bumbu kulakan & retail di Indonesia 🇮🇩.

