const pool = require('../config/database');

const logAction = async ({ userId, businessId, action }) => {
  try {
    await pool.query(
      'INSERT INTO logs (user_id, business_id, action) VALUES ($1, $2, $3)',
      [userId, businessId, action]
    );
  } catch (error) {
    console.error('Failed to log action:', error);
  }
};

module.exports = { logAction };
