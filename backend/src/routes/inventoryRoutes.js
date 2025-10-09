const express = require('express');
const router = express.Router();
const { getStock, adjustStock, deleteProduct, updateProduct } = require('../controllers/inventoryController');
const { authenticate, requireDocuments } = require('../middleware/authMiddleware');

router.get('/', authenticate, requireDocuments, getStock);
router.post('/adjust', authenticate, requireDocuments, adjustStock);
router.put('/:product_id', authenticate, requireDocuments, updateProduct);
router.delete('/:product_id', authenticate, requireDocuments, deleteProduct);

module.exports = router;
