const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { checkout, publicCheckout, enterStore, completeTransaction, getTransactionStatus } = require('../controllers/salesController');

router.post('/checkout', authenticate, checkout);
router.post('/public/checkout', publicCheckout);
// When a customer scans a store QR to enter the store
router.post('/public/enter-store', enterStore);
// Cashier completes a pending transaction (scans customer's cart QR and records payment)
router.post('/:id/complete', authenticate, completeTransaction);
// Public check transaction status (customer can poll this)
router.get('/public/transaction/:id', getTransactionStatus);

module.exports = router;
