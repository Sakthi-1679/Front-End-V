// routes/customOrders.js
const express = require('express');
const { read, write, uid } = require('../db');
const { authenticate, requireAdmin } = require('./middleware');
const { notifyAdminNewCustomOrder } = require('../email');

const router = express.Router();

// GET /api/custom-orders
router.get('/', authenticate, (req, res) => {
  const orders = read('customOrders');
  if (req.user.role !== 'ADMIN') {
    return res.json(orders.filter(o => o.userId === req.user.id));
  }
  res.json(orders);
});

// POST /api/custom-orders
router.post('/', authenticate, async (req, res) => {
  const { description, requestedDate, requestedTime, contactName, contactPhone, images } = req.body;
  // Always use the authenticated user's id — never trust client-supplied userId
  const userId = req.user.id;
  if (!description || !requestedDate || !requestedTime || !contactName || !contactPhone) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const now      = new Date();
  const deadline = new Date(requestedDate + 'T' + requestedTime);

  const order = {
    id: uid(),
    userId,
    description,
    requestedDate,
    requestedTime,
    contactName,
    contactPhone,
    images: images || [],
    status: 'PENDING',
    createdAt: now.toISOString(),
    deadlineAt: deadline.toISOString(),
  };

  // Send Brevo email to admin and record result
  const users = read('users');
  const user  = users.find(u => u.id === userId);
  const { sent: emailSent } = await notifyAdminNewCustomOrder(order, user);
  order.emailSent = emailSent;

  const orders = read('customOrders');
  orders.push(order);
  write('customOrders', orders);

  res.status(201).json(order);
});

// PUT /api/custom-orders/:id/status
router.put('/:id/status', authenticate, requireAdmin, (req, res) => {
  const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
  if (!VALID_STATUSES.includes(req.body.status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  const orders = read('customOrders');
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Custom order not found' });
  orders[idx].status = req.body.status;
  write('customOrders', orders);
  res.json(orders[idx]);
});

// DELETE /api/custom-orders/:id
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const orders = read('customOrders');
  const filtered = orders.filter(o => o.id !== req.params.id);
  if (filtered.length === orders.length) return res.status(404).json({ error: 'Custom order not found' });
  write('customOrders', filtered);
  res.json({ ok: true });
});

module.exports = router;
