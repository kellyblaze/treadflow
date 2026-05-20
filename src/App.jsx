import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { sendEmail, reservationConfirmation, orderNotification, orderStatusUpdate } from "./email";
const redirectToCheckout = (paymentLink) => {
  console.log("Redirecting to:", paymentLink);
  if (!paymentLink) { alert("No payment link found!"); return; }
  window.location.href = paymentLink;
};
  
const COLORS = {
  navy: "#0A1628",
  navyLight: "#0F2040",
  blue: "#1E6FD9",
  blueLight: "#3B8BF5",
  orange: "#F97316",
  white: "#FFFFFF",
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",
  green: "#10B981",
  red: "#EF4444",
  yellow: "#F59E0B",
  purple: "#8B5CF6",
};

const mockApplications = [
  { id: 1, shop: "Greenville Tire Pros", owner: "Marcus Williams", city: "Greenville", state: "SC", email: "marcus@greenvilletire.com", phone: "(864) 555-0142", status: "New", tires: "Both", inventory: "200+", plan: null, date: "2026-04-28", market: "Greenville, SC" },
  { id: 2, shop: "Palmetto Used Tires", owner: "Sandra Chen", city: "Columbia", state: "SC", email: "sandra@palmettotires.com", phone: "(803) 555-0198", status: "Reviewing", tires: "Used", inventory: "500+", plan: "Growth Partner", date: "2026-04-25", market: "Columbia, SC" },
  { id: 3, shop: "Carolina Wheel & Tire", owner: "James Rutherford", city: "Charlotte", state: "NC", email: "james@carolinawheel.com", phone: "(704) 555-0211", status: "Approved", tires: "Both", inventory: "300+", plan: "Early Partner", date: "2026-04-20", market: "Charlotte, NC" },
  { id: 4, shop: "Low Country Tire Co", owner: "Brenda Simmons", city: "Charleston", state: "SC", email: "brenda@lowcountry.com", phone: "(843) 555-0177", status: "Waitlisted", tires: "New", inventory: "100-200", plan: null, date: "2026-04-18", market: "Charleston, SC" },
  { id: 5, shop: "Peak Auto & Tire", owner: "Derek Foster", city: "Raleigh", state: "NC", email: "derek@peakauto.com", phone: "(919) 555-0263", status: "Invited", tires: "Both", inventory: "150+", plan: "Market Leader", date: "2026-04-15", market: "Raleigh, NC" },
];

const mockShops = [
  { id: 1, name: "Greenville Tire Pros", owner: "Marcus Williams", city: "Greenville", state: "SC", status: "Active", plan: "Growth Partner", mrr: 249, tires: 47, orders: 23, since: "2025-11-01", slug: "greenville-tire-pros" },
  { id: 2, name: "Palmetto Used Tires", owner: "Sandra Chen", city: "Columbia", state: "SC", status: "Trial", plan: "Early Partner", mrr: 149, tires: 112, orders: 8, since: "2026-03-15", slug: "palmetto-used-tires" },
  { id: 3, name: "Carolina Wheel & Tire", owner: "James Rutherford", city: "Charlotte", state: "NC", status: "Active", plan: "Market Leader", mrr: 399, tires: 89, orders: 41, since: "2025-09-01", slug: "carolina-wheel-tire" },
];

const mockTires = [
  { id: 1, brand: "Michelin", model: "Defender T+H", size: "225/55R17", width: 225, aspect: 55, rim: 17, condition: "New", type: "All-Season", qty: 8, price: 139.99, setPrice: 519.99, tread: null, dot: "2524", load: 97, speed: "H", status: "Active", featured: true, installFee: 25, disposalFee: 5, desc: "Premium all-season touring tire with long tread life.", images: [] },
  { id: 2, brand: "Goodyear", model: "Assurance WeatherReady", size: "215/60R16", width: 215, aspect: 60, rim: 16, condition: "Used", type: "All-Season", qty: 4, price: 59.99, setPrice: 219.99, tread: "8/32", dot: "2221", load: 95, speed: "H", status: "Active", featured: false, installFee: 20, disposalFee: 5, desc: "Good condition used tires, passed inspection.", images: [] },
  { id: 3, brand: "Bridgestone", model: "Dueler H/L Alenza", size: "265/70R17", width: 265, aspect: 70, rim: 17, condition: "New", type: "SUV/Truck", qty: 6, price: 179.99, setPrice: 679.99, tread: null, dot: "3024", load: 115, speed: "H", status: "Active", featured: true, installFee: 30, disposalFee: 5, desc: "Long-lasting performance for SUVs and light trucks.", images: [] },
  { id: 4, brand: "Continental", model: "TrueContact Tour", size: "205/55R16", width: 205, aspect: 55, rim: 16, condition: "Used", type: "All-Season", qty: 2, price: 49.99, setPrice: 179.99, tread: "7/32", dot: "1922", load: 91, speed: "H", status: "Active", featured: false, installFee: 20, disposalFee: 5, desc: "Dependable touring tire in used condition.", images: [] },
  { id: 5, brand: "Pirelli", model: "Scorpion Verde A/S", size: "245/50R20", width: 245, aspect: 50, rim: 20, condition: "New", type: "All-Season", qty: 4, price: 219.99, setPrice: 839.99, tread: null, dot: "1524", load: 102, speed: "W", status: "Active", featured: false, installFee: 35, disposalFee: 5, desc: "Premium all-season performance tire for luxury SUVs.", images: [] },
  { id: 6, brand: "Cooper", model: "CS5 Ultra Touring", size: "235/45R18", width: 235, aspect: 45, rim: 18, condition: "New", type: "Touring", qty: 0, price: 119.99, setPrice: 459.99, tread: null, dot: "0624", load: 98, speed: "V", status: "Out of Stock", featured: false, installFee: 25, disposalFee: 5, desc: "Comfortable touring tire with strong wet traction.", images: [] },
];

/** Public demo storefront resolves `shops.id` by slug; UUID fallback if row is missing (not used in the authenticated dashboard). */
const PUBLIC_STOREFRONT_SLUG = "greenville-tire-pros";
const FALLBACK_PUBLIC_SHOP_ID = "00000000-0000-0000-0000-000000000001";

function tireFromSupabaseRow(row) {
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

function formatOrderCreatedDate(created_at) {
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

function orderFromSupabaseRow(row) {
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
    created_at: row.created_at,
    orderLabel,
  };
}

const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function formatCustomerRecordDate(created_at) {
  if (!created_at) return "—";
  const d = new Date(created_at);
  return Number.isNaN(d.getTime()) ? "—" : d.toISOString().slice(0, 10);
}

function customerVehicleFromRow(row) {
  const parts = [row.vehicle_year, row.vehicle_make, row.vehicle_model].filter(
    v => v !== null && v !== undefined && String(v).trim() !== "",
  );
  return parts.length ? parts.map(v => String(v).trim()).join(" ") : "—";
}

function customerFromSupabaseRow(row) {
  return {
    id: row.id,
    shop_id: row.shop_id,
    name: row.name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    vehicle: customerVehicleFromRow(row),
    notes: row.notes ?? "",
    created_at: row.created_at,
    lastOrderDate: formatCustomerRecordDate(row.created_at),
  };
}

function parseAppointmentDateParts(dateVal) {
  const s = dateVal == null ? "" : String(dateVal).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return { monthLabel: "—", day: "—", iso: s };
  const monthIdx = Math.max(0, Math.min(11, parseInt(m[2], 10) - 1));
  return { monthLabel: MONTH_ABBR[monthIdx], day: String(parseInt(m[3], 10)), iso: s };
}

function appointmentFromSupabaseRow(row) {
  const cust = row.customers;
  const customer = Array.isArray(cust) ? cust[0] : cust;
  const { monthLabel, day, iso } = parseAppointmentDateParts(row.date);
  return {
    id: row.id,
    shop_id: row.shop_id,
    customer_id: row.customer_id,
    order_id: row.order_id,
    dateIso: iso,
    monthLabel,
    day,
    time: row.time ?? "",
    status: row.status ?? "Pending",
    vehicle: row.vehicle_info ?? "—",
    notes: row.notes ?? "",
    customerName: customer?.name ?? "—",
    customerPhone: customer?.phone ?? "",
    customerEmail: customer?.email ?? "",
    created_at: row.created_at,
  };
}

const mockOrders = [
  { id: "ORD-1042", customer: "Terrence Hall", email: "terrence@email.com", phone: "(864) 555-9021", tire: "Michelin Defender T+H 225/55R17", qty: 4, total: 579.99, status: "Pending", date: "2026-05-01", apptDate: "2026-05-05", vehicle: "2019 Toyota Camry", notes: "Customer requested morning slot" },
  { id: "ORD-1041", customer: "Angela Price", email: "angela@email.com", phone: "(864) 555-3344", tire: "Bridgestone Dueler H/L 265/70R17", qty: 2, total: 389.99, status: "Confirmed", date: "2026-04-30", apptDate: "2026-05-03", vehicle: "2021 Ford F-150", notes: "" },
  { id: "ORD-1040", customer: "Devon Clark", email: "devon@email.com", phone: "(864) 555-7712", tire: "Goodyear Assurance 215/60R16", qty: 4, total: 279.99, status: "Completed", date: "2026-04-28", apptDate: "2026-04-30", vehicle: "2017 Honda Accord", notes: "Paid in full" },
  { id: "ORD-1039", customer: "Shonda Meeks", email: "shonda@email.com", phone: "(864) 555-5501", tire: "Pirelli Scorpion Verde 245/50R20", qty: 4, total: 919.99, status: "Cancelled", date: "2026-04-25", apptDate: null, vehicle: "2022 BMW X5", notes: "Customer cancelled" },
];

const mockMarkets = [
  { id: 1, city: "Greenville", state: "SC", name: "Greenville Metro", max: 3, active: 1, status: "Open" },
  { id: 2, city: "Columbia", state: "SC", name: "Columbia Metro", max: 3, active: 2, status: "Limited" },
  { id: 3, city: "Charlotte", state: "NC", name: "Charlotte Metro", max: 5, active: 5, status: "Full" },
  { id: 4, city: "Charleston", state: "SC", name: "Lowcountry", max: 2, active: 2, status: "Waitlist Only" },
  { id: 5, city: "Raleigh", state: "NC", name: "Triangle Area", max: 4, active: 1, status: "Open" },
];

const storefront = {
  logo: "G",
  name: "Greenville Tire Pros",
  phone: "(864) 555-0142",
  address: "1420 Wade Hampton Blvd, Greenville, SC 29609",
  hours: "Mon–Fri 8am–6pm · Sat 8am–4pm",
  primaryColor: "#1E6FD9",
  hero: "Greenville's Trusted Tire Experts",
  heroBg: "#0A1628",
  heroSub: "New & used tires, fast installation, and honest prices. Search our inventory and reserve online.",
};

// ── Styles ──────────────────────────────────────────────────────────────────
const S = {
  btn: (variant = "primary", size = "md") => ({
    display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
    border: "none", fontFamily: "inherit", fontWeight: 500, borderRadius: 8,
    padding: size === "sm" ? "6px 14px" : size === "lg" ? "13px 28px" : "9px 20px",
    fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
    background: variant === "primary" ? COLORS.blue : variant === "orange" ? COLORS.orange : variant === "dark" ? COLORS.navy : variant === "ghost" ? "transparent" : variant === "danger" ? COLORS.red : "#E2E8F0",
    color: variant === "ghost" ? COLORS.blue : variant === "secondary" ? COLORS.gray700 : COLORS.white,
    border: variant === "ghost" ? `1px solid ${COLORS.blue}` : "none",
  }),
  badge: (color) => {
    const map = { New: ["#EFF6FF","#1D4ED8"], Reviewing: ["#FEF9C3","#854D0E"], Approved: ["#DCFCE7","#166534"], Waitlisted: ["#FEF3C7","#92400E"], Rejected: ["#FEE2E2","#991B1B"], Invited: ["#EDE9FE","#5B21B6"], "Converted to Shop": ["#D1FAE5","#065F46"], Active: ["#DCFCE7","#166534"], Trial: ["#DBEAFE","#1E40AF"], "Past Due": ["#FEF3C7","#92400E"], Suspended: ["#FEE2E2","#991B1B"], Cancelled: ["#F3F4F6","#374151"], Pending: ["#FEF9C3","#854D0E"], Confirmed: ["#D1FAE5","#065F46"], Completed: ["#DBEAFE","#1E40AF"], Open: ["#DCFCE7","#166534"], Limited: ["#FEF9C3","#854D0E"], Full: ["#FEE2E2","#991B1B"], "Waitlist Only": ["#EDE9FE","#5B21B6"], "Out of Stock": ["#F3F4F6","#374151"] };
    const [bg, text] = map[color] || ["#F3F4F6","#374151"];
    return { display: "inline-block", padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, background: bg, color: text };
  },
  card: { background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "20px 24px" },
  input: { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14, fontFamily: "inherit", background: "#fff", boxSizing: "border-box" },
  select: { padding: "9px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14, fontFamily: "inherit", background: "#fff" },
  label: { fontSize: 13, fontWeight: 500, color: COLORS.gray600, marginBottom: 4, display: "block" },
  metricCard: (accent) => ({ background: accent ? accent : "#F8FAFC", borderRadius: 10, padding: "16px 20px", border: "1px solid #E2E8F0" }),
  th: { padding: "10px 14px", fontSize: 12, fontWeight: 600, color: COLORS.gray500, textAlign: "left", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" },
  td: { padding: "11px 14px", fontSize: 13, color: COLORS.gray800, borderBottom: "1px solid #F1F5F9" },
};

// ── Components ────────────────────────────────────────────────────────────
function NavLink({ label, active, onClick }) {
  return <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 14px", borderRadius: 8, fontSize: 14, fontWeight: active ? 600 : 400, color: active ? COLORS.blue : COLORS.gray600, background: active ? "#EFF6FF" : "transparent" }}>{label}</button>;
}

function SidebarLink({ icon, label, active, onClick }) {
  return <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: active ? "#1E3A5F" : "transparent", border: "none", borderRadius: 8, padding: "10px 12px", cursor: "pointer", color: active ? "#fff" : "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: active ? 600 : 400, marginBottom: 2 }}>
    <span style={{ fontSize: 16 }}>{icon}</span>{label}
  </button>;
}

function MetricCard({ label, value, sub, color }) {
  return <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "16px 18px", border: "1px solid #E2E8F0" }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || COLORS.gray900 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: COLORS.gray400, marginTop: 2 }}>{sub}</div>}
  </div>;
}

