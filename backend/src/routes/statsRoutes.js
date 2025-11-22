const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
	getSummary,
	getSalesTimeseries,
	getSalesByCategory,
	getCustomersTimeseries,
	getKeyMetrics,
	getSalesByLocation,
	getRevenueVsExpenses,
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

// New/renamed endpoints used by the frontend dashboard components
router.get('/key-metrics', authenticate, getKeyMetrics);
router.get('/sales-by-location', authenticate, getSalesByLocation);
router.get('/revenue-vs-expenses', authenticate, getRevenueVsExpenses);
router.get('/profit-trend', authenticate, getProfitTrend);
router.get('/payment-methods', authenticate, getPaymentMethods);
router.get('/cash-ledger', authenticate, getCashLedger);
router.get('/cash-transactions', authenticate, getCashTransactions);
router.get('/product-performance', authenticate, getProductPerformance);
router.get('/business-stats', authenticate, getBusinessStats);

module.exports = router;


