const pool = require('../config/database');
const { logAction } = require('../utils/logger');

exports.getCategories = async (req, res) => {
  try {
    const rows = await pool.query('SELECT product_category_id, product_category_name FROM product_categories ORDER BY product_category_name ASC');
    res.json(rows.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllProducts = async (req, res) => {
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

exports.getProductById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE product_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createProduct = async (req, res) => {
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
    const sku = (body.sku || `SKU-${Date.now()}`).toString();
    const initialQuantity = Number(body.quantity ?? 0);
    const description = body.description || '';

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

    // Insert product
    const prodRes = await client.query(
      'INSERT INTO products (product_category_id, product_name, description, cost_price, selling_price, sku, created_by_user_id, business_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [categoryId, product_name, description, cost_price, selling_price, sku, createdBy, businessId]
    );
    const product = prodRes.rows[0];

    // Seed inventory if quantity provided
    if (initialQuantity && Number.isFinite(initialQuantity) && initialQuantity > 0) {
      const invSelect = await client.query(
        'SELECT inventory_id FROM inventory WHERE product_id = $1 AND business_id = $2 LIMIT 1',
        [product.product_id, businessId]
      );
      if (invSelect.rowCount > 0) {
        await client.query(
          'UPDATE inventory SET quantity_in_stock = quantity_in_stock + $1, updated_at = NOW() WHERE inventory_id = $2',
          [initialQuantity, invSelect.rows[0].inventory_id]
        );
      } else {
        await client.query(
          'INSERT INTO inventory (product_id, quantity_in_stock, business_id) VALUES ($1, $2, $3)',
          [product.product_id, initialQuantity, businessId]
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

exports.getProductBySku = async (req, res) => {
  try {
    const params = [req.params.sku];
    let where = 'p.sku = $1';
    if (req.user?.businessId) {
      params.push(req.user.businessId);
      where += ' AND p.business_id = $2';
    }
    const result = await pool.query(
      `SELECT p.*, COALESCE(i.quantity_in_stock, 0) as stock_quantity
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.product_id AND i.business_id = p.business_id
       WHERE ${where}`,
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
exports.getProductBySkuPublic = async (req, res) => {
  try {
    const { sku } = req.params;
    const { business_id } = req.query;

    // If business_id is provided, constrain lookup to that business and include inventory quantity
    if (business_id) {
      const byBusiness = await pool.query(
        `SELECT p.*, COALESCE(i.quantity_in_stock, 0) as stock_quantity
         FROM products p
         LEFT JOIN inventory i ON i.product_id = p.product_id AND i.business_id = p.business_id
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
      `SELECT p.*
       FROM products p
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
exports.addStockBySku = async (req, res) => {
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
    const prod = await client.query(`SELECT product_id FROM products WHERE ${where} LIMIT 1`, params);
    if (prod.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found for this business' });
    }
    const productId = prod.rows[0].product_id;
    // Upsert inventory row for this product+business (no unique constraint in schema, so emulate)
    const invSelect = await client.query(
      'SELECT inventory_id, quantity_in_stock FROM inventory WHERE product_id = $1 AND business_id = $2 LIMIT 1',
      [productId, req.user?.businessId || null]
    );
    if (invSelect.rowCount > 0) {
      await client.query(
        'UPDATE inventory SET quantity_in_stock = quantity_in_stock + $1, updated_at = NOW() WHERE inventory_id = $2',
        [qty, invSelect.rows[0].inventory_id]
      );
    } else {
      await client.query(
        'INSERT INTO inventory (product_id, quantity_in_stock, business_id) VALUES ($1, $2, $3)',
        [productId, qty, req.user?.businessId || null]
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

const { sendLowStockEmail } = require('../utils/emailService');

async function _getLowStockProducts(businessId, threshold = 10) {
  const result = await pool.query(
    `SELECT p.product_id, p.product_name, i.quantity_in_stock
     FROM products p
     JOIN inventory i ON p.product_id = i.product_id
     WHERE p.business_id = $1 AND i.quantity_in_stock <= $2
     ORDER BY i.quantity_in_stock ASC`,
    [businessId, threshold]
  );
  return result.rows;
}

exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = req.query.threshold || 10;
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

exports.sendLowStockAlert = async (req, res) => {
  try {
    const businessId = req.user?.businessId || null;
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    const lowStockProducts = await _getLowStockProducts(businessId, 10);

    if (lowStockProducts.length === 0) {
      return res.json({ message: 'No low stock products to report.' });
    }

    const userResult = await pool.query('SELECT email FROM users WHERE user_id = $1', [req.user.userId]);
    const userEmail = userResult.rows[0]?.email;

    if (!userEmail) {
      return res.status(404).json({ error: 'User email not found.' });
    }

    await sendLowStockEmail(userEmail, lowStockProducts);

    res.json({ message: 'Low stock alert sent successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const body = req.body || {};
    const businessId = req.user?.businessId || null;
    const userId = req.user?.userId || null;

    // Fetch the current product details for logging purposes
    const currentProductResult = await client.query('SELECT product_name, sku, description, cost_price, selling_price, product_category_id FROM products WHERE product_id = $1 AND business_id = $2', [id, businessId]);
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
    let categoryId = body.product_category_id ?? currentProduct.product_category_id;

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

exports.deleteProduct = async (req, res) => {
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
