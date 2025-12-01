
const path = require('path');
const { Pool } = require('pg');

// Load env vars when this module is required directly (e.g. outside server.js)
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'config.env') });

const buildConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isRender = process.env.RENDER === 'true';
  
  // Configure SSL based on environment
  let sslConfig;
  if (isProduction) {
    // For Render, we need to handle self-signed certificates
    if (isRender) {
      sslConfig = {
        rejectUnauthorized: false, // Skip certificate verification for Render
        ssl: { rejectUnauthorized: false } // Add this line to properly configure SSL for node-postgres
      };
    } else {
      // For other production environments, use standard SSL with verification
      sslConfig = {
        ssl: {
          rejectUnauthorized: true,
          require: true
        }
      };
    }
  } else {
    // For development, use SSL only if explicitly configured
    sslConfig = process.env.DB_SSL === 'true' 
      ? { ssl: { rejectUnauthorized: false } } 
      : false;
  }

  // Common configuration for all environments
  const commonConfig = {
    // Add connection timeout and keepalive settings
    connectionTimeoutMillis: 10000, // 10 seconds
    idleTimeoutMillis: 30000, // 30 seconds
    max: 20, // max number of clients in the pool
    ssl: sslConfig
  };

  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ...commonConfig
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
