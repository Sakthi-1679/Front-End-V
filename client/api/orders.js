// GET /api/orders   POST /api/orders (sends Brevo email → returns emailSent)
import { getDB } from './_db.js';
import { verifyToken } from './_auth.js';
import { notifyAdminNewOrder } from './_email.js';

const generateBillId = async (db) => {
  const [rows] = await db.query(
    'SELECT MAX(daily_sequence) as max_seq FROM orders WHERE DATE(created_at) = CURDATE()'
  );
  const nextSeq = (rows[0].max_seq || 0) + 1;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return { billId: `VKM-${dateStr}-${String(nextSeq).padStart(3, '0')}`, nextSeq };
};

export default async function handler(req, res) {
  const auth = verifyToken(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  const db = getDB();
  try {
    if (req.method === 'GET') {
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
    }

    if (req.method === 'POST') {
      // Always use the authenticated user's id — never trust client-supplied userId
      const userId = auth.user.id;
      const { productId, quantity, description } = req.body || {};
      if (!productId || !quantity) return res.status(400).json({ error: 'productId and quantity are required' });

      const [products] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
      if (products.length === 0) return res.status(404).json({ error: 'Product not found' });

      const product   = products[0];
      const totalPrice = product.price * quantity;
      const { billId, nextSeq } = await generateBillId(db);

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

      // Fetch user info for the email
      const [users] = await db.query('SELECT name, phone FROM users WHERE id = ?', [userId]);
      const user = users[0] || null;

      // Send Brevo notification to admin — this is what sets emailSent
      const { sent: emailSent } = await notifyAdminNewOrder(order, user);
      order.emailSent = emailSent;

      return res.status(201).json(order);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Orders error:', err);
    res.status(500).json({ error: err.message });
  }
}
