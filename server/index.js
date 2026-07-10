const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
const CORS_ORIGINS = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'https://localhost:3000', 'https://appsforoffice.microsoft.com'];

app.use(cors({
  origin: CORS_ORIGINS,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Healthcheck (tanpa auth — biar frontend/Word bisa cek koneksi)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    auth: !!process.env.PROXY_USERNAME,
    providers: {
      gptzero: !!process.env.GPTZERO_API_KEY,
      zerogpt: !!process.env.ZEROGPT_API_KEY,
      watsonx: !!process.env.WATSONX_API_KEY,
      desklib: true
    }
  });
});

// ================= Basic Auth Middleware =================
const PROXY_USERNAME = process.env.PROXY_USERNAME;
const PROXY_PASSWORD = process.env.PROXY_PASSWORD;
const authEnabled = !!(PROXY_USERNAME && PROXY_PASSWORD);

if (authEnabled) {
  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.set('WWW-Authenticate', 'Basic realm="Creative Alibi Proxy"');
      return res.status(401).json({ error: 'Harap login terlebih dahulu.' });
    }

    const base64 = authHeader.split(' ')[1];
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');

    if (username !== PROXY_USERNAME || password !== PROXY_PASSWORD) {
      res.set('WWW-Authenticate', 'Basic realm="Creative Alibi Proxy"');
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    next();
  });
}

// Provider handlers
const gptzeroHandler = require('./providers/gptzero');
const zerogptHandler = require('./providers/zerogpt');
const watsonxHandler = require('./providers/watsonx');
const desklibHandler = require('./providers/desklib');

// Main detection endpoint
app.post('/api/detect', async (req, res) => {
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
    } else {
      return res.status(400).json({ error: `Provider "${provider}" tidak didukung.` });
    }

    return res.json(result);
  } catch (error) {
    console.error(`[Error] ${provider}:`, error.message);
    // Send safe error message to client
    return res.status(500).json({ error: 'Gagal menghubungi layanan API deteksi pihak ketiga.', details: error.message });
  }
});



app.listen(PORT, () => {
  console.log(`Creative Alibi Proxy Server running on port ${PORT}`);
  console.log(`Basic Auth: ${authEnabled ? '✅ AKTIF (username: ' + PROXY_USERNAME + ')' : '❌ Nonaktif (kosongkan untuk local dev)'}`);
  console.log(`IBM watsonx.ai configured: ${!!process.env.WATSONX_API_KEY}`);
  console.log(`GPTZero API Key configured: ${!!process.env.GPTZERO_API_KEY}`);
  console.log(`ZeroGPT API Key configured: ${!!process.env.ZEROGPT_API_KEY}`);
  console.log(`Desklib local detector: ${!!process.env.DESKLIB_URL ? 'Custom URL: ' + process.env.DESKLIB_URL : 'http://127.0.0.1:5000 (default)'}`);
});
