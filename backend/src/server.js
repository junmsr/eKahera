const path = require('path');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');

if (process.env.NODE_ENV !== 'production') {
  // Load environment variables from .env file for local development
  // In production (like on Render), these variables should be set in the dashboard
  require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });
}

// If connecting to a hosted DB that uses a certificate not trusted by
// the local environment (e.g. some Supabase setups), allow skipping
// certificate verification for local development only. This prevents
// `SELF_SIGNED_CERT_IN_CHAIN` errors when running locally against
// a remote DB. Do not enable this in production.
try {
  const dbUrl = process.env.DATABASE_URL || '';
  const dbHost = process.env.DB_HOST || '';
  const looksLikeSupabase = dbUrl.includes('supabase') || dbHost.includes('supabase');
  if (looksLikeSupabase && process.env.NODE_ENV !== 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.warn('Local dev: disabled TLS certificate verification for DB connections');
  }
} catch (e) {
  // Swallow any unexpected errors here; we don't want startup to fail.
}

// The config object is populated from environment variables.
// This is compatible with hosting platforms like Render.
const config = {
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  AUTO_INIT_DB: process.env.AUTO_INIT_DB,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  FRONTEND_URL: process.env.FRONTEND_URL,
  PAYMONGO_SECRET_KEY: process.env.PAYMONGO_SECRET_KEY,
  CREATE_INITIAL_SUPERADMIN: process.env.CREATE_INITIAL_SUPERADMIN,
  SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL,
  SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD,
  SUPERADMIN_NAME: process.env.SUPERADMIN_NAME,
  SUPABASE_STORAGE_ENDPOINT: process.env.SUPABASE_STORAGE_ENDPOINT,
  SUPABASE_REGION: process.env.SUPABASE_REGION,
  SUPABASE_ACCESS_KEY_ID: process.env.SUPABASE_ACCESS_KEY_ID,
  SUPABASE_SECRET_ACCESS_KEY: process.env.SUPABASE_SECRET_ACCESS_KEY,
};

const { corsOptions, apiLimiter, securityHeaders, compressionOptions } = require('./config/serverConfig');

// Import routes
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const businessRoutes = require('./routes/businessRoutes');
const otpRoutes = require('./routes/otpRoutes');
const statsRoutes = require('./routes/statsRoutes');
const logsRoutes = require('./routes/logsRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes');
const discountRoutes = require('./routes/discountRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const documentRoutes = require('./routes/documentRoutes');
const locationRoutes = require('./routes/locationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const cleanupRoutes = require('./routes/cleanupRoutes');
const cleanupUserRoutes = require('./routes/cleanupUserRoutes');
const { sendApplicationSubmittedNotification } = require('./utils/emailService');
const { startPendingTransactionCleanup } = require('./utils/cleanup');
const { startStoreDeletionScheduler } = require('./utils/storeDeletionService');

const app = express();

// Enable compression for all responses
app.use(compression());

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now as it needs specific configuration
  crossOriginEmbedderPolicy: false, // Required for some features like hot-reloading
}));

// Set cache headers for static assets
const staticOptions = {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      // No cache for HTML files
      res.setHeader('Cache-Control', 'no-cache');
    } else if (path.match(/\.(js|css|json)$/)) {
      // Cache JavaScript, CSS, and JSON files for 1 year
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
};

// Serve static files with cache headers
app.use(express.static(path.join(__dirname, '../frontend/dist'), staticOptions));

// Apply security headers
app.use(securityHeaders);

// Enable CORS with preflight caching
app.use(require('cors')(corsOptions));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Webhook must receive raw body. Register BEFORE json parser
const { paymongoWebhook } = require('./controllers/paymentsController');
app.post('/api/payments/paymongo/webhook', express.raw({ type: '*/*' }), paymongoWebhook);

// Compression is already applied with default options at the top level
// We'll use the configured compression options for specific routes if needed

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request time to all requests
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

const { initializeDatabase } = require('./config/initDb');
const db = require('./config/database');

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cleanup', cleanupRoutes);
app.use('/api/cleanup', cleanupUserRoutes);

// Test email endpoint - for debugging only
app.get('/api/test-email', async (req, res) => {
  try {
    console.log('Testing email service...');
    const testBusiness = {
      email: process.env.EMAIL_USER, // Send to the configured email
      business_name: 'Test Business',
      business_id: 'test-123'
    };
    
    console.log('Sending test email to:', testBusiness.email);
    const result = await sendApplicationSubmittedNotification(testBusiness);
    console.log('Email test result:', result);
    
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Email test failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware (should be after all other middleware and routes)
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Unhandled error:`, {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    params: req.params,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      status: 'error', 
      message: 'Authentication token is invalid or has expired' 
    });
  }
  
  // Handle rate limit errors
  if (err.status === 429) {
    return res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later.'
    });
  }
  
  // Default error response
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const port = config.PORT || 5000;

if (config.AUTO_INIT_DB === 'true') {
  initializeDatabase()
    .then(() => {
      app.listen(port, () => {
        console.log(`API server listening on port ${port}`);
        startPendingTransactionCleanup();
        startStoreDeletionScheduler();
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database, server not started.', err);
      process.exit(1);
    });
} else {
  app.listen(port, () => {
    console.log(`API server listening on port ${port} (DB init skipped)`);
    startPendingTransactionCleanup();
    startStoreDeletionScheduler();
    // Print a one-time DB host diagnostic
    try {
      const cfgPath = path.join(__dirname, '..', 'config.env');
      const raw = fs.readFileSync(cfgPath, 'utf8');
      const lines = raw.split('\n');
      const hostLine = lines.find(l => l.trim().startsWith('DB_HOST=')) || '';
      const hostValue = hostLine.split('=')[1] || '';
      console.log('Database host:', hostValue.trim());
      db.query('select version() as version, current_database() as db', (err, r) => {
        if (err) {
          console.log('DB connection test failed:', err.message);
        } else {
          console.log('DB connected to:', r.rows[0].db, '\n', r.rows[0].version);
        }
      });
    } catch (e) {
      console.log('DB host diagnostic failed:', e.message);
    }
  });
}
