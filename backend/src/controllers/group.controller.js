const { query } = require('../config/db');
const { ANNOUNCEMENT_WRITER_ROLES, ROLES } = require('../config/constants');
const { asyncHandler } = require('../utils/http');

/**
 * GET /api/groups
 * Devuelve solo los grupos autorizados al usuario (membresía; Admin ve todos),
 * con `canWrite` ya calculado y la vista previa del último mensaje.
 */
const listGroups = asyncHandler(async (req, res) => {
  const { id, role } = req.user;

  const { rows } = await query(
    `SELECT g.id, g.name, g.description,
            g.is_announcement_only AS "isAnnouncementOnly",
            g.target_role_id AS "targetRoleId",
            tr.description AS "targetArea",
            lm.content AS "lastMessageContent",
            lm.created_at AS "lastMessageAt"
       FROM groups g
       LEFT JOIN roles tr ON tr.id = g.target_role_id
       LEFT JOIN LATERAL (
              SELECT m.content, m.created_at FROM messages m
               WHERE m.group_id = g.id ORDER BY m.id DESC LIMIT 1
            ) lm ON TRUE
      WHERE $2 = '${ROLES.ADMIN}'
         OR EXISTS (SELECT 1 FROM user_groups ug WHERE ug.group_id = g.id AND ug.user_id = $1)
      ORDER BY g.is_announcement_only DESC, g.name`,
    [id, role]
  );

  const canAnnounce = ANNOUNCEMENT_WRITER_ROLES.includes(role);
  const groups = rows.map((g) => ({ ...g, canWrite: !g.isAnnouncementOnly || canAnnounce }));

  res.json({ groups });
});

module.exports = { listGroups };
