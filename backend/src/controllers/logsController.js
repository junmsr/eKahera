const pool = require('../config/database');

exports.getLogs = async (req, res) => {
  try {
    const params = [];
    let where = '';
    const role = (req.user?.role || '').toLowerCase();
    const userBusinessId = req.user?.businessId || null;
    const queryBusinessId = req.query?.business_id ? Number(req.query.business_id) : null;

    if (role === 'superadmin') {
      if (queryBusinessId) {
        params.push(queryBusinessId);
        where = 'WHERE l.business_id = $1';
      }
    } else {
      if (!userBusinessId) return res.json([]);
      params.push(userBusinessId);
      where = 'WHERE l.business_id = $1';
    }

    const result = await pool.query(
      `SELECT 
         l.log_id,
         l.user_id,
         u.username,
         u.role,
         l.business_id,
         l.action,
         l.details,
         l.date_time
       FROM logs l
       LEFT JOIN users u ON u.user_id = l.user_id
       ${where}
       ORDER BY l.date_time DESC
       LIMIT 200`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


