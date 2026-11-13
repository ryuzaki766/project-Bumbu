import express from 'express';
import { db } from '../db.js';
import { signToken, verifyPassword, hashPassword } from '../auth.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Throttle login sederhana: maksimal 5 percobaan gagal per 15 menit per IP + username.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const loginAttempts = new Map();

function attemptKey(req, username) {
  return `${req.ip || 'unknown'}:${String(username || '').trim().toLowerCase()}`;
}

function isThrottled(key) {
  const entry = loginAttempts.get(key);
  if (!entry) return false;

  if (Date.now() - entry.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
    return false;
  }

  return entry.count >= MAX_LOGIN_ATTEMPTS;
}

function registerFailure(key) {
  const entry = loginAttempts.get(key);
  if (!entry || Date.now() - entry.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: Date.now() });
    return;
  }
  entry.count += 1;
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi.'
      });
    }

    const key = attemptKey(req, username);
    if (isThrottled(key)) {
      return res.status(429).json({
        success: false,
        message: 'Terlalu banyak percobaan login gagal. Coba lagi dalam 15 menit.'
      });
    }

    const user = db.findUserByUsername(username);
    if (!user || user.active === false || !verifyPassword(password, user.passwordHash)) {
      registerFailure(key);
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.'
      });
    }

    loginAttempts.delete(key);

    const token = signToken(user);

    res.json({
      success: true,
      message: `Selamat datang, ${user.name}.`,
      data: {
        token,
        user: db.toPublicUser(user)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const {
      name,
      username,
      password,
      confirmPassword,
      role: roleInput,
      phone = '',
      customerType: customerTypeInput
    } = req.body || {};

    // --- Validasi field wajib ---
    if (!name || !username || !password || !confirmPassword || !roleInput) {
      return res.status(400).json({
        success: false,
        message: 'Nama, username, password, konfirmasi password, dan peran wajib diisi.'
      });
    }

    if (String(name).trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Nama minimal 2 karakter.' });
    }

    const usernameTrimmed = String(username).trim();
    if (!/^[a-zA-Z0-9_.@-]{3,30}$/.test(usernameTrimmed)) {
      return res.status(400).json({
        success: false,
        message: 'Username 3–30 karakter, hanya boleh huruf, angka, titik, underscore, atau strip.'
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ success: false, message: 'Password minimal 8 karakter.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Konfirmasi password tidak cocok.' });
    }

    // --- Pemetaan peran dari frontend ke internal ---
    // Frontend mengirim: owner | admin | gudang | packing | customer | customer_umum
    // Backend menyimpan: owner | admin | warehouse | packing | customer
    const ROLE_MAP = {
      owner: { role: 'owner', customerType: null },
      admin: { role: 'admin', customerType: null },
      gudang: { role: 'warehouse', customerType: null },
      warehouse: { role: 'warehouse', customerType: null },
      packing: { role: 'packing', customerType: null },
      customer: { role: 'customer', customerType: customerTypeInput || 'reseller' },
      customer_umum: { role: 'customer', customerType: 'perorangan' }
    };

    const mapped = ROLE_MAP[String(roleInput).toLowerCase()];
    if (!mapped) {
      return res.status(400).json({
        success: false,
        message: `Peran tidak valid. Pilihan: owner, admin, gudang, packing, customer, customer_umum.`
      });
    }

    // --- Cek duplikasi username ---
    const existing = db.findUserByUsername(usernameTrimmed);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Username sudah digunakan. Pilih username lain.'
      });
    }

    // --- Throttle sederhana berdasarkan IP untuk register ---
    const ipKey = `reg:${req.ip || 'unknown'}`;
    if (isThrottled(ipKey)) {
      return res.status(429).json({
        success: false,
        message: 'Terlalu banyak percobaan pendaftaran. Coba lagi dalam 15 menit.'
      });
    }

    // --- Buat akun ---
    const newUser = {
      id: `user-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      username: usernameTrimmed,
      passwordHash: hashPassword(String(password)),
      name: String(name).trim(),
      role: mapped.role,
      phone: String(phone || '').trim(),
      address: '',
      customerType: mapped.customerType,
      active: true,
      createdAt: new Date().toISOString()
    };

    db.data.users.push(newUser);
    db.save();

    loginAttempts.delete(ipKey);

    const token = signToken(newUser);

    res.status(201).json({
      success: true,
      message: `Akun berhasil dibuat. Selamat datang, ${newUser.name}!`,
      data: {
        token,
        user: db.toPublicUser(newUser)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/logout
// Token bersifat stateless; client cukup menghapus token dari penyimpanan.
router.post('/logout', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Logout berhasil. Hapus token dari penyimpanan client.'
  });
});

export default router;
