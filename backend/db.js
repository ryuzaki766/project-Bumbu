import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Redis } from '@upstash/redis';
import { hashPassword } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = process.env.DB_FILE
  ? path.resolve(process.env.DB_FILE)
  : path.join(DATA_DIR, 'database.json');

const isVercel = Boolean(process.env.VERCEL);
const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const isRedisConfigured = Boolean(redisUrl && redisToken);
const REDIS_KEY = process.env.REDIS_DB_KEY || 'alur-bumbu-db';

// Ensure data directory exists only if local file mode is used
if (!isVercel && !isRedisConfigured) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Warning: Gagal membuat DATA_DIR:', err.message);
  }
}

// In Vercel, Redis credentials MUST be configured
if (isVercel && !isRedisConfigured) {
  throw new Error(
    'Environment VERCEL terdeteksi, tetapi kredensial Upstash Redis (KV_REST_API_URL / UPSTASH_REDIS_REST_URL dan TOKEN) belum dikonfigurasi. Vercel serverless membutuhkan Upstash Redis / Vercel KV karena filesystem bersifat read-only dan stateless.'
  );
}

export const SPICE_CATEGORY_DEFINITIONS = [
  {
    key: 'CAT_47K',
    name: 'Rp 47.000/kg (nomor 1-9)',
    pricePerKg: 47000,
    spiceNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    spiceCount: 9,
    calculationText: '9 × 500',
    totalPcs: 4500
  },
  {
    key: 'CAT_43K',
    name: 'Rp 43.000/kg (nomor 10-16)',
    pricePerKg: 43000,
    spiceNumbers: [10, 11, 12, 13, 14, 15, 16],
    spiceCount: 7,
    calculationText: '7 × 500',
    totalPcs: 3500
  }
];

export const SPICE_STANDARD_NAMES = [
  { number: 1, name: 'Bumbu Bali', categoryKey: 'CAT_47K' },
  { number: 2, name: 'Bumbu Sambel Goreng', categoryKey: 'CAT_47K' },
  { number: 3, name: 'Bumbu Rendang', categoryKey: 'CAT_47K' },
  { number: 4, name: 'Bumbu Rujak', categoryKey: 'CAT_47K' },
  { number: 5, name: 'Bumbu Ayam Panggang', categoryKey: 'CAT_47K' },
  { number: 6, name: 'Bumbu Rica-Rica', categoryKey: 'CAT_47K' },
  { number: 7, name: 'Bumbu Krengsengan', categoryKey: 'CAT_47K' },
  { number: 8, name: 'Bumbu Opor', categoryKey: 'CAT_47K' },
  { number: 9, name: 'Bumbu Mie', categoryKey: 'CAT_47K' },
  { number: 10, name: 'Bumbu Rawon', categoryKey: 'CAT_43K' },
  { number: 11, name: 'Bumbu Soto', categoryKey: 'CAT_43K' },
  { number: 12, name: 'Bumbu Lodeh', categoryKey: 'CAT_43K' },
  { number: 13, name: 'Bumbu Kare', categoryKey: 'CAT_43K' },
  { number: 14, name: 'Bumbu Gule', categoryKey: 'CAT_43K' },
  { number: 15, name: 'Bumbu Ukep/Bacem', categoryKey: 'CAT_43K' },
  { number: 16, name: 'Bumbu Nasi Goreng', categoryKey: 'CAT_43K' }
];

export function getSpiceCategoryInfo(product) {
  let spiceNumber = product.spiceNumber;

  if (!spiceNumber) {
    const prodName = (product.name || '').toLowerCase();
    for (const spec of SPICE_STANDARD_NAMES) {
      const keyword = spec.name.toLowerCase().replace('bumbu ', '');
      if (prodName.includes(keyword)) {
        spiceNumber = spec.number;
        break;
      }
    }
  }

  const categoryKey = product.spiceCategoryGroup || (
    spiceNumber && spiceNumber >= 1 && spiceNumber <= 9 ? 'CAT_47K' :
    spiceNumber && spiceNumber >= 10 && spiceNumber <= 16 ? 'CAT_43K' :
    product.priceRetail >= 45000 ? 'CAT_47K' : 'CAT_43K'
  );

  const def = SPICE_CATEGORY_DEFINITIONS.find(d => d.key === categoryKey) || SPICE_CATEGORY_DEFINITIONS[0];

  return {
    spiceNumber: spiceNumber || null,
    spiceCategoryGroup: def.key,
    spiceCategoryName: def.name,
    calculationText: def.calculationText,
    categoryTotalPcs: def.totalPcs,
    categoryPricePerKg: def.pricePerKg
  };
}

