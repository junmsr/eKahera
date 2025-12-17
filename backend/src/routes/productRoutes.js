const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, requireDocuments } = require('../middleware/authMiddleware');

// Low stock routes
router.get('/low-stock', authenticate, requireDocuments, productController.getLowStockProducts);
router.post('/send-low-stock-alert', authenticate, requireDocuments, productController.sendLowStockAlert);

// Product CRUD routes
router.get('/', authenticate, requireDocuments, productController.getAllProducts);
router.get('/sku/:sku', authenticate, requireDocuments, productController.getProductBySku);
router.get('/public/sku/:sku', productController.getProductBySkuPublic); // Public route, no document requirement
router.get('/:id', authenticate, requireDocuments, productController.getProductById);
router.post('/', authenticate, requireDocuments, productController.createProduct);
router.post('/bulk-import', authenticate, requireDocuments, productController.bulkImportProducts);
router.put('/:id', authenticate, requireDocuments, productController.updateProduct);
router.delete('/:id', authenticate, requireDocuments, productController.deleteProduct);
router.post('/add-stock-by-sku', authenticate, requireDocuments, productController.addStockBySku);
router.get('/categories/all', authenticate, requireDocuments, productController.getCategories);

module.exports = router;
