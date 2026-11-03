const router = require('express').Router();
const { authenticate } = require('../middlewares/auth');
const { listGroups } = require('../controllers/group.controller');

router.get('/', authenticate, listGroups);

module.exports = router;
