const { AppError } = require('../utils/http');

/**
 * Valida `req[source]` con un esquema zod y reemplaza el valor por el resultado parseado.
 */
const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new AppError(400, 'Datos inválidos', details));
  }
  req[source] = result.data;
  return next();
};

module.exports = { validate };
