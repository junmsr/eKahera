const pool = require('../config/database');

const Category = {
  async findAll(options = {}) {
    const { where = {} } = options;
    const params = [];
    const conditions = [];

    if (where.business_type) {
      params.push(where.business_type);
      conditions.push(`business_type = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT category_id, name, business_type, created_at, updated_at
      FROM categories
      ${whereClause}
      ORDER BY name ASC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  },
};

module.exports = Category;
