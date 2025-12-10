const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { createDiscount, getDiscounts } = require('../controllers/discountController');

router.get('/', authenticate, getDiscounts);
router.post('/', authenticate, createDiscount);

module.exports = router;

