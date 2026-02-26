
/**
 * Vercel Serverless Function – Brevo (Sendinblue) email relay
 *
 * Required environment variables (set in Vercel project settings):
 *   BREVO_API_KEY        – your Brevo v3 API key
 *   BREVO_SENDER_EMAIL   – verified sender address in Brevo
 *   BREVO_SENDER_NAME    – (optional) sender display name, defaults to "VKM Flower Shop"
 */
export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, subject, htmlContent, textContent } = req.body || {};

  if (!to?.email || !subject || !htmlContent) {
    return res.status(400).json({ error: 'Missing required fields: to.email, subject, htmlContent' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'VKM Flower Shop';

  if (!apiKey || !senderEmail) {
    console.error('Brevo env vars not set (BREVO_API_KEY, BREVO_SENDER_EMAIL)');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to.email, name: to.name || to.email }],
        subject,
        htmlContent,
        textContent: textContent || '',
      }),
    });

    const data = await brevoRes.json();

    if (!brevoRes.ok) {
      console.error('Brevo API error:', data);
      return res.status(brevoRes.status).json({ error: data.message || 'Failed to send email' });
    }

    return res.status(200).json({ success: true, messageId: data.messageId });
  } catch (err) {
    console.error('send-email handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
