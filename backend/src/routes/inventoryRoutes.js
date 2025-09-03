const express = require('express');
const router = express.Router();
const { getStock, adjustStock, deleteProduct, updateProduct } = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, getStock);
router.post('/adjust', authenticate, adjustStock);
router.put('/:product_id', authenticate, updateProduct);
router.delete('/:product_id', authenticate, deleteProduct);

module.exports = router;