// ══════════════════════════════════════════════════════════════════════════
// VIEWS
// ══════════════════════════════════════════════════════════════════════════

// ── 1. PUBLIC LANDING PAGE ────────────────────────────────────────────────
function LandingPage({ nav }) {
  const features = [
    { icon: "🛞", title: "Online Tire Storefront", desc: "Your own branded tire shop website with searchable inventory, live pricing, and tire detail pages." },
    { icon: "📦", title: "Inventory Management", desc: "Track new and used tires by size, brand, condition, tread depth, and quantity in real time." },
    { icon: "🔎", title: "Tire Size Search", desc: "Customers search by tire size, vehicle, brand, or condition. Filter to exactly what they need." },
    { icon: "📋", title: "Online Reservations", desc: "Let customers reserve tires and hold them with a deposit — no more phone tag." },
    { icon: "📅", title: "Appointment Booking", desc: "Built-in installation scheduling with date/time picker and vehicle info collection." },
    { icon: "📊", title: "Shop Dashboard", desc: "Manage orders, appointments, customers, and inventory from one clean admin panel." },
    { icon: "📱", title: "Customer Notifications", desc: "Automated email (and SMS) updates on order status, appointment reminders, and confirmations." },
    { icon: "🎨", title: "Custom Storefront Design", desc: "Your storefront built and styled to match your brand — not a generic template." },
  ];
  const localPlans = [
    { name: "Early Partner", price: 149, highlight: false, paymentLink: "https://buy.stripe.com/test_5kQbJ033hcZd4333v68so00", features: ["Online tire storefront", "Inventory dashboard", "Online reservations", "Order management", "Basic SEO pages", "Email notifications"] },
    { name: "Growth Partner", price: 249, highlight: true, paymentLink: "https://buy.stripe.com/test_eVq00i47l9N17ff6Hi8so01", features: ["Everything in Early Partner", "Online deposits/payments", "Appointment booking", "CSV inventory upload", "Staff accounts", "SMS notifications"] },
    { name: "Market Leader", price: 399, highlight: false, paymentLink: "https://buy.stripe.com/test_28EdR85bp3oDczze9K8so02", features: ["Everything in Growth", "AI chatbot", "Custom domain support", "Promotions & coupons", "Advanced reporting", "Multi-location support", "Priority onboarding"] },
  ];
  const faqs = [
    ["Is TreadFlow open to any tire shop?", "No. TreadFlow is invite-only. We review each applicant for market fit and shop readiness before granting access."],
    ["How does the invite process work?", "Submit an application. Our team reviews your market and shop fit. If approved, you receive a private invite link to create your account."],
    ["Can I have my own domain?", "Yes — custom domain support is available on the Market Leader plan."],
    ["How long does setup take?", "Most shops are live within 5–10 business days after approval, including storefront design and inventory setup."],
    ["Do I own my customer data?", "Absolutely. Your customers, orders, and inventory data belong to you."],
  ];
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#fff" }}>
      {/* Nav */}
      <div style={{ background: COLORS.navy, padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: COLORS.orange, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 16 }}>T</div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>TreadFlow</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["Features","Pricing","Market Availability","FAQ"].map(l => <button key={l} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 14, padding: "8px 12px", cursor: "pointer" }}>{l}</button>)}
        </div>
        <button onClick={() => nav("invite")} style={{ ...S.btn("orange"), fontWeight: 700 }}>Request Invite →</button>
      </div>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0F2040 60%, #1a1a2e 100%)`, padding: "100px 40px 120px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", borderRadius: 99, padding: "5px 16px", fontSize: 13, color: COLORS.orange, fontWeight: 600, marginBottom: 20 }}>✦ Invite-Only Access · Limited Shops Per Market</div>
        <h1 style={{ fontSize: 52, fontWeight: 800, color: "#fff", margin: "0 auto 20px", lineHeight: 1.15, maxWidth: 800 }}>The Invite-Only Online Storefront Platform for Tire Shops</h1>
        <p style={{ fontSize: 20, color: "rgba(255,255,255,0.65)", maxWidth: 640, margin: "0 auto 40px", lineHeight: 1.6 }}>TreadFlow helps selected tire shops launch searchable online tire inventory, accept customer orders, and modernize their sales process before competitors catch up.</p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
          <button onClick={() => nav("invite")} style={{ ...S.btn("orange", "lg"), fontWeight: 700 }}>Request an Invite →</button>
          <button onClick={() => nav("market")} style={{ ...S.btn("ghost", "lg") }}>Check Market Availability</button>
        </div>
        <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 60, color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
          {["Invite-only access","Limited shops per market","Setup in under 10 days","Cancel anytime"].map(t => <span key={t}>✓ {t}</span>)}
        </div>
      </div>
      {/* Features */}
      <div style={{ padding: "80px 40px", background: COLORS.gray50 }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.blue, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Platform Features</div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: COLORS.gray900, margin: "0 auto 14px" }}>Everything your shop needs online</h2>
          <p style={{ color: COLORS.gray500, fontSize: 16, maxWidth: 540, margin: "0 auto" }}>From searchable inventory to online reservations and appointment booking — all in one platform built for serious tire shops.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, maxWidth: 1100, margin: "0 auto" }}>
          {features.map(f => <div key={f.title} style={{ ...S.card, background: "#fff" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.gray900, marginBottom: 6 }}>{f.title}</div>
            <div style={{ fontSize: 14, color: COLORS.gray500, lineHeight: 1.6 }}>{f.desc}</div>
          </div>)}
        </div>
      </div>
      {/* Market Availability */}
      <div style={{ background: COLORS.navy, padding: "70px 40px", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.orange, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Limited Market Availability</div>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Only one or two shops per market</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, maxWidth: 560, margin: "0 auto 30px" }}>We intentionally limit the number of tire shops per city to protect your competitive advantage. When your market fills up, it's closed.</p>
        <button onClick={() => nav("market")} style={{ ...S.btn("orange", "lg") }}>Check Your Market →</button>
      </div>
      {/* Pricing */}
      <div style={{ padding: "80px 40px", background: "#fff" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.blue, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Pricing</div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: COLORS.gray900, marginBottom: 10 }}>Application-based pricing</h2>
          <p style={{ color: COLORS.gray500 }}>Plans are assigned after your application is reviewed and approved.</p>
        </div>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", maxWidth: 1000, margin: "0 auto" }}>
          {localPlans.map(p => <div key={p.name} style={{ flex: "1 1 280px", maxWidth: 320, borderRadius: 16, border: p.highlight ? `2px solid ${COLORS.blue}` : "1px solid #E2E8F0", padding: "32px 28px", background: p.highlight ? "#F0F7FF" : "#fff", position: "relative" }}>
            {p.highlight && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: COLORS.blue, color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 14px", borderRadius: 99 }}>Most Popular</div>}
            <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.gray900, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: p.highlight ? COLORS.blue : COLORS.gray900 }}>${p.price}<span style={{ fontSize: 16, fontWeight: 400, color: COLORS.gray400 }}>/mo</span></div>
            <div style={{ borderTop: "1px solid #E2E8F0", margin: "20px 0" }} />
            {p.features.map(f => <div key={f} style={{ display: "flex", gap: 8, fontSize: 14, color: COLORS.gray700, marginBottom: 8 }}><span style={{ color: COLORS.green }}>✓</span>{f}</div>)}
            <button onClick={() => redirectToCheckout(p.paymentLink)} style={{ ...S.btn(p.highlight ? "primary" : "secondary"), width: "100%", justifyContent: "center", marginTop: 20 }}>Get Started →</button>
          </div>)}
        </div>
        <div style={{ textAlign: "center", marginTop: 40, color: COLORS.gray500, fontSize: 13 }}>
          Optional setup services: Custom Storefront Design $499–$1,500 · Inventory Import $149+ · SEO Setup $299+ · Premium Design $999+
        </div>
      </div>
      {/* FAQ */}
      <div style={{ padding: "70px 40px", background: COLORS.gray50, maxWidth: 760, margin: "0 auto" }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, textAlign: "center", marginBottom: 36, color: COLORS.gray900 }}>Frequently asked questions</h2>
        {faqs.map(([q, a]) => <div key={q} style={{ marginBottom: 20, ...S.card }}>
          <div style={{ fontWeight: 700, color: COLORS.gray900, marginBottom: 6 }}>{q}</div>
          <div style={{ fontSize: 14, color: COLORS.gray500, lineHeight: 1.6 }}>{a}</div>
        </div>)}
      </div>
      {/* CTA */}
      <div style={{ background: COLORS.navy, padding: "80px 40px", textAlign: "center" }}>
        <h2 style={{ fontSize: 40, fontWeight: 800, color: "#fff", marginBottom: 16 }}>Launch your tire shop online<br/>before competitors catch up.</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 32, fontSize: 16 }}>Apply now. Only selected shops are accepted per market.</p>
        <button onClick={() => nav("invite")} style={{ ...S.btn("orange", "lg"), fontWeight: 700 }}>Request an Invite →</button>
      </div>
      {/* Footer */}
      <div style={{ background: "#060E1E", padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>© 2026 TreadFlow · Invite-Only Platform</div>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy","Terms","Contact"].map(l => <span key={l} style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}>{l}</span>)}
        </div>
      </div>
    </div>
  );
}

// ── 2. REQUEST INVITE ────────────────────────────────────────────────────
function InvitePage({ nav }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ shopName: "", ownerName: "", phone: "", email: "", address: "", city: "", state: "", locations: "1", website: "", tireType: "Both", inventory: "", currentMethod: "Spreadsheets", online: "No", installation: "Yes", features: [], notes: "" });
  const features = ["Online tire storefront","Inventory management","Online ordering","Appointment booking","Payments/deposits","AI chatbot","SEO/local marketing"];
  const set = (k, v) => setForm(f => ({...f, [k]: v}));
  const toggleFeat = f => set("features", form.features.includes(f) ? form.features.filter(x => x !== f) : [...form.features, f]);
  if (step === 2) return (
    <div style={{ minHeight: "100vh", background: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "60px 48px", textAlign: "center", maxWidth: 520 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.orange, letterSpacing: 1, marginBottom: 12 }}>APPLICATION RECEIVED</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: COLORS.gray900, marginBottom: 16 }}>We'll be in touch soon.</h2>
        <p style={{ color: COLORS.gray500, fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>Our team will review your market and shop fit. If approved, you'll receive a private invite link to your email address. <strong>Allow 3–5 business days.</strong></p>
        <div style={{ background: COLORS.gray50, borderRadius: 12, padding: "16px 20px", fontSize: 14, color: COLORS.gray600, marginBottom: 28 }}>Application submitted for: <strong>{form.shopName}</strong><br/>Market: <strong>{form.city}, {form.state}</strong></div>
        <button onClick={() => nav("home")} style={{ ...S.btn("primary", "lg"), width: "100%", justifyContent: "center" }}>Return to TreadFlow</button>
      </div>
    </div>
  );
  return (
    <div style={{ minHeight: "100vh", background: COLORS.navy, padding: "60px 20px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <button onClick={() => nav("home")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14, marginBottom: 24 }}>← Back to TreadFlow</button>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.orange, letterSpacing: 1, marginBottom: 8 }}>INVITE-ONLY APPLICATION</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 10 }}>Request Access to TreadFlow</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15 }}>Tell us about your shop. We review every application personally.</p>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: "36px 36px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[["shopName","Shop Name"],["ownerName","Owner Name"],["phone","Phone Number"],["email","Email Address"],["address","Shop Address"],["city","City"],["state","State"],["website","Current Website URL"]].map(([k, l]) => <div key={k} style={k === "address" || k === "website" ? { gridColumn: "1/-1" } : {}}>
              <label style={S.label}>{l}</label>
              <input style={S.input} value={form[k]} onChange={e => set(k, e.target.value)} />
            </div>)}
            <div>
              <label style={S.label}>Number of Locations</label>
              <select style={{...S.select, width:"100%"}} value={form.locations} onChange={e => set("locations", e.target.value)}>
                {["1","2","3","4","5+"].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Tires Sold</label>
              <select style={{...S.select, width:"100%"}} value={form.tireType} onChange={e => set("tireType", e.target.value)}>
                {["New","Used","Both"].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Approx. Tires in Inventory</label>
              <select style={{...S.select, width:"100%"}} value={form.inventory} onChange={e => set("inventory", e.target.value)}>
                {["Under 50","50–100","100–200","200–500","500+"].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Current Inventory Method</label>
              <select style={{...S.select, width:"100%"}} value={form.currentMethod} onChange={e => set("currentMethod", e.target.value)}>
                {["Spreadsheets","Paper","POS Software","None","Other"].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Accept Online Orders Now?</label>
              <select style={{...S.select, width:"100%"}} value={form.online} onChange={e => set("online", e.target.value)}>
                {["Yes","No"].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Offer Installation?</label>
              <select style={{...S.select, width:"100%"}} value={form.installation} onChange={e => set("installation", e.target.value)}>
                {["Yes","No"].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <label style={S.label}>Features interested in (select all)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {features.map(f => <button key={f} onClick={() => toggleFeat(f)} style={{ padding: "6px 14px", borderRadius: 99, fontSize: 13, cursor: "pointer", border: `1px solid ${form.features.includes(f) ? COLORS.blue : COLORS.gray300}`, background: form.features.includes(f) ? "#EFF6FF" : "#fff", color: form.features.includes(f) ? COLORS.blue : COLORS.gray600, fontWeight: form.features.includes(f) ? 600 : 400 }}>{f}</button>)}
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={S.label}>Additional Notes</label>
            <textarea style={{ ...S.input, height: 80, resize: "vertical" }} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
          <button onClick={() => setStep(2)} style={{ ...S.btn("orange", "lg"), width: "100%", justifyContent: "center", marginTop: 24, fontWeight: 700 }}>Submit Application →</button>
        </div>
      </div>
    </div>
  );
}

// ── 3. MARKET AVAILABILITY ────────────────────────────────────────────────
function MarketPage({ nav }) {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [result, setResult] = useState(null);
  const check = () => {
    const found = mockMarkets.find(m => m.city.toLowerCase() === city.toLowerCase() && m.state.toLowerCase() === state.toLowerCase());
    if (!found) setResult("open");
    else if (found.status === "Full" || found.status === "Waitlist Only") setResult("full");
    else if (found.status === "Limited") setResult("limited");
    else setResult("open");
  };
  const results = {
    open: { label: "Market Available", color: COLORS.green, icon: "✓", msg: "Your market may be available. Apply now to secure your spot before it fills." },
    limited: { label: "Limited Spots Remaining", color: COLORS.yellow, icon: "⚡", msg: "We are accepting a small number of shops in your market. Act fast." },
    full: { label: "Market Currently Full", color: COLORS.red, icon: "✕", msg: "This market is currently waitlist only. Submit an application to be notified if a spot opens." },
  };
  return (
    <div style={{ minHeight: "100vh", background: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "50px 44px", maxWidth: 480, width: "100%" }}>
        <button onClick={() => nav("home")} style={{ background: "none", border: "none", color: COLORS.gray400, cursor: "pointer", fontSize: 13, marginBottom: 16 }}>← Back</button>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.orange, letterSpacing: 1, marginBottom: 10 }}>MARKET AVAILABILITY</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: COLORS.gray900, marginBottom: 6 }}>Check your market</h2>
        <p style={{ fontSize: 14, color: COLORS.gray500, marginBottom: 28 }}>We limit the number of shops per city to protect your competitive advantage.</p>
        <label style={S.label}>City</label>
        <input style={{ ...S.input, marginBottom: 14 }} placeholder="e.g. Greenville" value={city} onChange={e => setCity(e.target.value)} />
        <label style={S.label}>State</label>
        <input style={{ ...S.input, marginBottom: 20 }} placeholder="e.g. SC" value={state} onChange={e => setState(e.target.value)} />
        <button onClick={check} style={{ ...S.btn("primary", "lg"), width: "100%", justifyContent: "center" }}>Check Availability</button>
        {result && <div style={{ marginTop: 28, background: result === "open" ? "#F0FDF4" : result === "limited" ? "#FFFBEB" : "#FEF2F2", borderRadius: 12, padding: "20px 24px", border: `1px solid ${results[result].color}30` }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: results[result].color, marginBottom: 6 }}>{results[result].icon} {results[result].label}</div>
          <p style={{ fontSize: 14, color: COLORS.gray700, marginBottom: 16 }}>{results[result].msg}</p>
          <button onClick={() => nav("invite")} style={{ ...S.btn("primary"), width: "100%", justifyContent: "center" }}>Apply for Access</button>
        </div>}
        <div style={{ marginTop: 24, borderTop: "1px solid #E2E8F0", paddingTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray600, marginBottom: 12 }}>Current market snapshot</div>
          {mockMarkets.slice(0, 4).map(m => <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: COLORS.gray700 }}>{m.city}, {m.state}</span>
            <span style={S.badge(m.status)}>{m.status}</span>
          </div>)}
        </div>
      </div>
    </div>
  );
}

