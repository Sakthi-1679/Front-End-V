// routes/auth.js
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { read, write, uid } = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vkm_dev_secret';

// POST /api/register
router.post('/register', async (req, res) => {
  const { name, email, password, phone, city, area } = req.body;
  if (!name || !email || !password || !phone || !city || !area) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const users = read('users');
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: uid(), name, email, password: hashed, phone, city, area, role: 'USER' };
  users.push(user);
  write('users', users);
  const { password: _, ...safe } = user;
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ user: safe, token });
});

// POST /api/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const users = read('users');
  const user  = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const { password: _, ...safe } = user;
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: safe, token });
});

module.exports = router;
