const express = require('express');
const router = express.Router();
const { getStock, adjustStock } = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', getStock);
router.post('/adjust', authenticate, adjustStock);

module.exports = router;
