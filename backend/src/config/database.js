
const { Sequelize } = require('sequelize');
const path = require('path');

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
    ssl: isProduction ? {
      require: true,
      // Don't reject self-signed certificates in production
      rejectUnauthorized: false
    } : false,
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
