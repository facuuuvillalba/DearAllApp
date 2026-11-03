const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { loadGroupAccess, requireGroupWriteAccess } = require('../middlewares/groupAccess');
const ctrl = require('../controllers/message.controller');

router.get(
  '/:groupId',
  authenticate,
  loadGroupAccess('params'),
  validate(ctrl.listMessagesQuerySchema, 'query'),
  ctrl.listMessages
);

router.post(
  '/',
  authenticate,
  validate(ctrl.sendMessageSchema),
  loadGroupAccess('body'),
  requireGroupWriteAccess,
  ctrl.sendMessage
);

module.exports = router;
