// server/index.js – Express API server for Railway deployment.
// Implements the same routes as the Vercel serverless functions in client/api/.
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as Brevo from '@getbrevo/brevo';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── DB pool ───────────────────────────────────────────────────────────────────
let _pool = null;
function getDB() {
  if (_pool) return _pool;
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vkm_flower_shop',
    waitForConnections: true,
    connectionLimit: process.env.DB_POOL_LIMIT ? Number(process.env.DB_POOL_LIMIT) : 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };
  if (
    process.env.DB_SSL === 'true' ||
    (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com'))
  ) {
    config.ssl = { rejectUnauthorized: false };
  }
  _pool = mysql.createPool(config);
  return _pool;
}

// ── Auth helpers ──────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'vkm_dev_secret';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return { error: 'Unauthorized', status: 401 };
  try {
    const user = jwt.verify(auth.slice(7), JWT_SECRET);
    return { user };
  } catch {
    return { error: 'Invalid token', status: 401 };
  }
}

// ── Email helpers ─────────────────────────────────────────────────────────────
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const ADMIN_EMAIL   = process.env.ADMIN_EMAIL;

async function checkBrevoConnection() {
  if (!BREVO_API_KEY) return { ok: false, error: 'BREVO_API_KEY is not configured' };
  try {
    const accountApi = new Brevo.AccountApi();
    accountApi.authentications['api-key'].apiKey = BREVO_API_KEY;
    const result = await accountApi.getAccount();
    return { ok: true, account: result.body };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

async function sendAdminAlert({ subject, htmlContent }) {
  if (!BREVO_API_KEY) {
    console.warn('[email] BREVO_API_KEY not set – skipping email');
    return { sent: false, error: 'BREVO_API_KEY not configured' };
  }
  if (!ADMIN_EMAIL) {
    console.warn('[email] ADMIN_EMAIL not set – skipping email');
    return { sent: false, error: 'ADMIN_EMAIL not configured' };
  }
  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.subject     = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.sender      = { name: 'VKM Flower Shop', email: ADMIN_EMAIL };
  sendSmtpEmail.to          = [{ email: ADMIN_EMAIL, name: 'VKM Admin' }];
  try {
    const transacApi = new Brevo.TransactionalEmailsApi();
    transacApi.authentications['api-key'].apiKey = BREVO_API_KEY;
    const result = await transacApi.sendTransacEmail(sendSmtpEmail);
    console.log('[email] Sent OK – messageId:', result.body?.messageId);
    return { sent: true };
  } catch (err) {
    console.error('[email] Send failed:', err.message || err);
    return { sent: false, error: err.message || String(err) };
  }
}

async function notifyAdminNewOrder(order, user) {
  const subject = `🌸 New Order #${order.id} – ${order.productTitle}`;
  const htmlContent = `
    <h2>New Order Received</h2>
    <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;">
      <tr><td><b>Order ID</b></td><td>${order.id}</td></tr>
      <tr><td><b>Bill ID</b></td><td>${order.billId || '—'}</td></tr>
      <tr><td><b>Product</b></td><td>${order.productTitle}</td></tr>
      <tr><td><b>Quantity</b></td><td>${order.quantity}</td></tr>
      <tr><td><b>Total</b></td><td>₹${order.totalPrice}</td></tr>
      <tr><td><b>Customer</b></td><td>${user ? user.name : 'Unknown'}</td></tr>
      <tr><td><b>Phone</b></td><td>${user ? user.phone : '—'}</td></tr>
      <tr><td><b>Notes</b></td><td>${order.description || '—'}</td></tr>
      <tr><td><b>Placed At</b></td><td>${order.createdAt}</td></tr>
    </table>
    <p>Please confirm payment via WhatsApp or call.</p>
  `;
  return sendAdminAlert({ subject, htmlContent });
}

async function notifyAdminNewCustomOrder(order, user) {
  const subject = `🎨 New Custom Order #${order.id} – ${order.contactName}`;
  const htmlContent = `
    <h2>New Custom Order Request</h2>
    <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;">
      <tr><td><b>Order ID</b></td><td>${order.id}</td></tr>
      <tr><td><b>Contact Name</b></td><td>${order.contactName}</td></tr>
      <tr><td><b>Contact Phone</b></td><td>${order.contactPhone}</td></tr>
      <tr><td><b>Requested Date</b></td><td>${order.requestedDate}</td></tr>
      <tr><td><b>Requested Time</b></td><td>${order.requestedTime}</td></tr>
      <tr><td><b>Description</b></td><td>${order.description}</td></tr>
      <tr><td><b>Images</b></td><td>${order.images.length} attached</td></tr>
      <tr><td><b>Placed At</b></td><td>${order.createdAt}</td></tr>
    </table>
    <p>Please call the customer within 2 hours to confirm.</p>
  `;
  return sendAdminAlert({ subject, htmlContent });
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  try {
    const db = getDB();
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    const { password: _, ...safe } = user;
    safe.id = safe.id.toString();
    const token = signToken({ id: safe.id, role: safe.role });
    return res.json({ user: safe, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/register
app.post('/api/register', async (req, res) => {
  const { name, email, password, phone, city, area } = req.body || {};
  if (!name || !email || !password || !phone || !city || !area) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const db = getDB();
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, city, area, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashed, phone, city, area, 'USER']
    );
    const user = { id: result.insertId.toString(), name, email, phone, city, area, role: 'USER' };
    const token = signToken({ id: user.id, role: user.role });
    return res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered' });
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /api/orders   POST /api/orders
app.get('/api/orders', async (req, res) => {
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  try {
    const db = getDB();
    const [rows] = await db.query(`
      SELECT o.*, u.name as userName, u.phone as userPhone,
             p.title as productTitle, p.images as productImages
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC
    `);
    return res.json(rows.map(r => {
      let img = 'https://via.placeholder.com/150';
      try {
        const imgs = typeof r.productImages === 'string' ? JSON.parse(r.productImages) : (r.productImages || []);
        if (Array.isArray(imgs) && imgs.length > 0) img = imgs[0];
      } catch (e) {
        console.warn('Failed to parse product images for order', r.id, e.message);
      }
      return {
        id: r.id.toString(), billId: r.bill_id || `ORD-${r.id}`,
        userId: r.user_id.toString(), productId: r.product_id ? r.product_id.toString() : '0',
        productTitle: r.productTitle || 'Deleted Product', productImage: img,
        quantity: r.quantity, totalPrice: r.total_price, description: r.description,
        status: r.status, createdAt: r.created_at, expectedDeliveryAt: r.expected_delivery_at || r.created_at,
      };
    }));
  } catch (err) {
    console.error('Orders error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  const userId = auth.user.id;
  const { productId, quantity, description } = req.body || {};
  if (!productId || !quantity) return res.status(400).json({ error: 'productId and quantity are required' });
  try {
    const db = getDB();
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    if (products.length === 0) return res.status(404).json({ error: 'Product not found' });
    const product   = products[0];
    const totalPrice = product.price * quantity;

    const [seqRows] = await db.query(
      'SELECT MAX(daily_sequence) as max_seq FROM orders WHERE DATE(created_at) = CURDATE()'
    );
    const nextSeq = (seqRows[0].max_seq || 0) + 1;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const billId  = `VKM-${dateStr}-${String(nextSeq).padStart(3, '0')}`;

    const [result] = await db.query(
      'INSERT INTO orders (bill_id, daily_sequence, user_id, product_id, quantity, total_price, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [billId, nextSeq, userId, productId, quantity, totalPrice, description || '', 'PENDING']
    );
    const order = {
      id: result.insertId.toString(), billId, userId: userId.toString(),
      productId: productId.toString(), productTitle: product.title,
      quantity: Number(quantity), totalPrice, description: description || '',
      status: 'PENDING', createdAt: new Date().toISOString(),
    };

    const [users] = await db.query('SELECT name, phone FROM users WHERE id = ?', [userId]);
    const user = users[0] || null;

    const { sent: emailSent } = await notifyAdminNewOrder(order, user);
    order.emailSent = emailSent;
    return res.status(201).json(order);
  } catch (err) {
    console.error('Orders error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/orders/:id
app.delete('/api/orders/:id', async (req, res) => {
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (auth.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  try {
    const db = getDB();
    await db.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete order error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/status
app.put('/api/orders/:id/status', async (req, res) => {
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (auth.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
  const { status } = req.body || {};
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  try {
    const db = getDB();
    let sql = 'UPDATE orders SET status = ?';
    const params = [status];
    if (status === 'CONFIRMED') sql += ', expected_delivery_at = DATE_ADD(NOW(), INTERVAL 24 HOUR)';
    sql += ' WHERE id = ?';
    params.push(req.params.id);
    await db.query(sql, params);
    return res.json({ success: true });
  } catch (err) {
    console.error('Update order status error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/products   POST /api/products
app.get('/api/products', async (req, res) => {
  try {
    const db = getDB();
    const [rows] = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    return res.json(rows.map(p => ({
      ...p,
      id: p.id.toString(),
      images: Array.isArray(p.images) ? p.images : (p.images ? JSON.parse(p.images) : []),
      durationHours: p.duration_hours,
    })));
  } catch (err) {
    console.error('Products error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (auth.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  const { title, description, price, durationHours, images } = req.body || {};
  if (!title || price == null) return res.status(400).json({ error: 'title and price are required' });
  try {
    const db = getDB();
    const [result] = await db.query(
      'INSERT INTO products (title, description, price, duration_hours, images) VALUES (?, ?, ?, ?, ?)',
      [title, description || '', price, durationHours || 24, JSON.stringify(images || [])]
    );
    return res.status(201).json({ id: result.insertId.toString(), title, description, price, durationHours, images });
  } catch (err) {
    console.error('Products error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id   DELETE /api/products/:id
app.put('/api/products/:id', async (req, res) => {
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (auth.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  const { title, description, price, durationHours, images } = req.body || {};
  try {
    const db = getDB();
    await db.query(
      'UPDATE products SET title=?, description=?, price=?, duration_hours=?, images=? WHERE id=?',
      [title, description, price, durationHours, JSON.stringify(images || []), req.params.id]
    );
    return res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('Product update error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (auth.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  try {
    const db = getDB();
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Product update error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/custom-orders   POST /api/custom-orders
app.get('/api/custom-orders', async (req, res) => {
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  try {
    const db = getDB();
    const [rows] = await db.query(`
      SELECT c.*, u.name as userName
      FROM custom_orders c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `);
    return res.json(rows.map(r => ({
      id: r.id.toString(), userId: r.user_id.toString(),
      description: r.description, requestedDate: r.requested_date,
      requestedTime: r.requested_time, contactName: r.contact_name,
      contactPhone: r.contact_phone,
      images: typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || []),
      status: r.status, createdAt: r.created_at, deadlineAt: r.deadline_at || r.created_at,
    })));
  } catch (err) {
    console.error('Custom orders error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/custom-orders', async (req, res) => {
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  const userId = auth.user.id;
  const { description, requestedDate, requestedTime, contactName, contactPhone, images } = req.body || {};
  if (!description || !requestedDate || !requestedTime || !contactName || !contactPhone) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const db = getDB();
    const [result] = await db.query(
      'INSERT INTO custom_orders (user_id, description, requested_date, requested_time, contact_name, contact_phone, images, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, description, requestedDate, requestedTime, contactName, contactPhone, JSON.stringify(images || []), 'PENDING']
    );
    const order = {
      id: result.insertId.toString(), userId: userId.toString(),
      description, requestedDate, requestedTime, contactName, contactPhone,
      images: images || [], status: 'PENDING', createdAt: new Date().toISOString(),
    };

    const [users] = await db.query('SELECT name, phone FROM users WHERE id = ?', [userId]);
    const user = users[0] || null;

    const { sent: emailSent } = await notifyAdminNewCustomOrder(order, user);
    order.emailSent = emailSent;
    return res.status(201).json(order);
  } catch (err) {
    console.error('Custom orders error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/custom-orders/:id
app.delete('/api/custom-orders/:id', async (req, res) => {
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (auth.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  try {
    const db = getDB();
    await db.query('DELETE FROM custom_orders WHERE id = ?', [req.params.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete custom order error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/custom-orders/:id/status
app.put('/api/custom-orders/:id/status', async (req, res) => {
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (auth.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
  const { status } = req.body || {};
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  try {
    const db = getDB();
    let sql = 'UPDATE custom_orders SET status = ?';
    const params = [status];
    if (status === 'CONFIRMED') sql += ', deadline_at = DATE_ADD(NOW(), INTERVAL 48 HOUR)';
    sql += ' WHERE id = ?';
    params.push(req.params.id);
    await db.query(sql, params);
    return res.json({ success: true });
  } catch (err) {
    console.error('Update custom order status error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/settings/contact   PUT /api/settings/contact
app.get('/api/settings/contact', async (req, res) => {
  try {
    const db = getDB();
    const [rows] = await db.query("SELECT value FROM settings WHERE key_name = 'admin_phone'");
    return res.json({ phone: rows.length ? rows[0].value : '9999999999' });
  } catch (err) {
    console.error('Settings error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings/contact', async (req, res) => {
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (auth.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  const { phone } = req.body || {};
  if (!phone || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'A valid 10-digit phone number is required' });
  }
  try {
    const db = getDB();
    await db.query(
      "INSERT INTO settings (key_name, value) VALUES ('admin_phone', ?) ON DUPLICATE KEY UPDATE value = ?",
      [phone, phone]
    );
    return res.json({ success: true, phone });
  } catch (err) {
    console.error('Settings error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id
app.get('/api/users/:id', async (req, res) => {
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  try {
    const db = getDB();
    const [rows] = await db.query(
      'SELECT id, name, email, phone, city, area, role FROM users WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const u = rows[0];
    u.id = u.id.toString();
    return res.json(u);
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/health/brevo
app.get('/api/health/brevo', async (_req, res) => {
  const result = await checkBrevoConnection();
  return res.status(result.ok ? 200 : 503).json(result);
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`VKM API server running on port ${PORT}`);
});
