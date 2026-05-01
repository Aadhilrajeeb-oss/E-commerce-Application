const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgres://postgres:postgres@localhost:5432/techmart'
});

const customers = [
  { name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', address: { street: '123 Tech Lane', city: 'Silicon Valley', state: 'CA' } },
  { name: 'Jane Smith', email: 'jane@example.com', phone: '234-567-8901', address: { street: '456 Innovation Blvd', city: 'Austin', state: 'TX' } },
  { name: 'Michael Brown', email: 'michael@example.com', phone: '345-678-9012', address: { street: '789 Circuit Way', city: 'Seattle', state: 'WA' } },
  { name: 'Emily Davis', email: 'emily@example.com', phone: '456-789-0123', address: { street: '101 Data Dr', city: 'Boston', state: 'MA' } },
  { name: 'David Wilson', email: 'david@example.com', phone: '567-890-1234', address: { street: '202 Byte Ct', city: 'Denver', state: 'CO' } },
  { name: 'Sarah Miller', email: 'sarah@example.com', phone: '678-901-2345', address: { street: '303 Cloud St', city: 'Chicago', state: 'IL' } },
  { name: 'Robert Taylor', email: 'robert@example.com', phone: '789-012-3456', address: { street: '404 Logic Rd', city: 'Atlanta', state: 'GA' } },
  { name: 'Linda Anderson', email: 'linda@example.com', phone: '890-123-4567', address: { street: '505 Web Ave', city: 'Miami', state: 'FL' } },
  { name: 'James Thomas', email: 'james@example.com', phone: '901-234-5678', address: { street: '606 Stack Pl', city: 'Phoenix', state: 'AZ' } },
  { name: 'Patricia Jackson', email: 'patricia@example.com', phone: '012-345-6789', address: { street: '707 Buffer Ln', city: 'Portland', state: 'OR' } },
];

async function seed() {
  try {
    console.log('Starting seeding...');

    // 1. Seed Customers
    const customerIds = [];
    for (const c of customers) {
      const res = await pool.query(
        'INSERT INTO customers (name, email, phone, address_json) VALUES ($1, $2, $3, $4) RETURNING id',
        [c.name, c.email, c.phone, JSON.stringify(c.address)]
      );
      customerIds.push(res.rows[0].id);
    }
    console.log(`Seeded ${customerIds.length} customers.`);

    // 2. Get Products
    const prodRes = await pool.query('SELECT id, price FROM products LIMIT 10');
    const products = prodRes.rows;
    if (products.length === 0) throw new Error('No products found. Please import products first.');

    // 3. Seed Orders
    const statuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const paymentStatuses = ['pending', 'paid', 'failed'];

    for (let i = 0; i < 40; i++) {
      const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      
      // Random date in the last 30 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      const orderRes = await pool.query(
        'INSERT INTO orders (customer_id, status, payment_status, total_amount, created_at) VALUES ($1, $2, $3, 0, $4) RETURNING id',
        [customerId, status, paymentStatus, date]
      );
      const orderId = orderRes.rows[0].id;

      // Add 1-3 random items
      let total = 0;
      const numItems = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        const price = parseFloat(product.price);
        total += price * qty;

        await pool.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
          [orderId, product.id, qty, price]
        );
      }

      // Update total amount
      await pool.query('UPDATE orders SET total_amount = $1 WHERE id = $2', [total, orderId]);
    }

    console.log('Seeded 40 sample orders.');
    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await pool.end();
  }
}

seed();