// ── 4. SUPER ADMIN ───────────────────────────────────────────────────────
function SuperAdmin({ nav }) {
  const [section, setSection] = useState("overview");
  const [apps, setApps] = useState(mockApplications);
  const [shops, setShops] = useState(mockShops);
  const [selectedApp, setSelectedApp] = useState(null);
  const [designShop, setDesignShop] = useState(null);
  const [toast, setToast] = useState(null);
  const [appFilter, setAppFilter] = useState("All");

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2800); };
  const updateAppStatus = (id, status) => { setApps(a => a.map(x => x.id === id ? {...x, status} : x)); showToast(`Application status updated to ${status}`); setSelectedApp(null); };

  const sidebar = [
    ["overview","📊","Overview"],["applications","📋","Applications"],["shops","🏪","Shops"],["markets","📍","Markets"],["design","🎨","Storefront Design Studio"],["plans","💳","Plans & Billing"],["orders","📦","Orders"],["settings","⚙️","Settings"],
  ];

  const filteredApps = appFilter === "All" ? apps : apps.filter(a => a.status === appFilter);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "system-ui, sans-serif", background: COLORS.gray50, position: "relative" }}>
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, background: COLORS.gray900, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>{toast}</div>}
      {/* Sidebar */}
      <div style={{ width: 220, background: COLORS.navy, padding: "20px 12px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px 24px" }}>
          <div style={{ width: 30, height: 30, background: COLORS.orange, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 14 }}>T</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>TreadFlow</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Super Admin</div>
          </div>
        </div>
        {sidebar.map(([id, icon, label]) => <SidebarLink key={id} icon={icon} label={label} active={section === id} onClick={() => { setSection(id); setSelectedApp(null); }} />)}
        <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12 }}>
          <button onClick={() => nav("home")} style={{ ...S.btn("ghost", "sm"), width: "100%", justifyContent: "center", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}>← Public Site</button>
        </div>
      </div>
      {/* Main */}
      <div style={{ flex: 1, overflow: "auto", padding: 28 }}>
        {section === "overview" && <AdminOverview shops={shops} apps={apps} nav={nav} setSection={setSection} />}
        {section === "applications" && !selectedApp && <ApplicationsList apps={filteredApps} allApps={apps} filter={appFilter} setFilter={setAppFilter} onSelect={setSelectedApp} />}
        {section === "applications" && selectedApp && <ApplicationDetail app={selectedApp} onBack={() => setSelectedApp(null)} onAction={updateAppStatus} />}
        {section === "shops" && <ShopsList shops={shops} onDesign={s => { setDesignShop(s); setSection("design"); }} onView={s => nav("storefront")} showToast={showToast} />}
        {section === "markets" && <MarketsPage showToast={showToast} />}
        {section === "design" && <StorefrontStudio shop={designShop || shops[0]} shops={shops} onShopChange={setDesignShop} showToast={showToast} />}
        {section === "plans" && <PlansPage />}
        {section === "orders" && <AdminOrders />}
        {section === "settings" && <AdminSettings />}
      </div>
    </div>
  );
}

function AdminOverview({ shops, apps, setSection }) {
  const metrics = [
    { label: "Total Shops", value: shops.length, color: COLORS.blue },
    { label: "Active Shops", value: shops.filter(s => s.status === "Active").length, color: COLORS.green },
    { label: "Monthly MRR", value: `$${shops.reduce((a, s) => a + s.mrr, 0).toLocaleString()}`, color: COLORS.orange },
    { label: "Pending Applications", value: apps.filter(a => ["New","Reviewing"].includes(a.status)).length, color: COLORS.purple },
    { label: "Total Tire Listings", value: shops.reduce((a, s) => a + s.tires, 0), color: COLORS.blue },
    { label: "Total Orders", value: shops.reduce((a, s) => a + s.orders, 0), color: COLORS.gray700 },
    { label: "Trial Shops", value: shops.filter(s => s.status === "Trial").length },
    { label: "Waitlisted Apps", value: apps.filter(a => a.status === "Waitlisted").length },
  ];
  return <div>
    <div style={{ marginBottom: 24 }}><h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Platform Overview</h2><p style={{ color: COLORS.gray500, marginTop: 4 }}>Real-time snapshot of TreadFlow</p></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
      {metrics.map(m => <MetricCard key={m.label} {...m} />)}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Recent Applications</div>
        {mockApplications.slice(0, 4).map(a => <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
          <div><div style={{ fontSize: 14, fontWeight: 600 }}>{a.shop}</div><div style={{ fontSize: 12, color: COLORS.gray400 }}>{a.city}, {a.state}</div></div>
          <span style={S.badge(a.status)}>{a.status}</span>
        </div>)}
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Active Shops</div>
        {mockShops.map(s => <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
          <div><div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div><div style={{ fontSize: 12, color: COLORS.gray400 }}>{s.plan} · {s.tires} tires</div></div>
          <span style={S.badge(s.status)}>{s.status}</span>
        </div>)}
      </div>
    </div>
  </div>;
}

function ApplicationsList({ apps, allApps, filter, setFilter, onSelect }) {
  const statuses = ["All", "New", "Reviewing", "Approved", "Waitlisted", "Rejected", "Invited"];
  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div><h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Applications</h2><p style={{ color: COLORS.gray500, marginTop: 4 }}>{allApps.length} total applications</p></div>
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
      {statuses.map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: "5px 14px", borderRadius: 99, fontSize: 13, cursor: "pointer", border: `1px solid ${filter === s ? COLORS.blue : COLORS.gray300}`, background: filter === s ? "#EFF6FF" : "#fff", color: filter === s ? COLORS.blue : COLORS.gray600, fontWeight: filter === s ? 600 : 400 }}>{s}</button>)}
    </div>
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Shop","Owner","Location","Plan Interest","Status","Date",""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{apps.map(a => <tr key={a.id} style={{ cursor: "pointer" }} onClick={() => onSelect(a)}>
          <td style={S.td}><div style={{ fontWeight: 600 }}>{a.shop}</div></td>
          <td style={S.td}>{a.owner}</td>
          <td style={S.td}>{a.city}, {a.state}</td>
          <td style={S.td}>{a.plan || <span style={{ color: COLORS.gray400 }}>—</span>}</td>
          <td style={S.td}><span style={S.badge(a.status)}>{a.status}</span></td>
          <td style={S.td}>{a.date}</td>
          <td style={S.td}><button style={{ ...S.btn("ghost", "sm") }}>Review →</button></td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}

function ApplicationDetail({ app, onBack, onAction }) {
  const [note, setNote] = useState("");
  const [plan, setPlan] = useState(app.plan || "Early Partner");
  return <div>
    <button onClick={onBack} style={{ background: "none", border: "none", color: COLORS.blue, cursor: "pointer", fontSize: 14, marginBottom: 20 }}>← Back to Applications</button>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{app.shop}</div>
        <div style={{ color: COLORS.gray500, fontSize: 14, marginBottom: 20 }}>Application submitted {app.date}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[["Owner", app.owner],["Email", app.email],["Phone", app.phone],["Location", `${app.city}, ${app.state}`],["Tire Types", app.tires],["Inventory Size", app.inventory],["Market", app.market],["Current Status", <span style={S.badge(app.status)}>{app.status}</span>]].map(([k, v]) => <div key={k}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray400, marginBottom: 2 }}>{k}</div>
            <div style={{ fontSize: 14, color: COLORS.gray800 }}>{v}</div>
          </div>)}
        </div>
        <div style={{ marginTop: 20 }}>
          <label style={S.label}>Internal Notes</label>
          <textarea style={{ ...S.input, height: 80, resize: "vertical" }} value={note} onChange={e => setNote(e.target.value)} placeholder="Add review notes..." />
        </div>
      </div>
      <div>
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Actions</div>
          <label style={S.label}>Assign Plan</label>
          <select style={{ ...S.select, width: "100%", marginBottom: 16 }} value={plan} onChange={e => setPlan(e.target.value)}>
            {["Early Partner","Growth Partner","Market Leader"].map(p => <option key={p}>{p}</option>)}
          </select>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => onAction(app.id, "Approved")} style={{ ...S.btn("primary"), justifyContent: "center" }}>✓ Approve Application</button>
            <button onClick={() => onAction(app.id, "Invited")} style={{ ...S.btn("primary"), justifyContent: "center", background: COLORS.purple }}>✉ Generate & Send Invite</button>
            <button onClick={() => onAction(app.id, "Waitlisted")} style={{ ...S.btn("secondary"), justifyContent: "center" }}>⏳ Waitlist</button>
            <button onClick={() => onAction(app.id, "Rejected")} style={{ ...S.btn("danger"), justifyContent: "center" }}>✕ Reject</button>
          </div>
          {app.status === "Approved" && <div style={{ marginTop: 16, background: "#F0FDF4", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.green, marginBottom: 4 }}>INVITE CODE</div>
            <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, letterSpacing: 2, color: COLORS.gray800 }}>TF-SC-{Math.random().toString(36).substring(2, 8).toUpperCase()}</div>
            <div style={{ fontSize: 12, color: COLORS.gray400, marginTop: 4 }}>Expires in 14 days</div>
          </div>}
        </div>
      </div>
    </div>
  </div>;
}

