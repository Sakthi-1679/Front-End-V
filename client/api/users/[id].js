// GET /api/users/:id
import { getDB } from '../_db.js';
import { verifyToken } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  try {
    const db = getDB();
    const [rows] = await db.query(
      'SELECT id, name, email, phone, city, area, role FROM users WHERE id = ?',
      [req.query.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const u = rows[0];
    u.id = u.id.toString();
    res.json(u);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: err.message });
  }
}
