// routes/users.js
const express = require('express');
const { read } = require('../db');
const { authenticate } = require('./middleware');

const router = express.Router();

// GET /api/users/:id
router.get('/:id', authenticate, (req, res) => {
  const users = read('users');
  const user  = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safe } = user;
  res.json(safe);
});

module.exports = router;
