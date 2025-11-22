const path = require('path');
const fs = require('fs');

// Load environment variables from .env file for local development
// In production (like on Render), these variables should be set in the dashboard
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });

// If connecting to a hosted DB that uses a certificate not trusted by
// the local environment (e.g. some Supabase setups), allow skipping
// certificate verification for local development only. This prevents
// `SELF_SIGNED_CERT_IN_CHAIN` errors when running locally against
// a remote DB. Do not enable this in production.
try {
  const dbUrl = process.env.DATABASE_URL || '';
  const dbHost = process.env.DB_HOST || '';
  const looksLikeSupabase = dbUrl.includes('supabase') || dbHost.includes('supabase');
  if (looksLikeSupabase && process.env.NODE_ENV !== 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.warn('Local dev: disabled TLS certificate verification for DB connections');
  }
} catch (e) {
  // Swallow any unexpected errors here; we don't want startup to fail.
}

// The config object is populated from environment variables.
// This is compatible with hosting platforms like Render.
const config = {
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  AUTO_INIT_DB: process.env.AUTO_INIT_DB,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  FRONTEND_URL: process.env.FRONTEND_URL,
  PAYMONGO_SECRET_KEY: process.env.PAYMONGO_SECRET_KEY,
  CREATE_INITIAL_SUPERADMIN: process.env.CREATE_INITIAL_SUPERADMIN,
  SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL,
  SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD,
  SUPERADMIN_NAME: process.env.SUPERADMIN_NAME,
  SUPABASE_STORAGE_ENDPOINT: process.env.SUPABASE_STORAGE_ENDPOINT,
  SUPABASE_REGION: process.env.SUPABASE_REGION,
  SUPABASE_ACCESS_KEY_ID: process.env.SUPABASE_ACCESS_KEY_ID,
  SUPABASE_SECRET_ACCESS_KEY: process.env.SUPABASE_SECRET_ACCESS_KEY,
};

const express = require('express');
const cors = require('cors');

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const businessRoutes = require('./routes/businessRoutes');
const otpRoutes = require('./routes/otpRoutes');
const statsRoutes = require('./routes/statsRoutes');
const logsRoutes = require('./routes/logsRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const documentRoutes = require('./routes/documentRoutes');
const locationRoutes = require('./routes/locationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Webhook must receive raw body. Register BEFORE json parser
const { paymongoWebhook } = require('./controllers/paymentsController');
app.post('/api/payments/paymongo/webhook', express.raw({ type: '*/*' }), paymongoWebhook);

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'https://www.ekahera.online', 'https://ekahera.onrender.com'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { initializeDatabase } = require('./config/initDb');
const db = require('./config/database');

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/dashboard', dashboardRoutes);

const port = config.PORT || 5000;

if (config.AUTO_INIT_DB === 'true') {
  initializeDatabase()
    .then(() => {
      app.listen(port, () => {
        console.log(`API server listening on port ${port}`);
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database, server not started.', err);
      process.exit(1);
    });
} else {
  app.listen(port, () => {
    console.log(`API server listening on port ${port} (DB init skipped)`);
    // Print a one-time DB host diagnostic
    try {
      const cfgPath = path.join(__dirname, '..', 'config.env');
      const raw = fs.readFileSync(cfgPath, 'utf8');
      const lines = raw.split('\n');
      const hostLine = lines.find(l => l.trim().startsWith('DB_HOST=')) || '';
      const hostValue = hostLine.split('=')[1] || '';
      console.log('Database host:', hostValue.trim());
      db.query('select version() as version, current_database() as db', (err, r) => {
        if (err) {
          console.log('DB connection test failed:', err.message);
        } else {
          console.log('DB connected to:', r.rows[0].db, '\n', r.rows[0].version);
        }
      });
    } catch (e) {
      console.log('DB host diagnostic failed:', e.message);
    }
  });
}
