const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgres://postgres:postgres@localhost:5432/techmart'
});

async function createLuxuryCustomer() {
  const name = 'Aadhil Luxe';
  const email = 'aadhil@luxury.com';
  const password = 'password123';
  const role = 'customer';

  const client = await pool.connect();
  try {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    
    await client.query('BEGIN');

    // Create customer profile
    const custRes = await client.query(
      'INSERT INTO customers (name, email, phone, address_json) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, '555-LUXE-01', JSON.stringify({ street: '1 Infinite Loop', city: 'Cupertino', state: 'CA' })]
    );
    const customerId = custRes.rows[0].id;

    // Create auth user
    await client.query(
      'INSERT INTO users (name, email, password_hash, role, customer_id) VALUES ($1, $2, $3, $4, $5)',
      [name, email, passwordHash, role, customerId]
    );

    // Add some luxury orders
    const prodRes = await client.query('SELECT id, price FROM products LIMIT 3');
    for (const prod of prodRes.rows) {
        const orderRes = await client.query(
            "INSERT INTO orders (customer_id, status, total_amount, payment_status) VALUES ($1, 'placed', $2, 'pending') RETURNING id",
            [customerId, prod.price]
        );
        await client.query(
            "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
            [orderRes.rows[0].id, prod.id, 1, prod.price]
        );
    }

    await client.query('COMMIT');
    console.log('Luxury customer created: aadhil@luxury.com / password123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

createLuxuryCustomer();
