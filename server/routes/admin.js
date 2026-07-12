// ============================================================
// routes/admin.js
// Rate limit ketat untuk endpoint admin-sensitive + mount
// license-routes.js.
//
// PENTING: license-routes.js sudah pakai path LENGKAP di
// dalamnya sendiri (app.post('/api/license/activate', ...),
// app.post('/api/admin/generate-license', ...), dst — sudah
// dikonfirmasi lewat grep). Karena itu, router ini TIDAK
// boleh di-mount dengan prefix tambahan '/api' di index.js.
// Router ini dipasang di app root (lihat index.js: app.use(adminRoutes),
// bukan app.use('/api', adminRoutes)) supaya path '/api/license/...'
// dan '/api/admin/...' di dalam license-routes.js tetap match
// persis, tidak dobel jadi '/api/api/...'.
// ============================================================

const express = require('express');
const rateLimit = require('express-rate-limit');
const registerLicenseRoutes = require('../license-routes');
const { apiKeyAuth } = require('./detect');

const router = express.Router();

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10,
  message: { error: 'Terlalu banyak percobaan akses admin. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Path lengkap '/api/admin' karena router ini di-mount di app root.
router.use('/api/admin', adminLimiter);

registerLicenseRoutes(router, apiKeyAuth);

module.exports = router;