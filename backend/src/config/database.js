
const path = require('path');
const { Pool } = require('pg');

// Load env vars when this module is required directly (e.g. outside server.js)
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'config.env') });

const buildConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isRender = process.env.RENDER === 'true';
  
  const sslConfig = isProduction
    ? isRender
      ? { rejectUnauthorized: false } // For Render, we'll skip certificate verification
      : { rejectUnauthorized: true }  // For other production environments, keep verification
    : false; // Disable SSL in development unless explicitly needed

  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
      // Add connection timeout and keepalive settings
      connectionTimeoutMillis: 10000, // 10 seconds
      idleTimeoutMillis: 30000, // 30 seconds
      max: 20, // max number of clients in the pool
    };
  }

  return {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: sslConfig,
    // Add connection timeout and keepalive settings
    connectionTimeoutMillis: 10000, // 10 seconds
    idleTimeoutMillis: 30000, // 30 seconds
    max: 20, // max number of clients in the pool
  };
};

const pool = new Pool(buildConfig());

pool.on('error', (err) => {
  console.error('Unexpected PG pool error:', err);
});

module.exports = pool;
