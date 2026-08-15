import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Deliberately never trusts a client-supplied dollar amount — the deposit
// amount comes from the shop's own configured deposit_amount column, and
// "pay in full" reads the order's own total, both looked up server-side.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey || !supabaseUrl || !supabaseServiceKey) {
    console.error("Missing required environment variables");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const { orderId, shopId, mode, returnPath } = req.body || {};
  if (!orderId || !shopId || (mode !== "deposit" && mode !== "full")) {
    return res.status(400).json({ error: "orderId, shopId, and a valid mode are required." });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, shop_id, total, customer_email, customer_name")
      .eq("id", orderId)
      .eq("shop_id", shopId)
      .maybeSingle();
    if (orderErr) throw orderErr;
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    const { data: shop, error: shopErr } = await supabase
      .from("shops")
      .select("id, name, deposit_amount")
      .eq("id", shopId)
      .maybeSingle();
    if (shopErr) throw shopErr;
    if (!shop) {
      return res.status(404).json({ error: "Shop not found." });
    }

    const amount = mode === "deposit" ? Number(shop.deposit_amount) || 50 : Number(order.total) || 0;
    if (amount <= 0) {
      return res.status(400).json({ error: "Nothing to charge for this order." });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const path = typeof returnPath === "string" && returnPath.startsWith("/") ? returnPath : "/";

    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: mode === "deposit" ? `Tire Deposit — ${shop.name}` : `Tire Order — ${shop.name}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: order.customer_email || undefined,
      success_url: `${origin}${path}?deposit_success=true&order_id=${encodeURIComponent(orderId)}`,
      cancel_url: `${origin}${path}?deposit_cancelled=true`,
      metadata: { flow: "deposit", order_id: orderId, shop_id: shopId, deposit_mode: mode },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-deposit-checkout error:", err);
    return res.status(500).json({ error: "Unable to start checkout." });
  }
}
