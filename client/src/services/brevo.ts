
/**
 * Brevo (Sendinblue) email notification service.
 * Calls the /api/send-email serverless function so the API key stays server-side.
 * All functions silently swallow errors – a failed email must never block the order flow.
 */

interface EmailRecipient {
  email: string;
  name?: string;
}

const sendEmail = async (
  to: EmailRecipient,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<void> => {
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, htmlContent, textContent }),
    });
  } catch (err) {
    console.warn('Email notification skipped:', err);
  }
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Regular order confirmation                                                */
/* ────────────────────────────────────────────────────────────────────────── */
export const sendOrderConfirmationEmail = async (
  user: { email: string; name: string },
  order: {
    id: string;
    productTitle: string;
    quantity: number;
    totalPrice: number;
    description?: string;
  },
  adminPhone: string
): Promise<void> => {
  const subject = `Order Confirmed – ${order.productTitle} | VKM Flower Shop`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:40px 32px;text-align:center;">
            <p style="margin:0 0 8px;font-size:32px;">🌸</p>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:-0.5px;">VKM Flower Shop</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:700;">Order Confirmation</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:40px 32px;">
            <p style="margin:0 0 6px;font-size:18px;font-weight:800;color:#111827;">Hello, ${user.name}! 👋</p>
            <p style="margin:0 0 32px;font-size:14px;color:#6b7280;line-height:1.7;">
              Great news – your order has been received and is being prepared with care. Here's a summary:
            </p>

            <!-- ORDER CARD -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;padding-bottom:10px;">Product</td>
                      <td style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;padding-bottom:10px;text-align:right;">Total</td>
                    </tr>
                    <tr>
                      <td style="font-size:18px;font-weight:900;color:#111827;padding-bottom:4px;">${order.productTitle}</td>
                      <td style="font-size:26px;font-weight:900;color:#4f46e5;text-align:right;">&#8377;${order.totalPrice}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#6b7280;padding-bottom:0;">Qty: ${order.quantity}</td>
                      <td></td>
                    </tr>
                    ${order.description ? `
                    <tr>
                      <td colspan="2" style="padding-top:16px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;font-style:italic;">"${order.description}"</td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <!-- CONTACT CALLOUT -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:800;color:#6366f1;text-transform:uppercase;letter-spacing:1.5px;">📞 Payment &amp; Pickup</p>
                  <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">
                    Contact us at <strong style="color:#4f46e5;">${adminPhone}</strong> for payment details and order updates.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Order ID: <strong style="color:#374151;">#${order.id}</strong></p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} VKM Flower Shop &middot; Specialized Service for Kanchipuram</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textContent =
    `Hello ${user.name},\n\n` +
    `Your order has been placed!\n\n` +
    `Product: ${order.productTitle}\n` +
    `Qty:     ${order.quantity}\n` +
    `Total:   ₹${order.totalPrice}\n` +
    (order.description ? `Note:    ${order.description}\n` : '') +
    `Order ID: #${order.id}\n\n` +
    `Contact us at ${adminPhone} for payment details.\n\n` +
    `© ${new Date().getFullYear()} VKM Flower Shop`;

  await sendEmail({ email: user.email, name: user.name }, subject, htmlContent, textContent);
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Custom order confirmation                                                 */
/* ────────────────────────────────────────────────────────────────────────── */
export const sendCustomOrderConfirmationEmail = async (
  user: { email: string; name: string },
  order: {
    id: string;
    description: string;
    requestedDate: string;
    requestedTime: string;
    contactName: string;
  },
  adminPhone: string
): Promise<void> => {
  const subject = `Custom Order Received | VKM Flower Shop`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Custom Order Confirmation</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 100%);padding:40px 32px;text-align:center;">
            <p style="margin:0 0 8px;font-size:32px;">🌸</p>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:-0.5px;">VKM Flower Shop</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:700;">Custom Order Received</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:40px 32px;">
            <p style="margin:0 0 6px;font-size:18px;font-weight:800;color:#111827;">Hello, ${user.name}! 👋</p>
            <p style="margin:0 0 32px;font-size:14px;color:#6b7280;line-height:1.7;">
              We've received your custom floral request. Our team will call you within <strong>2 hours</strong> to confirm the details.
            </p>

            <!-- REQUEST DETAILS CARD -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 16px;font-size:11px;font-weight:800;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;">Request Details</p>
                  <table width="100%" cellpadding="4" cellspacing="0">
                    <tr>
                      <td style="font-size:13px;color:#6b7280;width:38%;">Recipient:</td>
                      <td style="font-size:13px;font-weight:700;color:#111827;">${order.contactName}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#6b7280;">Required Date:</td>
                      <td style="font-size:13px;font-weight:700;color:#111827;">${order.requestedDate}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#6b7280;">Preferred Time:</td>
                      <td style="font-size:13px;font-weight:700;color:#111827;">${order.requestedTime}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#6b7280;vertical-align:top;padding-top:8px;border-top:1px solid #e5e7eb;">Description:</td>
                      <td style="font-size:13px;color:#374151;padding-top:8px;border-top:1px solid #e5e7eb;">${order.description}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- NEXT STEPS CALLOUT -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:1.5px;">✨ Next Steps</p>
                  <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">
                    Our team will call you at <strong style="color:#7c3aed;">${adminPhone}</strong> within 2 hours to discuss your custom order and confirm pricing.
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Request ID: <strong style="color:#374151;">#${order.id}</strong></p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} VKM Flower Shop &middot; Specialized Service for Kanchipuram</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textContent =
    `Hello ${user.name},\n\n` +
    `Your custom floral request has been received!\n\n` +
    `Recipient:     ${order.contactName}\n` +
    `Required Date: ${order.requestedDate}\n` +
    `Preferred Time:${order.requestedTime}\n` +
    `Description:   ${order.description}\n` +
    `Request ID:    #${order.id}\n\n` +
    `Our team will call you at ${adminPhone} within 2 hours.\n\n` +
    `© ${new Date().getFullYear()} VKM Flower Shop`;

  await sendEmail({ email: user.email, name: user.name }, subject, htmlContent, textContent);
};
