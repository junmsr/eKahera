const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { checkout } = require('../controllers/salesController');

router.post('/checkout', authenticate, checkout);

module.exports = router;
