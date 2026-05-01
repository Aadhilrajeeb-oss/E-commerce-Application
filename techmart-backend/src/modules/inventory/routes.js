const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticateToken } = require('../../middleware/auth');

router.get('/alerts', authenticateToken, controller.getAlerts);

module.exports = router;