function getSeedPassword(roleKey, defaultDevPassword) {
  if (process.env.NODE_ENV === 'production') {
    const envName = `SEED_${roleKey.toUpperCase()}_PASSWORD`;
    const envVal = process.env[envName];
    if (!envVal || envVal.trim().length === 0) {
      throw new Error(`[SEED USER] Environment variable ${envName} wajib diisi pada environment production untuk inisialisasi akun bawaan.`);
    }
    return envVal.trim();
  }
  return defaultDevPassword;
}

/**
 * Akun demo awal. Password di-hash saat seeding; jangan gunakan password ini di production.
 */
export function getSeedUsers() {
  const createdAt = new Date().toISOString();

  return [
    {
      id: 'user-owner',
      username: 'owner',
      passwordHash: hashPassword(getSeedPassword('owner', 'owner123')),
      name: 'Pak Haji Rahmat',
      role: 'owner',
      phone: '081288990011',
      address: 'Jl. Sentra Rempah Nusantara No. 88',
      customerType: null,
      active: true,
      createdAt
    },
    {
      id: 'user-admin',
      username: 'admin',
      passwordHash: hashPassword(getSeedPassword('admin', 'admin123')),
      name: 'Lina (Staf Admin)',
      role: 'admin',
      phone: '081288990012',
      address: '',
      customerType: null,
      active: true,
      createdAt
    },
    {
      id: 'user-warehouse',
      username: 'gudang',
      passwordHash: hashPassword(getSeedPassword('warehouse', 'gudang123')),
      name: 'Rudi (Staf Gudang)',
      role: 'warehouse',
      phone: '081288990013',
      address: '',
      customerType: null,
      active: true,
      createdAt
    },
    {
      id: 'user-packing',
      username: 'packing',
      passwordHash: hashPassword(getSeedPassword('packing', 'packing123')),
      name: 'Siti (Staf Packing)',
      role: 'packing',
      phone: '081288990014',
      address: '',
      customerType: null,
      active: true,
      createdAt
    },
    {
      id: 'user-customer-reseller',
      username: 'customer',
      passwordHash: hashPassword(getSeedPassword('customer', 'customer123')),
      name: 'Warung Bu Dewi',
      role: 'customer',
      phone: '081299887766',
      address: 'Jl. Merdeka No. 12, Padang',
      customerType: 'reseller',
      active: true,
      createdAt
    },
    {
      id: 'user-customer-umum',
      username: 'customer_umum',
      passwordHash: hashPassword(getSeedPassword('customer_umum', 'customer123')),
      name: 'Ibu Salma',
      role: 'customer',
      phone: '081299887767',
      address: 'Jl. Melati No. 5, Padang',
      customerType: 'perorangan',
      active: true,
      createdAt
    }
  ];
}

