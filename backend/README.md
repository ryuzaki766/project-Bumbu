# 🌿 Alur Bumbu - Backend API Server

Modul backend independen untuk aplikasi **Alur Bumbu** (Manajemen Pesanan Bumbu & Logistik Otomatis).

## 🚀 Fitur Backend
- **RESTful API**: Endpoint lengkap untuk Katalog Produk, Batch FEFO, Alur Pesanan (Workflow), Pembayaran COD, dan Laporan.
- **Login & Otorisasi Berbasis Peran (RBAC)**: Password `scrypt` + salt, token HMAC-SHA256, middleware `authenticate` & `authorize`.
- **Database Engine Persisten**: Penyimpanan data file-backed atomik di `data/database.json`, termasuk koleksi `users`.
- **FEFO Inventory Algorithm**: Pengurangan stok otomatis memprioritaskan batch dengan masa kedaluwarsa terdekat.
- **Audit Log Mutasi**: Pencatatan riwayat setiap barang masuk, keluar, retur, dan koreksi opname. Nama pelaku diambil dari sesi login.
- **WhatsApp Notification Engine**: Pembuatan log pesan otomatis ke Owner dan Customer.
- **Ekspor Excel / CSV**: Pembuatan spreadsheet `.xlsx` menggunakan library `xlsx` (khusus Owner, memerlukan token).

## 🔐 Konfigurasi Environment

Salin `.env.example` menjadi `.env`, lalu sesuaikan:

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
AUTH_SECRET=ganti-dengan-secret-acak-yang-kuat
AUTH_TOKEN_TTL=12h
```

- `AUTH_SECRET` **wajib** diisi di production. Server akan menolak start bila kosong.
- `AUTH_TOKEN_TTL` mendukung format `30m`, `12h`, atau `7d`.
- `DB_FILE` opsional, berguna untuk pengujian dengan database sementara.

## 📦 Menjalankan Backend
Jalankan file batch:
```bash
jalankan-backend.bat
```
Atau via command line:
```bash
npm start
```
Server akan aktif di:
👉 **http://localhost:5000** (Health check: `http://localhost:5000/api/health`)

## 👥 Akun Demo

Dibuat otomatis saat database pertama kali diinisialisasi:

| Peran | Username | Password |
|---|---|---|
| Owner | `owner` | `owner123` |
| Staf Admin | `admin` | `admin123` |
| Staf Gudang | `gudang` | `gudang123` |
| Staf Packing | `packing` | `packing123` |
| Customer Reseller | `customer` | `customer123` |
| Customer Umum | `customer_umum` | `customer123` |

> Ganti seluruh password demo sebelum production.

## 🔑 Alur Autentikasi

1. `POST /api/auth/login` dengan body `{ "username": "...", "password": "..." }`.
2. Simpan `data.token` dari response.
3. Kirim header `Authorization: Bearer <token>` pada setiap request API.
4. `GET /api/auth/me` untuk memvalidasi sesi; `POST /api/auth/logout` untuk logout.
5. Token berlaku sesuai `AUTH_TOKEN_TTL`. Setelah kedaluwarsa, API mengembalikan `401`.

Login dibatasi maksimal **5 percobaan gagal per 15 menit** per kombinasi IP + username.

## 🧪 Pengujian Otomatis

```bash
# Simulasi alur end-to-end memakai database sementara
npm test

# Uji login, token, 401/403, isolasi pesanan customer, dan alur per peran
npm run test:auth
```

Kedua skrip menggunakan database sementara sehingga tidak mengubah `data/database.json` operasional.
