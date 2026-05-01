const pool = require('../../config/db');
const { success, error } = require('../../utils/apiResponse');

exports.getAlerts = async (req, res) => {
  try {
    // Products with stock < 10
    const threshold = 10;
    const result = await pool.query(
      'SELECT id, name, sku, stock_quantity FROM products WHERE stock_quantity < $1 ORDER BY stock_quantity ASC',
      [threshold]
    );

    return success(res, {
      count: result.rows.length,
      items: result.rows
    });
  } catch (err) {
    return error(res, 'Error fetching inventory alerts', 500, err.message);
  }
};
