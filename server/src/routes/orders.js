// routes/orders.js
const express = require('express');
const { read, write, uid } = require('../db');
const { authenticate, requireAdmin } = require('./middleware');
const { notifyAdminNewOrder } = require('../email');

const router = express.Router();

function buildBillId(orders) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const todayOrders = orders.filter(o => o.createdAt.startsWith(new Date().toISOString().slice(0, 10)));
  const seq = String(todayOrders.length + 1).padStart(3, '0');
  return `VKM-${today}-${seq}`;
}

// GET /api/orders
router.get('/', authenticate, (req, res) => {
  const orders = read('orders');
  // Non-admins only see their own orders
  if (req.user.role !== 'ADMIN') {
    return res.json(orders.filter(o => o.userId === req.user.id));
  }
  res.json(orders);
});

// POST /api/orders
router.post('/', authenticate, async (req, res) => {
  const { productId, quantity, description } = req.body;
  // Always use the authenticated user's id — never trust client-supplied userId
  const userId = req.user.id;
  if (!productId || !quantity) {
    return res.status(400).json({ error: 'productId and quantity are required' });
  }

  const products = read('products');
  const product  = products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const orders = read('orders');
  const now    = new Date();
  const expectedDelivery = new Date(now.getTime() + product.durationHours * 3600 * 1000);

  const order = {
    id: uid(),
    billId: buildBillId(orders),
    userId,
    productId,
    productTitle: product.title,
    productImage: product.images[0] || '',
    quantity: Number(quantity),
    totalPrice: product.price * Number(quantity),
    description: description || '',
    status: 'PENDING',
    createdAt: now.toISOString(),
    expectedDeliveryAt: expectedDelivery.toISOString(),
  };

  // Send Brevo email to admin and record result
  const users = read('users');
  const user  = users.find(u => u.id === userId);
  const { sent: emailSent } = await notifyAdminNewOrder(order, user);
  order.emailSent = emailSent;

  orders.push(order);
  write('orders', orders);

  res.status(201).json(order);
});

// PUT /api/orders/:id/status
router.put('/:id/status', authenticate, requireAdmin, (req, res) => {
  const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
  if (!VALID_STATUSES.includes(req.body.status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  const orders = read('orders');
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });
  orders[idx].status = req.body.status;
  write('orders', orders);
  res.json(orders[idx]);
});

// DELETE /api/orders/:id
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const orders = read('orders');
  const filtered = orders.filter(o => o.id !== req.params.id);
  if (filtered.length === orders.length) return res.status(404).json({ error: 'Order not found' });
  write('orders', filtered);
  res.json({ ok: true });
});

module.exports = router;
