require('dotenv').config();

const express = require('express');
const cors = require('cors');

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');

const app = express();

app.use(cors());
app.use(express.json());

const { initializeDatabase } = require('./config/initDb');

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);

const port = process.env.PORT || 5000;

if (process.env.AUTO_INIT_DB === 'true') {
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