function ShopsList({ shops, onDesign, onView, showToast }) {
  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div><h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Shops</h2><p style={{ color: COLORS.gray500, marginTop: 4 }}>{shops.length} shops on platform</p></div>
    </div>
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Shop","Owner","Plan","MRR","Tires","Orders","Status","Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{shops.map(s => <tr key={s.id}>
          <td style={S.td}><div style={{ fontWeight: 600 }}>{s.name}</div><div style={{ fontSize: 12, color: COLORS.gray400 }}>{s.city}, {s.state}</div></td>
          <td style={S.td}>{s.owner}</td>
          <td style={S.td}><span style={{ fontSize: 13, fontWeight: 600, color: COLORS.blue }}>{s.plan}</span></td>
          <td style={S.td}><span style={{ color: COLORS.green, fontWeight: 700 }}>${s.mrr}</span></td>
          <td style={S.td}>{s.tires}</td>
          <td style={S.td}>{s.orders}</td>
          <td style={S.td}><span style={S.badge(s.status)}>{s.status}</span></td>
          <td style={S.td}>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => onView(s)} style={{ ...S.btn("ghost", "sm") }}>View</button>
              <button onClick={() => onDesign(s)} style={{ ...S.btn("primary", "sm") }}>Design</button>
              <button onClick={() => showToast(`${s.name} suspended`)} style={{ ...S.btn("danger", "sm") }}>Suspend</button>
            </div>
          </td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}

function MarketsPage({ showToast }) {
  const [markets, setMarkets] = useState(mockMarkets);
  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div><h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Markets</h2><p style={{ color: COLORS.gray500, marginTop: 4 }}>Manage market availability and capacity</p></div>
      <button onClick={() => showToast("Add market form coming soon")} style={S.btn("primary")}>+ Add Market</button>
    </div>
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Market","City","State","Capacity","Active","Status","Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{markets.map(m => <tr key={m.id}>
          <td style={S.td}><div style={{ fontWeight: 600 }}>{m.name}</div></td>
          <td style={S.td}>{m.city}</td>
          <td style={S.td}>{m.state}</td>
          <td style={S.td}>{m.active}/{m.max}</td>
          <td style={S.td}><div style={{ background: "#E2E8F0", borderRadius: 4, height: 6, width: 80 }}><div style={{ height: "100%", borderRadius: 4, background: m.active / m.max > 0.8 ? COLORS.red : COLORS.green, width: `${(m.active / m.max) * 100}%` }} /></div></td>
          <td style={S.td}><span style={S.badge(m.status)}>{m.status}</span></td>
          <td style={S.td}><button onClick={() => showToast("Market editor opened")} style={{ ...S.btn("ghost", "sm") }}>Edit</button></td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}

function StorefrontStudio({ shop, shops, onShopChange, showToast }) {
  const [primary, setPrimary] = useState("#1E6FD9");
  const [secondary, setSecondary] = useState("#F97316");
  const [hero, setHero] = useState(storefront.hero);
  const [heroSub, setHeroSub] = useState(storefront.heroSub);
  const [template, setTemplate] = useState("Local Trust");
  const [preview, setPreview] = useState("desktop");
  const [tab, setTab] = useState("brand");
  const templates = ["Modern Performance","Local Trust","Used Tire Deals","Premium Auto Service","Fleet/Commercial"];
  const tabs = ["brand","content","layout","sections"];
  const sections = ["Hero","Tire Search","Featured Tires","Services","Reviews","About","FAQ","Contact","Map","CTA Banner"];
  const [vis, setVis] = useState(sections.reduce((a, s) => ({...a, [s]: true}), {}));

  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Storefront Design Studio</h2>
        <p style={{ color: COLORS.gray500, marginTop: 4, fontSize: 14 }}>Customize the public storefront for each shop client</p>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <select style={S.select} value={shop?.name} onChange={e => onShopChange(shops.find(s => s.name === e.target.value))}>
          {shops.map(s => <option key={s.id}>{s.name}</option>)}
        </select>
        <button onClick={() => showToast("Draft saved")} style={S.btn("secondary")}>Save Draft</button>
        <button onClick={() => showToast("Changes published live!")} style={S.btn("primary")}>Publish Live →</button>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
      {/* Controls */}
      <div style={S.card}>
        <div style={{ display: "flex", gap: 6, marginBottom: 18, borderBottom: "1px solid #E2E8F0", paddingBottom: 14 }}>
          {tabs.map(t => <button key={t} onClick={() => setTab(t)} style={{ fontSize: 13, padding: "5px 12px", borderRadius: 7, cursor: "pointer", border: "none", background: tab === t ? COLORS.navy : COLORS.gray100, color: tab === t ? "#fff" : COLORS.gray600, fontWeight: tab === t ? 600 : 400, textTransform: "capitalize" }}>{t}</button>)}
        </div>
        {tab === "brand" && <div>
          <label style={S.label}>Template</label>
          <select style={{ ...S.select, width: "100%", marginBottom: 14 }} value={template} onChange={e => setTemplate(e.target.value)}>
            {templates.map(t => <option key={t}>{t}</option>)}
          </select>
          <label style={S.label}>Primary Color</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
            <input type="color" value={primary} onChange={e => setPrimary(e.target.value)} style={{ width: 40, height: 36, borderRadius: 6, border: "1px solid #E2E8F0", cursor: "pointer" }} />
            <input style={{ ...S.input, flex: 1 }} value={primary} onChange={e => setPrimary(e.target.value)} />
          </div>
          <label style={S.label}>Accent Color</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
            <input type="color" value={secondary} onChange={e => setSecondary(e.target.value)} style={{ width: 40, height: 36, borderRadius: 6, border: "1px solid #E2E8F0", cursor: "pointer" }} />
            <input style={{ ...S.input, flex: 1 }} value={secondary} onChange={e => setSecondary(e.target.value)} />
          </div>
          {[["Font Style","System Sans","System Serif","Mono"],["Button Style","Rounded","Square","Pill"],["Card Style","Flat","Bordered","Shadow"]].map(([l, ...opts]) => <div key={l} style={{ marginBottom: 14 }}>
            <label style={S.label}>{l}</label>
            <select style={{ ...S.select, width: "100%" }}>{opts.map(o => <option key={o}>{o}</option>)}</select>
          </div>)}
        </div>}
        {tab === "content" && <div>
          <label style={S.label}>Hero Headline</label>
          <input style={{ ...S.input, marginBottom: 12 }} value={hero} onChange={e => setHero(e.target.value)} />
          <label style={S.label}>Hero Subheadline</label>
          <textarea style={{ ...S.input, height: 80, resize: "vertical", marginBottom: 12 }} value={heroSub} onChange={e => setHeroSub(e.target.value)} />
          <label style={S.label}>CTA Button Text</label>
          <input style={{ ...S.input, marginBottom: 12 }} defaultValue="Search Our Tire Inventory" />
          <label style={S.label}>Announcement Bar</label>
          <input style={{ ...S.input, marginBottom: 12 }} defaultValue="🏷️ Free installation on sets of 4!" />
          <label style={S.label}>Financing Message</label>
          <input style={{ ...S.input, marginBottom: 12 }} defaultValue="12 months same-as-cash financing available" />
        </div>}
        {tab === "layout" && <div>
          <label style={S.label}>Homepage Template</label>
          <select style={{ ...S.select, width: "100%", marginBottom: 14 }} value={template} onChange={e => setTemplate(e.target.value)}>
            {templates.map(t => <option key={t}>{t}</option>)}
          </select>
          <label style={S.label}>Tire Card Design</label>
          <select style={{ ...S.select, width: "100%", marginBottom: 14 }}><option>Large Grid</option><option>Compact List</option><option>Detailed Card</option></select>
          <label style={S.label}>Client Edit Permissions</label>
          {["Can edit business info","Can edit services","Can edit homepage text","Can edit promotions"].map(p => <label key={p} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, fontSize: 14, color: COLORS.gray700, cursor: "pointer" }}>
            <input type="checkbox" defaultChecked style={{ accentColor: COLORS.blue }} />{p}
          </label>)}
        </div>}
        {tab === "sections" && <div>
          <div style={{ fontSize: 13, color: COLORS.gray500, marginBottom: 12 }}>Show/hide homepage sections</div>
          {sections.map(s => <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: COLORS.gray700 }}>{s}</span>
            <label style={{ position: "relative", display: "inline-block", width: 36, height: 20, cursor: "pointer" }}>
              <input type="checkbox" checked={vis[s]} onChange={() => setVis(v => ({...v, [s]: !v[s]}))} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: "absolute", inset: 0, background: vis[s] ? COLORS.blue : COLORS.gray300, borderRadius: 99, transition: "0.2s" }}><span style={{ position: "absolute", left: vis[s] ? 18 : 2, top: 2, width: 16, height: 16, background: "#fff", borderRadius: 99, transition: "0.2s" }} /></span>
            </label>
          </div>)}
        </div>}
      </div>
      {/* Preview */}
      <div style={S.card}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["desktop","tablet","mobile"].map(p => <button key={p} onClick={() => setPreview(p)} style={{ ...S.btn(preview === p ? "primary" : "secondary", "sm"), textTransform: "capitalize" }}>{p === "desktop" ? "🖥" : p === "tablet" ? "📱" : "📲"} {p}</button>)}
          <div style={{ marginLeft: "auto", fontSize: 12, color: COLORS.gray400, alignSelf: "center" }}>Live preview · {shop?.name}</div>
        </div>
        <div style={{ background: "#F8FAFC", borderRadius: 8, padding: 10, overflow: "hidden" }}>
          <div style={{ maxWidth: preview === "desktop" ? "100%" : preview === "tablet" ? 480 : 320, margin: "0 auto", background: "#fff", borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0" }}>
            {/* Mini storefront preview */}
            <div style={{ background: primary, padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{shop?.name || "Shop Name"}</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["Inventory","Services","Contact"].map(l => <span key={l} style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{l}</span>)}
              </div>
            </div>
            {vis["Hero"] && <div style={{ background: COLORS.navy, padding: "24px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6, lineHeight: 1.3 }}>{hero}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 12, lineHeight: 1.5 }}>{heroSub.substring(0, 80)}...</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button style={{ background: secondary, border: "none", color: "#fff", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Search Tires</button>
                <button style={{ background: "transparent", border: `1px solid rgba(255,255,255,0.4)`, color: "#fff", padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Call Now</button>
              </div>
            </div>}
            {vis["Featured Tires"] && <div style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray700, marginBottom: 8 }}>Featured Tires</div>
              <div style={{ display: "grid", gridTemplateColumns: preview === "mobile" ? "1fr" : "1fr 1fr", gap: 8 }}>
                {mockTires.slice(0,2).map(t => <div key={t.id} style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ background: "#F1F5F9", borderRadius: 6, height: 60, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 6 }}>🛞</div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{t.brand} {t.model}</div>
                  <div style={{ fontSize: 11, color: COLORS.gray500 }}>{t.size} · {t.condition}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: primary, marginTop: 4 }}>${t.price}</div>
                </div>)}
              </div>
            </div>}
            {vis["Services"] && <div style={{ background: COLORS.gray50, padding: "10px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gray700, marginBottom: 6 }}>Services</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Tire Installation","Balancing","Rotation","Flat Repair"].map(s => <span key={s} style={{ fontSize: 11, padding: "3px 8px", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 4 }}>{s}</span>)}
              </div>
            </div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={() => showToast("Version saved to history")} style={{ ...S.btn("secondary", "sm") }}>Save Version</button>
          <button onClick={() => showToast("Reverted to last published version")} style={{ ...S.btn("secondary", "sm") }}>Revert</button>
          <div style={{ marginLeft: "auto" }}><button onClick={() => showToast("Design published live!")} style={{ ...S.btn("primary") }}>Publish Changes →</button></div>
        </div>
      </div>
    </div>
  </div>;
}

function PlansPage() {
  return <div>
    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Plans & Billing</h2>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
      {[{name:"Early Partner",price:149,shops:1},{name:"Growth Partner",price:249,shops:1},{name:"Market Leader",price:399,shops:3}].map(p => <div key={p.name} style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.blue, margin: "8px 0" }}>${p.price}<span style={{ fontSize: 14, fontWeight: 400, color: COLORS.gray400 }}>/mo</span></div>
        <div style={{ fontSize: 13, color: COLORS.gray500 }}>{mockShops.filter((_, i) => i < p.shops).length} shops on this plan</div>
      </div>)}
    </div>
    <div style={{ ...S.card, marginTop: 20 }}>
      <div style={{ fontWeight: 700, marginBottom: 16 }}>Shop Subscriptions</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Shop","Plan","MRR","Status","Next Bill"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{mockShops.map(s => <tr key={s.id}>
          <td style={S.td}>{s.name}</td>
          <td style={S.td}>{s.plan}</td>
          <td style={{ ...S.td, color: COLORS.green, fontWeight: 700 }}>${s.mrr}</td>
          <td style={S.td}><span style={S.badge(s.status)}>{s.status}</span></td>
          <td style={S.td}>Jun 1, 2026</td>
        </tr>)}
        <tr style={{ background: COLORS.gray50 }}>
          <td style={{ ...S.td, fontWeight: 700 }}>Total MRR</td>
          <td style={S.td}></td>
          <td style={{ ...S.td, color: COLORS.green, fontWeight: 800, fontSize: 16 }}>${mockShops.reduce((a,s)=>a+s.mrr,0)}</td>
          <td style={S.td}></td><td style={S.td}></td>
        </tr></tbody>
      </table>
    </div>
  </div>;
}

function AdminOrders() {
  return <div>
    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>All Orders</h2>
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Order","Customer","Shop","Tire","Total","Status","Date"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{mockOrders.map(o => <tr key={o.id}>
          <td style={{ ...S.td, fontWeight: 700, color: COLORS.blue }}>{o.id}</td>
          <td style={S.td}>{o.customer}</td>
          <td style={S.td}>Greenville Tire Pros</td>
          <td style={S.td}><div style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.tire}</div></td>
          <td style={{ ...S.td, fontWeight: 700 }}>${o.total}</td>
          <td style={S.td}><span style={S.badge(o.status)}>{o.status}</span></td>
          <td style={S.td}>{o.date}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}

function AdminSettings() {
  return <div>
    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Platform Settings</h2>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {[["Platform Name","TreadFlow"],["Support Email","support@treadflow.io"],["Default Invite Expiry","14 days"],["Max Shops Per Market","3"]].map(([l, v]) => <div key={l} style={S.card}>
        <label style={S.label}>{l}</label>
        <input style={S.input} defaultValue={v} />
      </div>)}
    </div>
    <div style={{ ...S.card, marginTop: 20 }}>
      <div style={{ fontWeight: 700, marginBottom: 16 }}>Database Schema</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {["platform_users","shops","shop_users","staff_invitations","invite_applications","invite_codes","markets","tires","tire_photos","orders","order_items","customers","appointments","shop_settings","storefront_templates","storefront_settings","storefront_sections","storefront_theme_versions","subscriptions","plans","payments","support_tickets","audit_logs"].map(t => <span key={t} style={{ background: COLORS.navy, color: "#93C5FD", fontSize: 12, padding: "3px 10px", borderRadius: 5, fontFamily: "monospace" }}>{t}</span>)}
      </div>
      <p style={{ fontSize: 13, color: COLORS.gray500, marginTop: 12 }}>All shop-owned tables include <code style={{ background: COLORS.gray100, padding: "1px 5px", borderRadius: 4 }}>shop_id</code> for multi-tenant isolation. Users can only access data for their own shop.</p>
    </div>
  </div>;
}

