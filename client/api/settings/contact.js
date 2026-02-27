// GET /api/settings/contact   PUT /api/settings/contact
import { getDB } from '../_db.js';
import { verifyToken } from '../_auth.js';

export default async function handler(req, res) {
  const db = getDB();
  try {
    if (req.method === 'GET') {
      const [rows] = await db.query("SELECT value FROM settings WHERE key_name = 'admin_phone'");
      return res.json({ phone: rows.length ? rows[0].value : '9999999999' });
    }

    if (req.method === 'PUT') {
      const auth = verifyToken(req);
      if (auth.error) return res.status(auth.status).json({ error: auth.error });
      if (auth.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
      const { phone } = req.body || {};
      if (!phone || !/^\d{10}$/.test(phone)) {
        return res.status(400).json({ error: 'A valid 10-digit phone number is required' });
      }
      await db.query(
        "INSERT INTO settings (key_name, value) VALUES ('admin_phone', ?) ON DUPLICATE KEY UPDATE value = ?",
        [phone, phone]
      );
      return res.json({ success: true, phone });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Settings error:', err);
    res.status(500).json({ error: err.message });
  }
}
