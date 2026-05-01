const pool = require('../src/config/db');
const redisClient = require('../src/config/redis');

afterAll(async () => {
  await pool.end();
  await redisClient.quit();
});
