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
      max: 10, // increased pool size for better resilience
      min: 1, // maintain at least 1 connection
      idleTimeoutMillis: 60000, // increased idle timeout
      connectionTimeoutMillis: 20000, // increased connection timeout
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      allowExitOnIdle: true, // allow pool to close when idle
    }
  : {
      host: config.DB_HOST || 'localhost',
      port: config.DB_PORT || 5432,
      database: config.DB_NAME || 'ekahera_db',
      user: config.DB_USER || 'postgres',
      password: config.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 10, // increased pool size
      min: 1, // maintain at least 1 connection
      idleTimeoutMillis: 60000, // increased idle timeout
      connectionTimeoutMillis: 20000, // increased connection timeout
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      allowExitOnIdle: true,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err, client) => {
  console.error('Unexpected DB connection error:', err.message, err.code);
  // Don't exit the process, just log the error
});

pool.on('connect', (client) => {
  console.log('New database connection established');
});

pool.on('remove', (client) => {
  console.log('Database connection removed from pool');
});

module.exports = pool;
