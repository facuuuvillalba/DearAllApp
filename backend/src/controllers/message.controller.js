const { z } = require('zod');
const { query } = require('../config/db');
const { AppError, asyncHandler } = require('../utils/http');

const listMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.coerce.number().int().positive().optional(), // paginación hacia atrás
  after: z.coerce.number().int().positive().optional(), // polling incremental
});

const sendMessageSchema = z.object({
  groupId: z.coerce.number().int().positive(),
  content: z.string().trim().min(1, 'El mensaje no puede estar vacío').max(4000),
  parentMessageId: z.coerce.number().int().positive().optional(),
});

/**
 * GET /api/messages/:groupId?limit=&before=&after=
 * Siempre devuelve los mensajes en orden cronológico ascendente.
 * (Acceso al grupo ya validado por loadGroupAccess)
 */
const listMessages = asyncHandler(async (req, res) => {
  const { limit, before, after } = req.query;
  const params = [req.group.id];
  let filter = '';

  if (after) {
    params.push(after);
    filter = `AND m.id > $${params.length}`;
  } else if (before) {
    params.push(before);
    filter = `AND m.id < $${params.length}`;
  }
  params.push(limit);

  const { rows } = await query(
    `SELECT m.id, m.group_id AS "groupId", m.content, m.created_at AS "createdAt",
            m.parent_message_id AS "parentMessageId", m.sender_id AS "senderId",
            u.first_name || ' ' || u.last_name AS "senderName", r.name AS "senderRole"
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       JOIN roles r ON r.id = u.role_id
      WHERE m.group_id = $1 ${filter}
      ORDER BY m.id ${after ? 'ASC' : 'DESC'}
      LIMIT $${params.length}`,
    params
  );

  res.json({ messages: after ? rows : rows.reverse() });
});

/**
 * POST /api/messages
 * (Acceso y permiso de escritura ya validados por los middlewares de grupo)
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { content, parentMessageId } = req.body;

  if (parentMessageId) {
    const parent = await query('SELECT 1 FROM messages WHERE id = $1 AND group_id = $2', [
      parentMessageId,
      req.group.id,
    ]);
    if (parent.rowCount === 0) throw new AppError(400, 'El mensaje padre no existe en este grupo');
  }

  const { rows } = await query(
    `INSERT INTO messages (group_id, sender_id, content, parent_message_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at AS "createdAt"`,
    [req.group.id, req.user.id, content, parentMessageId ?? null]
  );

  res.status(201).json({
    message: {
      id: rows[0].id,
      groupId: req.group.id,
      content,
      createdAt: rows[0].createdAt,
      parentMessageId: parentMessageId ?? null,
      senderId: req.user.id,
      senderName: `${req.user.firstName} ${req.user.lastName}`,
      senderRole: req.user.role,
    },
  });
});

module.exports = { listMessagesQuerySchema, sendMessageSchema, listMessages, sendMessage };
