const fs = require('fs');
const path = require('path');

// Load config from config.env file
const configPath = path.join(__dirname, '..', 'config.env');
const configContent = fs.readFileSync(configPath, 'utf8');
const config = {};

configContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value && !key.startsWith('#')) {
    config[key.trim()] = value.trim();
  }
});

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

const app = express();

// Webhook must receive raw body. Register BEFORE json parser
const { paymongoWebhook } = require('./controllers/paymentsController');
app.post('/api/payments/paymongo/webhook', express.raw({ type: '*/*' }), paymongoWebhook);

app.use(cors());
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
