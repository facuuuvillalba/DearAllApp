/**
 * Crea el primer usuario Admin (idempotente). Requiere haber ejecutado schema.sql y seed.sql.
 * Uso: npm run seed:admin
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool, withTransaction } = require('../src/config/db');
const { syncUserMemberships } = require('../src/services/membership.service');

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || password.length < 8) {
    throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 8 caracteres) en .env');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const created = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role_id)
       SELECT $1, $2, $3, $4, r.id FROM roles r WHERE r.name = 'Admin'
       ON CONFLICT (LOWER(email)) DO NOTHING
       RETURNING id`,
      [process.env.ADMIN_FIRST_NAME || 'Admin', process.env.ADMIN_LAST_NAME || 'Sistema', email, passwordHash]
    );
    if (rows.length === 0) return false;
    await syncUserMemberships(client, rows[0].id);
    return true;
  });

  console.log(created ? `Admin creado: ${email}` : `Ya existe un usuario con el email ${email}`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
