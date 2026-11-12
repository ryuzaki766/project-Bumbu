import { verifyToken } from '../auth.js';
import { db } from '../db.js';

/**
 * Middleware autentikasi: memvalidasi Bearer token dan melampirkan req.user.
 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (!/^Bearer$/i.test(scheme || '') || !token) {
    return res.status(401).json({
      success: false,
      message: 'Autentikasi diperlukan. Silakan login terlebih dahulu.'
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      message: 'Sesi tidak valid atau sudah kedaluwarsa. Silakan login kembali.'
    });
  }

  const user = db.findUserById(payload.sub);
  if (!user || user.active === false) {
    return res.status(401).json({
      success: false,
      message: 'Akun tidak ditemukan atau sudah dinonaktifkan.'
    });
  }

  req.user = db.toPublicUser(user);
  next();
}

/**
 * Middleware otorisasi berbasis peran.
 */
export function authorize(...allowedRoles) {
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autentikasi diperlukan. Silakan login terlebih dahulu.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Endpoint ini hanya dapat diakses oleh peran: ${roles.join(', ')}.`
      });
    }

    next();
  };
}

/**
 * Identitas pelaku diambil dari sesi login, bukan dari body request.
 */
export function getActor(req, fallback = 'Sistem') {
  return req.user?.name || fallback;
}
