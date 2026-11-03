const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/checkRole');
const { validate } = require('../middlewares/validate');
const { ROLES } = require('../config/constants');
const ctrl = require('../controllers/admin.controller');

// Todo el router es exclusivo de administradores.
router.use(authenticate, checkRole(ROLES.ADMIN));

router.get('/roles', ctrl.listRoles);
router.get('/users', ctrl.listUsers);
router.post('/users', validate(ctrl.createUserSchema), ctrl.createUser);
router.patch(
  '/users/:id',
  validate(ctrl.userIdParamSchema, 'params'),
  validate(ctrl.updateUserSchema),
  ctrl.updateUser
);
router.post('/groups', validate(ctrl.createGroupSchema), ctrl.createGroup);

module.exports = router;
