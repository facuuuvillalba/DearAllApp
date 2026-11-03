const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { validate } = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { loginSchema, login, me } = require('../controllers/auth.controller');

// Freno específico contra fuerza bruta en el login.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta más tarde' },
});

router.post('/login', loginLimiter, validate(loginSchema), login);
router.get('/me', authenticate, me);

module.exports = router;
