const pool = require('../config/database');
const { logAction } = require('../utils/logger');
const { sendLowStockEmail } = require('../utils/emailService');

// Controller functions
const getCategories = async (req, res) => {
  try {
    const rows = await pool.query('SELECT product_category_id, product_category_name FROM product_categories ORDER BY product_category_name ASC');
    res.json(rows.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const params = [];
    let where = '';
    const role = (req.user?.role || '').toLowerCase();
    const userBusinessId = req.user?.businessId || null;
    const queryBusinessId = req.query?.business_id ? Number(req.query.business_id) : null;

    if (role === 'superadmin') {
      if (queryBusinessId) {
        params.push(queryBusinessId);
        where = 'WHERE business_id = $1';
      } else {
        return res.json([]);
      }
    } else {
      if (!userBusinessId) return res.json([]);
      params.push(userBusinessId);
      where = 'WHERE business_id = $1';
    }
    const result = await pool.query(`SELECT * FROM products ${where} ORDER BY product_id DESC`, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE product_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createProduct = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const body = req.body || {};
    console.log('Incoming request body:', body);
    const rawName = body.product_name ?? body.name ?? body.productName ?? body.ProductName;
    const product_name = typeof rawName === 'string' ? rawName.trim() : '';
    if (!product_name) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'product_name is required' });
    }

    const businessId = req.user?.businessId || null;
    const createdBy = req.user?.userId || null;
    const cost_price = Number(body.cost_price ?? 0);
    const selling_price = Number(body.selling_price ?? body.price ?? 0);
    const sku = (body.sku || `SKU-${Date.now()}`).toString().trim();
    const initialQuantity = Number(body.quantity ?? 0);
    console.log('[DEBUG createProduct] Initial quantity:', initialQuantity, 'Type:', typeof initialQuantity);
    const description = body.description || '';
    const low_stock_alert = body.low_stock_level !== undefined ? Number(body.low_stock_level) : (body.low_stock_alert !== undefined ? Number(body.low_stock_alert) : 10);

    // Validation: Quantity > 0
    if (!Number.isFinite(initialQuantity) || initialQuantity <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    // Validation: Selling price >= cost price
    if (selling_price < cost_price) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Selling price must be greater than or equal to cost price' });
    }

    // Handle unit-related fields based on "Product Sold By" selection
    const productSoldByRaw = (body.product_sold_by ?? body.sold_by ?? 'Per Piece').toString().trim();
    const productSoldByLower = productSoldByRaw.toLowerCase();
    // Normalize to standard format
    let productSoldBy = 'Per Piece';
    if (productSoldByLower === 'per piece' || productSoldByLower === 'per_piece' || productSoldByLower === 'count' || productSoldByLower === 'piece') {
      productSoldBy = 'Per Piece';
    } else if (productSoldByLower === 'by weight' || productSoldByLower === 'by_weight' || productSoldByLower === 'weight' || productSoldByLower === 'per weight') {
      productSoldBy = 'By Weight';
    } else if (productSoldByLower === 'by volume' || productSoldByLower === 'by_volume' || productSoldByLower === 'volume' || productSoldByLower === 'per volume') {
      productSoldBy = 'By Volume';
    } else {
      productSoldBy = productSoldByRaw; // Pass through for validation
    }
    
    let product_type, base_unit, quantity_per_unit, display_unit;

    if (productSoldBy === 'Per Piece' || productSoldBy === 'per_piece' || productSoldBy === 'count') {
      product_type = 'count';
      base_unit = 'pc';
      quantity_per_unit = 1;
      display_unit = null;
    } else if (productSoldBy === 'By Weight' || productSoldBy === 'by_weight' || productSoldBy === 'weight') {
      product_type = 'weight';
      const unitSize = Number(body.unit_size ?? body.size ?? 0);
      const unit = (body.unit ?? 'g').toString().trim().toLowerCase();
      
      // Validation: quantity_per_unit > 0
      if (!Number.isFinite(unitSize) || unitSize <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Unit size must be greater than 0 for weight-based products' });
      }

      // Validate and set base_unit (kg or g)
      if (unit === 'kg' || unit === 'kilogram' || unit === 'kilograms') {
        base_unit = 'kg';
      } else if (unit === 'g' || unit === 'gram' || unit === 'grams') {
        base_unit = 'g';
      } else {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Invalid unit for weight. Use "kg" or "g"' });
      }

      quantity_per_unit = unitSize;
      display_unit = `${unitSize} ${base_unit}${unitSize === 1 ? '' : ' sachet'}`;
      console.log('[DEBUG createProduct] Weight product - unitSize:', unitSize, 'quantity_per_unit:', quantity_per_unit);
    } else if (productSoldBy === 'By Volume' || productSoldBy === 'by_volume' || productSoldBy === 'volume') {
      product_type = 'volume';
      const unitSize = Number(body.unit_size ?? body.size ?? 0);
      const unit = (body.unit ?? 'mL').toString().trim().toLowerCase();
      
      // Validation: quantity_per_unit > 0
      if (!Number.isFinite(unitSize) || unitSize <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Unit size must be greater than 0 for volume-based products' });
      }

      // Validate and set base_unit (L or mL)
      if (unit === 'l' || unit === 'liter' || unit === 'liters' || unit === 'litre' || unit === 'litres') {
        base_unit = 'L';
      } else if (unit === 'ml' || unit === 'milliliter' || unit === 'milliliters' || unit === 'millilitre' || unit === 'millilitres') {
        base_unit = 'mL';
      } else {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Invalid unit for volume. Use "L" or "mL"' });
      }

      quantity_per_unit = unitSize;
      display_unit = `${unitSize} ${base_unit} bottle`;
      console.log('[DEBUG createProduct] Volume product - unitSize:', unitSize, 'base_unit:', base_unit, 'quantity_per_unit:', quantity_per_unit, 'display_unit:', display_unit);
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid product_sold_by. Use "Per Piece", "By Weight", or "By Volume"' });
    }

    // Check if SKU already exists for this business
    const existingSkuCheck = await client.query(
      'SELECT product_id, product_name, sku FROM products WHERE sku = $1 AND business_id = $2 LIMIT 1',
      [sku, businessId]
    );
    
    if (existingSkuCheck.rowCount > 0) {
      await client.query('ROLLBACK');
      const existingProduct = existingSkuCheck.rows[0];
      return res.status(409).json({ 
        error: 'Product with this SKU already exists',
        message: `A product with SKU "${sku}" already exists: ${existingProduct.product_name}`,
        existingProduct: {
          product_id: existingProduct.product_id,
          product_name: existingProduct.product_name,
          sku: existingProduct.sku
        }
      });
    }

    // Resolve category: prefer product_category_id, else create/find by category/category_name
    let categoryId = body.product_category_id ?? null;
    const rawCategoryName = body.category ?? body.category_name ?? body.product_category_name;
    const categoryName = typeof rawCategoryName === 'string' ? rawCategoryName.trim() : '';
    if (!categoryId && categoryName) {
      const existing = await client.query('SELECT product_category_id FROM product_categories WHERE LOWER(product_category_name) = LOWER($1) LIMIT 1', [categoryName]);
      if (existing.rowCount > 0) {
        categoryId = existing.rows[0].product_category_id;
      } else {
        const insCat = await client.query('INSERT INTO product_categories (product_category_name) VALUES ($1) RETURNING product_category_id', [categoryName]);
        categoryId = insCat.rows[0].product_category_id;
      }
    }

    // Insert product with unit-related fields
    const prodRes = await client.query(
      'INSERT INTO products (product_category_id, product_name, description, cost_price, selling_price, sku, created_by_user_id, business_id, low_stock_alert, product_type, base_unit, quantity_per_unit, display_unit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
      [categoryId, product_name, description, cost_price, selling_price, sku, createdBy, businessId, low_stock_alert, product_type, base_unit, quantity_per_unit, display_unit]
    );
    const product = prodRes.rows[0];

    // Seed inventory if quantity provided
    // Convert quantity to base units: for weight/volume products, multiply by quantity_per_unit
    // For volume products with base_unit "L", store in mL for precision (consistent with transaction items)
    if (initialQuantity && Number.isFinite(initialQuantity) && initialQuantity > 0) {
      // Calculate stock in base units
      // For count products: quantity stays as-is (pieces)
      // For weight/volume products: quantity * quantity_per_unit (e.g., 100 units * 20g = 2000g)
      // For volume products with base_unit "L": convert to mL (50 L = 50000 mL)
      let stockInBaseUnits = initialQuantity;
      console.log('[DEBUG createProduct] Before conversion - product_type:', product_type, 'quantity_per_unit:', quantity_per_unit, 'base_unit:', base_unit, 'initialQuantity:', initialQuantity);
      if (product_type !== 'count' && quantity_per_unit > 0) {
        // Ensure both values are numbers for accurate calculation
        const qty = Number(initialQuantity);
        const qpu = Number(quantity_per_unit);
        if (product_type === 'volume' && base_unit === 'L') {
          // Convert liters to milliliters for storage: 50 L = 50000 mL
          stockInBaseUnits = Math.round(qty * qpu * 1000);
          console.log(`[DEBUG createProduct] Volume (L) stock conversion: ${qty} units × ${qpu}L × 1000 = ${stockInBaseUnits}mL`);
        } else {
          stockInBaseUnits = Math.round(qty * qpu); // Round to avoid floating point issues
          console.log(`[DEBUG createProduct] Stock conversion: ${qty} units × ${qpu}${base_unit} = ${stockInBaseUnits}${base_unit}`);
        }
      } else {
        console.log('[DEBUG createProduct] No conversion needed - product_type:', product_type, 'quantity_per_unit:', quantity_per_unit);
      }
      console.log('[DEBUG createProduct] Final stockInBaseUnits:', stockInBaseUnits);

      const invSelect = await client.query(
        'SELECT inventory_id FROM inventory WHERE product_id = $1 AND business_id = $2 LIMIT 1',
        [product.product_id, businessId]
      );
      if (invSelect.rowCount > 0) {
        await client.query(
          'UPDATE inventory SET quantity_in_stock = quantity_in_stock + $1, updated_at = NOW() WHERE inventory_id = $2',
          [stockInBaseUnits, invSelect.rows[0].inventory_id]
        );
      } else {
        await client.query(
          'INSERT INTO inventory (product_id, quantity_in_stock, business_id) VALUES ($1, $2, $3)',
          [product.product_id, stockInBaseUnits, businessId]
        );
      }
    }

    await client.query('COMMIT');
    // Log create product
    logAction({
      userId: req.user?.userId || null,
      businessId: req.user?.businessId || null,
      action: `Created product: ${product.product_name} (SKU: ${product.sku})`,
    });
    res.status(201).json(product);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const getProductBySku = async (req, res) => {
  try {
    const params = [req.params.sku];
    let where = 'p.sku = $1';
    if (req.user?.businessId) {
      params.push(req.user.businessId);
      where += ' AND p.business_id = $2';
    }
    const result = await pool.query(
      `SELECT p.*, COALESCE(i.quantity_in_stock, 0) as stock_quantity,
              COALESCE(pc.is_basic_necessity, false) as is_basic_necessity
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.product_id AND i.business_id = p.business_id
       LEFT JOIN product_categories pc ON p.product_category_id = pc.product_category_id
       WHERE ${where}`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const product = result.rows[0];
    logAction({
      userId: req.user?.userId || null,
      businessId: req.user?.businessId || null,
      action: `Scanned item: ${product.product_name} (SKU: ${product.sku})`,
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Public endpoint for customers to get product by SKU (no authentication required)
const getProductBySkuPublic = async (req, res) => {
  try {
    const { sku } = req.params;
    const { business_id } = req.query;

    // If business_id is provided, constrain lookup to that business and include inventory quantity
    if (business_id) {
      const byBusiness = await pool.query(
        `SELECT p.*, COALESCE(i.quantity_in_stock, 0) as stock_quantity,
                COALESCE(pc.is_basic_necessity, false) as is_basic_necessity
         FROM products p
         LEFT JOIN inventory i ON i.product_id = p.product_id AND i.business_id = p.business_id
         LEFT JOIN product_categories pc ON p.product_category_id = pc.product_category_id
         WHERE p.sku = $1 AND p.business_id = $2
         LIMIT 1`,
        [sku, business_id]
      );
      if (byBusiness.rowCount > 0) {
        return res.json(byBusiness.rows[0]);
      }
      // If constrained lookup failed, fall through to global lookup below
    }

    // Fallback: allow public lookup by SKU without business constraint (most recent match)
    const anyBusiness = await pool.query(
      `SELECT p.*, COALESCE(pc.is_basic_necessity, false) as is_basic_necessity
       FROM products p
       LEFT JOIN product_categories pc ON p.product_category_id = pc.product_category_id
       WHERE p.sku = $1
       ORDER BY p.updated_at DESC NULLS LAST, p.product_id DESC
       LIMIT 1`,
      [sku]
    );
    if (anyBusiness.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(anyBusiness.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add or adjust stock by SKU
const addStockBySku = async (req, res) => {
  const { sku, quantity } = req.body || {};
  const qty = Number(quantity);
  const parsedSku = typeof sku === 'string' ? sku.trim() : '';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (!parsedSku || !Number.isFinite(qty) || qty <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Valid sku and positive integer quantity are required' });
    }
    const params = [parsedSku];
    let where = 'sku = $1';
    if (req.user?.businessId) {
      params.push(req.user.businessId);
      where += ' AND business_id = $2';
    }
    const prod = await client.query(`SELECT product_id, product_type, quantity_per_unit, base_unit FROM products WHERE ${where} LIMIT 1`, params);
    if (prod.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found for this business' });
    }
    const product = prod.rows[0];
    const productId = product.product_id;
    
    // Convert quantity to base units: for weight/volume products, multiply by quantity_per_unit
    // For volume products with base_unit "L", store in mL for precision (consistent with transaction items)
    let stockInBaseUnits = qty;
    if (product.product_type && product.product_type !== 'count' && product.quantity_per_unit > 0) {
      if (product.product_type === 'volume' && product.base_unit === 'L') {
        // Convert liters to milliliters for storage: 50 L = 50000 mL
        stockInBaseUnits = Math.round(qty * Number(product.quantity_per_unit) * 1000);
      } else {
        stockInBaseUnits = qty * Number(product.quantity_per_unit);
      }
    }
    
    // Upsert inventory row for this product+business (no unique constraint in schema, so emulate)
    const invSelect = await client.query(
      'SELECT inventory_id, quantity_in_stock FROM inventory WHERE product_id = $1 AND business_id = $2 LIMIT 1',
      [productId, req.user?.businessId || null]
    );
    if (invSelect.rowCount > 0) {
      await client.query(
        'UPDATE inventory SET quantity_in_stock = quantity_in_stock + $1, updated_at = NOW() WHERE inventory_id = $2',
        [stockInBaseUnits, invSelect.rows[0].inventory_id]
      );
    } else {
      await client.query(
        'INSERT INTO inventory (product_id, quantity_in_stock, business_id) VALUES ($1, $2, $3)',
        [productId, stockInBaseUnits, req.user?.businessId || null]
      );
    }
    await client.query('COMMIT');
    // Log stock add
    try {
      const invRow = await pool.query('SELECT inventory_id FROM inventory WHERE product_id = $1 AND business_id = $2', [productId, req.user?.businessId || null]);
      logAction({
        userId: req.user?.userId || null,
        businessId: req.user?.businessId || null,
        action: `Added ${qty} stock for product with SKU: ${parsedSku}`,
      });
    } catch (_) {}
    res.json({ message: 'Stock added', product_id: productId, quantity });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};


async function _getLowStockProducts(businessId, threshold = null) {
  // If threshold is provided, use it for backward compatibility
  // Otherwise, use each product's individual low_stock_alert value
  // For weight/volume products, low_stock_alert is in display units, so we need to convert
  // quantity_in_stock (base units) to display units before comparing
  let query, params;
  
  if (threshold !== null) {
    // For backward compatibility with threshold, compare directly (assumes threshold is in base units)
    query = `
      SELECT p.product_id, p.product_name, i.quantity_in_stock, p.low_stock_alert,
             p.product_type, p.quantity_per_unit
      FROM products p
      JOIN inventory i ON p.product_id = i.product_id
      WHERE p.business_id = $1 
        AND (
          CASE 
            WHEN p.product_type IN ('weight', 'volume') AND p.quantity_per_unit > 0 THEN
              (i.quantity_in_stock / p.quantity_per_unit) <= $2
            ELSE
              i.quantity_in_stock <= $2
          END
        )
      ORDER BY i.quantity_in_stock ASC`;
    params = [businessId, threshold];
  } else {
    // Use each product's low_stock_alert (in display units)
    // Convert quantity_in_stock to display units for comparison
    query = `
      SELECT p.product_id, p.product_name, i.quantity_in_stock, p.low_stock_alert,
             p.product_type, p.quantity_per_unit
      FROM products p
      JOIN inventory i ON p.product_id = i.product_id
      WHERE p.business_id = $1 
        AND (
          CASE 
            WHEN p.product_type IN ('weight', 'volume') AND p.quantity_per_unit > 0 THEN
              (i.quantity_in_stock / p.quantity_per_unit) <= COALESCE(p.low_stock_alert, 10)
            ELSE
              i.quantity_in_stock <= COALESCE(p.low_stock_alert, 10)
          END
        )
      ORDER BY i.quantity_in_stock ASC`;
    params = [businessId];
  }
  
  const result = await pool.query(query, params);
  return result.rows;
}

const getLowStockProducts = async (req, res) => {
  try {
    // If threshold is provided in query, use it; otherwise use each product's low_stock_alert
    const threshold = req.query.threshold ? Number(req.query.threshold) : null;
    const businessId = req.user?.businessId || null;

    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    const lowStockProducts = await _getLowStockProducts(businessId, threshold);
    res.json(lowStockProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const sendLowStockAlert = async (req, res) => {
  try {
    const businessId = req.user?.businessId || null;
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    // Use each product's individual low_stock_alert value
    const lowStockProducts = await _getLowStockProducts(businessId, null);

    if (lowStockProducts.length === 0) {
      return res.json({ message: 'No low stock products to report.' });
    }

    const userResult = await pool.query('SELECT email FROM users WHERE user_id = $1', [req.user.userId]);
    const userEmail = userResult.rows[0]?.email;

    if (!userEmail) {
      return res.status(404).json({ error: 'User email not found.' });
    }

    const emailSent = await sendLowStockEmail(userEmail, lowStockProducts, businessId, req.user.userId);

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send low stock alert email.' });
    }

    res.json({ message: 'Low stock alert sent successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateProduct = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const body = req.body || {};
    const businessId = req.user?.businessId || null;
    const userId = req.user?.userId || null;

    // Fetch the current product details for logging purposes
    const currentProductResult = await client.query('SELECT product_name, sku, description, cost_price, selling_price, product_category_id, low_stock_alert, product_type, base_unit, quantity_per_unit, display_unit FROM products WHERE product_id = $1 AND business_id = $2', [id, businessId]);
    if (currentProductResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found or you do not have permission to update it.' });
    }
    const currentProduct = currentProductResult.rows[0];

    const rawName = body.product_name ?? body.name ?? body.productName ?? body.ProductName;
    const product_name = typeof rawName === 'string' ? rawName.trim() : currentProduct.product_name;

    const cost_price = body.cost_price !== undefined ? Number(body.cost_price) : currentProduct.cost_price;
    const selling_price = body.selling_price !== undefined ? Number(body.selling_price) : currentProduct.selling_price;
    const sku = body.sku !== undefined ? (body.sku || `SKU-${Date.now()}`).toString() : currentProduct.sku;
    const description = body.description !== undefined ? body.description : currentProduct.description;
    const low_stock_alert = body.low_stock_level !== undefined ? Number(body.low_stock_level) : (body.low_stock_alert !== undefined ? Number(body.low_stock_alert) : currentProduct.low_stock_alert ?? 10);
    let categoryId = body.product_category_id ?? currentProduct.product_category_id;

    // Validation: Selling price >= cost price
    if (selling_price < cost_price) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Selling price must be greater than or equal to cost price' });
    }

    // Handle unit-related fields if product_sold_by is provided
    let product_type = currentProduct.product_type;
    let base_unit = currentProduct.base_unit;
    let quantity_per_unit = currentProduct.quantity_per_unit;
    let display_unit = currentProduct.display_unit;

    if (body.product_sold_by !== undefined || body.sold_by !== undefined) {
      const productSoldBy = (body.product_sold_by ?? body.sold_by ?? 'Per Piece').toString().trim();

      if (productSoldBy === 'Per Piece' || productSoldBy === 'per_piece' || productSoldBy === 'count') {
        product_type = 'count';
        base_unit = 'pc';
        quantity_per_unit = 1;
        display_unit = null;
      } else if (productSoldBy === 'By Weight' || productSoldBy === 'by_weight' || productSoldBy === 'weight') {
        product_type = 'weight';
        const unitSize = Number(body.unit_size ?? body.size ?? currentProduct.quantity_per_unit ?? 0);
        const unit = (body.unit ?? currentProduct.base_unit ?? 'g').toString().trim().toLowerCase();

        if (!Number.isFinite(unitSize) || unitSize <= 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Unit size must be greater than 0 for weight-based products' });
        }

        if (unit === 'kg' || unit === 'kilogram' || unit === 'kilograms') {
          base_unit = 'kg';
        } else if (unit === 'g' || unit === 'gram' || unit === 'grams') {
          base_unit = 'g';
        } else {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Invalid unit for weight. Use "kg" or "g"' });
        }

        quantity_per_unit = unitSize;
        display_unit = `${unitSize} ${base_unit}${unitSize === 1 ? '' : ' sachet'}`;
      } else if (productSoldBy === 'By Volume' || productSoldBy === 'by_volume' || productSoldBy === 'volume') {
        product_type = 'volume';
        const unitSize = Number(body.unit_size ?? body.size ?? currentProduct.quantity_per_unit ?? 0);
        const unit = (body.unit ?? currentProduct.base_unit ?? 'mL').toString().trim().toLowerCase();

        if (!Number.isFinite(unitSize) || unitSize <= 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Unit size must be greater than 0 for volume-based products' });
        }

        if (unit === 'l' || unit === 'liter' || unit === 'liters' || unit === 'litre' || unit === 'litres') {
          base_unit = 'L';
        } else if (unit === 'ml' || unit === 'milliliter' || unit === 'milliliters' || unit === 'millilitre' || unit === 'millilitres') {
          base_unit = 'mL';
        } else {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Invalid unit for volume. Use "L" or "mL"' });
        }

        quantity_per_unit = unitSize;
        display_unit = `${unitSize} ${base_unit} bottle`;
      } else {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Invalid product_sold_by. Use "Per Piece", "By Weight", or "By Volume"' });
      }
    }

    const rawCategoryName = body.category ?? body.category_name ?? body.product_category_name;
    const categoryName = typeof rawCategoryName === 'string' ? rawCategoryName.trim() : '';
    if (!categoryId && categoryName) {
      const existing = await client.query('SELECT product_category_id FROM product_categories WHERE LOWER(product_category_name) = LOWER($1) LIMIT 1', [categoryName]);
      if (existing.rowCount > 0) {
        categoryId = existing.rows[0].product_category_id;
      } else {
        const insCat = await client.query('INSERT INTO product_categories (product_category_name) VALUES ($1) RETURNING product_category_id', [categoryName]);
        categoryId = insCat.rows[0].product_category_id;
      }
    }

    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (categoryId !== currentProduct.product_category_id) {
      updateFields.push(`product_category_id = $${paramCount++}`);
      updateValues.push(categoryId);
    }
    if (product_name !== currentProduct.product_name) {
      updateFields.push(`product_name = $${paramCount++}`);
      updateValues.push(product_name);
    }
    if (description !== currentProduct.description) {
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(description);
    }
    if (cost_price !== currentProduct.cost_price) {
      updateFields.push(`cost_price = $${paramCount++}`);
      updateValues.push(cost_price);
    }
    if (selling_price !== currentProduct.selling_price) {
      updateFields.push(`selling_price = $${paramCount++}`);
      updateValues.push(selling_price);
    }
    if (sku !== currentProduct.sku) {
      updateFields.push(`sku = $${paramCount++}`);
      updateValues.push(sku);
    }
    if (low_stock_alert !== (currentProduct.low_stock_alert ?? 10)) {
      updateFields.push(`low_stock_alert = $${paramCount++}`);
      updateValues.push(low_stock_alert);
    }
    if (product_type !== currentProduct.product_type) {
      updateFields.push(`product_type = $${paramCount++}`);
      updateValues.push(product_type);
    }
    if (base_unit !== currentProduct.base_unit) {
      updateFields.push(`base_unit = $${paramCount++}`);
      updateValues.push(base_unit);
    }
    if (quantity_per_unit !== currentProduct.quantity_per_unit) {
      updateFields.push(`quantity_per_unit = $${paramCount++}`);
      updateValues.push(quantity_per_unit);
    }
    if (display_unit !== currentProduct.display_unit) {
      updateFields.push(`display_unit = $${paramCount++}`);
      updateValues.push(display_unit);
    }

    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(200).json({ message: 'No changes detected for product', product: currentProduct }); // Return 200 if no changes
    }

    updateFields.push(`updated_at = NOW()`);

    updateValues.push(id);
    updateValues.push(businessId);

    const query = `UPDATE products SET ${updateFields.join(', ')} WHERE product_id = $${paramCount} AND business_id = $${paramCount + 1} RETURNING *`;

    const prodRes = await client.query(query, updateValues);

    if (prodRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Product not found or you do not have permission to update it.' });
    }

    const updatedProduct = prodRes.rows[0];

    await client.query('COMMIT');

    // Construct detailed log message
    const changes = [];
    if (product_name !== currentProduct.product_name) {
      changes.push(`name from "${currentProduct.product_name}" to "${updatedProduct.product_name}"`);
    }
    if (description !== currentProduct.description) {
      changes.push(`description from "${currentProduct.description}" to "${updatedProduct.description}"`);
    }
    if (cost_price !== currentProduct.cost_price) {
      changes.push(`cost price from "${currentProduct.cost_price}" to "${updatedProduct.cost_price}"`);
    }
    if (selling_price !== currentProduct.selling_price) {
      changes.push(`selling price from "${currentProduct.selling_price}" to "${updatedProduct.selling_price}"`);
    }
    if (sku !== currentProduct.sku) {
      changes.push(`SKU from "${currentProduct.sku}" to "${updatedProduct.sku}"`);
    }
    if (low_stock_alert !== (currentProduct.low_stock_alert ?? 10)) {
      changes.push(`low stock alert from "${currentProduct.low_stock_alert ?? 10}" to "${updatedProduct.low_stock_alert ?? 10}"`);
    }
    if (categoryId !== currentProduct.product_category_id) {
        // Need to fetch category names for better logging
        const oldCategoryRes = await client.query('SELECT product_category_name FROM product_categories WHERE product_category_id = $1', [currentProduct.product_category_id]);
        const newCategoryRes = await client.query('SELECT product_category_name FROM product_categories WHERE product_category_id = $1', [updatedProduct.product_category_id]);
        const oldCategoryName = oldCategoryRes.rows[0]?.product_category_name || 'N/A';
        const newCategoryName = newCategoryRes.rows[0]?.product_category_name || 'N/A';
        changes.push(`category from "${oldCategoryName}" to "${newCategoryName}"`);
    }

    let logMessage = `Updated product: ${updatedProduct.product_name} (ID: ${updatedProduct.product_id})`;
    if (changes.length > 0) {
      logMessage += ` - Changed ${changes.join(', ')}`;
    } else {
      logMessage += ` - No significant changes detected (only metadata or unchanged values)`;
    }

    logAction({
      userId: userId,
      businessId: businessId,
      action: logMessage,
    });

    res.status(200).json(updatedProduct);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const bulkImportProducts = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { products } = req.body || {};
    
    if (!Array.isArray(products) || products.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Products array is required and must not be empty' });
    }

    const businessId = req.user?.businessId || null;
    const createdBy = req.user?.userId || null;

    if (!businessId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Business ID is required' });
    }

    const results = {
      success: [],
      errors: [],
    };

    for (let i = 0; i < products.length; i++) {
      const body = products[i];
      try {
        const rawName = body.product_name ?? body.name ?? body.productName ?? body.ProductName;
        const product_name = typeof rawName === 'string' ? rawName.trim() : '';
        if (!product_name) {
          results.errors.push({ index: i, error: 'product_name is required' });
          continue;
        }

        const cost_price = Number(body.cost_price ?? 0);
        const selling_price = Number(body.selling_price ?? body.price ?? 0);
        const sku = (body.sku || `SKU-${Date.now()}-${i}`).toString().trim();
        const initialQuantity = Number(body.quantity ?? 0);
        const description = body.description || '';
        const low_stock_alert = body.low_stock_level !== undefined ? Number(body.low_stock_level) : (body.low_stock_alert !== undefined ? Number(body.low_stock_alert) : 10);

        // Validation: Quantity > 0
        if (!Number.isFinite(initialQuantity) || initialQuantity <= 0) {
          results.errors.push({ index: i, product_name, error: 'Quantity must be greater than 0' });
          continue;
        }

        // Validation: Selling price >= cost price
        if (selling_price < cost_price) {
          results.errors.push({ index: i, product_name, error: 'Selling price must be greater than or equal to cost price' });
          continue;
        }

        // Handle unit-related fields based on "Product Sold By" selection
        const productSoldByRaw = (body.product_sold_by ?? body.sold_by ?? 'Per Piece').toString().trim();
        const productSoldByLower = productSoldByRaw.toLowerCase();
        // Normalize to standard format
        let productSoldBy = 'Per Piece';
        if (productSoldByLower === 'per piece' || productSoldByLower === 'per_piece' || productSoldByLower === 'count' || productSoldByLower === 'piece') {
          productSoldBy = 'Per Piece';
        } else if (productSoldByLower === 'by weight' || productSoldByLower === 'by_weight' || productSoldByLower === 'weight' || productSoldByLower === 'per weight') {
          productSoldBy = 'By Weight';
        } else if (productSoldByLower === 'by volume' || productSoldByLower === 'by_volume' || productSoldByLower === 'volume' || productSoldByLower === 'per volume') {
          productSoldBy = 'By Volume';
        } else {
          productSoldBy = productSoldByRaw; // Pass through for validation
        }
        
        let product_type, base_unit, quantity_per_unit, display_unit;

        if (productSoldBy === 'Per Piece' || productSoldBy === 'per_piece' || productSoldBy === 'count') {
          product_type = 'count';
          base_unit = 'pc';
          quantity_per_unit = 1;
          display_unit = null;
        } else if (productSoldBy === 'By Weight' || productSoldBy === 'by_weight' || productSoldBy === 'weight') {
          product_type = 'weight';
          const unitSize = Number(body.unit_size ?? body.size ?? 0);
          const unit = (body.unit ?? 'g').toString().trim().toLowerCase();
          
          if (!Number.isFinite(unitSize) || unitSize <= 0) {
            results.errors.push({ index: i, product_name, error: 'Unit size must be greater than 0 for weight-based products' });
            continue;
          }

          if (unit === 'kg' || unit === 'kilogram' || unit === 'kilograms') {
            base_unit = 'kg';
          } else if (unit === 'g' || unit === 'gram' || unit === 'grams') {
            base_unit = 'g';
          } else {
            results.errors.push({ index: i, product_name, error: 'Invalid unit for weight. Use "kg" or "g"' });
            continue;
          }

          quantity_per_unit = unitSize;
          display_unit = `${unitSize} ${base_unit}${unitSize === 1 ? '' : ' sachet'}`;
        } else if (productSoldBy === 'By Volume' || productSoldBy === 'by_volume' || productSoldBy === 'volume') {
          product_type = 'volume';
          const unitSize = Number(body.unit_size ?? body.size ?? 0);
          const unit = (body.unit ?? 'mL').toString().trim().toLowerCase();
          
          if (!Number.isFinite(unitSize) || unitSize <= 0) {
            results.errors.push({ index: i, product_name, error: 'Unit size must be greater than 0 for volume-based products' });
            continue;
          }

          if (unit === 'l' || unit === 'liter' || unit === 'liters' || unit === 'litre' || unit === 'litres') {
            base_unit = 'L';
          } else if (unit === 'ml' || unit === 'milliliter' || unit === 'milliliters' || unit === 'millilitre' || unit === 'millilitres') {
            base_unit = 'mL';
          } else {
            results.errors.push({ index: i, product_name, error: 'Invalid unit for volume. Use "L" or "mL"' });
            continue;
          }

          quantity_per_unit = unitSize;
          display_unit = `${unitSize} ${base_unit} bottle`;
        } else {
          results.errors.push({ index: i, product_name, error: 'Invalid product_sold_by. Use "Per Piece", "By Weight", or "By Volume"' });
          continue;
        }

        // Check if SKU already exists for this business
        const existingSkuCheck = await client.query(
          'SELECT product_id, product_name, sku FROM products WHERE sku = $1 AND business_id = $2 LIMIT 1',
          [sku, businessId]
        );
        
        if (existingSkuCheck.rowCount > 0) {
          results.errors.push({ index: i, product_name, sku, error: `SKU "${sku}" already exists` });
          continue;
        }

        // Resolve category
        let categoryId = body.product_category_id ?? null;
        const rawCategoryName = body.category ?? body.category_name ?? body.product_category_name;
        const categoryName = typeof rawCategoryName === 'string' ? rawCategoryName.trim() : '';
        if (!categoryId && categoryName) {
          const existing = await client.query('SELECT product_category_id FROM product_categories WHERE LOWER(product_category_name) = LOWER($1) LIMIT 1', [categoryName]);
          if (existing.rowCount > 0) {
            categoryId = existing.rows[0].product_category_id;
          } else {
            const insCat = await client.query('INSERT INTO product_categories (product_category_name) VALUES ($1) RETURNING product_category_id', [categoryName]);
            categoryId = insCat.rows[0].product_category_id;
          }
        }

        // Insert product
        const prodRes = await client.query(
          'INSERT INTO products (product_category_id, product_name, description, cost_price, selling_price, sku, created_by_user_id, business_id, low_stock_alert, product_type, base_unit, quantity_per_unit, display_unit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
          [categoryId, product_name, description, cost_price, selling_price, sku, createdBy, businessId, low_stock_alert, product_type, base_unit, quantity_per_unit, display_unit]
        );
        const product = prodRes.rows[0];

        // Seed inventory
        let stockInBaseUnits = initialQuantity;
        if (product_type !== 'count' && quantity_per_unit > 0) {
          const qty = Number(initialQuantity);
          const qpu = Number(quantity_per_unit);
          if (product_type === 'volume' && base_unit === 'L') {
            stockInBaseUnits = Math.round(qty * qpu * 1000);
          } else {
            stockInBaseUnits = Math.round(qty * qpu);
          }
        }

        const invSelect = await client.query(
          'SELECT inventory_id FROM inventory WHERE product_id = $1 AND business_id = $2 LIMIT 1',
          [product.product_id, businessId]
        );
        if (invSelect.rowCount > 0) {
          await client.query(
            'UPDATE inventory SET quantity_in_stock = quantity_in_stock + $1, updated_at = NOW() WHERE inventory_id = $2',
            [stockInBaseUnits, invSelect.rows[0].inventory_id]
          );
        } else {
          await client.query(
            'INSERT INTO inventory (product_id, quantity_in_stock, business_id) VALUES ($1, $2, $3)',
            [product.product_id, stockInBaseUnits, businessId]
          );
        }

        results.success.push({ index: i, product_name, sku, product_id: product.product_id });
      } catch (err) {
        results.errors.push({ index: i, product_name: body.name || body.product_name || 'Unknown', error: err.message || 'Unknown error' });
      }
    }

    if (results.success.length === 0 && results.errors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'All products failed to import',
        errors: results.errors 
      });
    }

    await client.query('COMMIT');
    
    // Log bulk import
    logAction({
      userId: createdBy,
      businessId: businessId,
      action: `Bulk imported ${results.success.length} products${results.errors.length > 0 ? ` (${results.errors.length} failed)` : ''}`,
    });

    res.status(201).json({
      message: `Successfully imported ${results.success.length} products`,
      success: results.success,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const deleteProduct = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const businessId = req.user?.businessId || null;
        const userId = req.user?.userId || null;

        // Fetch the product details before deleting for logging
        const productResult = await client.query('SELECT product_name, sku FROM products WHERE product_id = $1 AND business_id = $2', [id, businessId]);

        if (productResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found or you do not have permission to delete it.' });
        }
        const product = productResult.rows[0];

        // Before deleting the product, we might need to handle related records in other tables,
        // like 'inventory' or 'sales_items'. Assuming ON DELETE CASCADE is set up in the database
        // or that we handle it here if not. For now, just deleting from products.
        
        // Also deleting from inventory
        await client.query('DELETE FROM inventory WHERE product_id = $1 AND business_id = $2', [id, businessId]);

        const deleteResult = await client.query('DELETE FROM products WHERE product_id = $1 AND business_id = $2', [id, businessId]);

        if (deleteResult.rowCount === 0) {
            // This case should ideally not be reached if the initial check passes, but as a safeguard:
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found during deletion, or you do not have permission.' });
        }

        await client.query('COMMIT');

        logAction({
            userId: userId,
            businessId: businessId,
            action: `Deleted product: ${product.product_name} (SKU: ${product.sku})`,
        });

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch (_) {}
        // Check for foreign key violation error
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Cannot delete product because it is referenced in other records (e.g., sales). Please handle these records first.' });
        }
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

// Export all functions
module.exports = {
    getCategories,
    getAllProducts,
    getProductById,
    createProduct,
    getProductBySku,
    getProductBySkuPublic,
    addStockBySku,
    _getLowStockProducts,
    getLowStockProducts,
    sendLowStockAlert,
    updateProduct,
    deleteProduct,
    bulkImportProducts
};
