const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Auth Endpoints', () => {
  const testUser = {
    name: 'Test User',
    email: `test${Date.now()}@test.com`,
    password: 'password123',
  };

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBeTruthy();
    expect(res.body.data).toHaveProperty('id');
  });

  it('should login the user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('should prevent access to protected route without token', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toEqual(401);
  });
});
