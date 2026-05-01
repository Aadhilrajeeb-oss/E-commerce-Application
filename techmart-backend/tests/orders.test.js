const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Orders Endpoints', () => {
  let token;
  let customerId;
  let productId;

  beforeAll(async () => {
    // Authenticate user
    const resAuth = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin', email: `admin_orders_${Date.now()}@test.com`, password: 'password', role: 'admin' });
    
    // Fallback to login if already exists
    if (resAuth.statusCode === 400) {
      const loginRes = await request(app).post('/api/auth/login').send({ email: 'admin_orders@test.com', password: 'password' });
      token = loginRes.body.data.accessToken;
    } else {
      const loginRes = await request(app).post('/api/auth/login').send({ email: resAuth.body.data.email, password: 'password' });
      token = loginRes.body.data.accessToken;
    }

    // Create Customer
    const resCust = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Cust', email: `cust_${Date.now()}@test.com` });
    customerId = resCust.body.data.id;

    // Create Product
    const resProd = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Product', sku: `SKU-${Date.now()}`, price: 100, cost_price: 50, stock_quantity: 10, status: 'active' });
    productId = resProd.body.data.id;
  });

  it('should create an order and deduct stock', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customer_id: customerId,
        items: [{ product_id: productId, quantity: 2 }]
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBeTruthy();
    expect(parseFloat(res.body.data.total_amount)).toEqual(200);

    // Verify stock deduction
    const prodRes = await pool.query('SELECT stock_quantity FROM products WHERE id = $1', [productId]);
    expect(prodRes.rows[0].stock_quantity).toEqual(8); // 10 - 2 = 8
  });
});
