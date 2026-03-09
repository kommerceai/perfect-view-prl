require('dotenv').config();
const express = require('express');
const cors = require('cors');

const verifyWebhookSecret = require('./middleware/auth');
const leadsRouter = require('./routes/leads');
const setupRouter = require('./routes/setup');
const reviewRouter = require('./routes/review');

const app = express();
const PORT = process.env.PORT || 3001;

/* ── CORS ──────────────────────────────── */
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN || 'https://perfectviewprl.com',
  'https://perfect-view-prl.vercel.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Webhook-Secret'],
}));

app.use(express.json());

/* ── HEALTH CHECK ──────────────────────── */
app.get('/', (_req, res) => {
  res.json({
    service: 'Perfect View PRL — GHL Backend',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/* ── ROUTES ────────────────────────────── */
app.use('/api/leads', verifyWebhookSecret, leadsRouter);
app.use('/api/setup', verifyWebhookSecret, setupRouter);
app.use('/api/review-request', verifyWebhookSecret, reviewRouter);

/* ── ERROR HANDLER ─────────────────────── */
app.use((err, _req, res, _next) => {
  console.error('[SERVER]', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

/* ── START ─────────────────────────────── */
app.listen(PORT, () => {
  console.log(`[SERVER] Perfect View PRL backend running on port ${PORT}`);
  console.log(`[SERVER] Allowed origins: ${allowedOrigins.join(', ')}`);

  if (!process.env.GHL_API_KEY || process.env.GHL_API_KEY === 'your_ghl_api_key_here') {
    console.warn('[SERVER] ⚠  GHL_API_KEY not set — API calls will fail');
  }
  if (!process.env.GHL_LOCATION_ID) {
    console.warn('[SERVER] ⚠  GHL_LOCATION_ID not set — API calls will fail');
  }
});

module.exports = app;
