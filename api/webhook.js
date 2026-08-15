import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: { bodyParser: false },
};

// Same env vars as api/create-checkout-session.js — maps a Stripe Price ID
// back to a plan name so subscription.updated can detect upgrades/downgrades.
const PRICE_ENV_BY_PLAN = {
  "Early Partner": "STRIPE_PRICE_EARLY_PARTNER",
  "Growth Partner": "STRIPE_PRICE_GROWTH_PARTNER",
  "Market Leader": "STRIPE_PRICE_MARKET_LEADER",
};

function planForPriceId(priceId) {
  if (!priceId) return null;
  for (const [plan, envVar] of Object.entries(PRICE_ENV_BY_PLAN)) {
    if (process.env[envVar] === priceId) return plan;
  }
  return null;
}

function statusForSubscription(subscriptionStatus) {
  switch (subscriptionStatus) {
    case "active":
    case "trialing":
      return "Active";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "Past Due";
    case "canceled":
    case "incomplete_expired":
      return "Cancelled";
    default:
      return null;
  }
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function extractCustomerId(object) {
  return typeof object.customer === "string" ? object.customer : object.customer?.id ?? null;
}

async function resolveCustomerEmail(stripe, object) {
  if (object.customer_email) return object.customer_email;
  if (object.customer_details?.email) return object.customer_details.email;
  const customerId = extractCustomerId(object);
  if (!customerId || !stripe) return null;
  const customer = await stripe.customers.retrieve(customerId);
  return customer.email ?? null;
}

// Finds the shop for a webhook event's Stripe object, preferring the stored
// stripe_customer_id (stable across email changes) and falling back to email
// matching + backfilling stripe_customer_id for shops not linked yet.
async function findShopForObject(supabase, stripe, object) {
  const customerId = extractCustomerId(object);

  if (customerId) {
    const { data, error } = await supabase.from("shops").select("id, stripe_customer_id").eq("stripe_customer_id", customerId).maybeSingle();
    if (error) throw error;
    if (data) return { shopId: data.id, customerId };
  }

  const email = await resolveCustomerEmail(stripe, object);
  if (!email) return { shopId: null, customerId };

  const { data, error } = await supabase.from("shops").select("id").eq("email", email.trim()).maybeSingle();
  if (error) throw error;
  return { shopId: data?.id ?? null, customerId, email };
}

async function applyShopUpdate(supabase, shopId, updates) {
  if (!shopId || Object.keys(updates).length === 0) return { updated: false };
  const { data, error } = await supabase.from("shops").update(updates).eq("id", shopId).select("id").maybeSingle();
  if (error) throw error;
  return { updated: !!data };
}

async function handleCheckoutSessionCompleted(supabase, stripe, session) {
  // Storefront deposit/full-payment checkouts share this same Stripe event
  // type with shop subscription checkouts, distinguished by metadata.flow.
  if (session.metadata?.flow === "deposit") {
    return handleDepositCheckoutCompleted(supabase, session);
  }

  const { shopId, customerId } = await findShopForObject(supabase, stripe, session);
  const plan = session.metadata?.plan || null;
  return applyShopUpdate(supabase, shopId, {
    status: "Active",
    stripe_customer_id: customerId,
    stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null,
    ...(plan ? { plan } : {}),
  });
}

// Not importing src/email.js here — this webhook is the one path that must
// never fail to build/deploy, so it stays isolated with its own minimal
// inline template rather than sharing a module boundary with client code.
async function sendCustomerConfirmationEmail(to, customerName, tireName, shopName, shopPhone) {
  const resendUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL) + "/functions/v1/send-email";
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!to || !anonKey) return;
  try {
    await fetch(resendUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        subject: `Your tire reservation at ${shopName} is confirmed`,
        html: `<h2>Hi ${customerName},</h2><p>Your deposit has been received and your reservation for <strong>${tireName}</strong> at <strong>${shopName}</strong> is confirmed.</p><p>We will contact you shortly to confirm your installation appointment.</p><p>Questions? Call us at ${shopPhone}.</p><p>Thank you,<br/>${shopName}</p>`,
      }),
    });
  } catch (err) {
    console.warn("Deposit confirmation email failed:", err);
  }
}

async function handleDepositCheckoutCompleted(supabase, session) {
  const orderId = session.metadata?.order_id;
  const shopId = session.metadata?.shop_id;
  if (!orderId || !shopId) return { updated: false, reason: "missing order/shop metadata" };

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .update({ status: "Pending" })
    .eq("id", orderId)
    .eq("shop_id", shopId)
    .select("id, tire_id, customer_name, customer_email")
    .maybeSingle();
  if (orderErr) throw orderErr;
  if (!order) return { updated: false };

  const [{ data: shop }, { data: tire }] = await Promise.all([
    supabase.from("shops").select("name, phone").eq("id", shopId).maybeSingle(),
    order.tire_id ? supabase.from("tires").select("brand, model").eq("id", order.tire_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const tireName = tire ? `${tire.brand} ${tire.model}` : "your tire order";
  await sendCustomerConfirmationEmail(order.customer_email, order.customer_name, tireName, shop?.name || "the shop", shop?.phone || "");

  return { updated: true, orderId };
}

async function handleSubscriptionUpsert(supabase, stripe, subscription) {
  const { shopId, customerId } = await findShopForObject(supabase, stripe, subscription);
  const status = statusForSubscription(subscription.status);
  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  const plan = planForPriceId(priceId);
  return applyShopUpdate(supabase, shopId, {
    ...(status ? { status } : {}),
    ...(plan ? { plan } : {}),
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
  });
}

async function handleSubscriptionDeleted(supabase, stripe, subscription) {
  const { shopId, customerId } = await findShopForObject(supabase, stripe, subscription);
  return applyShopUpdate(supabase, shopId, { status: "Cancelled", stripe_customer_id: customerId });
}

async function handleInvoiceStatus(supabase, stripe, invoice, status) {
  const { shopId, customerId } = await findShopForObject(supabase, stripe, invoice);
  return applyShopUpdate(supabase, shopId, { status, stripe_customer_id: customerId });
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

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const object = event.data.object;
    let result;

    switch (event.type) {
      case "checkout.session.completed":
        result = await handleCheckoutSessionCompleted(supabase, stripe, object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        result = await handleSubscriptionUpsert(supabase, stripe, object);
        break;
      case "customer.subscription.deleted":
        result = await handleSubscriptionDeleted(supabase, stripe, object);
        break;
      case "invoice.payment_succeeded":
        result = await handleInvoiceStatus(supabase, stripe, object, "Active");
        break;
      case "invoice.payment_failed":
        result = await handleInvoiceStatus(supabase, stripe, object, "Past Due");
        break;
      default:
        return res.status(200).json({ received: true, handled: false });
    }

    console.log(`Webhook ${event.type}:`, result);
    return res.status(200).json({ received: true, ...result });
  } catch (err) {
    console.error(`Webhook handler error (${event.type}):`, err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}
