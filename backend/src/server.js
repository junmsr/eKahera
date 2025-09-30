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

const app = express();

// Webhook must receive raw body. Register BEFORE json parser
const { paymongoWebhook } = require('./controllers/paymentsController');
app.post('/api/payments/paymongo/webhook', express.raw({ type: '*/*' }), paymongoWebhook);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { initializeDatabase } = require('./config/initDb');

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
  });
}