function getInitialData() {
  const products = [
    {
        "id": "prod-001",
        "name": "Bumbu Bali 1 Kg",
        "category": "Bumbu Masak",
        "unit": "pack (1 Kg)",
        "priceRetail": 47000,
        "priceWholesale": 47000,
        "minStock": 10,
        "description": "Bumbu Bali kemasan 1 Kg.",
        "icon": "🌶️"
    },
    {
        "id": "prod-002",
        "name": "Bumbu Bali ½ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (500g)",
        "priceRetail": 24000,
        "priceWholesale": 24000,
        "minStock": 10,
        "description": "Bumbu Bali kemasan ½ Kg.",
        "icon": "🌶️"
    },
    {
        "id": "prod-003",
        "name": "Bumbu Bali ¼ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (250g)",
        "priceRetail": 12750,
        "priceWholesale": 12750,
        "minStock": 10,
        "description": "Bumbu Bali kemasan ¼ Kg.",
        "icon": "🌶️"
    },
    {
        "id": "prod-004",
        "name": "Bumbu Sambel Goreng 1 Kg",
        "category": "Bumbu Masak",
        "unit": "pack (1 Kg)",
        "priceRetail": 47000,
        "priceWholesale": 47000,
        "minStock": 10,
        "description": "Bumbu Sambel Goreng kemasan 1 Kg.",
        "icon": "🍲"
    },
    {
        "id": "prod-005",
        "name": "Bumbu Sambel Goreng ½ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (500g)",
        "priceRetail": 24000,
        "priceWholesale": 24000,
        "minStock": 10,
        "description": "Bumbu Sambel Goreng kemasan ½ Kg.",
        "icon": "🍲"
    },
    {
        "id": "prod-006",
        "name": "Bumbu Sambel Goreng ¼ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (250g)",
        "priceRetail": 12750,
        "priceWholesale": 12750,
        "minStock": 10,
        "description": "Bumbu Sambel Goreng kemasan ¼ Kg.",
        "icon": "🍲"
    },
    {
        "id": "prod-007",
        "name": "Bumbu Rendang 1 Kg",
        "category": "Bumbu Masak",
        "unit": "pack (1 Kg)",
        "priceRetail": 47000,
        "priceWholesale": 47000,
        "minStock": 10,
        "description": "Bumbu Rendang kemasan 1 Kg.",
        "icon": "🥘"
    },
    {
        "id": "prod-008",
        "name": "Bumbu Rendang ½ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (500g)",
        "priceRetail": 24000,
        "priceWholesale": 24000,
        "minStock": 10,
        "description": "Bumbu Rendang kemasan ½ Kg.",
        "icon": "🥘"
    },
    {
        "id": "prod-009",
        "name": "Bumbu Rendang ¼ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (250g)",
        "priceRetail": 12750,
        "priceWholesale": 12750,
        "minStock": 10,
        "description": "Bumbu Rendang kemasan ¼ Kg.",
        "icon": "🥘"
    },
    {
        "id": "prod-010",
        "name": "Bumbu Rujak 1 Kg",
        "category": "Bumbu Masak",
        "unit": "pack (1 Kg)",
        "priceRetail": 47000,
        "priceWholesale": 47000,
        "minStock": 10,
        "description": "Bumbu Rujak kemasan 1 Kg.",
        "icon": "🥣"
    },
    {
        "id": "prod-011",
        "name": "Bumbu Rujak ½ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (500g)",
        "priceRetail": 24000,
        "priceWholesale": 24000,
        "minStock": 10,
        "description": "Bumbu Rujak kemasan ½ Kg.",
        "icon": "🥣"
    },
    {
        "id": "prod-012",
        "name": "Bumbu Rujak ¼ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (250g)",
        "priceRetail": 12750,
        "priceWholesale": 12750,
        "minStock": 10,
        "description": "Bumbu Rujak kemasan ¼ Kg.",
        "icon": "🥣"
    },
    {
        "id": "prod-013",
        "name": "Bumbu Ayam Panggang 1 Kg",
        "category": "Bumbu Masak",
        "unit": "pack (1 Kg)",
        "priceRetail": 47000,
        "priceWholesale": 47000,
        "minStock": 10,
        "description": "Bumbu Ayam Panggang kemasan 1 Kg.",
        "icon": "🍛"
    },
    {
        "id": "prod-014",
        "name": "Bumbu Ayam Panggang ½ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (500g)",
        "priceRetail": 24000,
        "priceWholesale": 24000,
        "minStock": 10,
        "description": "Bumbu Ayam Panggang kemasan ½ Kg.",
        "icon": "🍛"
    },
    {
        "id": "prod-015",
        "name": "Bumbu Ayam Panggang ¼ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (250g)",
        "priceRetail": 12750,
        "priceWholesale": 12750,
        "minStock": 10,
        "description": "Bumbu Ayam Panggang kemasan ¼ Kg.",
        "icon": "🍛"
    },
    {
        "id": "prod-016",
        "name": "Bumbu Rica-Rica 1 Kg",
        "category": "Bumbu Masak",
        "unit": "pack (1 Kg)",
        "priceRetail": 47000,
        "priceWholesale": 47000,
        "minStock": 10,
        "description": "Bumbu Rica-Rica kemasan 1 Kg.",
        "icon": "🧂"
    },
    {
        "id": "prod-017",
        "name": "Bumbu Rica-Rica ½ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (500g)",
        "priceRetail": 24000,
        "priceWholesale": 24000,
        "minStock": 10,
        "description": "Bumbu Rica-Rica kemasan ½ Kg.",
        "icon": "🧂"
    },
    {
        "id": "prod-018",
        "name": "Bumbu Rica-Rica ¼ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (250g)",
        "priceRetail": 12750,
        "priceWholesale": 12750,
        "minStock": 10,
        "description": "Bumbu Rica-Rica kemasan ¼ Kg.",
        "icon": "🧂"
    },
    {
        "id": "prod-019",
        "name": "Bumbu Krengsengan 1 Kg",
        "category": "Bumbu Masak",
        "unit": "pack (1 Kg)",
        "priceRetail": 47000,
        "priceWholesale": 47000,
        "minStock": 10,
        "description": "Bumbu Krengsengan kemasan 1 Kg.",
        "icon": "🌿"
    },
    {
        "id": "prod-020",
        "name": "Bumbu Krengsengan ½ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (500g)",
        "priceRetail": 24000,
        "priceWholesale": 24000,
        "minStock": 10,
        "description": "Bumbu Krengsengan kemasan ½ Kg.",
        "icon": "🌿"
    },
    {
        "id": "prod-021",
        "name": "Bumbu Krengsengan ¼ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (250g)",
        "priceRetail": 12750,
        "priceWholesale": 12750,
        "minStock": 10,
        "description": "Bumbu Krengsengan kemasan ¼ Kg.",
        "icon": "🌿"
    },
    {
        "id": "prod-022",
        "name": "Bumbu Opor 1 Kg",
        "category": "Bumbu Masak",
        "unit": "pack (1 Kg)",
        "priceRetail": 47000,
        "priceWholesale": 47000,
        "minStock": 10,
        "description": "Bumbu Opor kemasan 1 Kg.",
        "icon": "✨"
    },
    {
        "id": "prod-023",
        "name": "Bumbu Opor ½ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (500g)",
        "priceRetail": 24000,
        "priceWholesale": 24000,
        "minStock": 10,
        "description": "Bumbu Opor kemasan ½ Kg.",
        "icon": "✨"
    },
    {
        "id": "prod-024",
        "name": "Bumbu Opor ¼ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (250g)",
        "priceRetail": 12750,
        "priceWholesale": 12750,
        "minStock": 10,
        "description": "Bumbu Opor kemasan ¼ Kg.",
        "icon": "✨"
    },
    {
        "id": "prod-025",
        "name": "Bumbu Mie 1 Kg",
        "category": "Bumbu Masak",
        "unit": "pack (1 Kg)",
        "priceRetail": 47000,
        "priceWholesale": 47000,
        "minStock": 10,
        "description": "Bumbu Mie kemasan 1 Kg.",
        "icon": "🔥"
    },
    {
        "id": "prod-026",
        "name": "Bumbu Mie ½ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (500g)",
        "priceRetail": 24000,
        "priceWholesale": 24000,
        "minStock": 10,
        "description": "Bumbu Mie kemasan ½ Kg.",
        "icon": "🔥"
    },
    {
        "id": "prod-027",
        "name": "Bumbu Mie ¼ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (250g)",
        "priceRetail": 12750,
        "priceWholesale": 12750,
        "minStock": 10,
        "description": "Bumbu Mie kemasan ¼ Kg.",
        "icon": "🔥"
    },
    {
        "id": "prod-028",
        "name": "Bumbu Rawon 1 Kg",
        "category": "Bumbu Masak",
        "unit": "pack (1 Kg)",
        "priceRetail": 43000,
        "priceWholesale": 43000,
        "minStock": 10,
        "description": "Bumbu Rawon kemasan 1 Kg.",
        "icon": "🍜"
    },
    {
        "id": "prod-029",
        "name": "Bumbu Rawon ½ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (500g)",
        "priceRetail": 22000,
        "priceWholesale": 22000,
        "minStock": 10,
        "description": "Bumbu Rawon kemasan ½ Kg.",
        "icon": "🍜"
    },
    {
        "id": "prod-030",
        "name": "Bumbu Rawon ¼ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (250g)",
        "priceRetail": 11750,
        "priceWholesale": 11750,
        "minStock": 10,
        "description": "Bumbu Rawon kemasan ¼ Kg.",
        "icon": "🍜"
    },
    {
        "id": "prod-031",
        "name": "Bumbu Soto 1 Kg",
        "category": "Bumbu Masak",
        "unit": "pack (1 Kg)",
        "priceRetail": 43000,
        "priceWholesale": 43000,
        "minStock": 10,
        "description": "Bumbu Soto kemasan 1 Kg.",
        "icon": "🌶️"
    },
    {
        "id": "prod-032",
        "name": "Bumbu Soto ½ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (500g)",
        "priceRetail": 22000,
        "priceWholesale": 22000,
        "minStock": 10,
        "description": "Bumbu Soto kemasan ½ Kg.",
        "icon": "🌶️"
    },
    {
        "id": "prod-033",
        "name": "Bumbu Soto ¼ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (250g)",
        "priceRetail": 11750,
        "priceWholesale": 11750,
        "minStock": 10,
        "description": "Bumbu Soto kemasan ¼ Kg.",
        "icon": "🌶️"
    },
    {
        "id": "prod-034",
        "name": "Bumbu Lodeh 1 Kg",
        "category": "Bumbu Masak",
        "unit": "pack (1 Kg)",
        "priceRetail": 43000,
        "priceWholesale": 43000,
        "minStock": 10,
        "description": "Bumbu Lodeh kemasan 1 Kg.",
        "icon": "🍲"
    },
    {
        "id": "prod-035",
        "name": "Bumbu Lodeh ½ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (500g)",
        "priceRetail": 22000,
        "priceWholesale": 22000,
        "minStock": 10,
        "description": "Bumbu Lodeh kemasan ½ Kg.",
        "icon": "🍲"
    },
    {
        "id": "prod-036",
        "name": "Bumbu Lodeh ¼ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (250g)",
        "priceRetail": 11750,
        "priceWholesale": 11750,
        "minStock": 10,
        "description": "Bumbu Lodeh kemasan ¼ Kg.",
        "icon": "🍲"
    },
    {
        "id": "prod-037",
        "name": "Bumbu Kare 1 Kg",
        "category": "Bumbu Masak",
        "unit": "pack (1 Kg)",
        "priceRetail": 43000,
        "priceWholesale": 43000,
        "minStock": 10,
        "description": "Bumbu Kare kemasan 1 Kg.",
        "icon": "🥘"
    },
    {
        "id": "prod-038",
        "name": "Bumbu Kare ½ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (500g)",
        "priceRetail": 22000,
        "priceWholesale": 22000,
        "minStock": 10,
        "description": "Bumbu Kare kemasan ½ Kg.",
        "icon": "🥘"
    },
    {
        "id": "prod-039",
        "name": "Bumbu Kare ¼ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (250g)",
        "priceRetail": 11750,
        "priceWholesale": 11750,
        "minStock": 10,
        "description": "Bumbu Kare kemasan ¼ Kg.",
        "icon": "🥘"
    },
    {
        "id": "prod-040",
        "name": "Bumbu Gule 1 Kg",
        "category": "Bumbu Masak",
        "unit": "pack (1 Kg)",
        "priceRetail": 43000,
        "priceWholesale": 43000,
        "minStock": 10,
        "description": "Bumbu Gule kemasan 1 Kg.",
        "icon": "🥣"
    },
    {
        "id": "prod-041",
        "name": "Bumbu Gule ½ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (500g)",
        "priceRetail": 22000,
        "priceWholesale": 22000,
        "minStock": 10,
        "description": "Bumbu Gule kemasan ½ Kg.",
        "icon": "🥣"
    },
    {
        "id": "prod-042",
        "name": "Bumbu Gule ¼ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (250g)",
        "priceRetail": 11750,
        "priceWholesale": 11750,
        "minStock": 10,
        "description": "Bumbu Gule kemasan ¼ Kg.",
        "icon": "🥣"
    },
    {
        "id": "prod-043",
        "name": "Bumbu Ukep/Bacem 1 Kg",
        "category": "Bumbu Masak",
        "unit": "pack (1 Kg)",
        "priceRetail": 43000,
        "priceWholesale": 43000,
        "minStock": 10,
        "description": "Bumbu Ukep/Bacem kemasan 1 Kg.",
        "icon": "🍛"
    },
    {
        "id": "prod-044",
        "name": "Bumbu Ukep/Bacem ½ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (500g)",
        "priceRetail": 22000,
        "priceWholesale": 22000,
        "minStock": 10,
        "description": "Bumbu Ukep/Bacem kemasan ½ Kg.",
        "icon": "🍛"
    },
    {
        "id": "prod-045",
        "name": "Bumbu Ukep/Bacem ¼ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (250g)",
        "priceRetail": 11750,
        "priceWholesale": 11750,
        "minStock": 10,
        "description": "Bumbu Ukep/Bacem kemasan ¼ Kg.",
        "icon": "🍛"
    },
    {
        "id": "prod-046",
        "name": "Bumbu Nasi Goreng 1 Kg",
        "category": "Bumbu Masak",
        "unit": "pack (1 Kg)",
        "priceRetail": 43000,
        "priceWholesale": 43000,
        "minStock": 10,
        "description": "Bumbu Nasi Goreng kemasan 1 Kg.",
        "icon": "🧂"
    },
    {
        "id": "prod-047",
        "name": "Bumbu Nasi Goreng ½ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (500g)",
        "priceRetail": 22000,
        "priceWholesale": 22000,
        "minStock": 10,
        "description": "Bumbu Nasi Goreng kemasan ½ Kg.",
        "icon": "🧂"
    },
    {
        "id": "prod-048",
        "name": "Bumbu Nasi Goreng ¼ Kg",
        "category": "Bumbu Masak",
        "unit": "pack (250g)",
        "priceRetail": 11750,
        "priceWholesale": 11750,
        "minStock": 10,
        "description": "Bumbu Nasi Goreng kemasan ¼ Kg.",
        "icon": "🧂"
    }
];

  const batches = [];
  const orders = [];
  const stockLogs = [];
  const notifications = [];

  const settings = {
    ownerPhone: '081288990011',
    ownerName: 'Pak Haji Rahmat (Owner Alur Bumbu)',
    whatsappProvider: 'WhatsApp Business Cloud API / Webhook (Simulated)',
    autoSendWhatsapp: true,
    warningDaysExpiry: 30,
    warehouseAddress: 'Jl. Sentra Rempah Nusantara No. 88, Pergudangan Bumbu Mas, Blok B3'
  };

  return {
    products,
    batches,
    orders,
    stockLogs,
    notifications,
    users: getSeedUsers(),
    settings
  };
}

