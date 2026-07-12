// ============================================================
// routes/detect.js
// Endpoint deteksi teks AI-generated + rate limit khusus /api/*
// ============================================================

const express = require('express');
const rateLimit = require('express-rate-limit');
const { config } = require('../config/env');
const { asyncHandler } = require('../middleware/errorHandler');
const createLogger = require('../utils/logger');

const router = express.Router();
const logger = createLogger('detect');

// ---- API Key Auth (dipakai juga oleh routes/admin.js) ----
function apiKeyAuth(req, res, next) {
  if (!config.API_KEY) return next(); // Skip jika API Key tidak diset
  const key = req.headers['x-api-key'];
  if (!key) {
    return res.status(401).json({ error: 'API Key diperlukan. Kirim header: X-API-Key' });
  }
  if (key !== config.API_KEY) {
    return res.status(403).json({ error: 'API Key tidak valid.' });
  }
  next();
}

// ---- Rate limiting khusus /api/* ----
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.RATE_LIMIT_MAX,
  message: { error: 'Terlalu banyak request. Coba lagi dalam 1 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(limiter);

// ---- Provider handlers ----
const PROVIDER_HANDLERS = {
  gptzero: require('../providers/gptzero'),
  zerogpt: require('../providers/zerogpt'),
  watsonx: require('../providers/watsonx'),
  desklib: require('../providers/desklib'),
  hix: require('../providers/hix'),
};

router.post('/detect', apiKeyAuth, asyncHandler(async (req, res) => {
  const { provider, text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Parameter "text" wajib dan harus berupa string.' });
  }
  if (text.trim().length < 50) {
    return res.status(400).json({ error: 'Teks terlalu pendek (minimum 50 karakter).' });
  }

  const handler = PROVIDER_HANDLERS[provider];
  if (!handler) {
    return res.status(400).json({ error: `Provider "${provider}" tidak didukung.` });
  }

  try {
    const result = await handler(text);
    return res.json(result);
  } catch (error) {
    logger.error(`Provider ${provider} gagal: ${error.message}`);
    return res.status(500).json({
      error: 'Gagal menghubungi layanan API deteksi pihak ketiga.',
      details: error.message
    });
  }
}));

module.exports = { router, apiKeyAuth };
