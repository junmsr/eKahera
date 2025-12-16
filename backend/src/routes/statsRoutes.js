const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
	getSummary,
	getSalesTimeseries,
	getSalesByCategory,
	getCustomersTimeseries,
	getKeyMetrics,
	getProfitTrend,
	getPaymentMethods,
	getCashLedger,
	getCashTransactions,
	getProductPerformance,
	getBusinessStats
} = require('../controllers/statsController');

// Existing summary and timeseries endpoints
router.get('/summary', authenticate, getSummary);
router.get('/sales-timeseries', authenticate, getSalesTimeseries);
router.get('/sales-by-category', authenticate, getSalesByCategory);
router.get('/customers-timeseries', authenticate, getCustomersTimeseries);

// Dashboard endpoints
router.get('/key-metrics', authenticate, getKeyMetrics);
router.get('/profit-trend', authenticate, getProfitTrend);
router.get('/payment-methods', authenticate, getPaymentMethods);
router.get('/cash-ledger', authenticate, getCashLedger);
router.get('/cash-transactions', authenticate, getCashTransactions);
router.get('/product-performance', authenticate, getProductPerformance);
router.get('/business-stats', authenticate, getBusinessStats);

module.exports = router;


