const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { checkout, publicCheckout, enterStore, completeTransaction, getTransactionStatus, getSaleDetailsByTransactionNumber } = require('../controllers/salesController');
const { getRecentCashierReceipts } = require('../controllers/salesController');

router.post('/checkout', authenticate, checkout);
router.post('/public/checkout', publicCheckout);
// When a customer scans a store QR to enter the store
router.post('/public/enter-store', enterStore);
// Cashier completes a pending transaction (scans customer's cart QR and records payment)
router.post('/:id/complete', authenticate, completeTransaction);
router.get('/cashier/recent', authenticate, getRecentCashierReceipts);
// Public check transaction status (customer can poll this)
router.get('/public/transaction/:id', getTransactionStatus);
// Get full sale details for a receipt (authenticated)
router.get('/details/:tn', authenticate, getSaleDetailsByTransactionNumber);
// Get full sale details for a receipt (public)
router.get('/public/details/:tn', getSaleDetailsByTransactionNumber);

module.exports = router;
