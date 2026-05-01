const pool = require('../../config/db');
const { success, error } = require('../../utils/apiResponse');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');

exports.createIntent = async (req, res) => {
  try {
    const { order_id } = req.body;
    const orderRes = await pool.query('SELECT total_amount FROM orders WHERE id = $1', [order_id]);
    if (orderRes.rows.length === 0) return error(res, 'Order not found', 404);

    const amountInCents = Math.round(parseFloat(orderRes.rows[0].total_amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: { order_id },
    });

    // Create payment record
    await pool.query(
      'INSERT INTO payments (order_id, stripe_payment_id, amount, status) VALUES ($1, $2, $3, $4)',
      [order_id, paymentIntent.id, orderRes.rows[0].total_amount, 'pending']
    );

    return success(res, { clientSecret: paymentIntent.client_secret });
  } catch (err) {
    return error(res, 'Error creating payment intent', 500, err.message);
  }
};

exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // If webhook secret isn't set, we skip signature verification for local testing simplicity.
    // In production, ALWAYS verify the signature.
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = req.body;
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.order_id;
      
      await pool.query("UPDATE payments SET status = 'paid', paid_at = NOW() WHERE stripe_payment_id = $1", [paymentIntent.id]);
      await pool.query("UPDATE orders SET payment_status = 'paid' WHERE id = $1", [orderId]);
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      await pool.query("UPDATE payments SET status = 'failed' WHERE stripe_payment_id = $1", [paymentIntent.id]);
      await pool.query("UPDATE orders SET payment_status = 'failed' WHERE id = $1", [paymentIntent.metadata.order_id]);
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).end();
  }
};

exports.getHistory = async (req, res) => {
  try {
    const customerId = req.user.customer_id;
    if (!customerId) return error(res, 'No customer profile found', 400);

    const query = `
      SELECT p.*, o.created_at as order_date 
      FROM payments p 
      JOIN orders o ON p.order_id = o.id 
      WHERE o.customer_id = $1 
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [customerId]);
    return success(res, result.rows);
  } catch (err) {
    return error(res, 'Error fetching payment history', 500, err.message);
  }
};
