const pool = require('../config/database');

async function logAction({ userId, businessId, action }) {
  try {
    if (!businessId || !userId || !action) return;
    await pool.query(
      'INSERT INTO logs (user_id, business_id, action, date_time) VALUES ($1, $2, $3, NOW())',
      [userId, businessId, action.toString()]
    );
  } catch (_) {
    // Best-effort logging; ignore failures
  }
}

module.exports = { logAction };


