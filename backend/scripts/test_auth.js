import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');

// Database sementara supaya pengujian tidak menyentuh data operasional.
const tempDb = path.join(os.tmpdir(), `alur-bumbu-auth-test-${Date.now()}-${Math.floor(Math.random() * 10000)}.json`);
const port = 5200 + Math.floor(Math.random() * 300);
const base = `http://127.0.0.1:${port}/api`;
const AUTH_SECRET = 'test-secret-alur-bumbu-auth';

let child = null;
let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`✓ ${name}`);
  } else {
    failed++;
    console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(pathname, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, data };
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.ok) return true;
    } catch {
      // Server belum siap.
    }
    await sleep(250);
  }
  return false;
}

async function login(username, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: { username, password }
  });
  return res;
}

async function main() {
  console.log('====================================================');
  console.log('🔐 PENGUJIAN LOGIN & OTORISASI BERBASIS PERAN');
  console.log('====================================================\n');

  child = spawn(process.execPath, ['index.js'], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(port),
      DB_FILE: tempDb,
      NODE_ENV: 'test',
      AUTH_SECRET
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let serverError = '';
  child.stderr.on('data', chunk => {
    serverError += chunk.toString();
  });

  const ready = await waitForServer();
  if (!ready) {
    throw new Error(`Server uji gagal start. ${serverError}`);
  }

  // 1. Endpoint publik
  const health = await request('/health');
  check('GET /api/health dapat diakses tanpa token', health.status === 200);

  const publicProducts = await request('/products');
  check('GET /api/products tetap publik untuk katalog', publicProducts.status === 200 && publicProducts.data?.success === true);

  // 2. Endpoint terlindungi menolak tanpa token
  const ordersWithoutToken = await request('/orders');
  check('GET /api/orders tanpa token ditolak 401', ordersWithoutToken.status === 401, `status=${ordersWithoutToken.status}`);

  const reportsWithoutToken = await request('/reports/dashboard');
  check('GET /api/reports/dashboard tanpa token ditolak 401', reportsWithoutToken.status === 401, `status=${reportsWithoutToken.status}`);

  // 3. Login gagal
  const badLogin = await login('owner', 'password-salah');
  check('Login dengan password salah ditolak 401', badLogin.status === 401, `status=${badLogin.status}`);

  // 4. Login semua peran
  const accounts = {
    owner: await login('owner', 'owner123'),
    admin: await login('admin', 'admin123'),
    warehouse: await login('gudang', 'gudang123'),
    packing: await login('packing', 'packing123'),
    customer: await login('customer', 'customer123'),
    customerUmum: await login('customer_umum', 'customer123')
  };

  for (const [role, res] of Object.entries(accounts)) {
    check(`Login ${role} berhasil dan menerima token`, res.status === 200 && Boolean(res.data?.data?.token));
  }

  const token = Object.fromEntries(
    Object.entries(accounts).map(([role, res]) => [role, res.data?.data?.token])
  );
  const users = Object.fromEntries(
    Object.entries(accounts).map(([role, res]) => [role, res.data?.data?.user])
  );

  check('Response login tidak membocorkan passwordHash', !('passwordHash' in (users.owner || {})));

  // 5. Token rusak
  const tampered = await request('/auth/me', { token: `${token.owner}x` });
  check('Token yang dimodifikasi ditolak 401', tampered.status === 401, `status=${tampered.status}`);

  // 6. Otorisasi laporan
  const customerReports = await request('/reports/dashboard', { token: token.customer });
  check('Customer tidak dapat mengakses dashboard laporan (403)', customerReports.status === 403, `status=${customerReports.status}`);

  const ownerReports = await request('/reports/dashboard', { token: token.owner });
  check('Owner dapat mengakses dashboard laporan (200)', ownerReports.status === 200, `status=${ownerReports.status}`);

  // 7. Otorisasi notifikasi
  const warehouseNotifications = await request('/notifications/whatsapp', { token: token.warehouse });
  check('Gudang tidak dapat mengakses log WhatsApp (403)', warehouseNotifications.status === 403, `status=${warehouseNotifications.status}`);

  const ownerSettings = await request('/notifications/settings', { token: token.owner });
  check('Owner dapat mengakses pengaturan notifikasi (200)', ownerSettings.status === 200, `status=${ownerSettings.status}`);

  // 8. Gudang mencatat barang masuk
  const goodsIn = await request('/products/goods-in', {
    method: 'POST',
    token: token.warehouse,
    body: {
      productId: 'prod-001',
      batchNumber: 'TEST-AUTH-01',
      expiryDate: '2027-12-31',
      qty: 50,
      supplierName: 'Supplier Uji Auth',
      notes: 'Data uji otomatis'
    }
  });
  check('Gudang dapat mencatat barang masuk (200)', goodsIn.status === 200 && goodsIn.data?.success === true, `status=${goodsIn.status}`);

  // 9. Customer membuat pesanan
  const createdOrder = await request('/orders', {
    method: 'POST',
    token: token.customer,
    body: {
      customerAddress: 'Jl. Uji Otorisasi No. 1',
      notes: 'Pesanan uji otorisasi',
      items: [{ productId: 'prod-001', qty: 1 }]
    }
  });
  const orderId = createdOrder.data?.data?.id;
  check('Customer dapat membuat pesanan (201)', createdOrder.status === 201 && Boolean(orderId), `status=${createdOrder.status}`);

  check(
    'Pesanan baru menyimpan customerUserId dari sesi login',
    createdOrder.data?.data?.customerUserId === users.customer?.id
  );

  check(
    'Harga pesanan mengikuti tipe akun (reseller = harga grosir)',
    createdOrder.data?.data?.items?.[0]?.price === 47000,
    `price=${createdOrder.data?.data?.items?.[0]?.price}`
  );

  // 10. Isolasi data antar customer
  const ownOrder = await request(`/orders/${orderId}`, { token: token.customer });
  check('Customer dapat melihat pesanannya sendiri (200)', ownOrder.status === 200, `status=${ownOrder.status}`);

  const otherCustomerOrder = await request(`/orders/${orderId}`, { token: token.customerUmum });
  check('Customer lain tidak dapat melihat pesanan tersebut (403)', otherCustomerOrder.status === 403, `status=${otherCustomerOrder.status}`);

  const otherCustomerList = await request('/orders', { token: token.customerUmum });
  check(
    'Daftar pesanan customer lain tidak memuat pesanan tersebut',
    otherCustomerList.status === 200 && Array.isArray(otherCustomerList.data?.data) &&
      !otherCustomerList.data.data.some(o => o.id === orderId)
  );

  // 11. Peran salah tidak bisa menjalankan aksi staf
  const customerPack = await request(`/orders/${orderId}/pack`, {
    method: 'POST',
    token: token.customer,
    body: { courierName: 'Kurir Tidak Sah' }
  });
  check('Customer tidak dapat memproses packing (403)', customerPack.status === 403, `status=${customerPack.status}`);

  // 12. Alur operasional dengan peran yang benar
  const prepared = await request(`/orders/${orderId}/prepare`, {
    method: 'POST',
    token: token.warehouse,
    body: { checklistItems: [true] }
  });
  check('Gudang dapat menandai pesanan siap dipacking (200)', prepared.status === 200, `status=${prepared.status}`);

  const packed = await request(`/orders/${orderId}/pack`, {
    method: 'POST',
    token: token.packing,
    body: { courierName: 'Kurir Uji Auth' }
  });
  check('Packing dapat memproses pesanan (200)', packed.status === 200, `status=${packed.status}`);

  const shipped = await request(`/orders/${orderId}/ship`, {
    method: 'POST',
    token: token.packing,
    body: { courierName: 'Kurir Uji Auth' }
  });
  check('Packing dapat menyerahkan pesanan ke kurir (200)', shipped.status === 200, `status=${shipped.status}`);

  const paid = await request(`/orders/${orderId}/pay-cod`, {
    method: 'POST',
    token: token.admin,
    body: { amountReceived: 47000, notes: 'Pembayaran uji auth' }
  });
  check('Admin dapat mencatat COD lunas (200)', paid.status === 200, `status=${paid.status}`);

  // 13. Identitas audit dari sesi login, bukan body
  const finalOrder = await request(`/orders/${orderId}`, { token: token.owner });
  const paidHistory = finalOrder.data?.data?.statusHistory?.find(h => h.status === 'LUNAS');
  check(
    'Audit log pembayaran memakai nama akun admin yang login',
    paidHistory?.actor === users.admin?.name,
    `actor=${paidHistory?.actor}`
  );

  // 14. Customer membatalkan pesanannya sendiri
  const secondOrder = await request('/orders', {
    method: 'POST',
    token: token.customerUmum,
    body: {
      customerAddress: 'Jl. Uji Batal No. 2',
      items: [{ productId: 'prod-001', qty: 1 }]
    }
  });
  const secondOrderId = secondOrder.data?.data?.id;

  const customerCancel = await request(`/orders/${secondOrderId}/cancel`, {
    method: 'POST',
    token: token.customerUmum,
    body: { reason: 'Uji pembatalan oleh customer' }
  });
  check('Customer dapat membatalkan pesanannya sendiri (200)', customerCancel.status === 200, `status=${customerCancel.status}`);

  const otherCancel = await request(`/orders/${orderId}/cancel`, {
    method: 'POST',
    token: token.customerUmum,
    body: { reason: 'Tidak berhak' }
  });
  check('Customer tidak dapat membatalkan pesanan customer lain (403)', otherCancel.status === 403, `status=${otherCancel.status}`);

  console.log('\n====================================================');
  console.log(`Hasil: ${passed} lulus, ${failed} gagal`);
  console.log('====================================================');
}

try {
  await main();
} catch (err) {
  failed++;
  console.error('\nPengujian gagal:', err.message);
} finally {
  if (child && !child.killed) {
    child.kill();
    await sleep(300);
  }
  try {
    if (fs.existsSync(tempDb)) fs.unlinkSync(tempDb);
  } catch {
    // Abaikan kegagalan pembersihan file sementara.
  }
}

process.exit(failed === 0 ? 0 : 1);
