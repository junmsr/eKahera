const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { getSummary, getSalesTimeseries, getSalesByCategory, getCustomersTimeseries } = require('../controllers/statsController');

router.get('/summary', authenticate, getSummary);
router.get('/sales-timeseries', authenticate, getSalesTimeseries);
router.get('/sales-by-category', authenticate, getSalesByCategory);
router.get('/customers-timeseries', authenticate, getCustomersTimeseries);

module.exports = router;


