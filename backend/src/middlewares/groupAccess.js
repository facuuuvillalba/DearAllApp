const { query } = require('../config/db');
const { ROLES, ANNOUNCEMENT_WRITER_ROLES } = require('../config/constants');
const { AppError, asyncHandler } = require('../utils/http');

/**
 * Carga el grupo indicado (en `req.params.groupId` o `req.body.groupId`) y verifica
 * que el usuario autenticado tenga acceso (membresía o rol Admin).
 * Deja `req.group`.
 */
const loadGroupAccess = (source) =>
  asyncHandler(async (req, _res, next) => {
    const groupId = Number(req[source].groupId);
    if (!Number.isInteger(groupId) || groupId <= 0) {
      throw new AppError(400, 'groupId inválido');
    }

    const { rows } = await query(
      `SELECT g.id, g.name, g.is_announcement_only AS "isAnnouncementOnly",
              EXISTS (SELECT 1 FROM user_groups ug
                       WHERE ug.group_id = g.id AND ug.user_id = $2) AS "isMember"
         FROM groups g
        WHERE g.id = $1`,
      [groupId, req.user.id]
    );
    const group = rows[0];
    if (!group) throw new AppError(404, 'Grupo no encontrado');

    if (!group.isMember && req.user.role !== ROLES.ADMIN) {
      // 404 para no revelar la existencia de grupos a los que no se tiene acceso.
      throw new AppError(404, 'Grupo no encontrado');
    }

    req.group = group;
    next();
  });

/**
 * Bloquea el envío en canales de solo lectura salvo para RRHH / Admin.
 * Requiere `loadGroupAccess` previo.
 */
const requireGroupWriteAccess = (req, _res, next) => {
  if (req.group.isAnnouncementOnly && !ANNOUNCEMENT_WRITER_ROLES.includes(req.user.role)) {
    return next(new AppError(403, 'Este canal es de solo lectura: únicamente RRHH o Admin pueden publicar'));
  }
  return next();
};

module.exports = { loadGroupAccess, requireGroupWriteAccess };
