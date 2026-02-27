// routes/settings.js
const express = require('express');
const { readOne, write } = require('../db');
const { authenticate, requireAdmin } = require('./middleware');

const router = express.Router();

// GET /api/settings/contact
router.get('/contact', (req, res) => {
  const settings = readOne('settings');
  res.json({ phone: settings.adminPhone || '9999999999' });
});

// PUT /api/settings/contact
router.put('/contact', authenticate, requireAdmin, (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'A valid 10-digit phone number is required' });
  }
  const settings = readOne('settings');
  settings.adminPhone = phone;
  write('settings', settings);
  res.json({ phone: settings.adminPhone });
});

module.exports = router;
