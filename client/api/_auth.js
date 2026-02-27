// api/_auth.js – JWT authentication helper for Vercel serverless functions
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vkm_dev_secret';

/**
 * Verify the Bearer token in Authorization header.
 * @returns {{ user: object }|{ error: string, status: number }}
 */
export function verifyToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }
  try {
    const user = jwt.verify(auth.slice(7), JWT_SECRET);
    return { user };
  } catch {
    return { error: 'Invalid token', status: 401 };
  }
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
