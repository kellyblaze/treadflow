const SUPABASE_URL = "https://egaxolujduyhcomkbuum.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYXhvbHVqZHV5aGNvbWtidXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NjAzOTUsImV4cCI6MjA5MzMzNjM5NX0.nNWcDR2EVLODNnXnKoRvyJ9YDl63YRMlypimNyG8JXA";

export async function sendEmail(to, subject, html) {
  console.log("sendEmail called:", { to, subject });
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, subject, html }),
    });
    const data = await res.json();
    console.log("Email response:", data);
    return data;
  } catch (err) {
    console.error("Email send failed:", err);
  }
}

export const reservationConfirmation = (customerName, tireName, shopName, shopPhone) => ({
  subject: `Your tire reservation at ${shopName} is confirmed`,
  html: `<h2>Hi ${customerName},</h2><p>Your reservation for <strong>${tireName}</strong> at <strong>${shopName}</strong> has been received.</p><p>We will contact you shortly to confirm your installation appointment.</p><p>Questions? Call us at ${shopPhone}.</p><p>Thank you,<br/>${shopName}</p>`
});

export const orderNotification = (customerName, tireName, quantity, total) => ({
  subject: `New tire reservation — ${customerName}`,
  html: `<h2>New Reservation</h2><p><strong>Customer:</strong> ${customerName}</p><p><strong>Tire:</strong> ${tireName}</p><p><strong>Quantity:</strong> ${quantity}</p><p><strong>Total:</strong> $${total}</p>`
});

export const orderStatusUpdate = (customerName, tireName, newStatus, shopName, shopPhone) => ({
  subject: `Your order status update from ${shopName}`,
  html: `<h2>Hi ${customerName},</h2><p>Your order for <strong>${tireName}</strong> has been updated to <strong>${newStatus}</strong>.</p><p>Questions? Call us at ${shopPhone}.</p><p>Thank you,<br/>${shopName}</p>`
});

export const shopInviteEmail = (shopName, code, plan, expiryDays = 14) => ({
  subject: `You're invited to join TreadFlow`,
  html: `<h2>Welcome to TreadFlow, ${shopName}!</h2><p>Your application has been approved on the <strong>${plan}</strong> plan.</p><p>Your invite code:</p><p style="font-family:monospace;font-size:20px;font-weight:700;letter-spacing:2px;">${code}</p><p>Use this code to create your account and set up your shop. This code expires in ${expiryDays} days.</p>`
});

export const staffInviteEmail = (staffName, shopName, role, code, acceptUrl) => ({
  subject: `You've been invited to join ${shopName} on TreadFlow`,
  html: `<h2>Hi ${staffName},</h2><p>You've been invited to join <strong>${shopName}</strong> on TreadFlow as <strong>${role}</strong>.</p><p><a href="${acceptUrl}">Click here to accept your invite</a>, or use this code:</p><p style="font-family:monospace;font-size:20px;font-weight:700;letter-spacing:2px;">${code}</p>`
});

export const invoiceEmail = (customerName, shopName, docType, docNumber, lineItems, subtotal, taxAmount, total, dueDate, notes) => {
  const rowsHtml = lineItems.map(li => `<tr><td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;">${li.description}</td><td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;text-align:center;">${li.quantity}</td><td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;text-align:right;">$${Number(li.unit_price).toFixed(2)}</td><td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;text-align:right;">$${(Number(li.quantity) * Number(li.unit_price)).toFixed(2)}</td></tr>`).join("");
  return {
    subject: `${docType} ${docNumber} from ${shopName}`,
    html: `<h2>Hi ${customerName},</h2><p>Here is your ${docType.toLowerCase()} <strong>${docNumber}</strong> from <strong>${shopName}</strong>.</p><table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:2px solid #0A1628;">Description</th><th style="padding:6px 8px;border-bottom:2px solid #0A1628;">Qty</th><th style="padding:6px 8px;border-bottom:2px solid #0A1628;">Price</th><th style="padding:6px 8px;border-bottom:2px solid #0A1628;">Amount</th></tr></thead><tbody>${rowsHtml}</tbody></table><p>Subtotal: $${subtotal.toFixed(2)}<br/>Tax: $${taxAmount.toFixed(2)}<br/><strong>Total: $${total.toFixed(2)}</strong></p>${dueDate ? `<p>Due date: ${dueDate}</p>` : ""}${notes ? `<p>${notes}</p>` : ""}<p>Thank you,<br/>${shopName}</p>`
  };
};