// ── 5. SHOP DASHBOARD ─────────────────────────────────────────────────────
function ShopDashboard({ nav }) {
  const [section, setSection] = useState("overview");
  const [tires, setTires] = useState([]);
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState(null);
  const [selectedTire, setSelectedTire] = useState(null);
  const [shopRecord, setShopRecord] = useState(null);
  const [shopLoading, setShopLoading] = useState(true);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setShopLoading(true);
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (cancelled) return;
      if (userErr || !user?.email) {
        setShopRecord(null);
        setShopLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("shops")
        .select("id, name, owner_name, email, city, state, status, plan, slug")
        .eq("email", user.email)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn("Shop lookup failed:", error);
        setShopRecord(null);
      } else {
        setShopRecord(data);
      }
      setShopLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const shopId = shopRecord?.id ?? null;
  const shopInitial = ((shopRecord?.name || "?").trim().charAt(0) || "?").toUpperCase();
  const shopLocationLine = shopRecord ? [shopRecord.city, shopRecord.state].filter(Boolean).join(", ") : "";

  const sidebar = [
    ["overview","📊","Overview"],["inventory","📦","Inventory"],["orders","📋","Orders"],["appointments","📅","Appointments"],["customers","👥","Customers"],["staff","👤","Staff"],["settings","⚙️","Settings"],["billing","💳","Billing"],
  ];

  if (shopLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", background: COLORS.gray50, color: COLORS.gray600 }}>
        Loading shop…
      </div>
    );
  }

  if (!shopRecord) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", background: COLORS.gray50 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: "40px 48px", maxWidth: 440, textAlign: "center", border: `1px solid ${COLORS.gray200}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏪</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 12px", color: COLORS.gray900 }}>Shop not found</h2>
          <p style={{ color: COLORS.gray500, fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>We could not find a tire shop linked to your login email in <code style={{ fontSize: 13, background: COLORS.gray100, padding: "2px 6px", borderRadius: 4 }}>shops.email</code>. Contact support if you believe this is an error.</p>
          <button type="button" onClick={async () => { await supabase.auth.signOut(); nav("login"); }} style={{ ...S.btn("primary", "lg"), width: "100%", justifyContent: "center" }}>
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "system-ui, sans-serif", background: COLORS.gray50, position: "relative" }}>
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, background: COLORS.gray900, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, zIndex: 999 }}>{toast}</div>}
      <div style={{ width: 220, background: "#0A1628", padding: "20px 12px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px 24px" }}>
          <div style={{ width: 30, height: 30, background: COLORS.blue, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 14 }}>{shopInitial}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, lineHeight: 1.25 }} title={shopRecord.name}>{shopRecord.name}</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Shop Dashboard</div>
          </div>
        </div>
        {sidebar.map(([id, icon, label]) => <SidebarLink key={id} icon={icon} label={label} active={section === id} onClick={() => { setSection(id); setSelectedTire(null); }} />)}
        <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={() => nav("storefront")} style={{ ...S.btn("ghost", "sm"), justifyContent: "center", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.15)", width: "100%" }}>View My Storefront</button>
          <button onClick={async () => { await supabase.auth.signOut(); nav("login"); }} style={{ ...S.btn("ghost", "sm"), justifyContent: "center", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.15)", width: "100%" }}>Logout</button>
          <button onClick={() => nav("home")} style={{ ...S.btn("ghost", "sm"), justifyContent: "center", color: "rgba(255,255,255,0.4)", border: "none", width: "100%" }}>← Back to Home</button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 28 }}>
        {section === "overview" && <ShopOverview tires={tires} orders={orders} shopName={shopRecord.name} shopLocation={shopLocationLine} />}
        {section === "inventory" && <InventoryPage shopId={shopId} tires={tires} setTires={setTires} showToast={showToast} selectedTire={selectedTire} setSelectedTire={setSelectedTire} />}
        {section === "orders" && <OrdersPage shopId={shopId} shopName={shopRecord.name} shopPhone={storefront.phone} orders={orders} setOrders={setOrders} showToast={showToast} />}
        {section === "appointments" && <AppointmentsPage shopId={shopId} showToast={showToast} />}
        {section === "customers" && <CustomersPage shopId={shopId} showToast={showToast} />}
        {section === "staff" && <StaffPage showToast={showToast} />}
        {section === "settings" && <ShopSettings showToast={showToast} />}
        {section === "billing" && <ShopBilling />}
      </div>
    </div>
  );
}

function ShopOverview({ tires, orders, shopName, shopLocation }) {
  const pending = orders.filter(o => o.status === Pending || o.status === pending").length;
  const confirmed = orders.filter(o => o.status === "Confirmed").length;
  const completed = orders.filter(o => o.status === "Completed").length;
  const lowStock = tires.filter(t => t.qty > 0 && t.qty <= 2).length;
  const revenue = orders.filter(o => o.status !== "Cancelled").reduce((a, o) => a + o.total, 0);
  const sub = [shopName, shopLocation].filter(Boolean).join(shopLocation ? " · " : "");
  return <div>
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Dashboard</h2>
      <p style={{ color: COLORS.gray500, marginTop: 4 }}>{sub}</p>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
      <MetricCard label="Total Tires" value={tires.reduce((a, t) => a + t.qty, 0)} />
      <MetricCard label="Low Stock" value={lowStock} color={lowStock > 0 ? COLORS.red : COLORS.green} />
      <MetricCard label="Pending Orders" value={pending} color={pending > 0 ? COLORS.orange : COLORS.gray700} />
      <MetricCard label="Est. Revenue (Month)" value={`$${revenue.toFixed(0)}`} color={COLORS.green} />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>Recent Orders</div>
        {orders.slice(0, 4).map(o => <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
          <div><div style={{ fontSize: 14, fontWeight: 600 }}>{o.customer}</div><div style={{ fontSize: 12, color: COLORS.gray400 }}>{o.orderLabel || o.id} · {(o.tire || "").split(" ").slice(0, 3).join(" ")}</div></div>
          <span style={S.badge(o.status)}>{o.status}</span>
        </div>)}
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>Inventory Snapshot</div>
        {tires.slice(0, 5).map(t => <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #F1F5F9" }}>
          <div><div style={{ fontSize: 13, fontWeight: 600 }}>{t.brand} {t.model}</div><div style={{ fontSize: 12, color: COLORS.gray400 }}>{t.size}</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700 }}>${t.price}</div><div style={{ fontSize: 12, color: t.qty === 0 ? COLORS.red : t.qty <= 2 ? COLORS.orange : COLORS.green }}>Qty: {t.qty}</div></div>
        </div>)}
      </div>
    </div>
  </div>;
}

function InventoryPage({ shopId, tires, setTires, showToast, selectedTire, setSelectedTire }) {
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterCondition, setFilterCondition] = useState("All");
  const [search, setSearch] = useState("");
  const [newTire, setNewTire] = useState({ brand: "", model: "", size: "", condition: "New", qty: 1, price: "", type: "All-Season", tread: "", desc: "" });
  const [editPrice, setEditPrice] = useState("");
  const [editSetPrice, setEditSetPrice] = useState("");
  const [editQty, setEditQty] = useState("");

  useEffect(() => {
    if (!shopId) return;
    let cancelled = false;
    (async () => {
      setInventoryLoading(true);
      const { data, error } = await supabase
        .from("tires")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setInventoryLoading(false);
      if (error) {
        showToast(error.message);
        return;
      }
      setTires((data || []).map(tireFromSupabaseRow));
    })();
    return () => { cancelled = true; };
 }, [shopId]);

  useEffect(() => {
    if (!selectedTire) return;
    setEditPrice(String(selectedTire.price));
    setEditSetPrice(String(selectedTire.setPrice));
    setEditQty(String(selectedTire.qty));
  }, [selectedTire]);

  const filtered = tires.filter(t => (filterCondition === "All" || t.condition === filterCondition) && (t.brand + t.model + t.size).toLowerCase().includes(search.toLowerCase()));

  const parseMoney = (v) => {
    const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const addTire = async () => {
    const qty = +newTire.qty;
    const price = +newTire.price;
    const status = qty === 0 ? "Out of Stock" : "Active";
    const { data, error } = await supabase
      .from("tires")
      .insert({
        shop_id: shopId,
        brand: newTire.brand,
        model: newTire.model,
        size: newTire.size,
        condition: newTire.condition,
        quantity: qty,
        price,
        status,
      })
      .select()
      .single();
    if (error) {
      showToast(error.message);
      return;
    }
    setTires(ts => [...ts, tireFromSupabaseRow(data)]);
    showToast("Tire added to inventory");
    setShowAdd(false);
    setNewTire({ brand: "", model: "", size: "", condition: "New", qty: 1, price: "", type: "All-Season", tread: "", desc: "" });
  };

  const saveTireChanges = async () => {
    const price = parseMoney(editPrice);
    const quantity = parseInt(String(editQty).replace(/\D/g, ""), 10) || 0;
    const { error } = await supabase
      .from("tires")
      .update({ price, quantity })
      .eq("id", selectedTire.id);
    if (error) {
      showToast(error.message);
      return;
    }
    const setPriceVal = parseMoney(editSetPrice) || +(price * 4).toFixed(2);
    setTires(ts => ts.map(t => (t.id === selectedTire.id ? { ...t, price, qty: quantity, setPrice: setPriceVal } : t)));
    showToast("Tire updated");
    setSelectedTire(null);
  };

  const deleteTire = async () => {
    const { error } = await supabase.from("tires").delete().eq("id", selectedTire.id);
    if (error) {
      showToast(error.message);
      return;
    }
    setTires(ts => ts.filter(t => t.id !== selectedTire.id));
    showToast("Tire removed");
    setSelectedTire(null);
  };

  if (selectedTire) return <div>
    <button onClick={() => setSelectedTire(null)} style={{ background: "none", border: "none", color: COLORS.blue, cursor: "pointer", fontSize: 14, marginBottom: 20 }}>← Back to Inventory</button>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
      <div style={S.card}>
        <div style={{ background: COLORS.gray100, borderRadius: 10, height: 200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, marginBottom: 20 }}>🛞</div>
        <div style={{ fontWeight: 800, fontSize: 22 }}>{selectedTire.brand} {selectedTire.model}</div>
        <div style={{ color: COLORS.gray500, marginBottom: 16 }}>{selectedTire.size} · {selectedTire.type}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[["Condition",selectedTire.condition],["Quantity",selectedTire.qty],["Tread Depth",selectedTire.tread||"N/A"],["DOT Date",selectedTire.dot||"—"],["Load Index",selectedTire.load],["Speed Rating",selectedTire.speed],["Install Fee","$"+selectedTire.installFee],["Disposal Fee","$"+selectedTire.disposalFee],["Status",selectedTire.status]].map(([k,v]) => <div key={k} style={{ background: COLORS.gray50, borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.gray400, marginBottom: 2 }}>{k}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{v}</div>
          </div>)}
        </div>
        {selectedTire.desc && <p style={{ marginTop: 16, color: COLORS.gray600, fontSize: 14 }}>{selectedTire.desc}</p>}
      </div>
      <div>
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 14 }}>Pricing</div>
          <div style={{ marginBottom: 10 }}>
            <label style={S.label}>Price Per Tire</label>
            <input style={S.input} value={editPrice} onChange={e => setEditPrice(e.target.value)} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={S.label}>Set Price (4 tires)</label>
            <input style={S.input} value={editSetPrice} onChange={e => setEditSetPrice(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Quantity</label>
            <input type="number" style={S.input} value={editQty} onChange={e => setEditQty(e.target.value)} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={saveTireChanges} style={{ ...S.btn("primary"), justifyContent: "center" }}>Save Changes</button>
            <button onClick={() => { setTires(ts => ts.map(t => t.id === selectedTire.id ? {...t, featured: !t.featured} : t)); showToast("Featured status updated"); }} style={{ ...S.btn("secondary"), justifyContent: "center" }}>{selectedTire.featured ? "Remove Featured" : "Mark as Featured"}</button>
            <button onClick={deleteTire} style={{ ...S.btn("danger"), justifyContent: "center" }}>Delete Tire</button>
          </div>
        </div>
      </div>
    </div>
  </div>;

  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div><h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Inventory</h2><p style={{ color: COLORS.gray500, marginTop: 4 }}>{tires.reduce((a, t) => a + t.qty, 0)} total tires in stock</p></div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => showToast("CSV upload dialog opened")} style={S.btn("secondary")}>📤 CSV Upload</button>
        <button onClick={() => setShowAdd(true)} style={S.btn("primary")}>+ Add Tire</button>
      </div>
    </div>
    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
      <input style={{ ...S.input, maxWidth: 260 }} placeholder="Search brand, model, size..." value={search} onChange={e => setSearch(e.target.value)} />
      {["All","New","Used"].map(c => <button key={c} onClick={() => setFilterCondition(c)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1px solid ${filterCondition === c ? COLORS.blue : COLORS.gray300}`, background: filterCondition === c ? "#EFF6FF" : "#fff", color: filterCondition === c ? COLORS.blue : COLORS.gray600, fontWeight: filterCondition === c ? 600 : 400 }}>{c}</button>)}
    </div>
    {showAdd && <div style={{ ...S.card, marginBottom: 20, background: "#F0F7FF", border: "1px solid #93C5FD" }}>
      <div style={{ fontWeight: 700, marginBottom: 14 }}>Add New Tire</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[["brand","Brand"],["model","Model"],["size","Size (e.g. 225/55R17)"],["price","Price"]].map(([k,l]) => <div key={k}>
          <label style={S.label}>{l}</label>
          <input style={S.input} value={newTire[k]} onChange={e => setNewTire(t => ({...t, [k]: e.target.value}))} />
        </div>)}
        <div><label style={S.label}>Condition</label><select style={{ ...S.select, width: "100%" }} value={newTire.condition} onChange={e => setNewTire(t => ({...t, condition: e.target.value}))}><option>New</option><option>Used</option></select></div>
        <div><label style={S.label}>Qty</label><input type="number" style={S.input} value={newTire.qty} onChange={e => setNewTire(t => ({...t, qty: e.target.value}))} /></div>
        <div><label style={S.label}>Tread Depth (used)</label><input style={S.input} value={newTire.tread} onChange={e => setNewTire(t => ({...t, tread: e.target.value}))} placeholder="e.g. 8/32" /></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={addTire} style={S.btn("primary")}>Add Tire</button>
        <button onClick={() => setShowAdd(false)} style={S.btn("secondary")}>Cancel</button>
      </div>
    </div>}
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden", position: "relative", minHeight: 120 }}>
      {inventoryLoading && (
        <div style={{ padding: "48px 24px", textAlign: "center", color: COLORS.gray500, fontSize: 15 }}>
          Loading inventory…
        </div>
      )}
      {!inventoryLoading && (
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Tire","Size","Cond.","Type","Qty","Price/Tire","Set Price","Status",""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{filtered.map(t => <tr key={t.id} style={{ cursor: "pointer" }}>
          <td style={S.td} onClick={() => setSelectedTire(t)}><div style={{ fontWeight: 600 }}>{t.brand} {t.model}</div>{t.featured && <span style={{ fontSize: 11, background: "#FEF9C3", color: "#854D0E", padding: "1px 6px", borderRadius: 4, marginTop: 2, display: "inline-block" }}>Featured</span>}</td>
          <td style={S.td}>{t.size}</td>
          <td style={S.td}><span style={S.badge(t.condition)}>{t.condition}</span></td>
          <td style={S.td}>{t.type}</td>
          <td style={{ ...S.td, fontWeight: 700, color: t.qty === 0 ? COLORS.red : t.qty <= 2 ? COLORS.orange : COLORS.gray800 }}>{t.qty}</td>
          <td style={{ ...S.td, fontWeight: 700 }}>${t.price}</td>
          <td style={S.td}>${t.setPrice}</td>
          <td style={S.td}><span style={S.badge(t.status)}>{t.status}</span></td>
          <td style={S.td}><button onClick={() => setSelectedTire(t)} style={{ ...S.btn("ghost", "sm") }}>Edit</button></td>
        </tr>)}</tbody>
      </table>
      )}
    </div>
  </div>;
}

function OrdersPage({ shopId, shopName, shopPhone, orders, setOrders, showToast }) {
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? orders : orders.filter(o => o.status.toLowerCase() === filter.toLowerCase());

  useEffect(() => {
    if (!shopId) return;
    let cancelled = false;
    (async () => {
      setOrdersLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setOrdersLoading(false);
      if (error) {
        showToast(error.message);
        return;
      }
      setOrders((data || []).map(orderFromSupabaseRow));
    })();
    return () => { cancelled = true; };
  }, [shopId]);

  const updateStatus = async (id, status) => {
    const order = orders.find(o => o.id === id);
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      showToast(error.message);
      return;
    }
    setOrders(os => os.map(o => (o.id === id ? { ...o, status } : o)));
    showToast(`Order ${status.toLowerCase()}`);
    if (order?.email && (status === "Confirmed" || status === "Completed")) {
      try {
        const { subject, html } = orderStatusUpdate(order.customer, order.tire, status, shopName || "Your tire shop", shopPhone || "");
        await sendEmail(order.email, subject, html);
      } catch (e) {
        console.warn("order status email:", e);
      }
    }
  };

  return <div>
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Orders</h2>
      <p style={{ color: COLORS.gray500, marginTop: 4 }}>{orders.length} orders total</p>
    </div>
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {["All","Pending","Confirmed","Completed","Cancelled"].map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1px solid ${filter === s ? COLORS.blue : COLORS.gray300}`, background: filter === s ? "#EFF6FF" : "#fff", color: filter === s ? COLORS.blue : COLORS.gray600, fontWeight: filter === s ? 600 : 400 }}>{s}</button>)}
    </div>
    {ordersLoading && (
      <div style={{ ...S.card, padding: "48px 24px", textAlign: "center", color: COLORS.gray500, fontSize: 15 }}>
        Loading orders…
      </div>
    )}
    {!ordersLoading && (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {filtered.map(o => <div key={o.id} style={{ ...S.card, display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 16, alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontWeight: 700, color: COLORS.blue }}>{o.orderLabel || o.id}</span>
            <span style={S.badge(o.status)}>{o.status}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{o.customer}</div>
          <div style={{ fontSize: 13, color: COLORS.gray400 }}>{o.phone}</div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{o.tire}</div>
          <div style={{ fontSize: 13, color: COLORS.gray500 }}>Qty: {o.qty} · Vehicle: {o.vehicle}</div>
          {o.apptDate && <div style={{ fontSize: 12, color: COLORS.blue, marginTop: 2 }}>📅 Appt: {o.apptDate}</div>}
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.green }}>${Number(o.total).toFixed(2)}</div>
          <div style={{ fontSize: 12, color: COLORS.gray400 }}>Ordered {o.date}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {o.status === Pending || o.status === pending" && <><button onClick={() => updateStatus(o.id, "Confirmed")} style={{ ...S.btn("primary", "sm"), justifyContent: "center" }}>Confirm</button><button onClick={() => updateStatus(o.id, "Cancelled")} style={{ ...S.btn("danger", "sm"), justifyContent: "center" }}>Cancel</button></>}
          {o.status === "Confirmed" && <button onClick={() => updateStatus(o.id, "Completed")} style={{ ...S.btn("primary", "sm"), justifyContent: "center" }}>Mark Complete</button>}
        </div>
      </div>)}
    </div>
    )}
  </div>;
}

