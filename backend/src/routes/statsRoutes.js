const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { getSummary, getSalesTimeseries, getSalesByCategory } = require('../controllers/statsController');

router.get('/summary', authenticate, getSummary);
router.get('/sales-timeseries', authenticate, getSalesTimeseries);
router.get('/sales-by-category', authenticate, getSalesByCategory);

module.exports = router;


