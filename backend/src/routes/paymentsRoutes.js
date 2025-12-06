const express = require('express');
const router = express.Router();
const { createGcashCheckout, createMayaCheckout } = require('../controllers/paymentsController');

router.post('/gcash/checkout', createGcashCheckout);
router.post('/maya/checkout', createMayaCheckout);

module.exports = router;


