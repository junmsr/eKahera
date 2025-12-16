const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { createDiscount, getDiscounts, deleteDiscount } = require('../controllers/discountController');

console.log('Discount routes module loaded');

// Add logging middleware to see all requests
router.use((req, res, next) => {
  console.log(`[DISCOUNT ROUTES] ${req.method} ${req.path} - Original URL: ${req.originalUrl}`);
  next();
});

// Test route without auth to verify routing works
router.get('/test', (req, res) => {
  console.log('[DISCOUNT TEST] Test route hit!');
  res.json({ message: 'Discount routes are working', timestamp: new Date().toISOString() });
});

router.get('/', authenticate, getDiscounts);
router.post('/', authenticate, createDiscount);
router.delete('/:id', authenticate, deleteDiscount);

console.log('Discount routes registered:');
console.log('  GET /');
console.log('  POST /');
console.log('  DELETE /:id');

module.exports = router;








