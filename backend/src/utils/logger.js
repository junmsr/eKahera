const pool = require('../config/database');

const logAction = async ({ userId, businessId, action }) => {
  // If there's no businessId (e.g. for a superadmin), don't log the action
  // to prevent violating the NOT NULL constraint in the 'logs' table.
  if (!businessId) {
    console.warn(`Skipping log for action "${action}" by userId ${userId} because businessId is missing.`);
    return;
  }
  try {
    const result = await pool.query(
      'INSERT INTO logs (user_id, business_id, action) VALUES ($1, $2, $3) RETURNING log_id',
      [userId, businessId, action]
    );
    console.log(`Successfully logged action: "${action}" for userId ${userId}, businessId ${businessId}, log_id: ${result.rows[0]?.log_id}`);
  } catch (error) {
    console.error('Failed to log action:', error);
    console.error('Error details:', {
      userId,
      businessId,
      action,
      errorMessage: error.message,
      errorStack: error.stack
    });
  }
};

module.exports = { logAction };
