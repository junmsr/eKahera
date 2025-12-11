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
  console.log('=== DELETE DISCOUNT REQUEST ===');
  console.log('Request params:', req.params);
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  const { id } = req.params;
  console.log('Raw id from params:', id, 'type:', typeof id);
  
  // Convert to number to ensure type matching
  const discountId = parseInt(id, 10);
  console.log('Parsed discountId:', discountId, 'type:', typeof discountId);
  
  if (isNaN(discountId)) {
    console.log('Invalid discount ID - NaN');
    return res.status(400).json({ error: 'Invalid discount ID' });
  }
  
  try {
    // First check if the discount exists
    console.log(`Checking if discount ${discountId} exists...`);
    const checkResult = await pool.query(
      'SELECT discount_id, discount_name FROM discounts WHERE discount_id = $1',
      [discountId]
    );
    
    console.log(`Query result: Found ${checkResult.rowCount} discount(s)`);
    if (checkResult.rowCount > 0) {
      console.log('Discount found:', checkResult.rows[0]);
    }
    
    if (checkResult.rowCount === 0) {
      console.log(`Discount ${discountId} not found in database`);
      // Let's also check what discounts DO exist
      const allDiscounts = await pool.query('SELECT discount_id, discount_name FROM discounts ORDER BY discount_id');
      console.log('All discounts in database:', allDiscounts.rows);
      return res.status(404).json({ error: 'Discount not found' });
    }
    
    // Now delete it
    console.log(`Deleting discount ${discountId}...`);
    const result = await pool.query(
      'DELETE FROM discounts WHERE discount_id = $1 RETURNING *',
      [discountId]
    );
    
    console.log(`Delete query result: ${result.rowCount} row(s) deleted`);
    
    if (result.rowCount === 0) {
      console.log(`Delete query returned 0 rows for discount ${discountId}`);
      return res.status(404).json({ error: 'Discount not found' });
    }
    
    console.log(`Successfully deleted discount ID: ${discountId}`);
    console.log('=== DELETE SUCCESS ===');
    return res.status(204).send();
  } catch (err) {
    console.error('=== DELETE ERROR ===');
    console.error('Failed to delete discount', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ error: 'Failed to delete discount' });
  }
};








