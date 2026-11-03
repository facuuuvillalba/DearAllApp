/** Nombres de rol usados por la lógica de permisos (deben coincidir con roles.name). */
const ROLES = Object.freeze({
  ADMIN: 'Admin',
  RRHH: 'RRHH',
});

/** Roles autorizados a escribir en canales is_announcement_only. */
const ANNOUNCEMENT_WRITER_ROLES = Object.freeze([ROLES.ADMIN, ROLES.RRHH]);

module.exports = { ROLES, ANNOUNCEMENT_WRITER_ROLES };
