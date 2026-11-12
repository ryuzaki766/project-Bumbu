# Backlog Alur Bumbu

Status di bawah disusun dari dokumentasi dan kode yang tersedia di repositori. ✅ berarti implementasinya ditemukan di kode; ❌ berarti masih perlu dikerjakan. Tanda ✅ bukan pengganti uji penerimaan di lingkungan produksi.

## Sudah dikerjakan

- ✅ Katalog produk dengan pilihan harga perorangan dan reseller.
- ✅ Checkout COD tanpa ongkir, pembuatan pesanan, dan pencadangan stok.
- ✅ Pelacakan pesanan berdasarkan ID.
- ✅ Antrean gudang FIFO, checklist pengambilan barang, dan pelaporan kendala.
- ✅ Verifikasi packing, penetapan kurir, serta cetak slip kurir.
- ✅ Perubahan status pengiriman, pencatatan pembayaran COD oleh admin, pembatalan, dan retur.
- ✅ Penerimaan barang supplier per batch, ringkasan stok, dan pengurangan stok dengan algoritma FEFO.
- ✅ Peringatan stok menipis/kedaluwarsa, koreksi stok opname dengan alasan, dan audit log mutasi.
- ✅ Dashboard owner serta ekspor laporan stok, mutasi, dan pesanan ke Excel/CSV.
- ✅ Log notifikasi WhatsApp dan tautan untuk membuka pesan melalui `wa.me`.
- ✅ Skrip simulasi alur pesanan tersedia melalui perintah `npm test` dan memakai database sementara.
- ✅ Login dan otorisasi berbasis peran untuk customer, gudang, packing, admin, dan owner; token HMAC-SHA256, password `scrypt`, dan pembatasan percobaan login.
- ✅ Pengujian otorisasi terisolasi melalui `npm run test:auth` (401/403, isolasi pesanan customer, alur per peran).

## Belum dikerjakan / backlog

| Status | Prioritas | Tugas |
|---|---|---|
| ❌ | P0 | Batasi konfigurasi CORS untuk deployment (saat ini masih mengizinkan origin pengembangan). |
| ❌ | P1 | Integrasikan WhatsApp Business/API provider untuk pengiriman otomatis dan status pengiriman pesan. Saat ini sistem menyimpan log dan menyediakan tautan `wa.me`; belum mengirim pesan otomatis melalui provider. |
| ❌ | P1 | Perluas pengujian terisolasi untuk kasus stok tidak cukup, konflik ID pesanan, dan retur sebagian; alur utama serta otorisasi sudah tercakup. |
| ❌ | P1 | Evaluasi migrasi dari penyimpanan JSON ke database transaksional, termasuk penanganan akses bersamaan, backup, dan pemulihan data sebelum penggunaan multi-pengguna/produksi. |
| ❌ | P2 | Tambahkan validasi dan penanganan konflik ID pesanan agar nomor yang terbentuk tidak pernah bertabrakan. |

## Catatan

- Daftar backlog berfokus pada celah yang tampak dari repositori dan kesiapan produksi; keputusan prioritas dapat disesuaikan dengan kebutuhan bisnis.
- Status implementasi dapat berubah setelah pengujian manual dan uji penerimaan pengguna.