function AppointmentsPage({ shopId, showToast }) {
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (!shopId) return;
    let cancelled = false;
    (async () => {
      setAppointmentsLoading(true);
      const { data, error } = await supabase
        .from("appointments")
        .select("id, shop_id, customer_id, order_id, date, time, status, vehicle_info, notes, created_at")
        .eq("shop_id", shopId)
        .order("date", { ascending: false });
      if (cancelled) return;
      setAppointmentsLoading(false);
      if (error) {
        showToast(error.message);
        return;
      }
      setAppointments((data || []).map(appointmentFromSupabaseRow));
    })();
    return () => { cancelled = true; };
  }, [shopId]);

  return <div>
    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Appointments</h2>
    {appointmentsLoading && (
      <div style={{ ...S.card, padding: "48px 24px", textAlign: "center", color: COLORS.gray500, fontSize: 15 }}>
        Loading appointments…
      </div>
    )}
    {!appointmentsLoading && (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {appointments.map(a => <div key={a.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1, minWidth: 0 }}>
          <div style={{ background: COLORS.blue, color: "#fff", borderRadius: 10, padding: "10px 14px", textAlign: "center", minWidth: 60, flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600 }}>{a.monthLabel}</div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{a.day}</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray500, marginBottom: 4 }}>
              {a.dateIso}{a.time ? ` · ${a.time}` : ""}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{a.customerName}</div>
            <div style={{ fontSize: 13, color: COLORS.gray600 }}>
              {[a.customerPhone, a.customerEmail].filter(Boolean).join(" · ") || "—"}
            </div>
            <div style={{ fontSize: 14, color: COLORS.gray500, marginTop: 4 }}><strong style={{ color: COLORS.gray700 }}>Vehicle:</strong> {a.vehicle}</div>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
          <span style={S.badge(a.status)}>{a.status}</span>
        </div>
      </div>)}
    </div>
    )}
  </div>;
}

function CustomersPage({ shopId, showToast }) {
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    if (!shopId) return;
    let cancelled = false;
    (async () => {
      setCustomersLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setCustomersLoading(false);
      if (error) {
        showToast(error.message);
        return;
      }
      setCustomers((data || []).map(customerFromSupabaseRow));
    })();
    return () => { cancelled = true; };
  }, [shopId, showToast]);

  return <div>
    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Customers</h2>
    {customersLoading && (
      <div style={{ ...S.card, padding: "48px 24px", textAlign: "center", color: COLORS.gray500, fontSize: 15 }}>
        Loading customers…
      </div>
    )}
    {!customersLoading && (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Name","Phone","Email","Vehicle","Last order"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>{customers.map(c => <tr key={c.id}>
          <td style={{ ...S.td, fontWeight: 600 }}>{c.name}</td>
          <td style={S.td}>{c.phone}</td>
          <td style={S.td}>{c.email}</td>
          <td style={S.td}>{c.vehicle}</td>
          <td style={S.td}>{c.lastOrderDate}</td>
        </tr>)}</tbody>
      </table>
    </div>
    )}
  </div>;
}

function StaffPage({ showToast }) {
  const staff = [
    { name: "Marcus Williams", role: "Owner", email: "marcus@greenvilletire.com", status: "Active" },
    { name: "Deja Lawson", role: "Manager", email: "deja@greenvilletire.com", status: "Active" },
    { name: "Trevor Banks", role: "Inventory Staff", email: "trevor@greenvilletire.com", status: "Active" },
  ];
  const roles = { Owner: "Full access", Manager: "Inventory, orders, appointments, customers", "Inventory Staff": "Inventory only", "Order Staff": "Orders and appointments only" };
  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Staff</h2>
      <button onClick={() => showToast("Invite sent!")} style={S.btn("primary")}>+ Invite Staff</button>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
      {staff.map(s => <div key={s.name} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: COLORS.blue, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 }}>{s.name[0]}</div>
          <div>
            <div style={{ fontWeight: 600 }}>{s.name}</div>
            <div style={{ fontSize: 13, color: COLORS.gray500 }}>{s.email}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: s.role === "Owner" ? COLORS.orange : COLORS.blue }}>{s.role}</span>
          <div style={{ fontSize: 12, color: COLORS.gray400 }}>{roles[s.role]}</div>
        </div>
      </div>)}
    </div>
  </div>;
}

function ShopSettings({ showToast }) {
  return <div>
    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Shop Settings</h2>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Business Info</div>
        {[["Shop Name","Greenville Tire Pros"],["Phone","(864) 555-0142"],["Email","info@greenvilletire.com"],["Address","1420 Wade Hampton Blvd, Greenville, SC"]].map(([l, v]) => <div key={l} style={{ marginBottom: 12 }}><label style={S.label}>{l}</label><input style={S.input} defaultValue={v} /></div>)}
        <button onClick={() => showToast("Settings saved!")} style={S.btn("primary")}>Save Changes</button>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Order Settings</div>
        {[["Tax Rate","7.0%"],["Installation Fee","$25.00"],["Disposal Fee","$5.00"],["Deposit Amount","$50.00"]].map(([l, v]) => <div key={l} style={{ marginBottom: 12 }}><label style={S.label}>{l}</label><input style={S.input} defaultValue={v} /></div>)}
        <button onClick={() => showToast("Settings saved!")} style={S.btn("primary")}>Save Changes</button>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Business Hours</div>
        {["Monday–Friday","Saturday","Sunday"].map((d, i) => <div key={d} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 14, color: COLORS.gray700, width: 120 }}>{d}</span>
          <input style={{ ...S.input, flex: 1, maxWidth: 200 }} defaultValue={i === 0 ? "8:00 AM – 6:00 PM" : i === 1 ? "8:00 AM – 4:00 PM" : "Closed"} />
        </div>)}
      </div>
    </div>
  </div>;
}

function ShopBilling() {
  return <div>
    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Billing</h2>
    <div style={{ ...S.card, maxWidth: 480, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray400 }}>CURRENT PLAN</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.blue }}>Growth Partner</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.gray700 }}>$249/month</div>
        </div>
        <span style={S.badge("Active")}>Active</span>
      </div>
      <div style={{ borderTop: "1px solid #E2E8F0", marginTop: 16, paddingTop: 16, fontSize: 14, color: COLORS.gray500 }}>
        Next billing date: <strong>June 1, 2026</strong><br />Member since: November 2025
      </div>
    </div>
  </div>;
}

