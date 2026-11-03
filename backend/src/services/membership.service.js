/**
 * Mantiene user_groups alineado con las reglas de acceso por rol:
 *   - Admin: todos los grupos.
 *   - Resto: grupos globales (target_role_id NULL) y los de su propio rol.
 * Todas las funciones reciben un `client` para participar en la transacción del llamador.
 */

/** Recalcula las membresías de un usuario (alta o cambio de rol). */
async function syncUserMemberships(client, userId) {
  const eligible = `
    SELECT g.id
      FROM groups g
      JOIN users u ON u.id = $1
      JOIN roles r ON r.id = u.role_id
     WHERE r.name = 'Admin' OR g.target_role_id IS NULL OR g.target_role_id = u.role_id`;

  await client.query(
    `DELETE FROM user_groups WHERE user_id = $1 AND group_id NOT IN (${eligible})`,
    [userId]
  );
  await client.query(
    `INSERT INTO user_groups (user_id, group_id)
     SELECT $1::int, e.id FROM (${eligible}) e
     ON CONFLICT DO NOTHING`,
    [userId]
  );
}

/** Suscribe a todos los usuarios elegibles a un grupo recién creado. */
async function addEligibleUsersToGroup(client, groupId) {
  await client.query(
    `INSERT INTO user_groups (user_id, group_id)
     SELECT u.id, g.id
       FROM groups g
       JOIN users u ON TRUE
       JOIN roles r ON r.id = u.role_id
      WHERE g.id = $1
        AND (r.name = 'Admin' OR g.target_role_id IS NULL OR g.target_role_id = u.role_id)
     ON CONFLICT DO NOTHING`,
    [groupId]
  );
}

module.exports = { syncUserMemberships, addEligibleUsersToGroup };
