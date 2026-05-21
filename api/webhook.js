import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function resolveCustomerEmail(stripe, object) {
  if (object.customer_email) return object.customer_email;
  const customerId =
    typeof object.customer === "string" ? object.customer : object.customer?.id;
  if (!customerId || !stripe) return null;
  const customer = await stripe.customers.retrieve(customerId);
  return customer.email ?? null;
}

async function activateShopByEmail(supabase, email) {
  if (!email) return { updated: false, reason: "no email" };

  const { data, error } = await supabase
    .from("shops")
    .update({ status: "Active" })
    .eq("email", email.trim())
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return { updated: !!data, shopId: data?.id ?? null };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error("Missing required environment variables");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

  const signature = req.headers["stripe-signature"];
  if (!signature) {
    return res.status(400).json({ error: "Missing Stripe signature" });
  }

  let event;
  try {
    const rawBody = await readRawBody(req);
    event = Stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const handledEvents = [
    "customer.subscription.created",
    "invoice.payment_succeeded",
  ];

  if (!handledEvents.includes(event.type)) {
    return res.status(200).json({ received: true, handled: false });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const email = await resolveCustomerEmail(stripe, event.data.object);

    if (!email) {
      console.warn(`No customer email for event ${event.id} (${event.type})`);
      return res.status(200).json({ received: true, activated: false });
    }

    const result = await activateShopByEmail(supabase, email);
    console.log(`Webhook ${event.type}:`, { email, ...result });

    return res.status(200).json({
      received: true,
      activated: result.updated,
      shopId: result.shopId,
    });
  } catch (err) {
    console.error(`Webhook handler error (${event.type}):`, err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}
