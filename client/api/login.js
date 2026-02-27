// POST /api/login
import bcrypt from 'bcryptjs';
import { read } from './_db.js';
import { signToken } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const users = read('users');
  const user  = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const { password: _, ...safe } = user;
  const token = signToken({ id: user.id, role: user.role });
  res.json({ user: safe, token });
}
