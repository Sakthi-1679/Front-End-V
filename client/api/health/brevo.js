// GET /api/health/brevo – verify Brevo API key is reachable
import { checkBrevoConnection } from '../_email.js';

export default async function handler(_req, res) {
  const result = await checkBrevoConnection();
  res.status(result.ok ? 200 : 503).json(result);
}
