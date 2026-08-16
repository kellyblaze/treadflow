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
    tierFeatures: ["Promotions & coupons", "Advanced reporting", "Multi-location support", "Priority onboarding"],
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

// Selectable public-storefront visual identities (Shop Settings > Storefront
// Theme). Every theme provides the same key shape as `colors` so Storefront
// can shadow the app-wide COLORS constant with a theme's palette and have
// every existing color reference in the storefront resolve correctly — no
// storefront markup or feature logic changes per theme, only these values.
// "classic" reproduces today's fixed look exactly, so it's a safe default
// for any shop that never picks a theme.
export const STOREFRONT_THEMES = {
  classic: {
    label: "Classic",
    blurb: "The current TreadFlow look — clean and professional.",
    accent: "#1E6FD9",
    heroBg: "#0A1628",
    fontDisplay: "system-ui, sans-serif",
    fontBody: "system-ui, sans-serif",
    colors: {
      navy: "#0A1628", navyLight: "#0F2040", blue: "#1E6FD9", blueLight: "#3B8BF5", orange: "#F97316", white: "#FFFFFF",
      gray50: "#F8FAFC", gray100: "#F1F5F9", gray200: "#E2E8F0", gray300: "#CBD5E1", gray400: "#94A3B8", gray500: "#64748B",
      gray600: "#475569", gray700: "#334155", gray800: "#1E293B", gray900: "#0F172A",
      green: "#10B981", red: "#EF4444", yellow: "#F59E0B", purple: "#8B5CF6",
    },
  },
  "pit-lane": {
    label: "Pit Lane",
    blurb: "Dark race-control cockpit — technical, high-energy.",
    accent: "#F5B400",
    heroBg: "#0A0D12",
    fontDisplay: '"Roboto Condensed", "Arial Narrow", system-ui, sans-serif',
    fontBody: "system-ui, sans-serif",
    colors: {
      navy: "#05070A", navyLight: "#12161D", blue: "#F5B400", blueLight: "#FFCB3D", orange: "#F5B400", white: "#12161D",
      gray50: "#171B22", gray100: "#1C212A", gray200: "#262D38", gray300: "#333B47", gray400: "#5B6577", gray500: "#8B95A6",
      gray600: "#A8B1C0", gray700: "#C7CEDB", gray800: "#DDE2EA", gray900: "#E8ECF2",
      green: "#2FBF6E", red: "#E6432F", yellow: "#F5B400", purple: "#A78BFA",
    },
  },
  "workshop-ledger": {
    label: "Workshop Ledger",
    blurb: "Tactile garage aesthetic — brass hardware on kraft canvas.",
    accent: "#A9762F",
    heroBg: "#34302A",
    fontDisplay: '"Arial Black", "Helvetica Neue", Impact, system-ui, sans-serif',
    fontBody: "system-ui, sans-serif",
    colors: {
      navy: "#34302A", navyLight: "#463F34", blue: "#A9762F", blueLight: "#C79448", orange: "#B14A18", white: "#EDE7DC",
      gray50: "#E9E2D3", gray100: "#E3DCCC", gray200: "#D3C9B1", gray300: "#BCAF8E", gray400: "#978A69", gray500: "#75694C",
      gray600: "#5B5343", gray700: "#453F33", gray800: "#332E25", gray900: "#241F17",
      green: "#4C7A3D", red: "#B14A18", yellow: "#B98900", purple: "#7A5C8A",
    },
  },
  "open-road": {
    label: "Open Road",
    blurb: "Premium cinematic highway — horizon gradients, confident type.",
    accent: "#D9642E",
    heroBg: "#14171C",
    fontDisplay: '"Helvetica Neue", Arial, system-ui, sans-serif',
    fontBody: "system-ui, sans-serif",
    colors: {
      navy: "#14171C", navyLight: "#1F2329", blue: "#D9642E", blueLight: "#F0875A", orange: "#B23A2E", white: "#F4F5F3",
      gray50: "#ECEDE9", gray100: "#E2E4DF", gray200: "#D3D6D0", gray300: "#B7BBB3", gray400: "#8D928A", gray500: "#6C716A",
      gray600: "#52564F", gray700: "#3B3E38", gray800: "#282A25", gray900: "#1B1E22",
      green: "#2F8F5B", red: "#B23A2E", yellow: "#D98F2E", purple: "#7A6AA0",
    },
  },
  "spec-sheet": {
    label: "Spec Sheet",
    blurb: "Technical blueprint/catalog — precise, on light paper.",
    accent: "#1C4FA0",
    heroBg: "#14181C",
    fontDisplay: '"Helvetica Neue", Arial, system-ui, sans-serif',
    fontBody: "system-ui, sans-serif",
    colors: {
      navy: "#14181C", navyLight: "#22262C", blue: "#1C4FA0", blueLight: "#3E6FC0", orange: "#B3231C", white: "#F7F7F5",
      gray50: "#F0F0EC", gray100: "#E6E6E0", gray200: "#D6D8D3", gray300: "#BCBEB6", gray400: "#8B9095", gray500: "#6C7176",
      gray600: "#52585F", gray700: "#3A3F44", gray800: "#24282C", gray900: "#14181C",
      green: "#2E7D46", red: "#B3231C", yellow: "#A87B12", purple: "#5C5CA0",
    },
  },
  showroom: {
    label: "Showroom",
    blurb: "Bright bold retail floor — one confident showroom red.",
    accent: "#D1181A",
    heroBg: "#17191B",
    fontDisplay: '"Arial Black", "Helvetica Neue", Impact, system-ui, sans-serif',
    fontBody: "system-ui, sans-serif",
    colors: {
      navy: "#17191B", navyLight: "#24272A", blue: "#D1181A", blueLight: "#E85557", orange: "#D1181A", white: "#FBFBF9",
      gray50: "#F4F4F0", gray100: "#EEEEE8", gray200: "#E3E3DD", gray300: "#C9C9C1", gray400: "#93979C", gray500: "#767B80",
      gray600: "#5C6066", gray700: "#404346", gray800: "#26282A", gray900: "#17191B",
      green: "#1F8A4C", red: "#9E1113", yellow: "#C98A12", purple: "#8A4F7A",
    },
  },
  "line-and-tread": {
    label: "Line & Tread",
    blurb: "Swiss-grid precision — true black on true white, one accent.",
    accent: "#E8471C",
    heroBg: "#0E0E0E",
    fontDisplay: '"Helvetica Neue", Arial, system-ui, sans-serif',
    fontBody: "system-ui, sans-serif",
    colors: {
      navy: "#0E0E0E", navyLight: "#1E1E1E", blue: "#E8471C", blueLight: "#F17347", orange: "#E8471C", white: "#FFFFFF",
      gray50: "#F7F7F7", gray100: "#F3F3F3", gray200: "#E0E0E0", gray300: "#C7C7C7", gray400: "#9A9D9F", gray500: "#7A7D80",
      gray600: "#63666A", gray700: "#454749", gray800: "#282929", gray900: "#0E0E0E",
      green: "#1B7A43", red: "#D62F0E", yellow: "#B8860B", purple: "#5C5C8A",
    },
  },
};

export const STOREFRONT_THEME_ORDER = ["classic", "pit-lane", "workshop-ledger", "open-road", "spec-sheet", "showroom", "line-and-tread"];

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
