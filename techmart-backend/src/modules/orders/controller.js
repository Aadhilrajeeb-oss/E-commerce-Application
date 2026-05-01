const pool = require('../../config/db');
const { success, error } = require('../../utils/apiResponse');
const PDFDocument = require('pdfkit');

const validTransitions = {
  placed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

exports.createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { customer_id, items } = req.body; // items: [{ product_id, quantity }]

    if (!items || items.length === 0) throw new Error('Order must contain at least one item');

    let totalAmount = 0;
    const processedItems = [];

    // Validate and deduct stock
    for (const item of items) {
      const prodRes = await client.query('SELECT name, price, stock_quantity FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
      if (prodRes.rows.length === 0) throw new Error(`Product ${item.product_id} not found`);
      
      const product = prodRes.rows[0];
      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      const newStock = product.stock_quantity - item.quantity;
      await client.query('UPDATE products SET stock_quantity = $1 WHERE id = $2', [newStock, item.product_id]);
      
      await client.query(
        "INSERT INTO inventory_logs (product_id, change_type, delta, note) VALUES ($1, 'sale', $2, 'Order placement')",
        [item.product_id, -item.quantity]
      );

      const unitPrice = parseFloat(product.price);
      totalAmount += unitPrice * item.quantity;
      processedItems.push({ ...item, unit_price: unitPrice });
    }

    // Create Order
    const orderRes = await client.query(
      "INSERT INTO orders (customer_id, status, total_amount, payment_status) VALUES ($1, 'placed', $2, 'pending') RETURNING *",
      [customer_id, totalAmount]
    );
    const orderId = orderRes.rows[0].id;

    // Create Order Items
    for (const item of processedItems) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.unit_price]
      );
    }

    await client.query('COMMIT');
    return success(res, orderRes.rows[0], 'Order created successfully', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    return error(res, err.message, 400);
  } finally {
    client.release();
  }
};

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, c.name as customer_name, c.email as customer_email 
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
      countQuery += ` AND status = $${params.length}`;
    }

    if (req.user.role === 'customer') {
      params.push(req.user.customer_id);
      query += ` AND o.customer_id = $${params.length}`;
      countQuery += ` AND customer_id = $${params.length}`;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    
    const [result, countResult] = await Promise.all([
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, params)
    ]);

    return success(res, {
      orders: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      }
    });
  } catch (err) {
    return error(res, 'Error fetching orders', 500, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const orderRes = await pool.query(
      `SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address_json 
       FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = $1`, [id]
    );
    if (orderRes.rows.length === 0) return error(res, 'Order not found', 404);

    const itemsRes = await pool.query(
      `SELECT oi.*, p.name as product_name, p.sku 
       FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`, [id]
    );

    const paymentRes = await pool.query('SELECT * FROM payments WHERE order_id = $1', [id]);

    const order = orderRes.rows[0];
    order.items = itemsRes.rows;
    order.payment = paymentRes.rows[0] || null;

    return success(res, order);
  } catch (err) {
    return error(res, 'Error fetching order', 500, err.message);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const orderRes = await pool.query('SELECT status FROM orders WHERE id = $1', [id]);
    if (orderRes.rows.length === 0) return error(res, 'Order not found', 404);

    const currentStatus = orderRes.rows[0].status;
    const allowed = validTransitions[currentStatus] || [];
    
    if (!allowed.includes(status)) {
      return error(res, `Invalid status transition from ${currentStatus} to ${status}`, 400);
    }

    const updated = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    return success(res, updated.rows[0], 'Status updated');
  } catch (err) {
    return error(res, 'Error updating status', 500, err.message);
  }
};

exports.cancelOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    const orderRes = await client.query('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (orderRes.rows.length === 0) throw new Error('Order not found');
    
    const currentStatus = orderRes.rows[0].status;
    if (currentStatus === 'cancelled') throw new Error('Order is already cancelled');
    if (currentStatus === 'delivered') throw new Error('Cannot cancel a delivered order');

    // Update order status
    await client.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [id]);

    // Restore stock
    const itemsRes = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [id]);
    for (const item of itemsRes.rows) {
      await client.query('UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2', [item.quantity, item.product_id]);
      await client.query(
        "INSERT INTO inventory_logs (product_id, change_type, delta, note) VALUES ($1, 'adjustment', $2, 'Order cancellation restore')",
        [item.product_id, item.quantity]
      );
    }

    // (If payment was processed, we would trigger Stripe refund here)

    await client.query('COMMIT');
    return success(res, null, 'Order cancelled and stock restored');
  } catch (err) {
    await client.query('ROLLBACK');
    return error(res, err.message, 400);
  } finally {
    client.release();
  }
};

exports.generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const orderRes = await pool.query(
      `SELECT o.*, c.name, c.email FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = $1`, [id]
    );
    if (orderRes.rows.length === 0) return error(res, 'Order not found', 404);
    
    const itemsRes = await pool.query(
      `SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`, [id]
    );

    const order = orderRes.rows[0];
    const items = itemsRes.rows;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('TECHMART', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('INVOICE', { align: 'center' });
    doc.moveDown();
    
    // Order Info
    doc.fontSize(10).text(`Order ID: ${order.id}`);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`);
    doc.text(`Status: ${order.status.toUpperCase()}`);
    doc.moveDown();
    
    // Customer Info
    doc.text(`Bill To:`);
    doc.text(`${order.name}`);
    doc.text(`${order.email}`);
    doc.moveDown();

    // Items
    doc.text('------------------------------------------------------------------');
    doc.text('Item                                     Qty    Price      Total');
    doc.text('------------------------------------------------------------------');
    
    items.forEach(item => {
      const lineTotal = (item.quantity * item.unit_price).toFixed(2);
      doc.text(`${item.name.substring(0, 35).padEnd(40)} ${item.quantity.toString().padEnd(6)} $${item.unit_price}   $${lineTotal}`);
    });

    doc.text('------------------------------------------------------------------');
    doc.moveDown();
    doc.fontSize(12).text(`Total Amount: $${order.total_amount}`, { align: 'right' });

    doc.end();
  } catch (err) {
    return error(res, 'Error generating invoice', 500, err.message);
  }
};
