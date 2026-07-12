// ============================================================
// Creative Alibi — Backend Proxy Server
// ============================================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const path = require('path');
const session = require('express-session');
const passport = require('passport');

dotenv.config();

const { validateEnv, config } = require('./config/env');
validateEnv();

const createLogger = require('./utils/logger');
const logger = createLogger('index');

const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { checkDesklib, checkGCS } = require('./lib/healthChecks');

const authRoutes = require('./routes/auth');
const { router: detectRoutes } = require('./routes/detect');
const supportRoutes = require('./routes/support');
const adminRoutes = require('./routes/admin');

const app = express();
app.set('trust proxy', 1);

// ---- Security & parsing middleware ----
app.use(cors({
  origin: config.CORS_ORIGINS,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // supaya taskpane.html tetap bisa load asset
}));
app.use(express.json());

// ---- Session & auth ----
app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, maxAge: 1000 * 60 * 60 * 24 * 7 }
}));
app.use(passport.initialize());
app.use(passport.session());

// ---- Health check (deep: cek koneksi live ke Desklib & GCS) ----
async function healthCheckHandler(req, res) {
  const [desklibResult, gcsResult] = await Promise.allSettled([checkDesklib(), checkGCS()]);

  res.json({
    status: 'ok',
    auth: !!config.API_KEY,
    providers: {
      gptzero: !!process.env.GPTZERO_API_KEY,
      zerogpt: !!process.env.ZEROGPT_API_KEY,
      watsonx: !!process.env.WATSONX_API_KEY,
      desklib: true,
      hix: !!process.env.HIX_EMAIL
    },
    dependencies: {
      desklib: desklibResult.status === 'fulfilled' ? desklibResult.value : { status: 'error', error: desklibResult.reason && desklibResult.reason.message },
      gcs: gcsResult.status === 'fulfilled' ? gcsResult.value : { status: 'error', error: gcsResult.reason && gcsResult.reason.message },
    }
  });
}
app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// ---- Static files ----
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '..', 'dist')));

// ---- Routes ----
// auth.js sudah define path lengkapnya sendiri (/auth/*, /api/me)
app.use(authRoutes);
app.use('/api', detectRoutes);   // -> /api/detect
app.use('/api', supportRoutes);  // -> /api/support
// admin.js TIDAK diberi prefix '/api' di sini — license-routes.js di
// dalamnya sudah pakai path lengkap sendiri ('/api/license/...',
// '/api/admin/...'). Lihat catatan di routes/admin.js.
app.use(adminRoutes);

// ---- 404 & error handler (WAJIB paling akhir) ----
app.use(notFoundHandler);
app.use(errorHandler);

// ---- Startup ----
app.listen(config.PORT, '0.0.0.0', () => {
  logger.info(`Creative Alibi Proxy Server running on port ${config.PORT}`);
  logger.info(`API Key Auth: ${config.API_KEY ? 'AKTIF' : 'Nonaktif (set API_KEY di .env untuk mengaktifkan)'}`);
  logger.info(`Rate Limit: ${config.RATE_LIMIT_MAX} req/min per IP`);
  logger.info(`Providers: desklib(local) gptzero(${!!process.env.GPTZERO_API_KEY}) zerogpt(${!!process.env.ZEROGPT_API_KEY}) watsonx(${!!process.env.WATSONX_API_KEY})`);
});

module.exports = app;
