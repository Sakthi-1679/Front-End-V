// api/_email.js – Brevo email helper for Vercel serverless functions.
// process.env.BREVO_API_KEY is set via the Vercel dashboard environment variables.
import * as Brevo from '@getbrevo/brevo';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const ADMIN_EMAIL   = process.env.ADMIN_EMAIL || 'vkmflowerskpm@gmail.com';

/**
 * Verify the Brevo API key is reachable by fetching the account info.
 * @returns {{ ok: boolean, account?: object, error?: string }}
 */
export async function checkBrevoConnection() {
  if (!BREVO_API_KEY) {
    return { ok: false, error: 'BREVO_API_KEY is not configured' };
  }
  try {
    const accountApi = new Brevo.AccountApi();
    accountApi.authentications['api-key'].apiKey = BREVO_API_KEY;
    const result = await accountApi.getAccount();
    return { ok: true, account: result.body };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

/**
 * Send an HTML alert email to the admin inbox.
 * @returns {{ sent: boolean, error?: string }}
 */
async function sendAdminAlert({ subject, htmlContent }) {
  if (!BREVO_API_KEY) {
    console.warn('[email] BREVO_API_KEY not set – skipping email');
    return { sent: false, error: 'BREVO_API_KEY not configured' };
  }
  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.subject     = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.sender      = { name: 'VKM Flower Shop', email: ADMIN_EMAIL };
  sendSmtpEmail.to          = [{ email: ADMIN_EMAIL, name: 'VKM Admin' }];

  try {
    const transacApi = new Brevo.TransactionalEmailsApi();
    transacApi.authentications['api-key'].apiKey = BREVO_API_KEY;
    const result = await transacApi.sendTransacEmail(sendSmtpEmail);
    console.log('[email] Sent OK – messageId:', result.body?.messageId);
    return { sent: true };
  } catch (err) {
    console.error('[email] Send failed:', err.message || err);
    return { sent: false, error: err.message || String(err) };
  }
}

export async function notifyAdminNewOrder(order, user) {
  const subject = `🌸 New Order #${order.id} – ${order.productTitle}`;
  const htmlContent = `
    <h2>New Order Received</h2>
    <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;">
      <tr><td><b>Order ID</b></td><td>${order.id}</td></tr>
      <tr><td><b>Bill ID</b></td><td>${order.billId || '—'}</td></tr>
      <tr><td><b>Product</b></td><td>${order.productTitle}</td></tr>
      <tr><td><b>Quantity</b></td><td>${order.quantity}</td></tr>
      <tr><td><b>Total</b></td><td>₹${order.totalPrice}</td></tr>
      <tr><td><b>Customer</b></td><td>${user ? user.name : 'Unknown'}</td></tr>
      <tr><td><b>Phone</b></td><td>${user ? user.phone : '—'}</td></tr>
      <tr><td><b>Notes</b></td><td>${order.description || '—'}</td></tr>
      <tr><td><b>Placed At</b></td><td>${order.createdAt}</td></tr>
    </table>
    <p>Please confirm payment via WhatsApp or call.</p>
  `;
  return sendAdminAlert({ subject, htmlContent });
}

export async function notifyAdminNewCustomOrder(order, user) {
  const subject = `🎨 New Custom Order #${order.id} – ${order.contactName}`;
  const htmlContent = `
    <h2>New Custom Order Request</h2>
    <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;">
      <tr><td><b>Order ID</b></td><td>${order.id}</td></tr>
      <tr><td><b>Contact Name</b></td><td>${order.contactName}</td></tr>
      <tr><td><b>Contact Phone</b></td><td>${order.contactPhone}</td></tr>
      <tr><td><b>Requested Date</b></td><td>${order.requestedDate}</td></tr>
      <tr><td><b>Requested Time</b></td><td>${order.requestedTime}</td></tr>
      <tr><td><b>Description</b></td><td>${order.description}</td></tr>
      <tr><td><b>Images</b></td><td>${order.images.length} attached</td></tr>
      <tr><td><b>Placed At</b></td><td>${order.createdAt}</td></tr>
    </table>
    <p>Please call the customer within 2 hours to confirm.</p>
  `;
  return sendAdminAlert({ subject, htmlContent });
}
