// DELETE /api/custom-orders/:id
import { getDB } from '../_db.js';
import { verifyToken } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (auth.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

  try {
    const db = getDB();
    await db.query('DELETE FROM custom_orders WHERE id = ?', [req.query.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete custom order error:', err);
    res.status(500).json({ error: err.message });
  }
}
