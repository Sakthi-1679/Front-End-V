// PUT /api/products/:id   DELETE /api/products/:id
import { getDB } from '../_db.js';
import { verifyToken } from '../_auth.js';

export default async function handler(req, res) {
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (auth.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

  const { id } = req.query;
  const db = getDB();
  try {
    if (req.method === 'PUT') {
      const { title, description, price, durationHours, images } = req.body || {};
      await db.query(
        'UPDATE products SET title=?, description=?, price=?, duration_hours=?, images=? WHERE id=?',
        [title, description, price, durationHours, JSON.stringify(images || []), id]
      );
      return res.json({ success: true, id });
    }

    if (req.method === 'DELETE') {
      await db.query('DELETE FROM products WHERE id = ?', [id]);
      return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Product update error:', err);
    res.status(500).json({ error: err.message });
  }
}
