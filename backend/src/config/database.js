
const path = require('path');
const { Pool } = require('pg');

// Load env vars when this module is required directly (e.g. outside server.js)
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'config.env') });

const buildConfig = () => {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: process.env.RENDER === 'true' ? false : true }
        : { rejectUnauthorized: false },
    };
  }

  return {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: process.env.RENDER === 'true' ? false : true }
      : undefined,
  };
};

const pool = new Pool(buildConfig());

pool.on('error', (err) => {
  console.error('Unexpected PG pool error:', err);
});

module.exports = pool;
