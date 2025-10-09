const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load config from config.env file
const configPath = path.join(__dirname, '..', '..', 'config.env');
const configContent = fs.readFileSync(configPath, 'utf8');
const config = {};

configContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value && !key.startsWith('#')) {
    config[key.trim()] = value.trim();
  }
});

// Prefer a single DATABASE_URL if provided (e.g., Supabase URI), fallback to discrete fields
const useConnectionString = Boolean(config.DATABASE_URL);
const pool = useConnectionString
  ? new Pool({
      connectionString: config.DATABASE_URL,
      ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  : new Pool({
      host: config.DB_HOST || 'localhost',
      port: config.DB_PORT || 5432,
      database: config.DB_NAME || 'ekahera_db',
      user: config.DB_USER || 'postgres',
      password: config.DB_PASSWORD,
      ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

module.exports = pool;
