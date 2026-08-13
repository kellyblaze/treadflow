import Stripe from "stripe";

// Set these in your Stripe Dashboard (test mode) as recurring Prices matching
// the $149/$249/$399 plans, then set the corresponding env var to the Price ID.
const PRICE_ENV_BY_PLAN = {
  "Early Partner": "STRIPE_PRICE_EARLY_PARTNER",
  "Growth Partner": "STRIPE_PRICE_GROWTH_PARTNER",
  "Market Leader": "STRIPE_PRICE_MARKET_LEADER",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("Missing STRIPE_SECRET_KEY");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const { plan, email } = req.body || {};
  const envVar = PRICE_ENV_BY_PLAN[plan];
  if (!envVar) {
    return res.status(400).json({ error: `Unknown plan: ${plan}` });
  }

  const priceId = process.env[envVar];
  if (!priceId) {
    console.error(`Missing ${envVar} — create this Price in Stripe and set the env var.`);
    return res.status(500).json({ error: "Billing is not fully configured for this plan yet." });
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;

  try {
    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: typeof email === "string" && email.trim() ? email.trim() : undefined,
      success_url: `${origin}/?checkout_success=true`,
      cancel_url: `${origin}/?checkout_cancelled=true`,
      metadata: { plan },
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return res.status(500).json({ error: "Unable to start checkout." });
  }
}
