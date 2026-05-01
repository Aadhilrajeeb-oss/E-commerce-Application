const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticateToken } = require('../../middleware/auth');

router.post('/create-intent', authenticateToken, controller.createIntent);
router.get('/history', authenticateToken, controller.getHistory);

// Webhook requires raw body for signature verification if secret is provided
router.post('/webhook', express.raw({type: 'application/json'}), controller.webhook);

module.exports = router;
