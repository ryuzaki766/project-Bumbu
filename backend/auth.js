import crypto from 'crypto';

const SCRYPT_KEYLEN = 64;
const DEFAULT_TTL_SECONDS = 12 * 60 * 60;

export const ROLES = ['customer', 'warehouse', 'packing', 'admin', 'owner'];

/**
 * Hash password memakai scrypt dengan salt acak per user.
 * Format tersimpan: scrypt$<salt>$<hash>
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, SCRYPT_KEYLEN).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

/**
 * Verifikasi password dengan perbandingan constant-time.
 */
export function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;

  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;

  try {
    const computed = crypto.scryptSync(String(password), salt, SCRYPT_KEYLEN);
    const expected = Buffer.from(expectedHex, 'hex');
    if (expected.length !== computed.length) return false;
    return crypto.timingSafeEqual(computed, expected);
  } catch {
    return false;
  }
}

function toBase64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.trim().length > 0) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET wajib diisi pada environment production.');
  }

  // Fallback khusus pengembangan lokal. Jangan dipakai di production.
  return 'alur-bumbu-development-secret-change-me';
}

/**
 * Mendukung nilai seperti "12h", "30m", "7d", atau angka detik.
 */
export function parseTtl(ttl) {
  if (typeof ttl === 'number' && Number.isFinite(ttl)) return Math.max(1, Math.floor(ttl));

  const match = String(ttl || '').trim().match(/^(\d+)\s*([smhd])?$/i);
  if (!match) return DEFAULT_TTL_SECONDS;

  const amount = parseInt(match[1], 10);
  const unit = (match[2] || 's').toLowerCase();
  const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit] || 1;

  return Math.max(1, amount * multiplier);
}

/**
 * Membuat token bertanda tangan HMAC-SHA256 (format mirip JWT).
 */
export function signToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const ttl = parseTtl(process.env.AUTH_TOKEN_TTL || '12h');

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    iat: now,
    exp: now + ttl
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();

  return `${encodedHeader}.${encodedPayload}.${toBase64Url(signature)}`;
}

/**
 * Memverifikasi token. Mengembalikan payload atau null jika tidak valid/kedaluwarsa.
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, providedSignature] = parts;
  if (!encodedHeader || !encodedPayload || !providedSignature) return null;

  try {
    const expectedSignature = toBase64Url(
      crypto
        .createHmac('sha256', getSecret())
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest()
    );

    const provided = Buffer.from(providedSignature);
    const expected = Buffer.from(expectedSignature);
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
      return null;
    }

    const payload = JSON.parse(fromBase64Url(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (!payload || !payload.sub || !payload.role || !payload.exp) return null;
    if (payload.exp <= now) return null;

    return payload;
  } catch {
    return null;
  }
}
