// GET /api/products  POST /api/products
import { getDB } from './_db.js';
import { verifyToken } from './_auth.js';

const DEFAULT_DURATION_HOURS = 24;

export default async function handler(req, res) {
  const db = getDB();
  try {
    if (req.method === 'GET') {
      const [rows] = await db.query('SELECT * FROM products ORDER BY created_at DESC');
      return res.json(rows.map(p => ({
        ...p,
        id: p.id.toString(),
        images: Array.isArray(p.images) ? p.images : (p.images ? JSON.parse(p.images) : []),
        durationHours: p.duration_hours,
      })));
    }

    if (req.method === 'POST') {
      const auth = verifyToken(req);
      if (auth.error) return res.status(auth.status).json({ error: auth.error });
      if (auth.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
      const { title, description, price, durationHours, images } = req.body || {};
      if (!title || price == null) return res.status(400).json({ error: 'title and price are required' });
      const [result] = await db.query(
        'INSERT INTO products (title, description, price, duration_hours, images) VALUES (?, ?, ?, ?, ?)',
        [title, description || '', price, durationHours || DEFAULT_DURATION_HOURS, JSON.stringify(images || [])]
      );
      return res.status(201).json({ id: result.insertId.toString(), title, description, price, durationHours, images });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Products error:', err);
    res.status(500).json({ error: err.message });
  }
}
