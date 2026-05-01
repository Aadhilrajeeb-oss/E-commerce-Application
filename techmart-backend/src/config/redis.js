const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Connect automatically
(async () => {
  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (err) {
    console.error('Redis connection failed:', err);
  }
})();

module.exports = redisClient;
