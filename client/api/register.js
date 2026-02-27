// POST /api/register
import bcrypt from 'bcryptjs';
import { getDB } from './_db.js';
import { signToken } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
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
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered' });
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}
