import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = process.env.DB_FILE
  ? path.resolve(process.env.DB_FILE)
  : path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
      passwordHash: hashPassword('owner123'),
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
      passwordHash: hashPassword('admin123'),
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
      passwordHash: hashPassword('gudang123'),
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
      passwordHash: hashPassword('packing123'),
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
      passwordHash: hashPassword('customer123'),
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
      passwordHash: hashPassword('customer123'),
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
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = getInitialData();
        this.save();
      }
    } catch (e) {
      console.error('Error loading db file, falling back to seed:', e);
      this.data = getInitialData();
      this.save();
    }

    // Migrasi database lama yang belum memiliki koleksi users.
    // Jangan seed ulang bila users sengaja dikosongkan oleh admin.
    if (!Array.isArray(this.data.users)) {
      this.data.users = getSeedUsers();
      this.save();
    }
  }

  save() {
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

    const activeReservedStatuses = ['MENUNGGU_DISIAPKAN', 'SIAP_DIPACKING', 'SUDAH_DIPACKING', 'BERMASALAH'];
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
        isLowStock: stock.availableStock <= p.minStock,
        nearExpiryCount,
        expiredCount,
        batchCount: batches.length
      };
    });
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

  addNotification({ recipientType, recipientPhone, type, title, message }) {
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
    this.save();
    return notif;
  }
}

export const db = new Database();
export default db;
