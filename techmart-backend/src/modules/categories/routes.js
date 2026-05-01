const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticateToken, requireRole } = require('../../middleware/auth');

router.use(authenticateToken);

router.get('/', controller.getAll);
router.get('/tree', controller.getTree);
router.post('/', requireRole(['admin']), controller.create);
router.put('/:id', requireRole(['admin']), controller.update);
router.delete('/:id', requireRole(['admin']), controller.delete);

module.exports = router;
