const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { checkout, publicCheckout } = require('../controllers/salesController');

router.post('/checkout', authenticate, checkout);
router.post('/public/checkout', publicCheckout);

module.exports = router;
