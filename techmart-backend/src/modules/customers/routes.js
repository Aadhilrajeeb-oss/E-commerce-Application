const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticateToken } = require('../../middleware/auth');

router.use(authenticateToken);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.get('/:id/orders', controller.getOrders);
router.post('/', controller.create);
router.put('/:id', controller.update);

module.exports = router;
