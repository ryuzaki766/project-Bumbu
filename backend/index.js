// Muat .env sebelum modul lain membaca process.env (mis. DB_FILE di db.js).
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import db from './db.js';
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import notificationsRouter from './routes/notifications.js';
import reportsRouter from './routes/reports.js';

if (process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET) {
  console.error('❌ AUTH_SECRET wajib diisi pada environment production.');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware Antrean Permintaan (Promise Queue per Instance) untuk Sinkronisasi DB
let requestQueue = Promise.resolve();

app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    return next();
  }

  const previousRequest = requestQueue;
  let releaseQueue;
  const currentRequestPromise = new Promise(resolve => {
    releaseQueue = resolve;
  });

  requestQueue = previousRequest.then(() => currentRequestPromise);

  let released = false;
  const onFinished = () => {
    if (!released) {
      released = true;
      releaseQueue();
    }
  };

  // Pasang listener SEGERA saat request masuk
  res.once('finish', onFinished);
  res.once('close', onFinished);

  previousRequest
    .then(async () => {
      // Cek apakah client sudah memutus koneksi sebelum giliran tiba
      if (res.destroyed || res.writableEnded) {
        onFinished();
        return;
      }

      try {
        await db.load();
        next();
      } catch (err) {
        onFinished();
        console.error('[DATABASE LOAD ERROR]:', err);
        res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan internal pada server database.'
        });
      }
    })
    .catch(err => {
      onFinished();
      console.error('[QUEUE PIPELINE ERROR]:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan internal pada antrean server.'
        });
      }
    });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/reports', reportsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Alur Bumbu Backend API',
    timestamp: new Date().toISOString(),
    frontendUrl: FRONTEND_URL
  });
});

// Serve frontend build if frontend/dist exists (optional unified deployment)
const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Fallback for SPA routing / API info
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint API tidak ditemukan' });
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Alur Bumbu Backend API</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 60px 20px; }
          .card { max-width: 540px; margin: 0 auto; background: #1e293b; padding: 32px; border-radius: 20px; border: 1px solid #334155; }
          h2 { color: #f97316; margin-top: 0; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
          .badge { display: inline-block; background: #065f46; color: #34d399; font-weight: bold; font-size: 12px; padding: 4px 12px; border-radius: 999px; margin-bottom: 16px; }
          a.btn { display: inline-block; background: #ea580c; color: white; text-decoration: none; font-weight: bold; padding: 10px 20px; border-radius: 12px; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">● BACKEND API AKTIF</div>
          <h2>🌿 Alur Bumbu - Backend Server</h2>
          <p>Layanan API backend berjalan pada port <strong>${PORT}</strong>.<br>Database JSON persisten dan sistem FEFO siap digunakan.</p>
          <a class="btn" href="${FRONTEND_URL}">Buka Frontend (Port 3000) &rarr;</a>
        </div>
      </body>
    </html>
  `);
});

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`🌿 Alur Bumbu Backend API berjalan pada:`);
    console.log(`   👉 http://localhost:${PORT}`);
    console.log(`   👉 http://127.0.0.1:${PORT}`);
    console.log(`📡 Frontend diarahkan ke: ${FRONTEND_URL}`);
    console.log(`===============================================`);
  });
}

export default app;
