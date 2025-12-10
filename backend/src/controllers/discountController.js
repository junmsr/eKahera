const pool = require('../config/database');

/**
 * Create a discount for the authenticated cashier's business.
 * Supports percentage- or amount-based discounts. Only one of the
 * numeric fields is required; the other will be stored as NULL.
 */
exports.createDiscount = async (req, res) => {
  const { discount_name, discount_percentage } = req.body || {};

  if (!discount_name || discount_percentage === undefined) {
    return res.status(400).json({ error: 'discount_name and discount_percentage are required' });
  }

  const pctValue = Number(discount_percentage);
  if (Number.isNaN(pctValue) || pctValue < 0 || pctValue > 100) {
    return res.status(400).json({ error: 'Discount percentage must be a number between 0 and 100' });
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO discounts (discount_name, discount_percentage)
        VALUES ($1, $2)
        RETURNING discount_id, discount_name, discount_percentage
      `,
      [discount_name.trim(), pctValue]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Failed to create discount', err);
    return res.status(500).json({ error: 'Failed to create discount' });
  }
};

/**
 * Fetch discounts for the authenticated cashier's business.
 */
exports.getDiscounts = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT 
          discount_id, 
          discount_name, 
          discount_percentage
        FROM discounts
        ORDER BY discount_name ASC
      `
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch discounts', err);
    return res.status(500).json({ error: 'Failed to fetch discounts' });
  }
};

/**
 * Delete a discount by ID
 */
exports.deleteDiscount = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'DELETE FROM discounts WHERE discount_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Discount not found' });
    }
    
    return res.status(204).send();
  } catch (err) {
    console.error('Failed to delete discount', err);
    return res.status(500).json({ error: 'Failed to delete discount' });
  }
};

