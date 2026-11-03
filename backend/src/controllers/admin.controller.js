const bcrypt = require('bcrypt');
const { z } = require('zod');
const { query, withTransaction } = require('../config/db');
const { AppError, asyncHandler } = require('../utils/http');
const { BCRYPT_ROUNDS } = require('./auth.controller');
const { syncUserMemberships, addEligibleUsersToGroup } = require('../services/membership.service');

// ---------- Esquemas de validación ----------
const createUserSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(128)
    .regex(/[A-Za-z]/, 'Debe incluir una letra')
    .regex(/\d/, 'Debe incluir un número'),
  roleId: z.coerce.number().int().positive(),
});

const updateUserSchema = z
  .object({
    isActive: z.boolean().optional(),
    roleId: z.coerce.number().int().positive().optional(),
  })
  .refine((v) => v.isActive !== undefined || v.roleId !== undefined, 'Nada que actualizar');

const createGroupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(''),
  isAnnouncementOnly: z.boolean().default(false),
  targetRoleId: z.coerce.number().int().positive().nullable().default(null),
});

const userIdParamSchema = z.object({ id: z.coerce.number().int().positive() });

// ---------- Helpers ----------
const USER_COLUMNS = `
  u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email,
  u.is_active AS "isActive", u.created_at AS "createdAt",
  r.id AS "roleId", r.name AS role, r.description AS area`;

const isUniqueViolation = (err) => err.code === '23505';

const recordAudit = (client, adminId, action, targetUserId, details) =>
  client.query(
    `INSERT INTO audit_logs (admin_id, action, target_user_id, details) VALUES ($1, $2, $3, $4)`,
    [adminId, action, targetUserId, JSON.stringify(details)]
  );

const fetchUser = async (client, id) => {
  const { rows } = await client.query(
    `SELECT ${USER_COLUMNS} FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
    [id]
  );
  return rows[0];
};

// ---------- Handlers ----------

/** POST /api/admin/users */
const createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, roleId } = req.body;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    const user = await withTransaction(async (client) => {
      const role = await client.query('SELECT id, name FROM roles WHERE id = $1', [roleId]);
      if (role.rowCount === 0) throw new AppError(400, 'El rol indicado no existe');

      const inserted = await client.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, role_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [firstName, lastName, email, passwordHash, roleId]
      );
      const userId = inserted.rows[0].id;

      await syncUserMemberships(client, userId);
      await recordAudit(client, req.user.id, 'USER_CREATED', userId, {
        email,
        role: role.rows[0].name,
      });

      return fetchUser(client, userId);
    });

    res.status(201).json({ user });
  } catch (err) {
    if (isUniqueViolation(err)) throw new AppError(409, 'Ya existe un usuario con ese email');
    throw err;
  }
});

/** GET /api/admin/users */
const listUsers = asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `SELECT ${USER_COLUMNS} FROM users u JOIN roles r ON r.id = u.role_id
      ORDER BY u.last_name, u.first_name`
  );
  res.json({ users: rows });
});

/** PATCH /api/admin/users/:id  (activar/desactivar, cambiar rol) */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive, roleId } = req.body;

  if (id === req.user.id) {
    throw new AppError(400, 'No puedes modificar tu propia cuenta desde el panel');
  }

  const user = await withTransaction(async (client) => {
    const current = await fetchUser(client, id);
    if (!current) throw new AppError(404, 'Usuario no encontrado');

    if (roleId !== undefined) {
      const role = await client.query('SELECT id FROM roles WHERE id = $1', [roleId]);
      if (role.rowCount === 0) throw new AppError(400, 'El rol indicado no existe');
    }

    await client.query(
      `UPDATE users SET is_active = COALESCE($2, is_active), role_id = COALESCE($3, role_id)
        WHERE id = $1`,
      [id, isActive ?? null, roleId ?? null]
    );

    if (roleId !== undefined && roleId !== current.roleId) {
      await syncUserMemberships(client, id);
      await recordAudit(client, req.user.id, 'USER_ROLE_CHANGED', id, { fromRoleId: current.roleId, toRoleId: roleId });
    }
    if (isActive !== undefined && isActive !== current.isActive) {
      await recordAudit(client, req.user.id, isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', id, {});
    }

    return fetchUser(client, id);
  });

  res.json({ user });
});

/** GET /api/admin/roles */
const listRoles = asyncHandler(async (_req, res) => {
  const { rows } = await query('SELECT id, name, description FROM roles ORDER BY id');
  res.json({ roles: rows });
});

/** POST /api/admin/groups */
const createGroup = asyncHandler(async (req, res) => {
  const { name, description, isAnnouncementOnly, targetRoleId } = req.body;

  try {
    const group = await withTransaction(async (client) => {
      if (targetRoleId !== null) {
        const role = await client.query('SELECT id FROM roles WHERE id = $1', [targetRoleId]);
        if (role.rowCount === 0) throw new AppError(400, 'El rol destino no existe');
      }

      const { rows } = await client.query(
        `INSERT INTO groups (name, description, is_announcement_only, target_role_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, description, is_announcement_only AS "isAnnouncementOnly",
                   target_role_id AS "targetRoleId"`,
        [name, description, isAnnouncementOnly, targetRoleId]
      );
      await addEligibleUsersToGroup(client, rows[0].id);
      await recordAudit(client, req.user.id, 'GROUP_CREATED', null, {
        groupId: rows[0].id,
        name,
        isAnnouncementOnly,
        targetRoleId,
      });
      return rows[0];
    });

    res.status(201).json({ group });
  } catch (err) {
    if (isUniqueViolation(err)) throw new AppError(409, 'Ya existe un canal con ese nombre');
    throw err;
  }
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  createGroupSchema,
  userIdParamSchema,
  createUser,
  listUsers,
  updateUser,
  listRoles,
  createGroup,
};
