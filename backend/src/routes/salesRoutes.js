const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { 
  checkout, 
  publicCheckout, 
  enterStore, 
  completeTransaction, 
  getPendingTransactionItems,
  getTransactionStatus, 
  getSaleDetailsByTransactionNumber,
  getRecentCashierReceipts,
  getRecentBusinessReceipts 
} = require('../controllers/salesController');

router.post('/checkout', authenticate, checkout);
router.post('/public/checkout', publicCheckout);
// When a customer scans a store QR to enter the store
router.post('/public/enter-store', enterStore);
// Get pending transaction items for cashier to load into cart
router.get('/:id/pending-items', authenticate, getPendingTransactionItems);
// Cashier completes a pending transaction (scans customer's cart QR and records payment)
router.post('/:id/complete', authenticate, completeTransaction);
router.get('/cashier/recent', authenticate, getRecentCashierReceipts);
// Public check transaction status (customer can poll this)
router.get('/public/transaction/:id', getTransactionStatus);
// Get full sale details for a receipt (authenticated)
router.get('/details/:tn', authenticate, getSaleDetailsByTransactionNumber);
// Get full sale details for a receipt (public)
router.get('/public/details/:tn', getSaleDetailsByTransactionNumber);

// Get recent transactions for the business (admin view)
router.get('/business/recent', authenticate, getRecentBusinessReceipts);

module.exports = router;
