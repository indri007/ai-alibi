// ============================================================
// config/env.js
// Validasi env var wajib saat startup. Fail-fast di production
// supaya error konfigurasi ketahuan langsung, bukan error samar
// di tengah request.
// ============================================================

const isProd = process.env.NODE_ENV === 'production';

// Wajib ada saat production. Di luar production boleh kosong
// (dev fallback dipakai) supaya masih bisa jalan lokal.
const REQUIRED_IN_PROD = ['SESSION_SECRET', 'API_KEY', 'ADMIN_PASSWORD'];

// OAuth itu grup: kalau salah satu diisi, ketiganya wajib diisi.
const OAUTH_VARS = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'SESSION_SECRET'];

function validateEnv() {
  if (isProd) {
    const missing = REQUIRED_IN_PROD.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      console.error(`❌ [FATAL] Env var wajib belum diset di production: ${missing.join(', ')}`);
      process.exit(1);
    }
  }

  const oauthPresent = OAUTH_VARS.filter((key) => !!process.env[key]);
  if (oauthPresent.length > 0 && oauthPresent.length < OAUTH_VARS.length) {
    const missingOauth = OAUTH_VARS.filter((key) => !process.env[key]);
    console.warn(`⚠️  OAuth config sebagian: ${missingOauth.join(', ')} belum diset — login Google akan dinonaktifkan.`);
  }
}

const config = {
  PORT: process.env.PORT || 3001,
  CORS_ORIGINS: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
    : ['http://localhost:3000', 'https://localhost:3000', 'https://appsforoffice.microsoft.com'],
  API_KEY: process.env.API_KEY || '',
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '20', 10),
  oauthEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.SESSION_SECRET),
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev-only-secret-jangan-dipakai-di-production',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

module.exports = { validateEnv, config };