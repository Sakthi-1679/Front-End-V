// POST /api/login  (routed here as /api/auth?action=login)
// POST /api/register  (routed here as /api/auth?action=register)
import bcrypt from 'bcryptjs';
import { getDB } from './_db.js';
import { signToken } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = req.query.action;

  if (action === 'login') {
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
  }

  if (action === 'register') {
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
  }

  return res.status(400).json({ error: 'Invalid action parameter. Expected "login" or "register".' });
}
