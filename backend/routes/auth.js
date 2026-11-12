import express from 'express';
import { db } from '../db.js';
import { signToken, verifyPassword } from '../auth.js';
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

// POST /api/auth/logout
// Token bersifat stateless; client cukup menghapus token dari penyimpanan.
router.post('/logout', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Logout berhasil. Hapus token dari penyimpanan client.'
  });
});

export default router;
