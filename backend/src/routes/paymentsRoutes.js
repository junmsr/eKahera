const express = require('express');
const router = express.Router();
const { createGcashCheckout } = require('../controllers/paymentsController');

router.post('/gcash/checkout', createGcashCheckout);

module.exports = router;


