const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticateToken } = require('../../middleware/auth');

router.use(authenticateToken);

router.get('/sales-summary', controller.salesSummary);
router.get('/revenue-by-category', controller.revenueByCategory);
router.get('/top-products', controller.topProducts);
router.get('/order-funnel', controller.orderFunnel);
router.get('/customer-ltv', controller.customerLtv);

module.exports = router;
