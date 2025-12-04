const pool = require('../config/database');

const logAction = async ({ userId, businessId, action }) => {
  // If there's no businessId (e.g. for a superadmin), don't log the action
  // to prevent violating the NOT NULL constraint in the 'logs' table.
  if (!businessId) {
    console.warn(`Skipping log for action "${action}" by userId ${userId} because businessId is missing.`);
    return;
  }
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
