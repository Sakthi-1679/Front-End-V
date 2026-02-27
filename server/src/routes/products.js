// routes/products.js
const express = require('express');
const { read, write, uid } = require('../db');
const { authenticate, requireAdmin } = require('./middleware');

const router = express.Router();

// GET /api/products
router.get('/', (req, res) => {
  res.json(read('products'));
});

// POST /api/products
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { title, description, price, durationHours, images } = req.body;
  if (!title || price == null) return res.status(400).json({ error: 'title and price are required' });
  const product = { id: uid(), title, description: description || '', price: Number(price), durationHours: Number(durationHours) || 1, images: images || [] };
  const products = read('products');
  products.push(product);
  write('products', products);
  res.status(201).json(product);
});

// PUT /api/products/:id
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const products = read('products');
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  const { title, description, price, durationHours, images } = req.body;
  const allowed = {};
  if (title        !== undefined) allowed.title        = title;
  if (description  !== undefined) allowed.description  = description;
  if (price        !== undefined) allowed.price        = Number(price);
  if (durationHours!== undefined) allowed.durationHours= Number(durationHours);
  if (images       !== undefined) allowed.images       = images;
  products[idx] = { ...products[idx], ...allowed };
  write('products', products);
  res.json(products[idx]);
});

// DELETE /api/products/:id
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const products = read('products');
  const filtered = products.filter(p => p.id !== req.params.id);
  if (filtered.length === products.length) return res.status(404).json({ error: 'Product not found' });
  write('products', filtered);
  res.json({ ok: true });
});

module.exports = router;
