// src/index.js – VKM Flower Shop API server
require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const authRoutes         = require('./routes/auth');
const userRoutes         = require('./routes/users');
const productRoutes      = require('./routes/products');
const orderRoutes        = require('./routes/orders');
const customOrderRoutes  = require('./routes/customOrders');
const settingsRoutes     = require('./routes/settings');
const { checkBrevoConnection } = require('./email');
const { authLimiter, apiLimiter } = require('./rateLimiter');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' })); // allow base64 image uploads

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', authLimiter, authRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/custom-orders', apiLimiter, customOrderRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);

// ── Brevo health check ───────────────────────────────────────────────────────
// GET /api/health/brevo
// Returns { ok: true, account: {...} } when the Brevo API key is valid and
// reachable, or { ok: false, error: "..." } otherwise.
app.get('/api/health/brevo', async (_req, res) => {
  const result = await checkBrevoConnection();
  res.status(result.ok ? 200 : 503).json(result);
});

// ── General health ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] VKM API listening on http://localhost:${PORT}`);
  // Check Brevo on startup and log result
  checkBrevoConnection().then(result => {
    if (result.ok) {
      console.log(`[email]  Brevo connection OK – account: ${result.account?.email || '(unknown)'}`);
    } else {
      console.warn(`[email]  Brevo connection FAILED: ${result.error}`);
    }
  });
});
