const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById, createProduct, getProductBySku, addStockBySku, getCategories, getProductBySkuPublic } = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, getAllProducts);
router.get('/sku/:sku', authenticate, getProductBySku);
router.get('/public/sku/:sku', getProductBySkuPublic);
router.get('/:id', authenticate, getProductById);
router.post('/', authenticate, createProduct);
router.post('/add-stock-by-sku', authenticate, addStockBySku);
router.get('/categories/all', authenticate, getCategories);

module.exports = router;
