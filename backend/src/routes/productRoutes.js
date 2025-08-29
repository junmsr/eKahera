const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById, createProduct, getProductBySku, addStockBySku } = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, getAllProducts);
router.get('/sku/:sku', authenticate, getProductBySku);
router.get('/:id', authenticate, getProductById);
router.post('/', authenticate, createProduct);
router.post('/add-stock-by-sku', authenticate, addStockBySku);

module.exports = router;
