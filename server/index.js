const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

// ── CORS ────────────────────────────────────────────────
const CORS_ORIGINS = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'https://localhost:3000', 'https://appsforoffice.microsoft.com'];

app.use(cors({
  origin: CORS_ORIGINS,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(express.json());
// ── Google OAuth Login (opsional) ────────────────────────
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const oauthEnabled = !!(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.SESSION_SECRET
);

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-secret-jangan-dipakai-di-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, maxAge: 1000 * 60 * 60 * 24 * 7 }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

if (oauthEnabled) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  }, (accessToken, refreshToken, profile, done) => {
    const user = {
      id: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      photo: profile.photos[0].value
    };
    return done(null, user);
  }));

  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => res.redirect('/')
  );
} else {
  console.log('⚠️  Google OAuth belum dikonfigurasi (GOOGLE_CLIENT_ID/SECRET/SESSION_SECRET kosong) — login Google dinonaktifkan sementara.');
  app.get('/auth/google', (req, res) => {
    res.status(503).json({ error: 'Login Google belum diaktifkan di server ini.' });
  });
}

app.get('/auth/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});

app.get('/api/me', (req, res) => {
  res.json({ loggedIn: !!req.user, user: req.user || null });
});
// ── API Key Auth ────────────────────────────────────────
const API_KEY = process.env.API_KEY || '';
const apiKeyEnabled = !!API_KEY;

// ── Rate Limiting ───────────────────────────────────────
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: parseInt(process.env.RATE_LIMIT_MAX || '20', 10),
  message: { error: 'Terlalu banyak request. Coba lagi dalam 1 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to /api/ routes
app.use('/api/', limiter);

// ── Healthcheck (tanpa auth) ────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    auth: apiKeyEnabled,
    providers: {
      gptzero: !!process.env.GPTZERO_API_KEY,
      zerogpt: !!process.env.ZEROGPT_API_KEY,
      watsonx: !!process.env.WATSONX_API_KEY,
      desklib: true,
      hix: !!process.env.HIX_EMAIL
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    auth: apiKeyEnabled,
    providers: {
      gptzero: !!process.env.GPTZERO_API_KEY,
      zerogpt: !!process.env.ZEROGPT_API_KEY,
      watsonx: !!process.env.WATSONX_API_KEY,
      desklib: true
    }
  });
});

// ── API Key Middleware ───────────────────────────────────
function apiKeyAuth(req, res, next) {
  if (!apiKeyEnabled) return next(); // Skip jika API Key tidak diset

  const key = req.headers['x-api-key'];
  if (!key) {
    return res.status(401).json({ error: 'API Key diperlukan. Kirim header: X-API-Key' });
  }
  if (key !== API_KEY) {
    return res.status(403).json({ error: 'API Key tidak valid.' });
  }
  next();
}

// ── Static Files ────────────────────────────────────────
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// ── Provider handlers ───────────────────────────────────
const gptzeroHandler = require('./providers/gptzero');
const zerogptHandler = require('./providers/zerogpt');
const watsonxHandler = require('./providers/watsonx');
const desklibHandler = require('./providers/desklib');
const hixHandler = require('./providers/hix');

// ── Main detection endpoint ─────────────────────────────
app.post('/api/detect', apiKeyAuth, async (req, res) => {
  const { provider, text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Parameter "text" wajib dan harus berupa string.' });
  }

  if (text.trim().length < 50) {
    return res.status(400).json({ error: 'Teks terlalu pendek (minimum 50 karakter).' });
  }

  try {
    let result;
    if (provider === 'gptzero') {
      result = await gptzeroHandler(text);
    } else if (provider === 'zerogpt') {
      result = await zerogptHandler(text);
    } else if (provider === 'watsonx') {
      result = await watsonxHandler(text);
    } else if (provider === 'desklib') {
      result = await desklibHandler(text);
    } else if (provider === 'hix') {
      result = await hixHandler(text);
    } else {
      return res.status(400).json({ error: `Provider "${provider}" tidak didukung.` });
    }

    return res.json(result);
  } catch (error) {
    console.error(`[Error] ${provider}:`, error.message);
    return res.status(500).json({ error: 'Gagal menghubungi layanan API deteksi pihak ketiga.', details: error.message });
  }
});

// ── Support Chat ─────────────────────────────────────────
const supportChat = require('./support');

app.post('/api/support', async (req, res) => {
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
    console.error('[Support] Error:', error.message);
    return res.status(500).json({ error: 'Gagal memproses chat. Coba lagi.', details: error.message });
  }
});

// ── Startup ─────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Creative Alibi Proxy Server running on port ${PORT}`);
  console.log(`API Key Auth: ${apiKeyEnabled ? '✅ AKTIF' : '❌ Nonaktif (set API_KEY di .env untuk mengaktifkan)'}`);
  console.log(`Rate Limit: ${process.env.RATE_LIMIT_MAX || '20'} req/min per IP`);
  console.log(`Providers: desklib(local) gptzero(${!!process.env.GPTZERO_API_KEY}) zerogpt(${!!process.env.ZEROGPT_API_KEY}) watsonx(${!!process.env.WATSONX_API_KEY})`);
});
