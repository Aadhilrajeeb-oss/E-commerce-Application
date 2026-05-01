const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticateToken, requireRole } = require('../../middleware/auth');

router.use(authenticateToken);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', requireRole(['admin', 'staff']), controller.createOrder);
router.patch('/:id/status', requireRole(['admin']), controller.updateStatus);
router.post('/:id/cancel', requireRole(['admin']), controller.cancelOrder);
router.get('/:id/invoice', controller.generateInvoice);

module.exports = router;
