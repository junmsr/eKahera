const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// Configure CORS with preflight caching
const corsOptions = {
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'https://www.ekahera.online', 
    'https://ekahera.onrender.com'
  ],
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
  maxAge: 600, // Cache preflight requests for 10 minutes
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://*"],
      connectSrc: ["'self'", "https://*.resend.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
});

// Compression options
const compressionOptions = {
  level: 6, // Compression level (0-9, where 9 is maximum)
  threshold: '1kb', // Only compress responses larger than 1kb
  filter: (req, res) => {
    // Don't compress responses with this header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Fall back to standard filter function
    return compression.filter(req, res);
  },
};

module.exports = {
  corsOptions,
  apiLimiter,
  securityHeaders,
  compressionOptions,
};
