
const path = require('path');

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
const fs = require('fs');

// Prefer process.env (dotenv) which correctly handles quoted values and
// values containing '='. This avoids truncation seen with naive splitting.
const env = process.env;

// Configure SSL based on environment
const sslConfig = process.env.NODE_ENV === 'production' 
  ? { 
      rejectUnauthorized: true,
      // Add your production CA certificate if needed
      // ca: fs.readFileSync('/path/to/ca-certificate.crt').toString()
    }
  : { 
      // For development, you might want to keep this off for local development
      rejectUnauthorized: false 
    };

// Common pool configuration
const commonPoolConfig = {
  max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 20,
  min: 2,
  idleTimeoutMillis: 300000,  // 5 minutes
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 30000,
  allowExitOnIdle: true,
  maxUses: 7500,  // Close and reopen connections periodically
  ssl: sslConfig
};

const poolConfig = env.DATABASE_URL
  ? {
      ...commonPoolConfig,
      connectionString: env.DATABASE_URL
    }
  : {
      ...commonPoolConfig,
      host: env.DB_HOST || 'localhost',
      port: env.DB_PORT ? parseInt(env.DB_PORT, 10) : 5432,
      database: env.DB_NAME || 'ekahera_db',
      user: env.DB_USER || 'postgres',
      password: env.DB_PASSWORD
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
