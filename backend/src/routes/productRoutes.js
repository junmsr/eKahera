const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById, createProduct, getProductBySku } = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', getAllProducts);
router.get('/sku/:sku', getProductBySku);
router.get('/:id', getProductById);
router.post('/', authenticate, createProduct);

module.exports = router;
