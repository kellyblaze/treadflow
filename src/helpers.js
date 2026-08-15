// Pure, dependency-free helpers shared across App.jsx — split out of that
// file so they're independently testable and so react-refresh doesn't warn
// about a component file exporting non-component values.

export const PLAN_TIER_DEFS = [
  {
    name: "Early Partner",
    price: 149,
    highlight: false,
    paymentLink: "https://buy.stripe.com/7sY8wJ3IDbYS75H5Je4Rq00",
    tierFeatures: ["Online tire storefront", "Inventory dashboard", "Online reservations", "Order management", "Basic SEO pages", "Email notifications"],
  },
  {
    name: "Growth Partner",
    price: 249,
    highlight: true,
    paymentLink: "https://buy.stripe.com/00w4gt2Ezgf83Tvb3y4Rq01",
    tierFeatures: ["Online deposits/payments", "Appointment booking", "CSV inventory upload", "Staff accounts", "SMS notifications"],
  },
  {
    name: "Market Leader",
    price: 399,
    highlight: false,
    paymentLink: "https://buy.stripe.com/14AfZbcf9d2W4XzdbG4Rq02",
    tierFeatures: ["AI chatbot", "Custom domain support", "Promotions & coupons", "Advanced reporting", "Multi-location support", "Priority onboarding"],
  },
];

export function planPrice(planName) {
  return PLAN_TIER_DEFS.find(p => p.name === planName)?.price ?? 0;
}

// Plans are cumulative — Growth Partner includes everything in Early Partner
// plus its own tierFeatures, and so on — so a shop on a given plan has every
// feature listed by that tier or any tier below it.
export function planHasFeature(planName, featureName) {
  const tierIndex = PLAN_TIER_DEFS.findIndex(p => p.name === planName);
  if (tierIndex === -1) return false;
  return PLAN_TIER_DEFS.slice(0, tierIndex + 1).some(tier => tier.tierFeatures.includes(featureName));
}

export function genInviteCode(state) {
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TF-${(state || "XX").slice(0, 2).toUpperCase()}-${suffix}`;
}

export function tireFromSupabaseRow(row) {
  const price = Number(row.price);
  const qty = Number(row.quantity);
  return {
    id: row.id,
    shop_id: row.shop_id,
    brand: row.brand ?? "",
    model: row.model ?? "",
    size: row.size ?? "",
    condition: row.condition ?? "New",
    qty,
    price,
    status: row.status ?? "Active",
    created_at: row.created_at,
    setPrice: +(price * 4).toFixed(2),
    type: "All-Season",
    tread: null,
    dot: "",
    load: 97,
    speed: "H",
    featured: false,
    installFee: 25,
    disposalFee: 5,
    desc: "",
    images: [],
  };
}

export function formatOrderCreatedDate(created_at) {
  if (!created_at) return "";
  const d = new Date(created_at);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function tireLineFromOrderRow(row) {
  const t = row.tires;
  if (!t) return "Tire";
  const tire = Array.isArray(t) ? t[0] : t;
  if (!tire) return "Tire";
  const parts = [tire.brand, tire.model, tire.size].filter(Boolean);
  return parts.length ? parts.join(" ") : "Tire";
}

export function orderFromSupabaseRow(row) {
  const id = row.id;
  const shortId = typeof id === "string" ? id.replace(/-/g, "").slice(0, 8) : String(id).slice(0, 8);
  const orderLabel = shortId ? `ORD-${shortId}` : "ORD";
  return {
    id,
    shop_id: row.shop_id,
    tire_id: row.tire_id,
    customer: row.customer_name ?? "",
    email: row.customer_email ?? "",
    phone: row.customer_phone ?? "",
    tire: tireLineFromOrderRow(row),
    qty: Number(row.quantity),
    total: Number(row.total),
    status: row.status ?? "Pending",
    date: formatOrderCreatedDate(row.created_at),
    apptDate: null,
    vehicle: "—",
    notes: "",
    sms_consent: row.sms_consent === true,
    created_at: row.created_at,
    orderLabel,
  };
}

export function docNumberFor(invoice) {
  const shortId = typeof invoice.id === "string" ? invoice.id.replace(/-/g, "").slice(0, 8).toUpperCase() : String(invoice.id);
  return `${invoice.doc_type === "Quote" ? "QT" : "INV"}-${shortId}`;
}

export function computeInvoiceTotals(lineItems, taxRate) {
  const subtotal = lineItems.reduce((sum, li) => sum + (Number(li.quantity) || 0) * (Number(li.unit_price) || 0), 0);
  const taxAmount = subtotal * ((Number(taxRate) || 0) / 100);
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

export function slugifyLocationName(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "shop";
}

export function buildTireInsertPayload(newTire, shopId) {
  const qty = +newTire.qty;
  const price = +newTire.price;
  return {
    shop_id: shopId,
    brand: newTire.brand,
    model: newTire.model,
    size: newTire.size,
    condition: newTire.condition,
    quantity: qty,
    price,
    status: qty === 0 ? "Out of Stock" : "Active",
  };
}

export function buildWaitlistPayload(waitlistTire, waitlistEmail, shopId) {
  if (!waitlistTire || !waitlistEmail?.trim()) return { valid: false };
  return {
    valid: true,
    payload: {
      shop_id: shopId,
      tire_id: waitlistTire.id,
      tire_name: `${waitlistTire.brand} ${waitlistTire.model} ${waitlistTire.size}`,
      email: waitlistEmail.trim(),
      created_at: new Date().toISOString(),
    },
  };
}

export function parseVehicleFields(vehicleRaw) {
  const parts = vehicleRaw.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { vehicle_year: null, vehicle_make: "", vehicle_model: "" };
  let idx = 0;
  let vehicle_year = null;
  if (/^\d{4}$/.test(parts[0])) {
    vehicle_year = parseInt(parts[0], 10);
    idx = 1;
  }
  const vehicle_make = parts[idx] ?? "";
  const vehicle_model = parts.slice(idx + 1).join(" ");
  return { vehicle_year, vehicle_make, vehicle_model };
}
