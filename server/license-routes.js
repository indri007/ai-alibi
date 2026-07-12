const { createLicense, activateLicense, listLicenses } = require('./lib/licenses');

function adminAuth(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD belum di-set di server.' });
  }
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Password admin salah atau tidak dikirim.' });
  }
  next();
}

function registerLicenseRoutes(app, apiKeyAuth) {
  // User aktivasi kode lisensi dari taskpane (butuh X-API-Key, seperti endpoint lain)
  app.post('/api/license/activate', apiKeyAuth, async (req, res) => {
    const { key, deviceId } = req.body;
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Parameter "key" wajib diisi.' });
    }
    try {
      const result = await activateLicense(key.trim().toUpperCase(), deviceId);
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (err) {
      console.error('[License Activate] Error:', err.message);
      return res.status(500).json({ error: 'Gagal memproses aktivasi.', details: err.message });
    }
  });

  // Admin generate kode baru (butuh X-Admin-Password, BUKAN X-API-Key)
  app.post('/api/admin/generate-license', adminAuth, async (req, res) => {
    const { daysValid, note } = req.body;
    try {
      const entry = await createLicense(daysValid || 365, note || '');
      return res.json({ success: true, license: entry });
    } catch (err) {
      console.error('[Admin Generate] Error:', err.message);
      return res.status(500).json({ error: 'Gagal generate lisensi.', details: err.message });
    }
  });

  // Admin lihat semua kode lisensi
  app.get('/api/admin/licenses', adminAuth, async (req, res) => {
    try {
      const licenses = await listLicenses();
      return res.json({ success: true, licenses: licenses.reverse() }); // terbaru dulu
    } catch (err) {
      console.error('[Admin List] Error:', err.message);
      return res.status(500).json({ error: 'Gagal mengambil daftar lisensi.', details: err.message });
    }
  });
}

module.exports = registerLicenseRoutes;
