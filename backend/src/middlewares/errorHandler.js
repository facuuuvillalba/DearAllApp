const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  if (err.status) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Solicitud demasiado grande' });
  }

  console.error(err);
  return res.status(500).json({
    error: 'Error interno del servidor',
    ...(env.nodeEnv !== 'production' && { details: err.message }),
  });
};

const notFound = (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' });

module.exports = { errorHandler, notFound };
