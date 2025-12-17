const pool = require('../config/database');
const { logAction } = require('../utils/logger');

exports.getStock = async (req, res) => {
  try {
    const params = [];
    let where = '';
    let paramIndex = 1;

    const role = (req.user?.role || '').toLowerCase();
    const userBusinessId = req.user?.businessId || null;
    const queryBusinessId = req.query?.business_id ? Number(req.query.business_id) : null;

    // Superadmin can optionally filter by business_id; otherwise return empty by default
    if (role === 'superadmin') {
      if (queryBusinessId) {
        params.push(queryBusinessId);
        where = 'WHERE p.business_id = $1';
        paramIndex = 2;
      } else {
        return res.json({ products: [], total: 0, page: 1, limit: 50, totalPages: 0 });
      }
    } else {
      // Admin/Cashier must be business-scoped; if missing, return empty
      if (!userBusinessId) {
        return res.json({ products: [], total: 0, page: 1, limit: 50, totalPages: 0 });
      }
      params.push(userBusinessId);
      where = 'WHERE p.business_id = $1';
      paramIndex = 2;
    }

    // Pagination parameters
    const limit = Math.min(1000, Math.max(1, Number(req.query?.limit) || 50));
    const offset = Math.max(0, Number(req.query?.offset) || 0);
    const page = Math.floor(offset / limit) + 1;

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM products p
       ${where}`,
      params.slice(0, paramIndex - 1)
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit);

    // Get paginated results
    params.push(limit, offset);
    const result = await pool.query(
      `SELECT 
        p.product_id as id,
        p.product_name as name,
        COALESCE(pc.product_category_name, 'Uncategorized') as category,
        p.description,
        p.cost_price,
        p.selling_price,
        COALESCE(i.quantity_in_stock, 0) as quantity,
        p.sku,
        COALESCE(p.low_stock_alert, 10) as low_stock_level,
        p.product_type,
        p.quantity_per_unit,
        p.base_unit,
        p.display_unit,
        i.updated_at as inventory_updated_at
       FROM products p
       LEFT JOIN product_categories pc ON pc.product_category_id = p.product_category_id
       LEFT JOIN inventory i ON i.product_id = p.product_id AND i.business_id = p.business_id
       ${where}
       ORDER BY p.product_name
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({
      products: result.rows,
      total,
      page,
      limit,
      totalPages,
      hasMore: offset + result.rows.length < total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.adjustStock = async (req, res) => {
  const { product_id, delta } = req.body;
  if (!product_id || !Number.isInteger(delta)) {
    return res.status(400).json({ error: 'product_id and integer delta are required' });
  }
  try {
    const params = [delta, product_id];
    let where = 'product_id = $2';
    if (req.user?.businessId) {
      params.push(req.user.businessId);
      where += ' AND business_id = $3';
    }
    const result = await pool.query(
      `UPDATE inventory SET quantity_in_stock = quantity_in_stock + $1 WHERE ${where} RETURNING *`,
      params
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Inventory not found' });
    // Log inventory adjustment
    logAction({
      userId: req.user?.userId || null,
      businessId: req.user?.businessId || null,
      action: `Adjusted stock for product ${product_id} by ${delta}`,
    });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  const { product_id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Delete from inventory first (if exists)
    await client.query('DELETE FROM inventory WHERE product_id = $1 AND business_id = $2', 
      [product_id, req.user?.businessId || null]);
    
    // Delete from products
    const result = await client.query(
      'DELETE FROM products WHERE product_id = $1 AND business_id = $2 RETURNING *',
      [product_id, req.user?.businessId || null]
    );
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const deletedProduct = result.rows[0];
    await client.query('COMMIT');
    logAction({
      userId: req.user?.userId || null,
      businessId: req.user?.businessId || null,
      action: `Deleted product: ${deletedProduct.product_name} (SKU: ${deletedProduct.sku})`,
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.updateProduct = async (req, res) => {
  const { product_id } = req.params;
  const body = req.body || {};
  const { product_name, cost_price, selling_price, sku, category, description, low_stock_level, low_stock_alert, product_sold_by, unit_size, unit } = body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Fetch the current product details including unit fields
    const currentProductResult = await client.query(
      'SELECT product_name, sku, description, cost_price, selling_price, product_category_id, low_stock_alert, product_type, base_unit, quantity_per_unit, display_unit FROM products WHERE product_id = $1 AND business_id = $2',
      [product_id, req.user?.businessId || null]
    );
    
    if (currentProductResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found or you do not have permission to update it.' });
    }
    
    const currentProduct = currentProductResult.rows[0];
    
    // Resolve category if provided
    let categoryId = body.product_category_id ?? currentProduct.product_category_id;
    const rawCategoryName = category ?? body.category_name ?? body.product_category_name;
    const categoryName = typeof rawCategoryName === 'string' ? rawCategoryName.trim() : '';
    if (!categoryId && categoryName) {
      const existing = await client.query(
        'SELECT product_category_id FROM product_categories WHERE LOWER(product_category_name) = LOWER($1) LIMIT 1', 
        [categoryName]
      );
      if (existing.rowCount > 0) {
        categoryId = existing.rows[0].product_category_id;
      } else {
        const insCat = await client.query(
          'INSERT INTO product_categories (product_category_name) VALUES ($1) RETURNING product_category_id', 
          [categoryName]
        );
        categoryId = insCat.rows[0].product_category_id;
      }
    }
    
    const rawName = product_name ?? body.name ?? body.productName ?? body.ProductName;
    const finalProductName = typeof rawName === 'string' ? rawName.trim() : currentProduct.product_name;
    const finalCostPrice = cost_price !== undefined ? Number(cost_price) : currentProduct.cost_price;
    const finalSellingPrice = selling_price !== undefined ? Number(selling_price) : currentProduct.selling_price;
    const finalSku = sku !== undefined ? (sku || `SKU-${Date.now()}`).toString() : currentProduct.sku;
    const finalDescription = description !== undefined ? description : currentProduct.description;
    const finalLowStockAlert = low_stock_level !== undefined ? Number(low_stock_level) : (low_stock_alert !== undefined ? Number(low_stock_alert) : currentProduct.low_stock_alert ?? 10);
    
    // Validation: Selling price >= cost price
    if (finalSellingPrice < finalCostPrice) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Selling price must be greater than or equal to cost price' });
    }
    
    // Handle unit-related fields if product_sold_by is provided
    let product_type = currentProduct.product_type;
    let base_unit = currentProduct.base_unit;
    let quantity_per_unit = currentProduct.quantity_per_unit;
    let display_unit = currentProduct.display_unit;
    
    if (product_sold_by !== undefined || body.sold_by !== undefined) {
      const productSoldBy = (product_sold_by ?? body.sold_by ?? 'Per Piece').toString().trim();
      
      if (productSoldBy === 'Per Piece' || productSoldBy === 'per_piece' || productSoldBy === 'count') {
        product_type = 'count';
        base_unit = 'pc';
        quantity_per_unit = 1;
        display_unit = null;
      } else if (productSoldBy === 'By Weight' || productSoldBy === 'by_weight' || productSoldBy === 'weight') {
        product_type = 'weight';
        const unitSize = Number(unit_size ?? body.size ?? currentProduct.quantity_per_unit ?? 0);
        const unitValue = (unit ?? currentProduct.base_unit ?? 'g').toString().trim().toLowerCase();
        
        if (!Number.isFinite(unitSize) || unitSize <= 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Unit size must be greater than 0 for weight-based products' });
        }
        
        if (unitValue === 'kg' || unitValue === 'kilogram' || unitValue === 'kilograms') {
          base_unit = 'kg';
        } else if (unitValue === 'g' || unitValue === 'gram' || unitValue === 'grams') {
          base_unit = 'g';
        } else {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Invalid unit for weight. Use "kg" or "g"' });
        }
        
        quantity_per_unit = unitSize;
        display_unit = `${unitSize} ${base_unit}${unitSize === 1 ? '' : ' sachet'}`;
      } else if (productSoldBy === 'By Volume' || productSoldBy === 'by_volume' || productSoldBy === 'volume') {
        product_type = 'volume';
        const unitSize = Number(unit_size ?? body.size ?? currentProduct.quantity_per_unit ?? 0);
        const unitValue = (unit ?? currentProduct.base_unit ?? 'mL').toString().trim().toLowerCase();
        
        if (!Number.isFinite(unitSize) || unitSize <= 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Unit size must be greater than 0 for volume-based products' });
        }
        
        if (unitValue === 'l' || unitValue === 'liter' || unitValue === 'liters' || unitValue === 'litre' || unitValue === 'litres') {
          base_unit = 'L';
        } else if (unitValue === 'ml' || unitValue === 'milliliter' || unitValue === 'milliliters' || unitValue === 'millilitre' || unitValue === 'millilitres') {
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
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;
    
    if (categoryId !== currentProduct.product_category_id) {
      updateFields.push(`product_category_id = $${paramCount++}`);
      updateValues.push(categoryId);
    }
    if (finalProductName !== currentProduct.product_name) {
      updateFields.push(`product_name = $${paramCount++}`);
      updateValues.push(finalProductName);
    }
    if (finalDescription !== currentProduct.description) {
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(finalDescription);
    }
    if (finalCostPrice !== currentProduct.cost_price) {
      updateFields.push(`cost_price = $${paramCount++}`);
      updateValues.push(finalCostPrice);
    }
    if (finalSellingPrice !== currentProduct.selling_price) {
      updateFields.push(`selling_price = $${paramCount++}`);
      updateValues.push(finalSellingPrice);
    }
    if (finalSku !== currentProduct.sku) {
      updateFields.push(`sku = $${paramCount++}`);
      updateValues.push(finalSku);
    }
    if (finalLowStockAlert !== (currentProduct.low_stock_alert ?? 10)) {
      updateFields.push(`low_stock_alert = $${paramCount++}`);
      updateValues.push(finalLowStockAlert);
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
      return res.status(200).json({ message: 'No changes detected for product', product: currentProduct });
    }
    
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(product_id);
    updateValues.push(req.user?.businessId || null);
    
    const query = `UPDATE products SET ${updateFields.join(', ')} WHERE product_id = $${paramCount} AND business_id = $${paramCount + 1} RETURNING *`;
    
    const result = await client.query(query, updateValues);
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found or you do not have permission to update it.' });
    }
    
    await client.query('COMMIT');
    
    const updatedProduct = result.rows[0];
    logAction({
      userId: req.user?.userId || null,
      businessId: req.user?.businessId || null,
      action: `Updated product: ${updatedProduct.product_name} (SKU: ${updatedProduct.sku})`,
    });
    
    res.json(updatedProduct);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};
