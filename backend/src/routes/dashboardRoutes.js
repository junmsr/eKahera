const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  getOverview,
  getInventoryMovement,
  getProfitAnalysis,
  getCashierPerformance,
  getSalesTimeseriesFromView
} = require('../controllers/dashboardController');

router.get('/overview', authenticate, getOverview);
router.get('/inventory-movement', authenticate, getInventoryMovement);
router.get('/profit-analysis', authenticate, getProfitAnalysis);
router.get('/cashiers', authenticate, getCashierPerformance);
router.get('/sales-timeseries', authenticate, getSalesTimeseriesFromView);

module.exports = router;
