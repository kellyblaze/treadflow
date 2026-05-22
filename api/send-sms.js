export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: "Missing 'to' or 'message'" });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone) {
    console.error("Missing Twilio environment variables");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: fromPhone,
        To: to,
        Body: message,
      }).toString(),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Twilio API error:", response.status, errBody);
      return res.status(502).json({ error: "Failed to send SMS", details: errBody });
    }

    const data = await response.json();
    return res.status(200).json({ sid: data.sid, message: "SMS sent successfully" });
  } catch (err) {
    console.error("send-sms error:", err);
    return res.status(500).json({ error: err.message || "Failed to send SMS" });
  }
}
