const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { query } = require('../config/db');
const { AppError, asyncHandler } = require('../utils/http');

/**
 * Verifica el JWT y carga el usuario desde la BD. Así, desactivar a un usuario
 * o cambiarle el rol surte efecto inmediato aunque su token siga vigente.
 * Deja `req.user = { id, email, role, area, firstName, lastName }`.
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'Token de autenticación requerido');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    throw new AppError(401, 'Token inválido o expirado');
  }

  const { rows } = await query(
    `SELECT u.id, u.email, u.first_name AS "firstName", u.last_name AS "lastName",
            r.name AS role, r.description AS area
       FROM users u
       JOIN roles r ON r.id = u.role_id
      WHERE u.id = $1 AND u.is_active = TRUE`,
    [payload.id]
  );
  if (rows.length === 0) {
    throw new AppError(401, 'Usuario inexistente o desactivado');
  }

  req.user = rows[0];
  next();
});

module.exports = { authenticate };
