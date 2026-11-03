const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      // Sin Origin (apps nativas, curl) => permitido; con Origin => debe estar en la lista.
      if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
  })
);
app.use(express.json({ limit: '50kb' }));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Intenta más tarde' },
  })
);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/groups', require('./routes/group.routes'));
app.use('/api/messages', require('./routes/message.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