function parseVehicleFields(vehicleRaw) {
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

async function storefrontSubmitReservation(shopId, {
  orderTire,
  name,
  phone,
  email,
  vehicleRaw,
  quantity,
}) {
  if (!shopId) throw new Error("Missing shop.");
  const qty = Math.max(1, Math.min(99, parseInt(String(quantity), 10) || 1));
  const total = +(qty * Number(orderTire.price)).toFixed(2);
  const { vehicle_year, vehicle_make, vehicle_model } = parseVehicleFields(vehicleRaw);

  const { data: existingCustomer, error: findErr } = await supabase
    .from("customers")
    .select("id")
    .eq("shop_id", shopId)
    .eq("email", email)
    .maybeSingle();
  if (findErr) throw findErr;

  if (!existingCustomer) {
    const { error: custErr } = await supabase.from("customers").insert({
      shop_id: shopId,
      name,
      phone,
      email,
      vehicle_year,
      vehicle_make,
      vehicle_model,
    });
    if (custErr) throw custErr;
  }

  const { data: orderRow, error: orderErr } = await supabase
    .from("orders")
    .insert({
      shop_id: shopId,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      quantity: qty,
      total,
      status: "pending",
    })
    .select("id")
    .single();
  if (orderErr) throw orderErr;
  return orderRow.id;
}

// ── 6. PUBLIC STOREFRONT ──────────────────────────────────────────────────
function Storefront({ nav }) {
  const [publicShopId, setPublicShopId] = useState(FALLBACK_PUBLIC_SHOP_ID);
  const [publicShopInfo, setPublicShopInfo] = useState({ name: storefront.name, email: "" });

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("shops")
      .select("id, name, email")
      .eq("slug", PUBLIC_STOREFRONT_SLUG)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data?.id) return;
        setPublicShopId(data.id);
        setPublicShopInfo({
          name: data.name || storefront.name,
          email: (data.email || "").trim(),
        });
      });
    return () => { cancelled = true; };
  }, []);

  const [search, setSearch] = useState("");
  const [condFilter, setCondFilter] = useState("All");
  const [selectedTire, setSelectedTire] = useState(null);
  const [showOrder, setShowOrder] = useState(false);
  const [orderTire, setOrderTire] = useState(null);
  const [orderDone, setOrderDone] = useState(false);
  const [resName, setResName] = useState("");
  const [resPhone, setResPhone] = useState("");
  const [resEmail, setResEmail] = useState("");
  const [resVehicle, setResVehicle] = useState("");
  const [resQuantity, setResQuantity] = useState("1");
  const [resService, setResService] = useState("Installation at Shop");
  const [resDate, setResDate] = useState("");
  const [resTime, setResTime] = useState("8:00 AM");
  const [resPayment, setResPayment] = useState("Pay deposit online ($50)");
  const [resNotes, setResNotes] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [savedOrderId, setSavedOrderId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([{ from: "bot", text: "Hi! Welcome to Greenville Tire Pros. Ask me anything about our inventory, services, or hours." }]);

  const filtered = mockTires.filter(t => t.status === "Active" && (condFilter === "All" || t.condition === condFilter) && (t.brand + t.model + t.size).toLowerCase().includes(search.toLowerCase()));

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.toLowerCase();
    let reply = "I'm not sure about that. Please call us at (864) 555-0142 for more info!";
    if (msg.includes("hour") || msg.includes("open")) reply = "We're open Mon–Fri 8am–6pm and Saturday 8am–4pm. Closed Sundays.";
    else if (msg.includes("install")) reply = "Installation starts at $25 per tire. Book online or call us to schedule.";
    else if (msg.includes("used")) reply = "Yes! We sell quality used tires, all inspected and priced fairly.";
    else if (msg.includes("reserve") || msg.includes("order")) reply = "You can reserve tires directly from the tire listing. Click 'Reserve Now' on any tire card.";
    else if (msg.includes("225") || msg.includes("215") || msg.includes("265") || msg.includes("tire")) reply = "We have new and used tires in stock! Use the search and filter above to find your size.";
    setChatMessages(m => [...m, { from: "user", text: chatInput }, { from: "bot", text: reply }]);
    setChatInput("");
  };

  if (orderDone) return (
    <div style={{ minHeight: "100vh", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "60px 48px", textAlign: "center", maxWidth: 480 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: COLORS.gray900, marginBottom: 12 }}>Reservation Confirmed!</h2>
        <p style={{ color: COLORS.gray500, fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>We've received your tire reservation. You'll get a confirmation email shortly. Our team will follow up to confirm your installation appointment.</p>
        <div style={{ background: COLORS.gray50, borderRadius: 12, padding: "16px 20px", fontSize: 14, color: COLORS.gray600, marginBottom: 24 }}>
          <div><strong>{orderTire?.brand} {orderTire?.model}</strong></div>
          <div>{orderTire?.size} · {orderTire?.condition}</div>
          {savedOrderId != null && <div style={{ marginTop: 8, color: COLORS.green, fontWeight: 700 }}>Order ID: {String(savedOrderId)}</div>}
        </div>
        <button onClick={() => { setOrderDone(false); setSelectedTire(null); setShowOrder(false); setSavedOrderId(null); setOrderError(""); }} style={{ ...S.btn("primary", "lg"), width: "100%", justifyContent: "center" }}>Back to Store</button>
      </div>
    </div>
  );

  if (showOrder && orderTire) return (
    <div style={{ minHeight: "100vh", background: COLORS.gray50, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: storefront.primaryColor, padding: "14px 32px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => { setShowOrder(false); setOrderError(""); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 14 }}>←</button>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{storefront.name}</span>
      </div>
      <div style={{ maxWidth: 680, margin: "40px auto", padding: "0 20px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Reserve Your Tires</h2>
        <div style={{ ...S.card, marginBottom: 20, display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ fontSize: 36 }}>🛞</div>
          <div>
            <div style={{ fontWeight: 700 }}>{orderTire.brand} {orderTire.model}</div>
            <div style={{ fontSize: 14, color: COLORS.gray500 }}>{orderTire.size} · {orderTire.condition}</div>
            <div style={{ fontWeight: 800, color: COLORS.blue, fontSize: 18 }}>${orderTire.price}/tire</div>
          </div>
        </div>
        <div style={S.card}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={S.label}>Full Name</label>
              <input style={S.input} value={resName} onChange={e => setResName(e.target.value)} autoComplete="name" />
            </div>
            <div>
              <label style={S.label}>Phone Number</label>
              <input style={S.input} value={resPhone} onChange={e => setResPhone(e.target.value)} autoComplete="tel" />
            </div>
            <div>
              <label style={S.label}>Email Address</label>
              <input type="email" style={S.input} value={resEmail} onChange={e => setResEmail(e.target.value)} autoComplete="email" />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={S.label}>Vehicle (Year Make Model)</label>
              <input style={S.input} placeholder="e.g. 2020 Honda Civic" value={resVehicle} onChange={e => setResVehicle(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Quantity</label>
              <select style={{ ...S.select, width: "100%" }} value={resQuantity} onChange={e => setResQuantity(e.target.value)}>
                {[1, 2, 3, 4].map(n => <option key={n} value={String(n)}>{n}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Service Type</label>
              <select style={{ ...S.select, width: "100%" }} value={resService} onChange={e => setResService(e.target.value)}>
                <option>Installation at Shop</option>
                <option>Pickup Only</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Preferred Date</label>
              <input type="date" style={S.input} value={resDate} onChange={e => setResDate(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Preferred Time</label>
              <select style={{ ...S.select, width: "100%" }} value={resTime} onChange={e => setResTime(e.target.value)}>
                {["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={S.label}>Payment Option</label>
              <select style={{ ...S.select, width: "100%" }} value={resPayment} onChange={e => setResPayment(e.target.value)}>
                <option>Pay deposit online ($50)</option>
                <option>Pay in full online</option>
                <option>Pay at shop</option>
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={S.label}>Notes</label>
              <textarea style={{ ...S.input, height: 60, resize: "vertical" }} value={resNotes} onChange={e => setResNotes(e.target.value)} />
            </div>
          </div>
          {orderError ? (
            <div style={{ marginTop: 14, padding: "12px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: COLORS.red, fontSize: 14 }}>
              {orderError}
            </div>
          ) : null}
          <button
            type="button"
            disabled={orderSubmitting}
            onClick={async () => {
              setOrderError("");
              const name = resName.trim();
              const phone = resPhone.trim();
              const email = resEmail.trim();
              const vehicleRaw = resVehicle.trim();
              if (!name || !phone || !email || !vehicleRaw) {
                setOrderError("Please fill in your full name, phone, email, and vehicle.");
                return;
              }
              setOrderSubmitting(true);
              try {
                const id = await storefrontSubmitReservation(publicShopId, {
                  orderTire,
                  name,
                  phone,
                  email,
                  vehicleRaw,
                  quantity: resQuantity,
                });
                setSavedOrderId(id);
                const tireName = `${orderTire.brand} ${orderTire.model}`;
                const qtyNum = Math.max(1, Math.min(99, parseInt(String(resQuantity), 10) || 1));
                const totalStr = +(qtyNum * Number(orderTire.price)).toFixed(2);
                try {
                  const custTpl = reservationConfirmation(name, tireName, publicShopInfo.name, storefront.phone);
                  await sendEmail(email, custTpl.subject, custTpl.html);
                } catch (e) {
                  console.warn("Reservation confirmation email:", e);
                }
                if (publicShopInfo.email) {
                  try {
                    const shopTpl = orderNotification(name, tireName, qtyNum, totalStr);
                    await sendEmail(publicShopInfo.email, shopTpl.subject, shopTpl.html);
                  } catch (e) {
                    console.warn("Shop order notification email:", e);
                  }
                }
                setOrderDone(true);
              } catch (err) {
                const msg = err?.message || err?.error_description || (typeof err === "string" ? err : "") || "Something went wrong saving your reservation. Please try again.";
                setOrderError(msg);
              } finally {
                setOrderSubmitting(false);
              }
            }}
            style={{ ...S.btn("orange", "lg"), width: "100%", justifyContent: "center", marginTop: 20, fontWeight: 700, opacity: orderSubmitting ? 0.7 : 1 }}
          >
            {orderSubmitting ? "Saving…" : "Reserve Tires →"}
          </button>
        </div>
      </div>
    </div>
  );

  if (selectedTire) return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: storefront.primaryColor, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setSelectedTire(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 14 }}>←</button>
          <span style={{ color: "#fff", fontWeight: 700 }}>{storefront.name}</span>
        </div>
        <a href="tel:8645550142" style={{ color: "#fff", fontSize: 14, textDecoration: "none" }}>📞 (864) 555-0142</a>
      </div>
      <div style={{ maxWidth: 900, margin: "32px auto", padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <div>
          <div style={{ background: COLORS.gray100, borderRadius: 16, height: 300, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, marginBottom: 16 }}>🛞</div>
        </div>
        <div>
          <span style={S.badge(selectedTire.condition)}>{selectedTire.condition}</span>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: "10px 0 4px" }}>{selectedTire.brand} {selectedTire.model}</h1>
          <div style={{ fontSize: 18, color: COLORS.gray500, marginBottom: 20 }}>{selectedTire.size}</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: COLORS.blue }}>${selectedTire.price}<span style={{ fontSize: 16, fontWeight: 400, color: COLORS.gray400 }}>/tire</span></div>
          {selectedTire.setPrice && <div style={{ fontSize: 18, color: COLORS.green, fontWeight: 700 }}>Set of 4: ${selectedTire.setPrice}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "20px 0" }}>
            {[["In Stock", selectedTire.qty + " available"], selectedTire.tread ? ["Tread Depth", selectedTire.tread] : ["DOT Date", selectedTire.dot], ["Load Index", selectedTire.load], ["Speed Rating", selectedTire.speed], ["Type", selectedTire.type], ["Install Fee", "$" + selectedTire.installFee]].map(([k, v]) => <div key={k} style={{ background: COLORS.gray50, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.gray400 }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{v}</div>
            </div>)}
          </div>
          <p style={{ fontSize: 14, color: COLORS.gray600, lineHeight: 1.7, marginBottom: 20 }}>{selectedTire.desc}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { setOrderTire(selectedTire); setShowOrder(true); }} style={{ ...S.btn("orange", "lg"), justifyContent: "center", fontWeight: 700 }}>Reserve Now →</button>
            <button style={{ ...S.btn("primary", "lg"), justifyContent: "center" }}>📅 Book Installation</button>
            <a href="tel:8645550142" style={{ ...S.btn("secondary", "lg"), justifyContent: "center", textDecoration: "none" }}>📞 Call Shop</a>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", fontFamily: "system-ui, sans-serif", background: "#fff", position: "relative" }}>
      {/* Sticky Header */}
      <div style={{ background: storefront.primaryColor, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "rgba(255,255,255,0.2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 }}>G</div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>{storefront.name}</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {["Inventory","Services","About","Contact"].map(l => <span key={l} style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, cursor: "pointer" }}>{l}</span>)}
          <a href="tel:8645550142" style={{ ...S.btn("orange", "sm"), textDecoration: "none", fontWeight: 700 }}>📞 Call Now</a>
        </div>
      </div>
      {/* Announcement Bar */}
      <div style={{ background: COLORS.orange, padding: "8px 32px", textAlign: "center", fontSize: 14, color: "#fff", fontWeight: 600 }}>
        🏷️ Free installation on any set of 4 tires — Limited time offer!
      </div>
      {/* Hero */}
      <div style={{ background: storefront.heroBg, padding: "80px 40px", textAlign: "center" }}>
        <h1 style={{ fontSize: 44, fontWeight: 800, color: "#fff", margin: "0 auto 16px", maxWidth: 700, lineHeight: 1.2 }}>{storefront.hero}</h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", maxWidth: 540, margin: "0 auto 32px", lineHeight: 1.6 }}>{storefront.heroSub}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", maxWidth: 520, margin: "0 auto", background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 12 }}>
          <input style={{ ...S.input, flex: 1, background: "#fff" }} placeholder="Search by size, brand, or model (e.g. 225/55R17)..." value={search} onChange={e => setSearch(e.target.value)} />
          <button style={{ ...S.btn("orange"), fontWeight: 700, whiteSpace: "nowrap" }}>Search Tires</button>
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
          {[["📍","1420 Wade Hampton Blvd, Greenville SC"],["🕐","Mon–Fri 8am–6pm · Sat 8am–4pm"],["⭐","4.9/5 — 127 reviews"]].map(([icon, text]) => <span key={text} style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{icon} {text}</span>)}
        </div>
      </div>
      {/* Inventory */}
      <div style={{ padding: "60px 40px", background: COLORS.gray50 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Tire Inventory</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {["All","New","Used"].map(c => <button key={c} onClick={() => setCondFilter(c)} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 14, cursor: "pointer", border: `1px solid ${condFilter === c ? storefront.primaryColor : COLORS.gray300}`, background: condFilter === c ? storefront.primaryColor : "#fff", color: condFilter === c ? "#fff" : COLORS.gray600 }}>{c}</button>)}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {filtered.map(t => <div key={t.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden", cursor: "pointer" }} onClick={() => setSelectedTire(t)}>
            <div style={{ background: COLORS.gray100, height: 160, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, position: "relative" }}>
              🛞
              {t.featured && <div style={{ position: "absolute", top: 10, left: 10, background: COLORS.orange, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>Featured</div>}
              {t.qty === 0 && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Out of Stock</span></div>}
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <span style={S.badge(t.condition)}>{t.condition}</span>
                {t.tread && <span style={{ fontSize: 12, color: COLORS.gray400 }}>Tread: {t.tread}</span>}
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, margin: "6px 0 2px" }}>{t.brand} {t.model}</div>
              <div style={{ fontSize: 14, color: COLORS.gray500, marginBottom: 8 }}>{t.size} · {t.type}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: storefront.primaryColor }}>${t.price}</div>
                <div style={{ fontSize: 13, color: COLORS.gray400 }}>Qty: {t.qty}</div>
              </div>
              <button onClick={e => { e.stopPropagation(); setOrderTire(t); setShowOrder(true); }} disabled={t.qty === 0} style={{ ...S.btn("orange"), width: "100%", justifyContent: "center", fontWeight: 700, opacity: t.qty === 0 ? 0.4 : 1 }}>Reserve Now</button>
            </div>
          </div>)}
        </div>
      </div>
      {/* Services */}
      <div style={{ padding: "60px 40px", background: "#fff" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 32 }}>Our Services</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, maxWidth: 900, margin: "0 auto" }}>
          {[["🔧","Tire Installation","$25–$35/tire"],["⚖️","Wheel Balancing","$12/wheel"],["🔄","Tire Rotation","$19.99"],["🩹","Flat Repair","$19.99"],["🔩","TPMS Service","$15/sensor"],["🚗","Used Tire Mounting","$15/tire"]].map(([i,s,p]) => <div key={s} style={{ background: COLORS.gray50, borderRadius: 12, padding: "20px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{i}</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s}</div>
            <div style={{ fontSize: 14, color: COLORS.blue, fontWeight: 600 }}>{p}</div>
          </div>)}
        </div>
      </div>
      {/* Reviews */}
      <div style={{ padding: "60px 40px", background: COLORS.gray50 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 32 }}>Customer Reviews</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 900, margin: "0 auto" }}>
          {[["Terrence H.","⭐⭐⭐⭐⭐","Great prices on used tires. In and out in 45 minutes. Will definitely be back!"],["Angela P.","⭐⭐⭐⭐⭐","Reserved online and they had my tires ready when I arrived. Super easy process."],["Devon C.","⭐⭐⭐⭐⭐","Best used tire shop in Greenville. Honest people and fair pricing."]].map(([n, r, t]) => <div key={n} style={{ ...S.card }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{n}</div>
            <div style={{ marginBottom: 8 }}>{r}</div>
            <div style={{ fontSize: 14, color: COLORS.gray500, lineHeight: 1.6 }}>{t}</div>
          </div>)}
        </div>
      </div>
      {/* Footer */}
      <div style={{ background: COLORS.navy, padding: "40px 40px", color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div><div style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{storefront.name}</div><div>{storefront.address}</div><div>{storefront.hours}</div><div style={{ marginTop: 4 }}>{storefront.phone}</div></div>
          <div style={{ textAlign: "right" }}><div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Powered by TreadFlow</div></div>
        </div>
      </div>
      {/* Chatbot */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100 }}>
        {chatOpen && <div style={{ width: 320, background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", marginBottom: 12, overflow: "hidden" }}>
          <div style={{ background: storefront.primaryColor, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>🤖 Greenville Tire Chat</div>
            <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18 }}>×</button>
          </div>
          <div style={{ height: 220, overflow: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {chatMessages.map((m, i) => <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ background: m.from === "bot" ? COLORS.gray100 : storefront.primaryColor, color: m.from === "user" ? "#fff" : COLORS.gray800, borderRadius: 10, padding: "8px 12px", fontSize: 13, maxWidth: "80%", lineHeight: 1.5 }}>{m.text}</div>
            </div>)}
          </div>
          <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderTop: "1px solid #E2E8F0" }}>
            <input style={{ ...S.input, flex: 1, fontSize: 13 }} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Ask a question..." />
            <button onClick={sendChat} style={{ ...S.btn("primary", "sm") }}>→</button>
          </div>
        </div>}
        <button onClick={() => setChatOpen(!chatOpen)} style={{ width: 56, height: 56, borderRadius: "50%", background: storefront.primaryColor, border: "none", color: "#fff", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>{chatOpen ? "×" : "💬"}</button>
      </div>
      {/* Mobile sticky call bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: COLORS.orange, padding: "14px 20px", display: "flex", gap: 12, zIndex: 90 }}>
        <a href="tel:8645550142" style={{ flex: 1, ...S.btn("dark"), justifyContent: "center", textDecoration: "none", background: COLORS.navy, fontSize: 16, fontWeight: 700 }}>📞 Call Now</a>
        <button onClick={() => nav("home")} style={{ ...S.btn("secondary", "sm"), color: "rgba(255,255,255,0.7)", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", fontSize: 12 }}>← Home</button>
      </div>
    </div>
  );
}

// ── INVITE ONBOARDING ─────────────────────────────────────────────────────
function InviteOnboarding({ nav }) {
  const [step, setStep] = useState(1);
  const code = "TF-SC-KX92PL";
  if (step === 3) return (
    <div style={{ minHeight: "100vh", background: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "60px 48px", textAlign: "center", maxWidth: 500 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>You're in. Welcome to TreadFlow!</h2>
        <p style={{ color: COLORS.gray500, marginBottom: 28, lineHeight: 1.7 }}>Your shop account has been created. Your storefront is being set up. You'll receive a confirmation email with next steps from your onboarding specialist.</p>
        <button onClick={() => nav("shop")} style={{ ...S.btn("primary", "lg"), width: "100%", justifyContent: "center" }}>Go to Shop Dashboard →</button>
      </div>
    </div>
  );
  return (
    <div style={{ minHeight: "100vh", background: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "48px 44px", maxWidth: 520, width: "100%" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.orange, marginBottom: 8 }}>PRIVATE INVITE — TREADFLOW</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{step === 1 ? "Verify Your Invite" : "Create Your Account"}</h2>
        <p style={{ color: COLORS.gray500, fontSize: 14, marginBottom: 24 }}>{step === 1 ? "Enter your invite code to get started." : "You're approved. Set up your account below."}</p>
        {step === 1 && <>
          <label style={S.label}>Invite Code</label>
          <input style={{ ...S.input, fontFamily: "monospace", fontSize: 18, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }} defaultValue={code} />
          <label style={S.label}>Email Address</label>
          <input style={{ ...S.input, marginBottom: 20 }} defaultValue="marcus@greenvilletire.com" />
          <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "12px 14px", marginBottom: 20, fontSize: 13, color: "#166534" }}>
            ✓ Invite valid · Plan: Growth Partner · Market: Greenville, SC · Expires May 16, 2026
          </div>
          <button onClick={() => setStep(2)} style={{ ...S.btn("primary", "lg"), width: "100%", justifyContent: "center" }}>Verify & Continue →</button>
        </>}
        {step === 2 && <>
          <div style={{ display: "grid", gap: 12 }}>
            {[["Full Name","Marcus Williams"],["Shop Name","Greenville Tire Pros"],["Password",""],["Confirm Password",""]].map(([l, v]) => <div key={l}>
              <label style={S.label}>{l}</label>
              <input type={l.includes("Password") ? "password" : "text"} style={S.input} defaultValue={v} />
            </div>)}
          </div>
          <div style={{ background: COLORS.gray50, borderRadius: 10, padding: "12px 14px", marginTop: 16, marginBottom: 20, fontSize: 13, color: COLORS.gray600 }}>
            Assigned Plan: <strong>Growth Partner — $249/mo</strong><br />Market: <strong>Greenville, SC</strong>
          </div>
          <button onClick={() => setStep(3)} style={{ ...S.btn("primary", "lg"), width: "100%", justifyContent: "center" }}>Create Account & Start →</button>
        </>}
      </div>
    </div>
  );
}

async function validateInviteCode(inviteCode) {
  const code = (inviteCode || "").trim();
  if (!code) return { ok: false, reason: "Invite code is required." };

  const { data, error } = await supabase
    .from("invite_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    return { ok: false, reason: error.message || "Unable to verify invite code." };
  }
  if (!data) return { ok: false, reason: "Invalid invite code." };

  if (typeof data.is_active === "boolean" && !data.is_active) return { ok: false, reason: "This invite code is no longer active." };
  if (data.status && String(data.status).toLowerCase() !== "active") return { ok: false, reason: "This invite code is not active." };
  if (data.used_at) return { ok: false, reason: "This invite code has already been used." };

  if (data.expires_at) {
    const expiresAt = new Date(data.expires_at).getTime();
    if (!Number.isNaN(expiresAt) && Date.now() > expiresAt) return { ok: false, reason: "This invite code has expired." };
  }

  return { ok: true, data };
}

const authShellBg = `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 55%, #1a1a2e 100%)`;

function AuthCardShell({ children, maxWidth = 480 }) {
  return (
    <div style={{ minHeight: "100vh", background: authShellBg, fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: COLORS.orange, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 16 }}>T</div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>TreadFlow</span>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 20px 48px" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 40px", maxWidth, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.12)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function LoginPage({ nav }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) setError(error.message);
  };

  const linkStyle = { background: "none", border: "none", padding: 0, margin: 0, cursor: "pointer", color: COLORS.blue, fontSize: 14, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3, fontFamily: "inherit" };

  return (
    <AuthCardShell maxWidth={460}>
      <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.orange, letterSpacing: 1.2, marginBottom: 10, textTransform: "uppercase" }}>Shop owner login</div>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: COLORS.gray900, margin: "0 0 8px" }}>Welcome back</h2>
      <p style={{ color: COLORS.gray500, margin: "0 0 24px", fontSize: 15, lineHeight: 1.55 }}>Sign in with the email and password for your shop.</p>

      <form onSubmit={onSubmit}>
        <label style={S.label}>Email</label>
        <input style={{ ...S.input, marginBottom: 12 }} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <label style={S.label}>Password</label>
        <input type="password" style={{ ...S.input, marginBottom: 14 }} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />

        {error && (
          <div role="alert" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", borderRadius: 10, padding: "12px 14px", fontSize: 13, marginBottom: 16, lineHeight: 1.45 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{ ...S.btn("primary", "lg"), width: "100%", justifyContent: "center", opacity: loading ? 0.75 : 1 }}>
          {loading ? "Signing in…" : "Sign in →"}
        </button>
      </form>

      <p style={{ textAlign: "center", margin: "18px 0 0", fontSize: 14, color: COLORS.gray600 }}>
        Need an account?{" "}
        <button type="button" onClick={() => nav("signup")} style={linkStyle}>
          Sign up with an invite code
        </button>
      </p>

      <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${COLORS.gray200}` }}>
        <button type="button" onClick={() => nav("home")} style={{ ...S.btn("ghost", "sm"), width: "100%", justifyContent: "center", color: COLORS.gray600, border: `1px solid ${COLORS.gray300}` }}>
          ← Back to public site
        </button>
      </div>
    </AuthCardShell>
  );
}

function SignUpPage({ nav }) {
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);

    const validation = await validateInviteCode(inviteCode);
    if (!validation.ok) {
      setLoading(false);
      return setError(validation.reason);
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          invite_code: inviteCode.trim(),
        },
      },
    });

    setLoading(false);

    if (error) return setError(error.message);

    if (data?.session) {
      setSuccessMsg("Account created. You’re signed in — heading to your dashboard.");
    } else {
      setSuccessMsg("Account created. Check your email to confirm your address, then return here to log in.");
    }
  };

  return (
    <AuthCardShell maxWidth={520}>
      <div style={{ fontSize: 12, fontWeight: 800, color: COLORS.orange, letterSpacing: 1.2, marginBottom: 10, textTransform: "uppercase" }}>Invite-only sign up</div>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: COLORS.gray900, margin: "0 0 8px" }}>Create your shop account</h2>
      <p style={{ color: COLORS.gray500, margin: "0 0 24px", fontSize: 15, lineHeight: 1.55 }}>Enter the invite code you received, then choose your login email and password.</p>

      <form onSubmit={onSubmit}>
        <label style={S.label}>Invite code</label>
        <input style={{ ...S.input, marginBottom: 12, fontFamily: "ui-monospace, monospace", fontWeight: 700, letterSpacing: 1 }} value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="e.g. TF-SC-KX92PL" />
        <label style={S.label}>Email</label>
        <input style={{ ...S.input, marginBottom: 12 }} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <label style={S.label}>Password</label>
        <input type="password" style={{ ...S.input, marginBottom: 12 }} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <label style={S.label}>Confirm password</label>
        <input type="password" style={{ ...S.input, marginBottom: 14 }} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />

        {error && (
          <div role="alert" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", borderRadius: 10, padding: "12px 14px", fontSize: 13, marginBottom: 16, lineHeight: 1.45 }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div role="status" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534", borderRadius: 10, padding: "12px 14px", fontSize: 13, marginBottom: 16, lineHeight: 1.55 }}>
            ✓ {successMsg}
          </div>
        )}

        <button type="submit" disabled={loading || !!successMsg} style={{ ...S.btn("orange", "lg"), width: "100%", justifyContent: "center", fontWeight: 700, opacity: loading || successMsg ? 0.75 : 1 }}>
          {loading ? "Creating account…" : "Create account →"}
        </button>
      </form>

      <p style={{ textAlign: "center", margin: "18px 0 0", fontSize: 14, color: COLORS.gray600 }}>
        Already have an account?{" "}
        <button type="button" onClick={() => nav("login")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: COLORS.blue, fontSize: 14, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3, fontFamily: "inherit" }}>
          Log in
        </button>
      </p>

      <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${COLORS.gray200}` }}>
        <button type="button" onClick={() => nav("home")} style={{ ...S.btn("ghost", "sm"), width: "100%", justifyContent: "center", color: COLORS.gray600, border: `1px solid ${COLORS.gray300}` }}>
          ← Back to public site
        </button>
      </div>
    </AuthCardShell>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [intendedPage, setIntendedPage] = useState("shop");

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.warn("supabase.auth.getSession error:", error);
      setSession(data?.session ?? null);
      setAuthReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => {
      mounted = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  // If the user is on auth pages and gets a session, send them where they meant to go.
  useEffect(() => {
    if (!authReady) return;
    if (session && (page === "login" || page === "signup")) setPage(intendedPage || "shop");
  }, [authReady, intendedPage, page, session]);

  const nav = (p) => {
    const protectedPages = new Set(["shop"]);
    if (protectedPages.has(p) && !session) {
      setIntendedPage(p);
      setPage("login");
      return;
    }
    setPage(p);
  };

  const navBar = (
    <div style={{ background: COLORS.navy, padding: "10px 20px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontFamily: "system-ui, sans-serif" }}>
      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginRight: 4 }}>Navigate:</span>
      {[["home","🌐 Public Site"],["login","🔐 Login"],["signup","✨ Sign Up"],["invite","📝 Request Invite"],["market","📍 Market Check"],["onboarding","🔑 Invite Onboarding"],["admin","🛠 Super Admin"],["shop","🏪 Shop Dashboard"],["storefront","🛞 Shop Storefront"]].map(([p, l]) => <button key={p} onClick={() => nav(p)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, cursor: "pointer", background: page === p ? COLORS.blue : "rgba(255,255,255,0.1)", color: "#fff", border: "none", fontWeight: page === p ? 700 : 400 }}>{l}</button>)}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      {navBar}
      {page === "home" && <LandingPage nav={nav} />}
      {page === "login" && <LoginPage nav={nav} />}
      {page === "signup" && <SignUpPage nav={nav} />}
      {page === "invite" && <InvitePage nav={nav} />}
      {page === "market" && <MarketPage nav={nav} />}
      {page === "onboarding" && <InviteOnboarding nav={nav} />}
      {page === "admin" && <SuperAdmin nav={nav} />}
      {page === "shop" && (authReady ? (session ? <ShopDashboard nav={nav} /> : <LoginPage nav={nav} />) : <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>Loading...</div>)}
      {page === "storefront" && <Storefront nav={nav} />}
    </div>
  );
}
