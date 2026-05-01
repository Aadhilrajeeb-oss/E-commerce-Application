const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authenticateToken, requireRole } = require('../../middleware/auth');

router.use(authenticateToken);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', requireRole(['admin']), controller.create);
router.put('/:id', requireRole(['admin']), controller.update);
router.delete('/:id', requireRole(['admin']), controller.delete);

router.post('/import-external', requireRole(['admin']), controller.importExternal);
router.put('/:id/stock', requireRole(['admin']), controller.updateStock);

module.exports = router;