class Database {
  constructor() {
    this.data = null;
    this.redis = isRedisConfigured
      ? new Redis({ url: redisUrl, token: redisToken })
      : null;
  }

  async load() {
    if (this.redis) {
      // Jalur Redis: JANGAN telan error, JANGAN fallback ke seed bila error!
      const remoteData = await this.redis.get(REDIS_KEY);
      if (remoteData !== null && remoteData !== undefined) {
        this.data = typeof remoteData === 'string' ? JSON.parse(remoteData) : remoteData;
      } else {
        // Key memang belum ada: inisialisasi seed pertama kali
        this.data = getInitialData();
        await this.save();
      }

      if (!Array.isArray(this.data.users)) {
        this.data.users = getSeedUsers();
        await this.save();
      }
      return;
    }

    // Jalur File Lokal (fallback dev & test)
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = getInitialData();
        await this.save();
      }
    } catch (e) {
      console.error('Error loading db file, falling back to seed:', e);
      this.data = getInitialData();
      await this.save();
    }

    if (!Array.isArray(this.data.users)) {
      this.data.users = getSeedUsers();
      await this.save();
    }
  }

  async save() {
    if (!this.data) return;

    if (this.redis) {
      // Jalur Redis: error dilempar agar caller mengetahui kegagalan
      await this.redis.set(REDIS_KEY, this.data);
      return;
    }

    // Jalur File Lokal: toleransi try/catch seperti sebelumnya
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving db file:', e);
    }
  }

  findUserByUsername(username) {
    if (!username || !Array.isArray(this.data.users)) return null;
    const normalized = String(username).trim().toLowerCase();
    return this.data.users.find(
      u => String(u.username || '').trim().toLowerCase() === normalized
    ) || null;
  }

  findUserById(id) {
    if (!id || !Array.isArray(this.data.users)) return null;
    return this.data.users.find(u => u.id === id) || null;
  }

  toPublicUser(user) {
    if (!user) return null;
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }

  getProductStockSummary(productId) {
    const productBatches = this.data.batches.filter(b => b.productId === productId);
    const totalPhysicalStock = productBatches.reduce((acc, b) => acc + (b.currentQty || 0), 0);

    const activeReservedStatuses = ['MENUNGGU_PRODUKSI', 'MENUNGGU_DISIAPKAN', 'SIAP_DIPACKING', 'SUDAH_DIPACKING', 'BERMASALAH'];
    const reservedStock = this.data.orders
      .filter(o => activeReservedStatuses.includes(o.status))
      .reduce((acc, order) => {
        const productQty = order.items
          .filter(i => i.productId === productId)
          .reduce((sum, item) => sum + (item.qty || 0), 0);
        return acc + productQty;
      }, 0);

    const availableStock = Math.max(0, totalPhysicalStock - reservedStock);

    return {
      totalPhysicalStock,
      reservedStock,
      availableStock
    };
  }

  getProducts() {
    const now = new Date();
    return this.data.products.map(p => {
      const stock = this.getProductStockSummary(p.id);
      const batches = this.data.batches.filter(b => b.productId === p.id);
      const spiceInfo = getSpiceCategoryInfo(p);
      
      const warningDays = this.data.settings.warningDaysExpiry || 30;
      let nearExpiryCount = 0;
      let expiredCount = 0;

      batches.forEach(b => {
        const expDate = new Date(b.expiryDate.includes('T') ? b.expiryDate : b.expiryDate + 'T23:59:59.999Z');
        const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0 && b.currentQty > 0) {
          expiredCount++;
        } else if (diffDays <= warningDays && b.currentQty > 0) {
          nearExpiryCount++;
        }
      });

      return {
        ...p,
        ...stock,
        ...spiceInfo,
        isLowStock: stock.availableStock <= p.minStock,
        nearExpiryCount,
        expiredCount,
        batchCount: batches.length
      };
    });
  }

  async updateProduct(id, updateData) {
    const product = this.data.products.find(p => p.id === id);
    if (!product) return null;

    if (updateData.name !== undefined) product.name = String(updateData.name).trim();
    if (updateData.category !== undefined) product.category = String(updateData.category).trim();
    if (updateData.unit !== undefined) product.unit = String(updateData.unit).trim();
    if (updateData.priceRetail !== undefined) product.priceRetail = Number(updateData.priceRetail);
    if (updateData.priceWholesale !== undefined) product.priceWholesale = Number(updateData.priceWholesale);
    if (updateData.minStock !== undefined) product.minStock = Number(updateData.minStock);
    if (updateData.description !== undefined) product.description = String(updateData.description || '').trim();
    if (updateData.icon !== undefined) product.icon = String(updateData.icon || '🌶️').trim();
    if (updateData.spiceNumber !== undefined) {
      product.spiceNumber = updateData.spiceNumber ? Number(updateData.spiceNumber) : null;
    }
    if (updateData.spiceCategoryGroup !== undefined) {
      product.spiceCategoryGroup = updateData.spiceCategoryGroup;
    }

    await this.save();
    return this.getProducts().find(p => p.id === id);
  }

  async deleteProduct(id) {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) {
      return { success: false, message: 'Produk tidak ditemukan.' };
    }

    const hasBatches = this.data.batches.some(b => b.productId === id && b.currentQty > 0);
    if (hasBatches) {
      return {
        success: false,
        message: 'Produk tidak dapat dihapus karena masih memiliki batch stok aktif di gudang.'
      };
    }

    const activeStatuses = ['MENUNGGU_DISIAPKAN', 'SIAP_DIPACKING', 'SUDAH_DIPACKING', 'DIKIRIM', 'BERMASALAH'];
    const hasActiveOrders = this.data.orders.some(o => 
      activeStatuses.includes(o.status) && o.items.some(it => it.productId === id)
    );
    if (hasActiveOrders) {
      return {
        success: false,
        message: 'Produk tidak dapat dihapus karena tercatat dalam pesanan yang sedang berjalan.'
      };
    }

    const removed = this.data.products.splice(index, 1)[0];
    await this.save();
    return { success: true, data: removed };
  }

  getCategorySummary() {
    return {
      categories: [
        {
          category: 'Rp 47.000/kg (nomor 1-9)',
          range: 'Nomor 1 - 9',
          spiceCount: 9,
          calculation: '9 × 500',
          totalPcs: 4500,
          pricePerKg: 47000
        },
        {
          category: 'Rp 43.000/kg (nomor 10-16)',
          range: 'Nomor 10 - 16',
          spiceCount: 7,
          calculation: '7 × 500',
          totalPcs: 3500,
          pricePerKg: 43000
        }
      ],
      total: {
        category: 'Total keseluruhan',
        range: 'Nomor 1 - 16',
        spiceCount: 16,
        calculation: '16 × 500',
        totalPcs: 8000
      }
    };
  }

  allocateFEFO(productId, qtyNeeded) {
    const now = new Date();
    const candidateBatches = this.data.batches
      .filter(b => b.productId === productId && b.currentQty > 0)
      .map(b => {
        const expDate = new Date(b.expiryDate.includes('T') ? b.expiryDate : b.expiryDate + 'T23:59:59.999Z');
        const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
        return {
          ...b,
          diffDays,
          parsedExp: expDate
        };
      })
      .filter(b => b.diffDays > 0)
      .sort((a, b) => a.parsedExp - b.parsedExp);

    let remaining = qtyNeeded;
    const allocations = [];

    for (const batch of candidateBatches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.currentQty, remaining);
      if (take > 0) {
        allocations.push({
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          qty: take
        });
        remaining -= take;
      }
    }

    if (remaining > 0) {
      throw new Error(`Stok batch non-kadaluwarsa tidak mencukupi untuk memenuhi ${qtyNeeded} satuan (Kekurangan: ${remaining}).`);
    }

    return allocations;
  }

  addStockLog({ type, productId, productName, batchNumber, qtyChange, stockAfter, reference, actor, notes }) {
    const log = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      type,
      productId,
      productName,
      batchNumber: batchNumber || '-',
      qtyChange,
      stockAfter,
      reference: reference || '-',
      actor: actor || 'Sistem',
      notes: notes || ''
    };
    this.data.stockLogs.unshift(log);
    return log;
  }

  async addNotification({ recipientType, recipientPhone, type, title, message }) {
    const notif = {
      id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      recipientType: recipientType || 'OWNER',
      recipientPhone: recipientPhone || this.data.settings.ownerPhone,
      type,
      title,
      message,
      status: 'TERKIRIM',
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(notif);
    await this.save();
    return notif;
  }
}

export const db = new Database();
export default db;
