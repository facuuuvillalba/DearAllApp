const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const env = require('../config/env');
const { query } = require('../config/db');
const { AppError, asyncHandler } = require('../utils/http');

const BCRYPT_ROUNDS = 12;

// Hash de relleno para igualar el tiempo de respuesta cuando el email no existe.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1).max(128),
});

const publicUser = (row) => ({
  id: row.id,
  firstName: row.firstName,
  lastName: row.lastName,
  email: row.email,
  role: row.role,
  area: row.area,
});

/** POST /api/auth/login */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await query(
    `SELECT u.id, u.email, u.password_hash AS "passwordHash", u.is_active AS "isActive",
            u.first_name AS "firstName", u.last_name AS "lastName",
            r.name AS role, r.description AS area
       FROM users u
       JOIN roles r ON r.id = u.role_id
      WHERE LOWER(u.email) = $1`,
    [email]
  );
  const user = rows[0];

  const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !passwordOk) {
    throw new AppError(401, 'Credenciales inválidas');
  }
  if (!user.isActive) {
    throw new AppError(403, 'Tu cuenta está desactivada. Contacta al administrador');
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
  });

  res.json({ token, user: publicUser(user) });
});

/** GET /api/auth/me */
const me = (req, res) => res.json({ user: publicUser(req.user) });

module.exports = { loginSchema, login, me, BCRYPT_ROUNDS };
