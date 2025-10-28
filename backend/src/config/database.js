const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load config from config.env
const configPath = path.join(__dirname, '..', '..', 'config.env');
const configContent = fs.readFileSync(configPath, 'utf8');
const config = {};

configContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value && !key.startsWith('#')) {
    config[key.trim()] = value.trim();
  }
});

// Build Pool config
const poolConfig = config.DATABASE_URL
  ? {
      connectionString: config.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5, // small pool for free-tier
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: config.DB_HOST || 'localhost',
      port: config.DB_PORT || 5432,
      database: config.DB_NAME || 'ekahera_db',
      user: config.DB_USER || 'postgres',
      password: config.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 5,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected DB connection error:', err.message);
});

module.exports = pool;
