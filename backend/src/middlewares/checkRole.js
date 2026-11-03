const { AppError } = require('../utils/http');

/**
 * Restringe una ruta a los roles indicados. Debe ir después de `authenticate`.
 * Ej.: router.post('/users', authenticate, checkRole('Admin'), handler)
 */
const checkRole =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.user) return next(new AppError(401, 'No autenticado'));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, 'No tienes permisos para realizar esta acción'));
    }
    return next();
  };

module.exports = { checkRole };
