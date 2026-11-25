import assert from 'assert';
import { db } from '../db.js';

console.log('====================================================');
console.log('🧪 PENGUJIAN PERILAKU DATABASE REDIS (ERROR & SEED)');
console.log('====================================================\n');

async function runTests() {
  // Simpan state asli
  const originalRedis = db.redis;
  const originalData = db.data;

  try {
    // --- SKENARIO 1: redis.get melempar error ---
    console.log('1. Uji redis.get melempar error...');
    let saveCalled = false;
    db.data = { customKey: 'sensitive-unoverwritten-data' };
    db.redis = {
      get: async (key) => {
        throw new Error('Connection timeout to Upstash Redis');
      },
      set: async (key, val) => {
        saveCalled = true;
      }
    };

    let errorThrown = false;
    try {
      await db.load();
    } catch (err) {
      errorThrown = true;
      assert.strictEqual(err.message, 'Connection timeout to Upstash Redis');
    }

    assert.strictEqual(errorThrown, true, 'db.load() harus melempar error saat redis.get gagal');
    assert.strictEqual(saveCalled, false, 'db.save() TIDAK boleh dipanggil saat redis.get gagal');
    assert.strictEqual(db.data.customKey, 'sensitive-unoverwritten-data', 'Data TIDAK boleh ditimpa seed saat Redis error');
    console.log('   ✓ Berhasil: Error dilempar, save() tidak dipanggil, data tidak ditimpa.');

    // --- SKENARIO 2: redis.set melempar error ---
    console.log('\n2. Uji redis.set melempar error pada db.save()...');
    db.redis = {
      set: async (key, val) => {
        throw new Error('Redis read-only replica error');
      }
    };

    let saveErrorThrown = false;
    try {
      await db.save();
    } catch (err) {
      saveErrorThrown = true;
      assert.strictEqual(err.message, 'Redis read-only replica error');
    }

    assert.strictEqual(saveErrorThrown, true, 'db.save() harus melempar error saat redis.set gagal');
    console.log('   ✓ Berhasil: Error dari redis.set tidak ditelan dan dilempar ke caller.');

    // --- SKENARIO 3: redis.get mengembalikan null (database baru belum ada) ---
    console.log('\n3. Uji redis.get mengembalikan null (database baru)...');
    let savedData = null;
    db.data = null;
    db.redis = {
      get: async (key) => null,
      set: async (key, val) => {
        savedData = val;
      }
    };

    await db.load();
    assert.ok(db.data !== null, 'db.data harus diisi dengan seed saat redis null');
    assert.ok(Array.isArray(db.data.products), 'db.data.products harus berupa array');
    assert.ok(Array.isArray(db.data.users), 'db.data.users harus berupa array');
    assert.ok(savedData !== null, 'db.save() harus dipanggil untuk menyimpan seed baru');
    console.log('   ✓ Berhasil: Seeding hanya berjalan saat redis.get null/undefined.');

    // --- SKENARIO 4: redis.get mengembalikan data yang sudah ada ---
    console.log('\n4. Uji redis.get mengembalikan data tersimpan...');
    let existingSaveCalled = false;
    const existingDataset = {
      products: [{ id: 'p1', name: 'Bumbu Spesial' }],
      users: [{ id: 'u1', username: 'owner' }],
      batches: [],
      orders: [],
      stockLogs: [],
      notifications: [],
      settings: {}
    };

    db.redis = {
      get: async (key) => JSON.stringify(existingDataset),
      set: async (key, val) => {
        existingSaveCalled = true;
      }
    };

    await db.load();
    assert.strictEqual(db.data.products.length, 1);
    assert.strictEqual(db.data.products[0].name, 'Bumbu Spesial');
    assert.strictEqual(existingSaveCalled, false, 'db.save() tidak perlu dipanggil jika data sudah lengkap');
    console.log('   ✓ Berhasil: Data remote digunakan tanpa seeding ulang.');

    console.log('\n====================================================');
    console.log('🎉 SELURUH PENGUJIAN ERROR REDIS & SEED BERHASIL 100%!');
    console.log('====================================================');
  } finally {
    // Kembalikan state asli
    db.redis = originalRedis;
    db.data = originalData;
  }
}

runTests().catch(err => {
  console.error('Pengujian gagal:', err);
  process.exit(1);
});
