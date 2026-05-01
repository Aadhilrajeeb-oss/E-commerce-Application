const cron = require('node-cron');
const pool = require('./db');

const startCronJobs = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running low stock alert check...');
    try {
      const threshold = 10;
      const result = await pool.query('SELECT id, name, sku, stock_quantity FROM products WHERE stock_quantity < $1', [threshold]);
      
      if (result.rows.length > 0) {
        console.warn(`[ALERT] ${result.rows.length} products are running low on stock!`);
        // Here we could integrate with email services (e.g., SendGrid/Nodemailer) to email the admin
        // or push to a Slack webhook.
      }
    } catch (err) {
      console.error('Error in low stock cron job', err);
    }
  });
  console.log('Cron jobs scheduled.');
};

module.exports = startCronJobs;
