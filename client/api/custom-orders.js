// GET /api/custom-orders   POST /api/custom-orders (sends Brevo email → returns emailSent)
import { getDB } from './_db.js';
import { verifyToken } from './_auth.js';
import { notifyAdminNewCustomOrder } from './_email.js';

export default async function handler(req, res) {
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  const db = getDB();
  try {
    if (req.method === 'GET') {
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
    }

    if (req.method === 'POST') {
      // Always use the authenticated user's id — never trust client-supplied userId
      const userId = auth.user.id;
      const { description, requestedDate, requestedTime, contactName, contactPhone, images } = req.body || {};
      if (!description || !requestedDate || !requestedTime || !contactName || !contactPhone) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const [result] = await db.query(
        'INSERT INTO custom_orders (user_id, description, requested_date, requested_time, contact_name, contact_phone, images, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, description, requestedDate, requestedTime, contactName, contactPhone, JSON.stringify(images || []), 'PENDING']
      );

      const order = {
        id: result.insertId.toString(), userId: userId.toString(),
        description, requestedDate, requestedTime, contactName, contactPhone,
        images: images || [], status: 'PENDING', createdAt: new Date().toISOString(),
      };

      // Fetch user info for the email
      const [users] = await db.query('SELECT name, phone FROM users WHERE id = ?', [userId]);
      const user = users[0] || null;

      // Send Brevo notification to admin — this is what sets emailSent
      const { sent: emailSent } = await notifyAdminNewCustomOrder(order, user);
      order.emailSent = emailSent;

      return res.status(201).json(order);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Custom orders error:', err);
    res.status(500).json({ error: err.message });
  }
}
