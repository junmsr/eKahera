
const { Sequelize } = require('sequelize');
const path = require('path');

<<<<<<< HEAD
// Only load .env file in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', 'config.env') });
}

const isProduction = process.env.NODE_ENV === 'production';
const isRender = process.env.RENDER === 'true';

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // This is needed for self-signed certificates
    },
  },
  pool: {
    max: 10,
    min: 1,
    idle: 60000,
    acquire: 20000,
    evict: 10000,
    handleDisconnects: true,
  },
  // Better error handling
  retry: {
    max: 3,
    timeout: 30000, // 30 seconds
  },
=======
// Use dotenv to load the environment file (server.js already does this,
// but using it here ensures this module works when loaded directly).
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'config.env') });

// For local development against some hosted DBs (e.g. Supabase) that
// present certificate chains not trusted by the local OS, allow skipping
// TLS verification. This must be set before loading `pg` so Node's TLS
// behavior is applied to the DB client.
try {
  const dbUrl = process.env.DATABASE_URL || '';
  const dbHost = process.env.DB_HOST || '';
  const looksLikeSupabase = dbUrl.includes('supabase') || dbHost.includes('supabase');
  // Disable TLS verification also in production on Render environment for now
  if (looksLikeSupabase && (process.env.NODE_ENV !== 'production' || process.env.RENDER === 'true')) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    process.env.PGSSLMODE = process.env.PGSSLMODE || 'no-verify';
    console.warn('Disabled TLS certificate verification for DB connections (database.js) in Render or non-production');
  }
} catch (e) {
  // no-op
}

const { Pool } = require('pg');

// Prefer process.env (dotenv) which correctly handles quoted values and
// values containing '='. This avoids truncation seen with naive splitting.
const env = process.env;

const poolConfig = env.DATABASE_URL
  ? {
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      min: 1,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 20000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      allowExitOnIdle: true,
    }
  : {
      host: env.DB_HOST || 'localhost',
      port: env.DB_PORT ? parseInt(env.DB_PORT, 10) : 5432,
      database: env.DB_NAME || 'ekahera_db',
      user: env.DB_USER || 'postgres',
      password: env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 10,
      min: 1,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 20000,
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
>>>>>>> parent of bb8beeb (mulltiple changes in admin)
});

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    // Don't crash in production, but log the error
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
}

// Only run the connection test if this file is run directly
if (require.main === module) {
  testConnection();
}

module.exports = sequelize;
