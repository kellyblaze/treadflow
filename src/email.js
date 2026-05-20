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
