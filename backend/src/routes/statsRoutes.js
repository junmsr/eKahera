const express = require('express');
const router = express.Router();
const { authenticate, requireDocuments } = require('../middleware/authMiddleware');
const { getSummary, getSalesTimeseries, getSalesByCategory } = require('../controllers/statsController');

router.get('/summary', authenticate, requireDocuments, getSummary);
router.get('/sales-timeseries', authenticate, requireDocuments, getSalesTimeseries);
router.get('/sales-by-category', authenticate, requireDocuments, getSalesByCategory);

module.exports = router;


