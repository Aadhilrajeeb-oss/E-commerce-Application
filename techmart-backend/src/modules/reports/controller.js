const pool = require('../../config/db');
const redisClient = require('../../config/redis');
const { success, error } = require('../../utils/apiResponse');

const CACHE_TTL = 60 * 15; // 15 minutes

/**
 * Helper: build a cache key from route name + query params
 */
const buildCacheKey = (name, params) => `reports:${name}:${JSON.stringify(params)}`;

/**
 * Helper: try cache first, fallback to DB query
 */
const cachedQuery = async (cacheKey, queryFn) => {
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (_) {}

  const result = await queryFn();
  try {
    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
  } catch (_) {}
  return result;
};

// GET /api/reports/sales-summary?dateFrom=&dateTo=&period=daily|weekly|monthly
exports.salesSummary = async (req, res) => {
  try {
    const { dateFrom = '2000-01-01', dateTo = new Date().toISOString().split('T')[0], period = 'daily' } = req.query;

    const truncMap = { daily: 'day', weekly: 'week', monthly: 'month' };
    const trunc = truncMap[period] || 'day';

    const cacheKey = buildCacheKey('sales-summary', { dateFrom, dateTo, period });
    const data = await cachedQuery(cacheKey, async () => {
      const result = await pool.query(
        `SELECT
           DATE_TRUNC($1, created_at) AS period,
           COUNT(*)::int AS order_count,
           SUM(total_amount) AS revenue,
           AVG(total_amount) AS avg_order_value
         FROM orders
         WHERE status != 'cancelled'
           AND created_at BETWEEN $2 AND $3::date + INTERVAL '1 day'
         GROUP BY period
         ORDER BY period`,
        [trunc, dateFrom, dateTo]
      );

      const totals = await pool.query(
        `SELECT
           COUNT(*)::int AS total_orders,
           COALESCE(SUM(total_amount), 0) AS total_revenue,
           COALESCE(AVG(total_amount), 0) AS avg_order_value
         FROM orders
         WHERE status != 'cancelled'
           AND created_at BETWEEN $1 AND $2::date + INTERVAL '1 day'`,
        [dateFrom, dateTo]
      );

      return { summary: totals.rows[0], timeline: result.rows };
    });

    return success(res, data);
  } catch (err) {
    return error(res, 'Error fetching sales summary', 500, err.message);
  }
};

// GET /api/reports/revenue-by-category
exports.revenueByCategory = async (req, res) => {
  try {
    const { dateFrom = '2000-01-01', dateTo = new Date().toISOString().split('T')[0] } = req.query;

    const cacheKey = buildCacheKey('revenue-by-category', { dateFrom, dateTo });
    const data = await cachedQuery(cacheKey, async () => {
      const result = await pool.query(
        `SELECT
           COALESCE(c.name, 'Uncategorized') AS category,
           COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue,
           COUNT(DISTINCT oi.order_id)::int AS order_count
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN products p ON oi.product_id = p.id
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE o.status != 'cancelled'
           AND o.created_at BETWEEN $1 AND $2::date + INTERVAL '1 day'
         GROUP BY c.name
         ORDER BY revenue DESC`,
        [dateFrom, dateTo]
      );
      return result.rows;
    });

    return success(res, data);
  } catch (err) {
    return error(res, 'Error fetching revenue by category', 500, err.message);
  }
};

// GET /api/reports/top-products?limit=10
exports.topProducts = async (req, res) => {
  try {
    const { limit = 10, dateFrom = '2000-01-01', dateTo = new Date().toISOString().split('T')[0] } = req.query;

    const cacheKey = buildCacheKey('top-products', { limit, dateFrom, dateTo });
    const data = await cachedQuery(cacheKey, async () => {
      const result = await pool.query(
        `SELECT
           p.id,
           p.name,
           p.sku,
           SUM(oi.quantity)::int AS units_sold,
           SUM(oi.quantity * oi.unit_price) AS revenue
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN products p ON oi.product_id = p.id
         WHERE o.status != 'cancelled'
           AND o.created_at BETWEEN $1 AND $2::date + INTERVAL '1 day'
         GROUP BY p.id, p.name, p.sku
         ORDER BY revenue DESC
         LIMIT $3`,
        [dateFrom, dateTo, limit]
      );
      return result.rows;
    });

    return success(res, data);
  } catch (err) {
    return error(res, 'Error fetching top products', 500, err.message);
  }
};

// GET /api/reports/order-funnel
exports.orderFunnel = async (req, res) => {
  try {
    const { dateFrom = '2000-01-01', dateTo = new Date().toISOString().split('T')[0] } = req.query;

    const cacheKey = buildCacheKey('order-funnel', { dateFrom, dateTo });
    const data = await cachedQuery(cacheKey, async () => {
      const result = await pool.query(
        `SELECT
           status,
           COUNT(*)::int AS count
         FROM orders
         WHERE created_at BETWEEN $1 AND $2::date + INTERVAL '1 day'
         GROUP BY status`,
        [dateFrom, dateTo]
      );
      return result.rows;
    });

    return success(res, data);
  } catch (err) {
    return error(res, 'Error fetching order funnel', 500, err.message);
  }
};

// GET /api/reports/customer-ltv
exports.customerLtv = async (req, res) => {
  try {
    const { dateFrom = '2000-01-01', dateTo = new Date().toISOString().split('T')[0] } = req.query;

    const cacheKey = buildCacheKey('customer-ltv', { dateFrom, dateTo });
    const data = await cachedQuery(cacheKey, async () => {
      const result = await pool.query(
        `SELECT
           c.id,
           c.name,
           c.email,
           COUNT(o.id)::int AS order_count,
           COALESCE(SUM(o.total_amount), 0) AS lifetime_value,
           COALESCE(AVG(o.total_amount), 0) AS avg_order_value,
           MAX(o.created_at) AS last_order_at
         FROM customers c
         LEFT JOIN orders o ON c.id = o.customer_id
           AND o.status != 'cancelled'
           AND o.created_at BETWEEN $1 AND $2::date + INTERVAL '1 day'
         GROUP BY c.id, c.name, c.email
         ORDER BY lifetime_value DESC
         LIMIT 20`,
        [dateFrom, dateTo]
      );
      return result.rows;
    });

    return success(res, data);
  } catch (err) {
    return error(res, 'Error fetching customer LTV', 500, err.message);
  }
};
