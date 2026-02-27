// PUT /api/orders/:id/status
import { getDB } from '../../_db.js';
import { verifyToken } from '../../_auth.js';

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });
  if (auth.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

  const { status } = req.body || {};
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  try {
    const db = getDB();
    let sql = 'UPDATE orders SET status = ?';
    const params = [status];
    if (status === 'CONFIRMED') {
      sql += ', expected_delivery_at = DATE_ADD(NOW(), INTERVAL 24 HOUR)';
    }
    sql += ' WHERE id = ?';
    params.push(req.query.id);
    await db.query(sql, params);
    res.json({ success: true });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: err.message });
  }
}
