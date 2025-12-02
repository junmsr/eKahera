const { Pool } = require('pg');

// Only load .env file in development
if (process.env.NODE_ENV !== 'production') {
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '..', '..', 'config.env') });
}

const isProduction = process.env.NODE_ENV === 'production';

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Parse DATABASE_URL for connection parameters
let poolConfig;

try {
  const dbUrl = new URL(process.env.DATABASE_URL);
  
  poolConfig = {
    user: dbUrl.username,
    password: dbUrl.password,
    host: dbUrl.hostname,
    port: dbUrl.port,
    database: dbUrl.pathname.split('/')[1],
    ssl: {
      // Required for SSL connections
      require: true,
      // Don't reject self-signed certificates
      rejectUnauthorized: false
    },
    // Connection pool settings
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 5000, // increased from 2000 to 5000 for slower connections
  };
} catch (error) {
  console.error('Error parsing DATABASE_URL:', error);
  throw new Error('Invalid DATABASE_URL format');
}

const pool = new Pool(poolConfig);

// Test the connection when the pool is first created
async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('Successfully connected to the database');
  } catch (err) {
    console.error('Error connecting to the database:', err);
    // Don't crash in production, just log the error
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  } finally {
    client.release();
  }
}

// Run the connection test
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

// Handle connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't crash the app on connection errors in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

module.exports = pool;
