const { Pool, types } = require('pg');
const env = require('./env');

// BIGINT (OID 20) llega como string por defecto; los ids caben de sobra en Number.
types.setTypeParser(20, (value) => parseInt(value, 10));

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
  max: 10,
});

const query = (text, params) => pool.query(text, params);

/** Ejecuta `fn(client)` dentro de una transacción (COMMIT / ROLLBACK automático). */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
