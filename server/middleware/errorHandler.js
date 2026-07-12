// ============================================================
// middleware/errorHandler.js
// Error handler terpusat. Route tinggal pakai asyncHandler(),
// tidak perlu try/catch berulang di tiap endpoint.
// ============================================================

const createLogger = require('../utils/logger');
const logger = createLogger('errorHandler');

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
}

function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.originalUrl}: ${err.message}`);
  const status = err.status || 500;
  res.status(status).json({
    error: err.publicMessage || 'Terjadi kesalahan pada server.',
    details: err.message,
  });
}

module.exports = { asyncHandler, notFoundHandler, errorHandler };
