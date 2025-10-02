const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById, createProduct, getProductBySku, addStockBySku, getCategories, getProductBySkuPublic } = require('../controllers/productController');
const { authenticate, requireDocuments } = require('../middleware/authMiddleware');

router.get('/', authenticate, requireDocuments, getAllProducts);
router.get('/sku/:sku', authenticate, requireDocuments, getProductBySku);
router.get('/public/sku/:sku', getProductBySkuPublic); // Public route, no document requirement
router.get('/:id', authenticate, requireDocuments, getProductById);
router.post('/', authenticate, requireDocuments, createProduct);
router.post('/add-stock-by-sku', authenticate, requireDocuments, addStockBySku);
router.get('/categories/all', authenticate, requireDocuments, getCategories);

module.exports = router;
