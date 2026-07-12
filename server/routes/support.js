// ============================================================
// routes/support.js
// Endpoint chat support (bukan bagian dari deteksi AI-text).
// ============================================================

const express = require('express');
const supportChat = require('../support');
const { asyncHandler } = require('../middleware/errorHandler');
const createLogger = require('../utils/logger');

const router = express.Router();
const logger = createLogger('support');

router.post('/support', asyncHandler(async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Parameter "message" wajib dan harus berupa string.' });
  }
  if (message.trim().length < 2) {
    return res.status(400).json({ error: 'Pesan terlalu pendek.' });
  }

  try {
    const result = await supportChat.chat(message, history || []);
    return res.json({ success: true, reply: result.reply });
  } catch (error) {
    logger.error(`Support chat gagal: ${error.message}`);
    return res.status(500).json({ error: 'Gagal memproses chat. Coba lagi.', details: error.message });
  }
}));

module.exports = router;
