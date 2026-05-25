import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import { sendEmail, reservationConfirmation, orderNotification, orderStatusUpdate } from "./email";
const redirectToCheckout = (paymentLink) => {
  console.log("Redirecting to:", paymentLink);
  if (!paymentLink) { alert("No payment link found!"); return; }
  window.location.href = paymentLink;
};

const sendSms = async (to, message) => {
  try {
    const res = await fetch("/api/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, message }),
    });
    if (!res.ok) {
      const err = await res.json();
      console.warn("SMS send failed:", err);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("SMS error:", e);
    return false;
  }
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
const SHOP_PUBLIC_URL = "https://www.treadflow.cc";

function tireSlug(tire) {
  return [tire?.brand, tire?.model, tire?.size].filter(Boolean).join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function tirePagePath(tire, shopSlug = PUBLIC_STOREFRONT_SLUG) {
  return `/shop/${shopSlug}/${tireSlug(tire)}`;
}

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
    sms_consent: row.sms_consent === true,
    created_at: row.created_at,
    orderLabel,
  };
}

function formatCustomerRecordDate(created_at) {
  if (!created_at) return "";
  const d = new Date(created_at);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function customerVehicleFromRow(row) {
  const parts = [];
  if (row.vehicle_year) parts.push(row.vehicle_year);
  if (row.vehicle_make) parts.push(row.vehicle_make);
  if (row.vehicle_model) parts.push(row.vehicle_model);
  if (parts.length) return parts.join(" ");
  return row.vehicle || "—";
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
const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

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

const PLAN_TIER_DEFS = [
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

const LOCAL_PLANS = PLAN_TIER_DEFS.map((tier, index) => {
  const { tierFeatures, ...plan } = tier;
  return {
    ...plan,
    features: PLAN_TIER_DEFS.slice(0, index + 1).flatMap(t => t.tierFeatures),
  };
});

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

function useWindowWidth() {
  const [width, setWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

function gridCols(desktop, isMobile) {
  return isMobile ? "1fr" : desktop;
}

function getSpeechRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function tireFormFromParsedJson(parsed) {
  const condition = String(parsed?.condition ?? "").toLowerCase() === "used" ? "Used" : "New";
  const qtyNum = Number(parsed?.quantity ?? parsed?.qty ?? 0);
  const priceNum = Number(parsed?.price ?? 0);
  return {
    brand: String(parsed?.brand ?? ""),
    model: String(parsed?.model ?? ""),
    size: String(parsed?.size ?? ""),
    condition,
    qty: qtyNum > 0 ? qtyNum : 1,
    price: priceNum > 0 ? String(priceNum) : "",
    type: "All-Season",
    tread: "",
    desc: "",
  };
}

async function parseTireTranscript(transcript) {
  const res = await fetch("/api/parse-tire", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to parse tire details (${res.status})`);
  }
  return data;
}

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
  const width = useWindowWidth();
  const isMobile = width < 768;
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
      <div style={{ background: COLORS.navy, padding: isMobile ? "0 16px" : "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 100, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: COLORS.orange, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 16 }}>T</div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>TreadFlow</span>
        </div>
        {!isMobile && (
          <div style={{ display: "flex", gap: 4 }}>
            {["Features","Pricing","Market Availability","FAQ"].map(l => <button key={l} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 14, padding: "8px 12px", cursor: "pointer" }}>{l}</button>)}
          </div>
        )}
        <button onClick={() => nav("invite")} style={{ ...S.btn("orange"), fontWeight: 700, ...(isMobile ? { width: "100%", maxWidth: 160, justifyContent: "center" } : {}) }}>Request Invite →</button>
      </div>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0F2040 60%, #1a1a2e 100%)`, padding: isMobile ? "60px 20px 80px" : "100px 40px 120px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", borderRadius: 99, padding: "5px 16px", fontSize: 13, color: COLORS.orange, fontWeight: 600, marginBottom: 20 }}>✦ Invite-Only Access · Limited Shops Per Market</div>
        <h1 style={{ fontSize: isMobile ? 32 : 52, fontWeight: 800, color: "#fff", margin: "0 auto 20px", lineHeight: 1.15, maxWidth: 800 }}>The Invite-Only Online Storefront Platform for Tire Shops</h1>
        <p style={{ fontSize: isMobile ? 16 : 20, color: "rgba(255,255,255,0.65)", maxWidth: 640, margin: "0 auto 40px", lineHeight: 1.6 }}>TreadFlow helps selected tire shops launch searchable online tire inventory, accept customer orders, and modernize their sales process before competitors catch up.</p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexDirection: isMobile ? "column" : "row", alignItems: "stretch", maxWidth: isMobile ? 360 : undefined, margin: "0 auto" }}>
          <button onClick={() => nav("invite")} style={{ ...S.btn("orange", "lg"), fontWeight: 700, ...(isMobile ? { width: "100%", justifyContent: "center" } : {}) }}>Request an Invite →</button>
          <button onClick={() => nav("market")} style={{ ...S.btn("ghost", "lg"), ...(isMobile ? { width: "100%", justifyContent: "center" } : {}) }}>Check Market Availability</button>
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
        <div style={{ display: "grid", gridTemplateColumns: gridCols("repeat(auto-fit, minmax(240px, 1fr))", isMobile), gap: 20, maxWidth: 1100, margin: "0 auto" }}>
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
          {LOCAL_PLANS.map(p => <div key={p.name} style={{ flex: "1 1 280px", maxWidth: 320, borderRadius: 16, border: p.highlight ? `2px solid ${COLORS.blue}` : "1px solid #E2E8F0", padding: "32px 28px", background: p.highlight ? "#F0F7FF" : "#fff", position: "relative" }}>
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
          <span onClick={() => nav("login")} style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}>Login</span>
        </div>
      </div>
    </div>
    
  );
}

// ── 2. REQUEST INVITE ────────────────────────────────────────────────────
function InvitePage({ nav }) {
  const width = useWindowWidth();
  const isMobile = width < 768;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ shopName: "", ownerName: "", phone: "", email: "", address: "", city: "", state: "", locations: "1", website: "", referralCode: "", tireType: "Both", inventory: "", currentMethod: "Spreadsheets", online: "No", installation: "Yes", features: [], notes: "" });
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
          <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 1fr", isMobile), gap: 16 }}>
            {[["shopName","Shop Name"],["ownerName","Owner Name"],["phone","Phone Number"],["email","Email Address"],["address","Shop Address"],["city","City"],["state","State"],["website","Current Website URL"],["referralCode","Referral Code (optional)"]].map(([k, l]) => <div key={k} style={!isMobile && (k === "address" || k === "website" || k === "referralCode") ? { gridColumn: "1/-1" } : {}}>
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
          <button onClick={async () => { await supabase.auth.signOut(); nav("login"); }} style={{ ...S.btn("ghost", "sm"), width: "100%", justifyContent: "center", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)", marginTop: 6 }}>Logout</button>
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
  const isMobile = useWindowWidth() < 768;
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
    <div style={{ display: "grid", gridTemplateColumns: gridCols("repeat(4, 1fr)", isMobile), gap: 14, marginBottom: 28 }}>
      {metrics.map(m => <MetricCard key={m.label} {...m} />)}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 1fr", isMobile), gap: 20 }}>
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
  const isMobile = useWindowWidth() < 768;
  const [note, setNote] = useState("");
  const [plan, setPlan] = useState(app.plan || "Early Partner");
  return <div>
    <button onClick={onBack} style={{ background: "none", border: "none", color: COLORS.blue, cursor: "pointer", fontSize: 14, marginBottom: 20 }}>← Back to Applications</button>
    <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 340px", isMobile), gap: 20 }}>
      <div style={S.card}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{app.shop}</div>
        <div style={{ color: COLORS.gray500, fontSize: 14, marginBottom: 20 }}>Application submitted {app.date}</div>
        <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 1fr", isMobile), gap: 16 }}>
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
  const isMobile = useWindowWidth() < 768;
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
    <div style={{ display: "grid", gridTemplateColumns: gridCols("320px 1fr", isMobile), gap: 20 }}>
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
              <div style={{ display: "grid", gridTemplateColumns: isMobile || preview === "mobile" ? "1fr" : "1fr 1fr", gap: 8 }}>
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
  const isMobile = useWindowWidth() < 768;
  return <div>
    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Plans & Billing</h2>
    <div style={{ display: "grid", gridTemplateColumns: gridCols("repeat(3, 1fr)", isMobile), gap: 16 }}>
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
  const isMobile = useWindowWidth() < 768;
  return <div>
    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Platform Settings</h2>
    <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 1fr", isMobile), gap: 20 }}>
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
  const width = useWindowWidth();
  const isMobile = width < 768;
  const [section, setSection] = useState("overview");
  const [tires, setTires] = useState([]);
  const [orders, setOrders] = useState([]);
  const [shops, setShops] = useState([]);
  const [activeShop, setActiveShop] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedTire, setSelectedTire] = useState(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setShopLoading(true);
      setIsSuperAdmin(false);
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (cancelled) return;
      if (userErr || !user?.email) {
        setShops([]);
        setActiveShop(null);
        setShopLoading(false);
        return;
      }
      if (user.email === "powerlinkmarketing@protonmail.com") {
        setIsSuperAdmin(true);
        setShopLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("shops")
        .select("id, name, owner_name, email, city, state, status, plan, slug")
        .eq("user_id", user.id)
        .order("name", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.warn("Shop lookup failed:", error);

        setShops([]);
        setActiveShop(null);
      } else {
        const shopsData = data || [];
        setShops(shopsData);
        setActiveShop(prev => {
          if (prev) {
            return shopsData.find(s => s.id === prev.id) || shopsData[0] || null;
          }
          return shopsData[0] || null;
        });
      }
      setShopLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const shopId = activeShop?.id ?? null;
  const shopInitial = ((activeShop?.name || "?").trim().charAt(0) || "?").toUpperCase();
  const shopLocationLine = activeShop ? [activeShop.city, activeShop.state].filter(Boolean).join(", ") : "";

  const sidebar = [
    ["overview","📊","Overview"],
    ["inventory","📦","Inventory"],
    ["orders","📋","Orders"],
    ["mobile","🚗","Mobile"],
    ["appointments","📅","Appointments"],
    ["customers","👥","Customers"],
    ["promotions","📣","Promotions"],
    ["analytics","📈","Analytics"],
    ["design","🎨","Design"],
    ["staff","👥","Staff"],
    ["settings","⚙️","Settings"],
    ["billing","💳","Billing"],
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    nav("login");
  };

  const sectionTabs = sidebar.map(([id, icon, label]) => ({ id, icon, label: label.split(" ")[0], kind: "section" }));
  const settingsIdx = sectionTabs.findIndex(t => t.id === "settings");
  const mobileNavItems = [
    ...sectionTabs.slice(0, settingsIdx + 1),
    { id: "design", icon: "🎨", label: "Design", kind: "section" },
    ...sectionTabs.slice(settingsIdx + 1),
    { id: "storefront", icon: "🌐", label: "Store", kind: "storefront" },
    { id: "logout", icon: "🚪", label: "Out", kind: "logout" },
  ];
  const designShopRecord = activeShop ? { id: activeShop.id, name: activeShop.name, city: activeShop.city, state: activeShop.state } : null;

  if (shopLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", background: COLORS.gray50, color: COLORS.gray600 }}>
        Loading shop…
      </div>
    );
  }

  if (isSuperAdmin) {
    return <SuperAdmin nav={nav} />;
  }

  if (!activeShop) {
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
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", minHeight: "100vh", height: isMobile ? "auto" : "100vh", fontFamily: "system-ui, sans-serif", background: COLORS.gray50, position: "relative" }}>
      {toast && <div style={{ position: "fixed", bottom: isMobile ? 88 : 24, right: 24, background: COLORS.gray900, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, zIndex: 999 }}>{toast}</div>}
      {!isMobile && (
      <div style={{ width: 220, background: "#0A1628", padding: "20px 12px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px 24px" }}>
          <div style={{ width: 30, height: 30, background: COLORS.blue, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 14 }}>{shopInitial}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, lineHeight: 1.25 }} title={activeShop?.name}>{activeShop?.name}</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Shop Dashboard</div>
          </div>
        </div>
        {shops.length > 1 && (
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.9)", marginBottom: 8, fontWeight: 600 }}>Switch shop</label>
            <select value={activeShop?.id || ""} onChange={e => setActiveShop(shops.find(s => s.id === e.target.value) || activeShop)} style={{ width: "100%", appearance: "none", borderRadius: 12, border: "1px solid rgba(255,255,255,0.3)", background: "#1E3A5F", color: "#fff", padding: "10px 12px", fontSize: 13, cursor: "pointer" }}>
              {shops.map(shop => <option key={shop.id} value={shop.id} style={{ background: "#0A1628", color: "#fff" }}>{shop.name}</option>)}
            </select>
          </div>
        )}
        {sidebar.map(([id, icon, label]) => <SidebarLink key={id} icon={icon} label={label} active={section === id} onClick={() => { setSection(id); setSelectedTire(null); }} />)}
        <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={() => nav("storefront")} style={{ ...S.btn("ghost", "sm"), justifyContent: "center", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.15)", width: "100%" }}>View My Storefront</button>
          <button onClick={async () => { await supabase.auth.signOut(); nav("login"); }} style={{ ...S.btn("ghost", "sm"), justifyContent: "center", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.15)", width: "100%" }}>Logout</button>
          <button onClick={() => nav("home")} style={{ ...S.btn("ghost", "sm"), justifyContent: "center", color: "rgba(255,255,255,0.4)", border: "none", width: "100%" }}>← Back to Home</button>
        </div>
      </div>
      )}
      <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "16px 16px 88px" : 28 }}>
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${COLORS.gray200}` }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.25 }} title={activeShop?.name}>{activeShop?.name}</div>
              <div style={{ fontSize: 12, color: COLORS.gray500 }}>Shop Dashboard</div>
            </div>
            <button type="button" onClick={handleLogout} style={{ ...S.btn("secondary", "sm"), flexShrink: 0 }}>Logout</button>
          </div>
        )}
        {section === "overview" && <ShopOverview tires={tires} orders={orders} shopName={activeShop?.name} shopLocation={shopLocationLine} />}
        {section === "inventory" && <InventoryPage shopId={shopId} tires={tires} setTires={setTires} showToast={showToast} selectedTire={selectedTire} setSelectedTire={setSelectedTire} />}
        {section === "orders" && <OrdersPage shopId={shopId} shopName={activeShop?.name} shopPhone={storefront.phone} orders={orders} setOrders={setOrders} showToast={showToast} />}
        {section === "appointments" && <AppointmentsPage shopId={shopId} showToast={showToast} />}
        {section === "mobile" && <MobileJobsPage shopId={shopId} shopName={activeShop?.name} shopPhone={storefront.phone} showToast={showToast} />}
        {section === "customers" && <CustomersPage shopId={shopId} showToast={showToast} />}
        {section === "promotions" && <PromotionsPage shopId={shopId} showToast={showToast} />}
        {section === "analytics" && <AnalyticsPage shopId={shopId} showToast={showToast} />}
        {section === "staff" && <StaffPage showToast={showToast} />}
        {section === "settings" && <ShopSettings shopId={shopId} showToast={showToast} />}
        {section === "design" && designShopRecord && <StorefrontStudio shop={designShopRecord} shops={[designShopRecord]} onShopChange={() => {}} showToast={showToast} />}
        {section === "billing" && <ShopBilling shopId={shopId} plan={activeShop?.plan} status={activeShop?.status} />}
      </div>
      {isMobile && (
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0A1628", borderTop: "1px solid rgba(255,255,255,0.1)", zIndex: 100, paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}>
          <div style={{ display: "flex", overflowX: "auto", WebkitOverflowScrolling: "touch", gap: 2, padding: "6px 4px 4px" }}>
            {mobileNavItems.map(item => {
              const active = item.kind === "section" && section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.kind === "storefront") nav("storefront");
                    else if (item.kind === "logout") handleLogout();
                    else { setSection(item.id); setSelectedTire(null); }
                  }}
                  title={item.label}
                  style={{
                    flex: "0 0 auto",
                    minWidth: 52,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    background: active ? "#1E3A5F" : "transparent",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 8px",
                    cursor: "pointer",
                    color: active ? "#fff" : "rgba(255,255,255,0.75)",
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.2 }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function ShopOverview({ tires, orders, shopName, shopLocation }) {
  const isMobile = useWindowWidth() < 768;
  const pending = orders.filter(o => o.status === "Pending" || o.status === "pending").length;
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
    <div style={{ display: "grid", gridTemplateColumns: gridCols("repeat(4, 1fr)", isMobile), gap: 14, marginBottom: 24 }}>
      <MetricCard label="Total Tires" value={tires.reduce((a, t) => a + t.qty, 0)} />
      <MetricCard label="Low Stock" value={lowStock} color={lowStock > 0 ? COLORS.red : COLORS.green} />
      <MetricCard label="Pending Orders" value={pending} color={pending > 0 ? COLORS.orange : COLORS.gray700} />
      <MetricCard label="Est. Revenue (Month)" value={`$${revenue.toFixed(0)}`} color={COLORS.green} />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 1fr", isMobile), gap: 20 }}>
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
  const isMobile = useWindowWidth() < 768;
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Tap to speak");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [voiceMode, setVoiceMode] = useState("single");
  const [pendingTires, setPendingTires] = useState([]);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showLowStockBanner, setShowLowStockBanner] = useState(true);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [filterCondition, setFilterCondition] = useState("All");
  const [search, setSearch] = useState("");
  const [newTire, setNewTire] = useState({ brand: "", model: "", size: "", condition: "New", qty: 1, price: "", type: "All-Season", tread: "", desc: "" });
  const [editPrice, setEditPrice] = useState("");
  const [editSetPrice, setEditSetPrice] = useState("");
  const [editQty, setEditQty] = useState("");
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef("");
  const skipProcessOnEndRef = useRef(false);

  const handleVoiceTap = async () => {
    if (isListening) {
      stopVoiceListening(true);
      setVoiceStatus("Tap to speak");
      return;
    }
    setVoiceTranscript("");
    setVoiceError("");
    setVoiceStatus("Listening...");
    startVoiceListening();
  };
  // CSV import helpers
  const parseCsvPreview = async (file) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = lines[0].split(",").map(h => h.trim());
    const rows = lines.slice(1).map(l => l.split(",").map(c => c.trim()));
    return { headers, rows };
  };

  const handleCsvFileChange = async (e) => {
    const f = e.target.files && e.target.files[0];
    setCsvFile(f || null);
    setCsvErrors([]);
    setCsvPreviewRows([]);
    if (!f) return;
    try {
      const { headers, rows } = await parseCsvPreview(f);
      const preview = rows.slice(0, 5).map(r => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = r[i] ?? "");
        return obj;
      });
      setCsvPreviewRows(preview);
    } catch (err) {
      setCsvErrors(["Could not read CSV file"]);
    }
  };

  const downloadCsvTemplate = () => {
    const headers = ["brand","model","size","condition","quantity","price"];
    const sample = ["Michelin","Defender T+H","225/55R17","New",4,139.99];
    const csv = `${headers.join(",")}\n${sample.join(",")}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tire-import-template.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importCsv = async () => {
    if (!csvFile) return setCsvErrors(["No file selected"]);
    setCsvImporting(true);
    setCsvErrors([]);
    try {
      const text = await csvFile.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) { setCsvErrors(["CSV has no data rows"]); setCsvImporting(false); return; }
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const required = ["brand","size","price"];
      const toInsert = [];
      const errors = [];
      lines.slice(1).forEach((ln, idx) => {
        const cols = ln.split(",").map(c => c.trim());
        const row = {};
        headers.forEach((h,i) => row[h] = cols[i] ?? "");
        const rowNum = idx + 2;
        // validate
        for (const r of required) {
          if (!row[r]) { errors.push(`Row ${rowNum}: missing ${r}`); return; }
        }
        const quantity = Number(row.quantity || 1);
        const price = Number(row.price || 0);
        if (Number.isNaN(price)) { errors.push(`Row ${rowNum}: invalid price`); return; }
        toInsert.push({ brand: row.brand, model: row.model || "", size: row.size, condition: row.condition || "New", quantity, price, shop_id: shopId, status: 'Active' });
      });
      if (errors.length) { setCsvErrors(errors); setCsvImporting(false); return; }
      if (toInsert.length === 0) { setCsvErrors(["No valid rows to import"]); setCsvImporting(false); return; }
      const { data, error } = await supabase.from('tires').insert(toInsert);
      if (error) { setCsvErrors([error.message || 'Import failed']); setCsvImporting(false); return; }
      // append to local list
      setTires(ts => [...(ts||[]), ...((data||[]).map(tireFromSupabaseRow))]);
      showToast(`Imported ${data.length} tires`);
      setShowCsvModal(false);
      setCsvFile(null);
      setCsvPreviewRows([]);
    } catch (err) {
      setCsvErrors([err.message || 'Import failed']);
    }
    setCsvImporting(false);
  };
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopVoiceListening = useCallback((skipProcess = false) => {
    if (skipProcess) skipProcessOnEndRef.current = true;
    clearSilenceTimer();
    listeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* already stopped */
      }
    }
  }, [clearSilenceTimer]);

  const removePendingTire = useCallback((index) => {
    setPendingTires(prev => prev.filter((_, i) => i !== index));
  }, []);

  const importPendingTires = async () => {
    if (pendingTires.length === 0) return;
    const rows = pendingTires.map(t => ({
      shop_id: shopId,
      brand: t.brand,
      model: t.model,
      size: t.size,
      condition: t.condition,
      quantity: Number(t.qty) || 1,
      price: Number(t.price) || 0,
      status: (Number(t.qty) || 1) === 0 ? "Out of Stock" : "Active",
    }));
    const { data, error } = await supabase.from('tires').insert(rows).select();
    if (error) {
      showToast(error.message || "Could not import tires");
      return;
    }
    setTires(ts => [...ts, ...((data || []).map(tireFromSupabaseRow))]);
    const count = data.length;
    setPendingTires([]);
    showToast(`Successfully imported ${count} tires`);
  };

  const handleBulkDone = () => {
    stopVoiceListening(true);
    setVoiceStatus("Done listening. Review the pending list below.");
  };

  const processVoiceTranscript = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setVoiceStatus("Tap to speak");
      setVoiceError("No speech detected. Try again.");
      return;
    }
    setVoiceStatus("Processing...");
    setVoiceError("");
    try {
      const parsed = await parseTireTranscript(trimmed);
      stopVoiceListening(true);
      setShowVoiceModal(false);
      setVoiceStatus("Tap to speak");
      setVoiceTranscript("");
      setVoiceError("");
      transcriptRef.current = "";
      setNewTire(tireFormFromParsedJson(parsed));
      setShowAdd(true);
      showToast("Review pre-filled tire details before saving");
    } catch (err) {
      setVoiceError(err?.message || "Could not parse tire details. Use the transcript below and enter manually.");
      setShowAdd(true);
      setNewTire(t => ({ ...t, desc: trimmed }));
    }
  }, [stopVoiceListening, showToast]);

  const processBulkTranscript = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setVoiceStatus("Processing...");
    setVoiceError("");
    try {
      const parsed = await parseTireTranscript(trimmed);
      setPendingTires(prev => [...prev, tireFormFromParsedJson(parsed)]);
      setVoiceStatus("Keep going... say the next tire");
      setVoiceTranscript("");
      transcriptRef.current = "";
    } catch (err) {
      setVoiceError(err?.message || "Could not parse this tire. Keep talking or try again.");
      setVoiceStatus("Listening...");
    }
  }, []);

  const startVoiceListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognitionCtor();
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setVoiceError("Voice input not supported on this browser");
      return;
    }
    setVoiceError("");
    transcriptRef.current = "";
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onresult = async (event) => {
      let chunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        chunk += event.results[i][0].transcript;
      }
      transcriptRef.current = `${transcriptRef.current} ${chunk}`.trim();
      setVoiceTranscript(transcriptRef.current);
      clearSilenceTimer();
      silenceTimerRef.current = window.setTimeout(async () => {
        if (!listeningRef.current) return;
        const finalText = transcriptRef.current.trim();
        if (voiceMode === "bulk") {
          await processBulkTranscript(finalText);
          transcriptRef.current = "";
          setVoiceTranscript("");
        } else {
          stopVoiceListening();
        }
      }, voiceMode === "bulk" ? 2000 : 5000);
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        setVoiceError(event.error === "not-allowed" ? "Microphone permission denied" : `Speech error: ${event.error}`);
      }
      listeningRef.current = false;
      setIsListening(false);
      setVoiceStatus("Tap to speak");
      clearSilenceTimer();
    };

    recognition.onend = () => {
      if (skipProcessOnEndRef.current) {
        skipProcessOnEndRef.current = false;
        setVoiceStatus("Tap to speak");
        return;
      }
      if (voiceMode === "bulk" && listeningRef.current) {
        startVoiceListening();
        return;
      }
      listeningRef.current = false;
      setIsListening(false);
      clearSilenceTimer();
      const finalText = transcriptRef.current.trim();
      if (finalText && voiceMode === "single") {
        processVoiceTranscript(finalText);
      } else if (!finalText) {
        setVoiceStatus("Tap to speak");
      }
    };

    try {
      recognition.start();
      listeningRef.current = true;
      setIsListening(true);
      setVoiceStatus("Listening...");
    } catch {
      setVoiceError("Could not start voice recognition");
      setVoiceStatus("Tap to speak");
      setIsListening(false);
    }
  }, [clearSilenceTimer, stopVoiceListening, processVoiceTranscript, processBulkTranscript, voiceMode]);

  useEffect(() => () => stopVoiceListening(), [stopVoiceListening]);

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
      const mapped = (data || []).map(tireFromSupabaseRow);
      setTires(mapped);
      // compute low stock items (qty <= 2 and Active)
      const low = mapped.filter(t => Number(t.qty) <= 2 && String(t.status).toLowerCase() === "active");
      setLowStockItems(low.map(t => ({ id: t.id, label: `${t.brand} ${t.model} ${t.size}`, qty: Number(t.qty) })));
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
    const wasOutOfStock = Number(selectedTire.qty) === 0;
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
    showToast(wasOutOfStock && quantity > 0 ? "Don't forget to notify waitlist customers!" : "Tire updated");
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
    <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 320px", isMobile), gap: 20 }}>
      <div style={S.card}>
        <div style={{ background: COLORS.gray100, borderRadius: 10, height: 200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, marginBottom: 20 }}>🛞</div>
        <div style={{ fontWeight: 800, fontSize: 22 }}>{selectedTire.brand} {selectedTire.model}</div>
        <div style={{ color: COLORS.gray500, marginBottom: 16 }}>{selectedTire.size} · {selectedTire.type}</div>
        <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 1fr 1fr", isMobile), gap: 12 }}>
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
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button type="button" onClick={() => setShowCsvModal(true)} style={S.btn("secondary")}>📤 CSV Upload</button>
        <button type="button" onClick={() => setShowVoiceModal(true)} style={S.btn("secondary")}>🎤 Voice Add</button>
        <button type="button" onClick={() => setShowAdd(true)} style={S.btn("primary")}>+ Add Tire</button>
      </div>
    </div>
    {showLowStockBanner && lowStockItems && lowStockItems.length > 0 && (
      <div style={{ background: "#FFFBEB", border: `1px solid ${COLORS.yellow}`, padding: 12, borderRadius: 8, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: COLORS.gray700, fontSize: 14 }}>
          <strong>⚠️ Low Stock:</strong>&nbsp;{lowStockItems.map(i => `${i.label} (${i.qty} left)`).join(", ")}
        </div>
        <button onClick={() => setShowLowStockBanner(false)} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer" }}>✕</button>
      </div>
    )}
    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
      <input style={{ ...S.input, maxWidth: 260 }} placeholder="Search brand, model, size..." value={search} onChange={e => setSearch(e.target.value)} />
      {["All","New","Used"].map(c => <button key={c} onClick={() => setFilterCondition(c)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: `1px solid ${filterCondition === c ? COLORS.blue : COLORS.gray300}`, background: filterCondition === c ? "#EFF6FF" : "#fff", color: filterCondition === c ? COLORS.blue : COLORS.gray600, fontWeight: filterCondition === c ? 600 : 400 }}>{c}</button>)}
    </div>
    {showVoiceModal && (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 450, width: "100%", textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>🎤 Voice Tire Entry</div>
      <div style={{ fontSize: 13, color: COLORS.gray500, marginBottom: 24 }}>Say the tire details out loud — brand, size, condition, quantity, and price.</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
        <button type="button" onClick={() => setVoiceMode("single")} style={{ ...S.btn(voiceMode === "single" ? "primary" : "ghost", "sm"), minWidth: 110 }}>Single Tire</button>
        <button type="button" onClick={() => setVoiceMode("bulk")} style={{ ...S.btn(voiceMode === "bulk" ? "primary" : "ghost", "sm"), minWidth: 110 }}>Bulk Mode</button>
      </div>
      <div style={{ fontSize: 14, color: COLORS.gray600, marginBottom: 16, minHeight: 20 }}>{voiceMode === "bulk" ? "Bulk mode listens continuously and adds a tire after 2 seconds of pause." : "Single mode listens for one tire and then stops."}</div>
      <div style={{ fontSize: 14, color: COLORS.gray600, marginBottom: 20, minHeight: 20 }}>{voiceStatus}</div>
      <button onClick={handleVoiceTap} style={{ width: 80, height: 80, borderRadius: "50%", background: isListening ? COLORS.red : COLORS.blue, border: "none", fontSize: 32, cursor: "pointer", color: "#fff", marginBottom: 20 }}>{isListening ? "⏹" : "🎤"}</button>
      {voiceTranscript && <div style={{ background: COLORS.gray50, borderRadius: 8, padding: 12, fontSize: 13, color: COLORS.gray700, marginBottom: 16, textAlign: "left" }}><strong>Heard:</strong> {voiceTranscript}</div>}
      {voiceError && <div style={{ background: "#FEF2F2", borderRadius: 8, padding: 12, fontSize: 13, color: COLORS.red, marginBottom: 16 }}>{voiceError}</div>}
      {voiceMode === "bulk" && pendingTires.length > 0 && (
        <div style={{ textAlign: "left", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{pendingTires.length} tire{pendingTires.length === 1 ? "" : "s"} ready to import</div>
          <div style={{ maxHeight: 180, overflow: "auto", border: `1px solid ${COLORS.gray200}`, borderRadius: 12, padding: 12, marginBottom: 12 }}>
            {pendingTires.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: idx < pendingTires.length - 1 ? `1px solid ${COLORS.gray200}` : "none" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.brand} {item.model}</div>
                  <div style={{ fontSize: 12, color: COLORS.gray500 }}>{item.size} · ${item.price}</div>
                </div>
                <button onClick={() => removePendingTire(idx)} style={{ ...S.btn("ghost", "sm") }}>Remove</button>
              </div>
            ))}
          </div>
          <button onClick={importPendingTires} style={{ ...S.btn("primary"), width: "100%", marginBottom: 10 }} disabled={pendingTires.length === 0}>Import All</button>
          <button onClick={handleBulkDone} style={{ ...S.btn("secondary"), width: "100%" }}>Done</button>
        </div>
      )}
      {!isListening && voiceMode === "bulk" && pendingTires.length === 0 && (
        <div style={{ fontSize: 13, color: COLORS.gray500, marginBottom: 16 }}>Press the mic and speak one or more tire entries. Pause for 2 seconds after each tire to add it to the list.</div>
      )}
      <button onClick={() => { setShowVoiceModal(false); setVoiceStatus("Tap to speak"); setVoiceTranscript(""); setVoiceError(""); setIsListening(false); setVoiceMode("single"); setPendingTires([]); }} style={{ ...S.btn("secondary"), width: "100%", justifyContent: "center" }}>Cancel</button>
    </div>
  </div>
)}
    {showCsvModal && (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ background: "#fff", borderRadius: 12, padding: 20, maxWidth: 720, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Import Inventory CSV</div>
        <button onClick={() => { setShowCsvModal(false); setCsvFile(null); setCsvPreviewRows([]); setCsvErrors([]); }} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
      </div>
      <div style={{ marginBottom: 12, color: COLORS.gray600 }}>Expected format: <code>brand, model, size, condition, quantity, price</code>. First row should be headers.</div>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <input type="file" accept=".csv" onChange={handleCsvFileChange} />
        <button onClick={downloadCsvTemplate} style={S.btn("ghost")}>Download Template</button>
        <button onClick={importCsv} style={S.btn("primary")} disabled={csvImporting}>{csvImporting ? "Importing..." : "Import"}</button>
      </div>
      {csvErrors.length > 0 && <div style={{ background: "#FFF7ED", border: `1px solid ${COLORS.yellow}`, padding: 10, borderRadius: 8, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Errors</div>
        {csvErrors.map((e, i) => <div key={i} style={{ fontSize: 13, color: COLORS.gray700 }}>{e}</div>)}
      </div>}
      {csvPreviewRows.length > 0 && <div style={{ maxHeight: 240, overflow: "auto", border: `1px solid ${COLORS.gray200}`, borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{Object.keys(csvPreviewRows[0]||{}).map(h => <th key={h} style={{ textAlign: "left", padding: "8px 12px", background: COLORS.gray50 }}>{h}</th>)}</tr></thead>
          <tbody>{csvPreviewRows.map((r, i) => <tr key={i}>{Object.keys(r).map(k => <td key={k} style={{ padding: "8px 12px", borderTop: `1px solid ${COLORS.gray200}` }}>{r[k]}</td>)}</tr>)}</tbody>
        </table>
      </div>}
    </div>
  </div>
)}

    {showAdd && <div style={{ ...S.card, marginBottom: 20, background: "#F0F7FF", border: "1px solid #93C5FD" }}>
      <div style={{ fontWeight: 700, marginBottom: 14 }}>Add New Tire</div>
      <div style={{ display: "grid", gridTemplateColumns: gridCols("repeat(4, 1fr)", isMobile), gap: 12 }}>
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
      {!inventoryLoading && (isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 12 }}>
          {filtered.map(t => (
            <div key={t.id} style={{ ...S.card, padding: "16px 18px" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.gray900 }}>{t.brand} {t.model}</div>
              {t.featured && <span style={{ fontSize: 11, background: "#FEF9C3", color: "#854D0E", padding: "2px 8px", borderRadius: 4, marginTop: 6, display: "inline-block" }}>Featured</span>}
              <div style={{ fontSize: 14, color: COLORS.gray500, marginTop: 6 }}>{t.size}</div>
              <div style={{ marginTop: 8 }}><span style={S.badge(t.condition)}>{t.condition}</span></div>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.gray900, marginTop: 10 }}>${t.price}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.qty === 0 ? COLORS.red : t.qty <= 2 ? COLORS.orange : COLORS.gray700, marginTop: 4 }}>Qty: {t.qty}</div>
              <button type="button" onClick={() => setSelectedTire(t)} style={{ ...S.btn("primary", "sm"), width: "100%", justifyContent: "center", marginTop: 14 }}>Edit</button>
            </div>
          ))}
        </div>
      ) : (
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
      ))}
    </div>
  </div>;
}

function OrdersPage({ shopId, shopName, shopPhone, orders, setOrders, showToast }) {
  const isMobile = useWindowWidth() < 768;
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
    
    // Send SMS notifications on status changes when customer consented
    if (order?.phone && order?.sms_consent === true && (status === "Confirmed" || status === "Completed")) {
      let smsMessage = "";
      if (status === "Confirmed") {
        smsMessage = `Your tire order at ${shopName || "our shop"} has been confirmed! We'll see you soon. Reply STOP to unsubscribe.`;
      } else if (status === "Completed") {
        smsMessage = `Your tire order at ${shopName || "our shop"} is complete. Thank you for your business! Reply STOP to unsubscribe.`;
      }
      await sendSms(order.phone, smsMessage);
    }
    
    // Send email notifications
    if (order?.email && (status === "Confirmed" || status === "Completed")) {
      try {
        const { subject, html } = orderStatusUpdate(order.customer, order.tire, status, shopName || "Your tire shop", shopPhone || "");
        await sendEmail(order.email, subject, html);
      } catch (e) {
        console.warn("order status email:", e);
      }
    }
    
    // Send Google reviews email on completion
    if (order?.email && status === "Completed") {
      try {
        const googleReviewUrl = ""; // TODO: get from shop settings
        const reviewEmailHtml = `
          <p>Hi ${order.customer},</p>
          <p>Thank you for choosing ${shopName || "our shop"} for your tire service! We appreciate your business.</p>
          <p>If you had a great experience, we'd love to hear about it! Please take a moment to leave a review.</p>
          <p><a href="${googleReviewUrl}" style="background: #1E6FD9; color: white; padding: 12px 24px; borderRadius: 8px; textDecoration: none; display: inline-block;">Leave a Google Review</a></p>
          <p>Thanks for your support!</p>
        `;
        if (googleReviewUrl) {
          await sendEmail(order.email, `How was your experience at ${shopName || "our shop"}?`, reviewEmailHtml);
        }
      } catch (e) {
        console.warn("google reviews email:", e);
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
      {filtered.map(o => <div key={o.id} style={{ ...S.card, display: "grid", gridTemplateColumns: gridCols("1fr 1fr 1fr auto", isMobile), gap: 16, alignItems: isMobile ? "stretch" : "center" }}>
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
        <div>
          {(o.status === "Pending" || o.status === "pending") && <><button onClick={() => updateStatus(o.id, "Confirmed")} style={{ ...S.btn("primary", "sm"), justifyContent: "center" }}>Confirm</button><button onClick={() => updateStatus(o.id, "Cancelled")} style={{ ...S.btn("danger", "sm"), justifyContent: "center" }}>Cancel</button></>}
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
  const [calView, setCalView] = useState(false);

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
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Appointments</h2>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setCalView(false)} style={{ ...S.btn(calView ? "secondary" : "primary", "sm") }}>📋 List</button>
        <button onClick={() => setCalView(true)} style={{ ...S.btn(calView ? "primary" : "secondary", "sm") }}>📅 Calendar</button>
      </div>
    </div>

    {appointmentsLoading && (
      <div style={{ ...S.card, padding: "48px 24px", textAlign: "center", color: COLORS.gray500, fontSize: 15 }}>
        Loading appointments…
      </div>
    )}

    {!appointmentsLoading && !calView && (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {appointments.map(a => <div key={a.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1, minWidth: 0 }}>
            <div style={{ background: COLORS.blue, color: "#fff", borderRadius: 10, padding: "10px 14px", textAlign: "center", minWidth: 60, flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{a.monthLabel}</div>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{a.day}</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray500, marginBottom: 4 }}>{a.dateIso}{a.time ? ` · ${a.time}` : ""}</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{a.customerName}</div>
              <div style={{ fontSize: 13, color: COLORS.gray600 }}>{[a.customerPhone, a.customerEmail].filter(Boolean).join(" · ") || "—"}</div>
              <div style={{ fontSize: 14, color: COLORS.gray500, marginTop: 4 }}><strong style={{ color: COLORS.gray700 }}>Vehicle:</strong> {a.vehicle}</div>
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
            <span style={S.badge(a.status)}>{a.status}</span>
          </div>
        </div>)}
      </div>
    )}

    {!appointmentsLoading && calView && (
      <div style={{ ...S.card }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{new Date().toLocaleString("default", { month: "long", year: "numeric" })}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: COLORS.gray500 }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {(() => {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const cells = [];
            for (let i = 0; i < firstDay; i++) cells.push(<div key={"e"+i} />);
            for (let d = 1; d <= daysInMonth; d++) {
              const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
              const dayAppts = appointments.filter(a => a.dateIso === dateStr);
              cells.push(
                <div key={d} style={{ textAlign: "center", padding: "6px 2px", borderRadius: 6, background: dayAppts.length > 0 ? "#EFF6FF" : "transparent", border: dayAppts.length > 0 ? "1px solid #BFDBFE" : "1px solid transparent" }}>
                  <div style={{ fontSize: 13, fontWeight: dayAppts.length > 0 ? 700 : 400, color: dayAppts.length > 0 ? COLORS.blue : COLORS.gray700 }}>{d}</div>
                  {dayAppts.length > 0 && <div style={{ fontSize: 10, color: COLORS.blue, fontWeight: 600 }}>{dayAppts.length} appt{dayAppts.length > 1 ? "s" : ""}</div>}
                </div>
              );
            }
            return cells;
          })()}
        </div>
      </div>
    )}
  </div>;
}

function MobileJobsPage({ shopId, shopName, shopPhone, showToast }) {
  const isMobile = useWindowWidth() < 768;
  const [loading, setLoading] = useState(true);
  const [allJobs, setAllJobs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [hoveredDate, setHoveredDate] = useState(null);

  const loadAllJobs = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, customer_name, customer_phone, service_address, mobile_time_slot, mobile_date, quantity, total, status, created_at")
      .eq("shop_id", shopId)
      .eq("is_mobile", true)
      .order("mobile_date", { ascending: true });
    setLoading(false);
    if (error) {
      showToast(error.message || "Unable to load mobile jobs.");
      return;
    }
    setAllJobs((data || []).map(row => ({
      id: row.id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      serviceAddress: row.service_address,
      mobileTimeSlot: row.mobile_time_slot,
      mobileDate: row.mobile_date,
      quantity: Number(row.quantity || 0),
      total: Number(row.total || 0),
      status: row.status || "Pending",
    })));
  }, [shopId, showToast]);

  useEffect(() => {
    loadAllJobs();
  }, [loadAllJobs]);

  const selectedDayJobs = allJobs.filter(job => job.mobileDate === selectedDate).sort((a, b) => String(a.mobileTimeSlot).localeCompare(b.mobileTimeSlot));
  const slotCounts = selectedDayJobs.reduce((acc, job) => {
    if (!job.mobileTimeSlot) return acc;
    acc[job.mobileTimeSlot] = (acc[job.mobileTimeSlot] || 0) + 1;
    return acc;
  }, {});
  const totalRevenue = selectedDayJobs.reduce((sum, job) => sum + job.total, 0);

  const updateStatus = async (jobId, newStatus, job) => {
    if (!jobId) return;
    setStatusUpdating(true);
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", jobId);
    setStatusUpdating(false);
    if (error) {
      showToast(error.message || "Unable to update job status.");
      return;
    }
    setAllJobs(current => current.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    if (newStatus === "En Route") {
      await sendSms(job.customerPhone, `Your TreadFlow mobile tire tech is on the way! Expected arrival: ${job.mobileTimeSlot}. Call us at ${shopPhone} with any questions.`);
    }
    if (newStatus === "Completed") {
      await sendSms(job.customerPhone, `Your mobile tire installation is complete! Thank you for choosing ${shopName}. Reply STOP to unsubscribe.`);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const jobsByDate = allJobs.reduce((acc, job) => {
    if (!acc[job.mobileDate]) acc[job.mobileDate] = [];
    acc[job.mobileDate].push(job);
    return acc;
  }, {});

  const monthStr = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayJobs = jobsByDate[dateStr] || [];
    calendarCells.push({ day: d, dateStr, jobCount: dayJobs.length });
  }

  return <div>
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Mobile Jobs</h2>
      <p style={{ color: COLORS.gray500, marginBottom: 20 }}>View and manage mobile tire service jobs for {shopName}.</p>
    </div>

    <div style={{ ...S.card, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} style={{ ...S.btn("secondary", "sm") }}>← Previous</button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{monthStr}</div>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} style={{ ...S.btn("secondary", "sm") }}>Next →</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isMobile ? 2 : 4, marginBottom: 12 }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: isMobile ? 10 : 12, fontWeight: 700, color: COLORS.gray500, paddingBottom: 8 }}>{d}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: isMobile ? 2 : 4 }}>
        {calendarCells.map((cell, idx) => {
          if (!cell) return <div key={`empty-${idx}`} />;
          const isToday = cell.dateStr === today;
          const isSelected = cell.dateStr === selectedDate;
          const hasJobs = cell.jobCount > 0;
          const isHovered = hoveredDate === cell.dateStr;

          let bgColor = "#fff";
          let textColor = COLORS.gray900;
          let borderStyle = `1px solid ${COLORS.gray200}`;

          if (isSelected) {
            bgColor = COLORS.navy;
            textColor = "#fff";
            borderStyle = `2px solid ${COLORS.navy}`;
          } else if (hasJobs) {
            bgColor = COLORS.blue;
            textColor = "#fff";
            borderStyle = isToday ? `2px solid ${COLORS.orange}` : `1px solid ${COLORS.blue}`;
          } else if (isToday) {
            borderStyle = `2px solid ${COLORS.orange}`;
          }

          const hoverBg = isHovered ? (bgColor === "#fff" ? COLORS.gray100 : bgColor) : bgColor;

          return (
            <button
              key={cell.dateStr}
              onClick={() => setSelectedDate(cell.dateStr)}
              onMouseEnter={() => setHoveredDate(cell.dateStr)}
              onMouseLeave={() => setHoveredDate(null)}
              style={{
                position: "relative",
                padding: isMobile ? 6 : 10,
                borderRadius: 8,
                border: borderStyle,
                background: hoverBg,
                color: textColor,
                fontSize: isMobile ? 12 : 14,
                fontWeight: isSelected ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
                opacity: isHovered && bgColor !== "#fff" ? 0.85 : 1,
              }}
            >
              <div>{cell.day}</div>
              {cell.jobCount > 0 && (
                <div style={{
                  position: "absolute",
                  top: isMobile ? 2 : 4,
                  right: isMobile ? 2 : 4,
                  background: COLORS.orange,
                  color: "#fff",
                  borderRadius: "50%",
                  width: isMobile ? 16 : 20,
                  height: isMobile ? 16 : 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isMobile ? 9 : 11,
                  fontWeight: 700,
                }}>
                  {cell.jobCount}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 1fr 1fr", isMobile), gap: 12, marginBottom: 18 }}>
      <div style={S.card}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 6 }}>Selected Day</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
      </div>
      <div style={S.card}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 6 }}>Total Jobs</div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>{selectedDayJobs.length}</div>
      </div>
      <div style={S.card}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 6 }}>Revenue</div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>${totalRevenue.toFixed(2)}</div>
      </div>
    </div>

    {loading ? (
      <div style={{ ...S.card, padding: 24, textAlign: "center", color: COLORS.gray500 }}>Loading mobile jobs…</div>
    ) : selectedDayJobs.length === 0 ? (
      <div style={{ ...S.card, padding: 24, textAlign: "center", color: COLORS.gray500 }}>No mobile jobs scheduled for {new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.</div>
    ) : (
      <div style={{ display: "grid", gap: 14 }}>
        {selectedDayJobs.map(job => {
          const conflict = slotCounts[job.mobileTimeSlot] > 1;
          const timeSlotParts = (job.mobileTimeSlot || "").split(" - ");
          const startTime = timeSlotParts[0] || "";
          return (
            <div key={job.id} style={{ ...S.card, borderColor: conflict ? COLORS.red : COLORS.gray200, borderWidth: 1, borderStyle: "solid" }}>
              <div style={{ display: "grid", gridTemplateColumns: gridCols("90px 1fr 1fr", isMobile), gap: 14, alignItems: "flex-start" }}>
                <div style={{ background: COLORS.blue, color: "#fff", borderRadius: 8, padding: "8px 10px", textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: isMobile ? 10 : 12, fontWeight: 600 }}>Time</div>
                  <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, marginTop: 2, wordBreak: "break-word" }}>{startTime}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{job.customerName}</div>
                  <div style={{ display: "grid", gap: 3, color: COLORS.gray600, fontSize: 13 }}>
                    <div>📞 {job.customerPhone}</div>
                    <div>📍 {job.serviceAddress}</div>
                    <div>🛞 {job.quantity} tire{job.quantity === 1 ? "" : "s"} · ${job.total.toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ textAlign: isMobile ? "left" : "right" }}>
                  <div style={S.badge(job.status)}>{job.status}</div>
                  {conflict && <div style={{ marginTop: 6, color: COLORS.red, fontSize: 12, fontWeight: 600 }}>⚠️ Time conflict</div>}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                {job.status !== "Confirmed" && job.status !== "Completed" && job.status !== "Cancelled" && (
                  <button type="button" onClick={() => updateStatus(job.id, "Confirmed", job)} style={S.btn("primary", "sm")}>Confirm</button>
                )}
                {job.status !== "En Route" && job.status !== "Completed" && job.status !== "Cancelled" && (
                  <button type="button" onClick={() => updateStatus(job.id, "En Route", job)} style={S.btn("secondary", "sm")}>En Route</button>
                )}
                {job.status !== "Completed" && job.status !== "Cancelled" && (
                  <button type="button" onClick={() => updateStatus(job.id, "Completed", job)} style={S.btn("primary", "sm")}>Completed</button>
                )}
                {job.status !== "Cancelled" && (
                  <button type="button" onClick={() => updateStatus(job.id, "Cancelled", job)} style={S.btn("danger", "sm")}>Cancel</button>
                )}
                <a href={`https://maps.google.com/?q=${encodeURIComponent(job.serviceAddress)}`} target="_blank" rel="noopener noreferrer" style={{ ...S.btn("ghost", "sm"), color: COLORS.blue, border: `1px solid ${COLORS.blue}` }}>📍 Map</a>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>;
}

// SQL to create promotions table:
// create table promotions (
//   id uuid default gen_random_uuid() primary key,
//   shop_id uuid references shops(id),
//   title text not null,
//   discount_type text not null,
//   discount_value numeric not null,
//   applies_to text not null,
//   start_date date not null,
//   end_date date not null,
//   promo_code text,
//   active boolean not null default true,
//   created_at timestamptz default now()
// );

function CustomersPage({ shopId, showToast }) {
  const isMobile = useWindowWidth() < 768;
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerOrdersLoading, setCustomerOrdersLoading] = useState(false);

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

  useEffect(() => {
    if (!shopId || !selectedCustomer?.email) return;
    let cancelled = false;
    (async () => {
      setCustomerOrdersLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("shop_id", shopId)
        .eq("customer_email", selectedCustomer.email)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setCustomerOrdersLoading(false);
      if (error) {
        showToast(error.message);
        return;
      }
      setCustomerOrders((data || []).map(row => ({
        id: row.id,
        tireName: row.tire_name || row.tire || "Tire order",
        quantity: Number(row.quantity || 0),
        total: Number(row.total || 0),
        status: row.status || "Pending",
        date: formatOrderCreatedDate(row.created_at),
      })));
    })();
    return () => { cancelled = true; };
  }, [shopId, selectedCustomer, showToast]);

  const filteredCustomers = customers.filter(c => [c.name, c.phone, c.email].join(" ").toLowerCase().includes(customerSearch.toLowerCase()));
  const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0);

  if (selectedCustomer) {
    return <div>
      <button onClick={() => setSelectedCustomer(null)} style={{ background: "none", border: "none", color: COLORS.blue, cursor: "pointer", fontSize: 14, marginBottom: 20 }}>← Back to Customers</button>
      <div style={{ display: "grid", gridTemplateColumns: gridCols("1.6fr 1fr", isMobile), gap: 20 }}>
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 8 }}>{selectedCustomer.name}</div>
          <div style={{ color: COLORS.gray600, marginBottom: 6 }}>{selectedCustomer.phone}</div>
          <div style={{ color: COLORS.gray600, marginBottom: 6 }}>{selectedCustomer.email}</div>
          <div style={{ color: COLORS.gray700, marginTop: 12, fontWeight: 600 }}>Vehicle</div>
          <div style={{ color: COLORS.gray600, marginTop: 4 }}>{selectedCustomer.vehicle}</div>
          {selectedCustomer.notes && <div style={{ marginTop: 14 }}><div style={{ fontWeight: 600, color: COLORS.gray700, marginBottom: 6 }}>Notes</div><div style={{ color: COLORS.gray600 }}>{selectedCustomer.notes}</div></div>}
        </div>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Order History</div>
              <div style={{ fontSize: 13, color: COLORS.gray500 }}>{customerOrders.length} order{customerOrders.length === 1 ? "" : "s"}</div>
            </div>
          </div>
          {customerOrdersLoading && <div style={{ padding: "24px 0", textAlign: "center", color: COLORS.gray500 }}>Loading order history…</div>}
          {!customerOrdersLoading && customerOrders.length === 0 && <div style={{ padding: "24px 0", textAlign: "center", color: COLORS.gray500 }}>No orders found for this customer yet.</div>}
          {!customerOrdersLoading && customerOrders.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Tire","Qty","Total","Status","Date"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>{customerOrders.map(o => <tr key={o.id}>
                  <td style={S.td}>{o.tireName}</td>
                  <td style={S.td}>{o.quantity}</td>
                  <td style={S.td}>${o.total.toFixed(2)}</td>
                  <td style={S.td}><span style={S.badge(o.status)}>{o.status}</span></td>
                  <td style={S.td}>{o.date}</td>
                </tr>)}</tbody>
              </table>
            </div>
          )}
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${COLORS.gray200}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, color: COLORS.gray900 }}>
            <div>Total spent</div>
            <div>${totalSpent.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>;
  }

  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Customers</h2>
        <p style={{ color: COLORS.gray500, marginTop: 4 }}>Browse customer records, search by name, email, or phone, and view vehicle history.</p>
      </div>
      <input style={{ ...S.input, maxWidth: 320 }} placeholder="Search name, phone, or email" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
    </div>
    {customersLoading && (
      <div style={{ ...S.card, padding: "48px 24px", textAlign: "center", color: COLORS.gray500, fontSize: 15 }}>
        Loading customers…
      </div>
    )}
    {!customersLoading && filteredCustomers.length === 0 && (
      <div style={{ ...S.card, padding: "32px 24px", textAlign: "center", color: COLORS.gray500 }}>No customers match your search.</div>
    )}
    {!customersLoading && filteredCustomers.length > 0 && (isMobile ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredCustomers.map(c => (
          <button key={c.id} onClick={() => setSelectedCustomer(c)} style={{ ...S.card, padding: "16px 18px", textAlign: "left", border: `1px solid ${COLORS.gray200}`, cursor: "pointer" }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.gray900 }}>{c.name}</div>
            <div style={{ fontSize: 14, color: COLORS.gray600, marginTop: 6 }}>{c.phone}</div>
            <div style={{ fontSize: 14, color: COLORS.gray600, marginTop: 4 }}>{c.email}</div>
            <div style={{ fontSize: 14, color: COLORS.gray700, marginTop: 6 }}>{c.vehicle}</div>
            <div style={{ fontSize: 13, color: COLORS.gray400, marginTop: 8 }}>Last order: {c.lastOrderDate}</div>
          </button>
        ))}
      </div>
    ) : (
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Name","Phone","Email","Vehicle","Last order"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{filteredCustomers.map(c => <tr key={c.id} onClick={() => setSelectedCustomer(c)} style={{ cursor: "pointer" }}>
            <td style={{ ...S.td, fontWeight: 600 }}>{c.name}</td>
            <td style={S.td}>{c.phone}</td>
            <td style={S.td}>{c.email}</td>
            <td style={S.td}>{c.vehicle}</td>
            <td style={S.td}>{c.lastOrderDate}</td>
          </tr>)}</tbody>
        </table>
      </div>
    ))}
  </div>;
}

function PromotionsPage({ shopId, showToast }) {
  const isMobile = useWindowWidth() < 768;
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", discount_type: "percentage", discount_value: "20", applies_to: "All tires", start_date: new Date().toISOString().slice(0, 10), end_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().slice(0, 10), promo_code: "", active: true });

  useEffect(() => {
    if (!shopId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("shop_id", shopId)
        .order("start_date", { ascending: false });
      if (cancelled) return;
      setLoading(false);
      if (error) {
        showToast(error.message);
        return;
      }
      setPromotions(data || []);
    })();
    return () => { cancelled = true; };
  }, [shopId, showToast]);

  const savePromotion = async () => {
    if (!form.title.trim() || !form.discount_value || !form.start_date || !form.end_date) {
      showToast("Please complete the promotion form.");
      return;
    }
    const payload = {
      shop_id: shopId,
      title: form.title.trim(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      applies_to: form.applies_to,
      start_date: form.start_date,
      end_date: form.end_date,
      promo_code: form.promo_code.trim() || null,
      active: Boolean(form.active),
    };
    const { data, error } = await supabase.from("promotions").insert(payload).select();
    if (error) {
      showToast(error.message || "Could not save promotion");
      return;
    }
    setPromotions(p => [...p, ...(data || [])]);
    setShowForm(false);
    showToast("Promotion added");
  };

  const activePromos = promotions.filter(p => p.active && new Date(p.start_date) <= new Date() && new Date(p.end_date) >= new Date());
  const expiredPromos = promotions.filter(p => !activePromos.includes(p));

  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexDirection: isMobile ? "column" : "row", gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Promotions</h2>
        <p style={{ color: COLORS.gray500, marginTop: 4 }}>Create seasonal discounts, promo codes, and campaign offers for your storefront.</p>
      </div>
      <button onClick={() => setShowForm(true)} style={S.btn("primary")}>+ Add Promotion</button>
    </div>
    {showForm && (
      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 1fr", isMobile), gap: 16 }}>
          <div><label style={S.label}>Promotion Title</label><input style={S.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div><label style={S.label}>Discount Type</label><select style={S.select} value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}><option value="percentage">Percentage off</option><option value="fixed">Fixed amount off</option></select></div>
          <div><label style={S.label}>Discount Value</label><input style={S.input} value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} /></div>
          <div><label style={S.label}>Applies to</label><select style={S.select} value={form.applies_to} onChange={e => setForm(f => ({ ...f, applies_to: e.target.value }))}><option>All tires</option><option>New tires only</option><option>Used tires only</option></select></div>
          <div><label style={S.label}>Start Date</label><input type="date" style={S.input} value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
          <div><label style={S.label}>End Date</label><input type="date" style={S.input} value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
          <div style={{ gridColumn: "1/-1" }}><label style={S.label}>Promo Code</label><input style={S.input} value={form.promo_code} onChange={e => setForm(f => ({ ...f, promo_code: e.target.value }))} placeholder="Optional" /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><input type="checkbox" id="promotionActive" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} /><label htmlFor="promotionActive" style={{ fontSize: 14, color: COLORS.gray700 }}>Active</label></div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
          <button onClick={savePromotion} style={S.btn("primary")}>Save Promotion</button>
          <button onClick={() => setShowForm(false)} style={S.btn("secondary")}>Cancel</button>
        </div>
      </div>
    )}
    <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 1fr", isMobile), gap: 20 }}>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>Active Promotions</div>
        {loading && <div style={{ color: COLORS.gray500 }}>Loading promotions…</div>}
        {!loading && activePromos.length === 0 && <div style={{ color: COLORS.gray500 }}>No active promotions yet.</div>}
        {!loading && activePromos.map(p => (
          <div key={p.id} style={{ padding: "12px", borderBottom: `1px solid ${COLORS.gray200}` }}>
            <div style={{ fontWeight: 700 }}>{p.title}</div>
            <div style={{ color: COLORS.gray500, fontSize: 13, margin: "4px 0" }}>{p.discount_type === "percentage" ? `${p.discount_value}% off` : `$${p.discount_value} off`} · {p.applies_to}</div>
            <div style={{ fontSize: 13, color: COLORS.gray500 }}>Valid {p.start_date} through {p.end_date}{p.promo_code ? ` · Code: ${p.promo_code}` : ""}</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 14 }}>Expired Promotions</div>
        {!loading && expiredPromos.length === 0 && <div style={{ color: COLORS.gray500 }}>No expired promotions.</div>}
        {!loading && expiredPromos.map(p => (
          <div key={p.id} style={{ padding: "12px", borderBottom: `1px solid ${COLORS.gray200}` }}>
            <div style={{ fontWeight: 700 }}>{p.title}</div>
            <div style={{ color: COLORS.gray500, fontSize: 13, margin: "4px 0" }}>{p.discount_type === "percentage" ? `${p.discount_value}% off` : `$${p.discount_value} off`} · {p.applies_to}</div>
            <div style={{ fontSize: 13, color: COLORS.gray500 }}>Expired {p.end_date}</div>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

function AnalyticsPage({ shopId, showToast }) {
  const isMobile = useWindowWidth() < 768;
  const [loading, setLoading] = useState(true);
  const [analyticsOrders, setAnalyticsOrders] = useState([]);
  const [analyticsTires, setAnalyticsTires] = useState([]);
  const [analyticsCustomers, setAnalyticsCustomers] = useState([]);
  const [storefrontViewsThisMonth, setStorefrontViewsThisMonth] = useState(0);

  useEffect(() => {
    if (!shopId) {
      setLoading(false);
      return;
    }
    let mounted = true;
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const monthStartIso = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const [ordersResponse, tiresResponse, customersResponse, viewsResponse] = await Promise.all([
          supabase.from("orders").select("*").eq("shop_id", shopId),
          supabase.from("tires").select("*").eq("shop_id", shopId),
          supabase.from("customers").select("*").eq("shop_id", shopId),
          supabase.from("storefront_views").select("id", { count: "exact", head: true }).eq("shop_id", shopId).gte("created_at", monthStartIso),
        ]);

        if (!mounted) return;

        if (ordersResponse.error || tiresResponse.error || customersResponse.error) {
          console.error("Analytics fetch error", ordersResponse.error || tiresResponse.error || customersResponse.error);
          showToast("Unable to load analytics data.");
        }

        setAnalyticsOrders((ordersResponse.data || []).map(orderFromSupabaseRow));
        setAnalyticsTires((tiresResponse.data || []).map(tireFromSupabaseRow));
        setAnalyticsCustomers((customersResponse.data || []).map(customerFromSupabaseRow));
        if (!viewsResponse.error) setStorefrontViewsThisMonth(viewsResponse.count || 0);
      } catch (error) {
        console.error("Analytics fetch exception", error);
        if (mounted) showToast("Unable to load analytics data.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAnalytics();
    return () => { mounted = false; };
  }, [shopId, showToast]);

  if (loading) {
    return <div style={{ ...S.card, padding: 24, marginTop: 20, textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Loading analytics…</div>
      <div style={{ fontSize: 14, color: COLORS.gray500 }}>Fetching orders, tires, and customers for your shop.</div>
    </div>;
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const lastMonthEnd = new Date(currentYear, currentMonth, 0);
  const currentMonthStart = new Date(currentYear, currentMonth, 1);

  const thisMonthOrders = analyticsOrders.filter(o => {
    const d = new Date(o.created_at || o.date);
    return d >= currentMonthStart && d < new Date(currentYear, currentMonth + 1, 1);
  });
  const lastMonthOrders = analyticsOrders.filter(o => {
    const d = new Date(o.created_at || o.date);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });

  const thisMonthRevenue = thisMonthOrders.filter(o => o.status && o.status.toLowerCase() !== "cancelled").reduce((sum, o) => sum + (o.total || 0), 0);
  const lastMonthRevenue = lastMonthOrders.filter(o => o.status && o.status.toLowerCase() !== "cancelled").reduce((sum, o) => sum + (o.total || 0), 0);
  const revenueChange = lastMonthRevenue > 0 ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1) : 0;

  const orderCounts = {};
  (analyticsOrders || []).forEach(o => {
    const status = o.status || "Pending";
    orderCounts[status] = (orderCounts[status] || 0) + 1;
  });

  const topTires = {};
  (analyticsOrders || []).forEach(o => {
    const tire = o.tire || "Unknown";
    topTires[tire] = (topTires[tire] || 0) + (o.qty || 1);
  });
  const topTiresList = Object.entries(topTires).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const thisMonthCustomers = analyticsCustomers.filter(c => {
    const d = new Date(c.created_at);
    return d >= currentMonthStart && d < new Date(currentYear, currentMonth + 1, 1);
  }).length;

  const avgOrderValue = thisMonthOrders.length > 0 ? (thisMonthRevenue / thisMonthOrders.length).toFixed(2) : 0;
  const lowStockCount = (analyticsTires || []).filter(t => t.qty > 0 && t.qty <= 2).length;
  const conversionRate = ((thisMonthOrders.length / Math.max(1, thisMonthOrders.length + 50)) * 100).toFixed(1);

  return <div>
    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Analytics</h2>
    <div style={{ display: "grid", gridTemplateColumns: gridCols("repeat(5, 1fr)", isMobile), gap: 14, marginBottom: 24 }}>
      <div style={S.metricCard(thisMonthRevenue > lastMonthRevenue ? COLORS.green : COLORS.orange)}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 4 }}>Revenue This Month</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>${thisMonthRevenue.toFixed(0)}</div>
        <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 6 }}>{revenueChange > 0 ? "+" : ""}{revenueChange}% vs last month</div>
      </div>
      <div style={S.metricCard()}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 4 }}>Orders This Month</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{thisMonthOrders.length}</div>
        <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 6 }}>{lastMonthOrders.length} last month</div>
      </div>
      <div style={S.metricCard()}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 4 }}>New Customers</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{thisMonthCustomers}</div>
        <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 6 }}>this month</div>
      </div>
      <div style={S.metricCard()}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 4 }}>Avg Order Value</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>${avgOrderValue}</div>
        <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 6 }}>this month</div>
      </div>
      <div style={S.metricCard()}>
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 4 }}>Storefront Views This Month</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{storefrontViewsThisMonth}</div>
        <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 6 }}>tracked visits</div>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 1fr", isMobile), gap: 20 }}>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Top 5 Tires</div>
        {topTiresList.length === 0 ? (
          <div style={{ color: COLORS.gray500 }}>No sales yet</div>
        ) : (
          topTiresList.map(([tire, qty], idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: idx < topTiresList.length - 1 ? `1px solid ${COLORS.gray200}` : "none", marginBottom: 10 }}>
              <div style={{ fontSize: 13 }}>{tire}</div>
              <div style={{ fontWeight: 700, color: COLORS.blue }}>{qty} sold</div>
            </div>
          ))
        )}
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Order Status Breakdown</div>
        {Object.entries(orderCounts).map(([status, count]) => {
          const total = Object.values(orderCounts).reduce((a, b) => a + b, 0);
          const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
          return (
            <div key={status} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span>{status}</span><span>{count} ({pct}%)</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: COLORS.gray200, overflow: "hidden" }}>
                <div style={{ height: "100%", background: status === "Completed" ? COLORS.green : status === "Confirmed" ? COLORS.blue : status === "Cancelled" ? COLORS.red : COLORS.orange, width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 1fr", isMobile), gap: 20, marginTop: 20 }}>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 16 }}>Conversion Rate</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.blue }}>{conversionRate}%</div>
        <div style={{ fontSize: 13, color: COLORS.gray500, marginTop: 8 }}>Orders vs storefront views</div>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 16 }}>Low Stock Alert</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: lowStockCount > 0 ? COLORS.orange : COLORS.green }}>{lowStockCount}</div>
        <div style={{ fontSize: 13, color: COLORS.gray500, marginTop: 8 }}>{lowStockCount} tire{lowStockCount === 1 ? "" : "s"} with qty ≤ 2</div>
      </div>
    </div>
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

function ShopSettings({ shopId, showToast }) {
  console.log('ShopSettings shopId prop:', shopId);
  const isMobile = useWindowWidth() < 768;
  const galleryInputRef = useRef(null);
  const [mobileServiceEnabled, setMobileServiceEnabled] = useState(false);
  const [mobileServiceRadius, setMobileServiceRadius] = useState(25);
  const [mobileServiceFee, setMobileServiceFee] = useState(50);
  const [mobileServiceHoursStart, setMobileServiceHoursStart] = useState("8:00 AM");
  const [mobileServiceHoursEnd, setMobileServiceHoursEnd] = useState("6:00 PM");
  const [savingMobileService, setSavingMobileService] = useState(false);
  const [heroVideoUrl, setHeroVideoUrl] = useState("");
  const [savingHeroVideo, setSavingHeroVideo] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [savingGallery, setSavingGallery] = useState(false);
  const [galleryStorageMissing, setGalleryStorageMissing] = useState(false);
  const [storefrontSections, setStorefrontSections] = useState({ hero_video: true, trust_badges: true, size_finder: true, maps: true, gallery: true, services: true, reviews: true, chatbot: true, announcement: true });
  const [savingStorefrontSections, setSavingStorefrontSections] = useState(false);

  useEffect(() => {
    if (!shopId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("mobile_service_enabled, mobile_service_radius, mobile_service_fee, mobile_service_hours_start, mobile_service_hours_end, hero_video_url, gallery_images, storefront_sections")
        .eq("id", shopId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        showToast(error.message || "Unable to load settings.");
        return;
      }
      if (!data) return;
      setMobileServiceEnabled(Boolean(data.mobile_service_enabled));
      setMobileServiceRadius(data.mobile_service_radius ?? 25);
      setMobileServiceFee(data.mobile_service_fee ?? 50);
      setMobileServiceHoursStart(data.mobile_service_hours_start || "8:00 AM");
      setMobileServiceHoursEnd(data.mobile_service_hours_end || "6:00 PM");
      setHeroVideoUrl(data.hero_video_url || "");
      setGalleryImages(Array.isArray(data.gallery_images) ? data.gallery_images : []);
      if (data.storefront_sections && typeof data.storefront_sections === "object") {
        setStorefrontSections(prev => ({ ...prev, ...data.storefront_sections }));
      }
    })();
    return () => { cancelled = true; };
  }, [shopId, showToast]);

  const saveMobileSettings = async () => {
    console.log('saving mobile settings, shopId:', shopId, 'enabled:', mobileServiceEnabled);
    if (!shopId) return;
    setSavingMobileService(true);
    const { error } = await supabase
      .from("shops")
      .update({
        mobile_service_enabled: mobileServiceEnabled,
        mobile_service_radius: mobileServiceRadius,
        mobile_service_fee: mobileServiceFee,
        mobile_service_hours_start: mobileServiceHoursStart,
        mobile_service_hours_end: mobileServiceHoursEnd,
      })
      .eq("id", shopId);
    setSavingMobileService(false);
    if (error) {
      showToast(error.message || "Unable to save mobile service settings.");
      return;
    }
    showToast("Mobile service settings saved.");
  };

  const saveHeroVideo = async () => {
    if (!shopId) return;
    setSavingHeroVideo(true);
    const { error } = await supabase
      .from("shops")
      .update({ hero_video_url: heroVideoUrl.trim() || null })
      .eq("id", shopId);
    setSavingHeroVideo(false);
    if (error) {
      showToast(error.message || "Unable to save hero video URL.");
      return;
    }
    setHeroVideoUrl(heroVideoUrl.trim());
    showToast("Hero video URL saved.");
  };

  const persistGalleryImages = async (images) => {
    if (!shopId) return;
    setSavingGallery(true);
    const { error } = await supabase
      .from("shops")
      .update({ gallery_images: images })
      .eq("id", shopId);
    setSavingGallery(false);
    if (error) {
      showToast(error.message || "Unable to save gallery images.");
      return false;
    }
    setGalleryImages(images);
    return true;
  };

  const showGalleryBucketInstructions = () => {
    setGalleryStorageMissing(true);
    showToast("Create the shop-gallery storage bucket in Supabase, then try again.");
  };

  const handleGalleryUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (!shopId || selectedFiles.length === 0) return;
    const remainingSlots = 6 - galleryImages.length;
    if (remainingSlots <= 0) {
      showToast("Photo gallery is limited to 6 images.");
      return;
    }
    const files = selectedFiles.slice(0, remainingSlots);
    setSavingGallery(true);
    setGalleryStorageMissing(false);
    const uploadedUrls = [];
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        showToast("Only JPG, PNG, and WebP images are supported.");
        continue;
      }
      const path = `${shopId}/${file.name}`;
      const { error } = await supabase.storage
        .from("shop-gallery")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) {
        setSavingGallery(false);
        if (/bucket/i.test(error.message || "")) showGalleryBucketInstructions();
        else showToast(error.message || `Unable to upload ${file.name}.`);
        return;
      }
      const { data } = supabase.storage.from("shop-gallery").getPublicUrl(path);
      if (data?.publicUrl) uploadedUrls.push(data.publicUrl);
    }
    setSavingGallery(false);
    if (uploadedUrls.length === 0) return;
    const nextImages = [...galleryImages, ...uploadedUrls].slice(0, 6);
    const saved = await persistGalleryImages(nextImages);
    if (saved) showToast(`${uploadedUrls.length} image${uploadedUrls.length === 1 ? "" : "s"} uploaded.`);
  };

  const removeGalleryImage = async (imageUrl) => {
    const nextImages = galleryImages.filter(img => img !== imageUrl);
    const saved = await persistGalleryImages(nextImages);
    if (!saved) return;
    try {
      const path = new URL(imageUrl).pathname.split("/shop-gallery/")[1];
      if (path) await supabase.storage.from("shop-gallery").remove([decodeURIComponent(path)]);
    } catch (error) {
      console.warn("Gallery storage cleanup failed:", error);
    }
    showToast("Gallery image removed.");
  };

  const saveStorefrontSections = async () => {
    if (!shopId) return;
    setSavingStorefrontSections(true);
    const { error } = await supabase
      .from("shops")
      .update({ storefront_sections: storefrontSections })
      .eq("id", shopId);
    setSavingStorefrontSections(false);
    if (error) {
      showToast(error.message || "Unable to save storefront sections.");
      return;
    }
    showToast("Storefront sections saved.");
  };

  return <div>
    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Shop Settings</h2>
    <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 1fr", isMobile), gap: 20 }}>
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
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Mobile Service</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <label style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Mobile Service</label>
          <input type="checkbox" checked={mobileServiceEnabled} onChange={e => setMobileServiceEnabled(e.target.checked)} style={{ accentColor: COLORS.blue, width: 18, height: 18 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Service Radius</label>
          <select style={S.select} value={mobileServiceRadius} onChange={e => setMobileServiceRadius(Number(e.target.value))}>
            {[10, 15, 25, 50].map(m => <option key={m} value={m}>{m} miles</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Mobile Service Fee</label>
          <input type="number" style={S.input} value={mobileServiceFee} onChange={e => setMobileServiceFee(Number(e.target.value))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 1fr", isMobile), gap: 14, marginBottom: 12 }}>
          <div>
            <label style={S.label}>Hours Start</label>
            <select style={S.select} value={mobileServiceHoursStart} onChange={e => setMobileServiceHoursStart(e.target.value)}>
              {["6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM","8:00 PM"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Hours End</label>
            <select style={S.select} value={mobileServiceHoursEnd} onChange={e => setMobileServiceHoursEnd(e.target.value)}>
              {["10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM","8:00 PM","9:00 PM"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{ fontSize: 13, color: COLORS.gray500, marginBottom: 14 }}>Jobs are scheduled 90 minutes apart minimum.</div>
        <button onClick={saveMobileSettings} disabled={savingMobileService} style={S.btn("primary")}>{savingMobileService ? "Saving…" : "Save Mobile Service"}</button>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Review Settings</div>
        <div style={{ marginBottom: 12 }}><label style={S.label}>Google Review Link</label><input style={S.input} placeholder="https://g.page/your-shop" defaultValue="" /></div>
        <button onClick={() => showToast("Settings saved!")} style={S.btn("primary")}>Save Changes</button>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Hero Video</div>
        <div style={{ marginBottom: 10 }}>
          <label style={S.label}>Hero Video URL</label>
          <input
            style={S.input}
            value={heroVideoUrl}
            onChange={e => setHeroVideoUrl(e.target.value)}
            placeholder="Paste a direct video URL (mp4, webm) or leave blank for default"
          />
        </div>
        <div style={{ fontSize: 13, color: COLORS.gray500, lineHeight: 1.5, marginBottom: 14 }}>Use a direct video file URL ending in .mp4 or .webm. YouTube and Vimeo links will not work - use a direct file URL.</div>
        <button onClick={saveHeroVideo} disabled={savingHeroVideo} style={S.btn("primary")}>{savingHeroVideo ? "Saving..." : "Save Hero Video"}</button>
        {heroVideoUrl.trim() && (
          <video controls muted style={{ width: "100%", marginTop: 14, borderRadius: 10, background: COLORS.navy, maxHeight: 180 }}>
            <source src={heroVideoUrl.trim()} type={heroVideoUrl.trim().toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4"} />
          </video>
        )}
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Business Hours</div>
        {["Monday–Friday","Saturday","Sunday"].map((d, i) => <div key={d} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 14, color: COLORS.gray700, width: 120 }}>{d}</span>
          <input style={{ ...S.input, flex: 1, maxWidth: 200 }} defaultValue={i === 0 ? "8:00 AM – 6:00 PM" : i === 1 ? "8:00 AM – 4:00 PM" : "Closed"} />
        </div>)}
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Photo Gallery</div>
        <div style={{ fontSize: 13, color: COLORS.gray500, marginBottom: 12 }}>Upload up to 6 JPG, PNG, or WebP images for the storefront "Our Work" section.</div>
        {galleryStorageMissing && (
          <div style={{ background: "#FEF2F2", border: `1px solid ${COLORS.red}`, color: "#991B1B", borderRadius: 10, padding: 12, fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
            Supabase Storage bucket missing. In Supabase, go to Storage, create a public bucket named <strong>shop-gallery</strong>, then allow uploads for authenticated shop users.
          </div>
        )}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          onChange={handleGalleryUpload}
          style={{ display: "none" }}
        />
        <button
          onClick={() => galleryInputRef.current?.click()}
          disabled={savingGallery || galleryImages.length >= 6}
          style={S.btn("primary")}
        >
          {savingGallery ? "Uploading..." : galleryImages.length >= 6 ? "Gallery Full" : "Upload Images"}
        </button>
        <div style={{ fontSize: 12, color: COLORS.gray500, marginTop: 10 }}>{galleryImages.length}/6 images uploaded</div>
        <div style={{ display: "grid", gridTemplateColumns: gridCols("repeat(3, 1fr)", isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)"), gap: 10, marginTop: 14 }}>
          {galleryImages.map((imageUrl) => (
            <div key={imageUrl} style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: 10, overflow: "hidden", background: COLORS.gray100, border: `1px solid ${COLORS.gray200}` }}>
              <img src={imageUrl} alt="Shop gallery" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <button
                type="button"
                onClick={() => removeGalleryImage(imageUrl)}
                aria-label="Remove gallery image"
                style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 999, border: "none", background: COLORS.red, color: "#fff", fontWeight: 800, cursor: "pointer", lineHeight: "24px", padding: 0 }}
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Storefront Sections</div>
        <div style={{ fontSize: 13, color: COLORS.gray500, marginBottom: 16 }}>Choose which sections appear on your public storefront.</div>
        <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
          {[["hero_video", "Hero Video Background"], ["announcement", "Announcement Bar"], ["trust_badges", "Trust Badges"], ["size_finder", "Tire Size Finder Button"], ["services", "Services Section"], ["gallery", "Photo Gallery"], ["maps", "Google Maps"], ["reviews", "Customer Reviews"], ["chatbot", "Live Chatbot"]].map(([key, label]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
              <input
                type="checkbox"
                checked={storefrontSections[key] ?? true}
                onChange={e => setStorefrontSections(prev => ({ ...prev, [key]: e.target.checked }))}
                style={{ accentColor: COLORS.blue, width: 18, height: 18, cursor: "pointer" }}
              />
              <label style={{ fontSize: 14, color: COLORS.gray700, cursor: "pointer", flex: 1 }}>{label}</label>
            </div>
          ))}
        </div>
        <button onClick={saveStorefrontSections} disabled={savingStorefrontSections} style={S.btn("primary")}>{savingStorefrontSections ? "Saving…" : "Save Storefront Sections"}</button>
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>QR Code</div>
        <div style={{ fontSize: 13, color: COLORS.gray500, marginBottom: 14 }}>Put this on receipts, business cards, your shop window, or anywhere customers can scan it to find your tires online</div>
        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(SHOP_PUBLIC_URL)}`} alt="Shop storefront QR code" style={{ width: 200, height: 200, display: "block", border: `1px solid ${COLORS.gray200}`, borderRadius: 10, marginBottom: 14 }} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(SHOP_PUBLIC_URL)}`} download="treadflow-storefront-qr.png" style={{ ...S.btn("primary"), textDecoration: "none" }}>Download</a>
          <button
            type="button"
            onClick={() => {
              const printWindow = window.open("", "_blank", "width=420,height=520");
              if (!printWindow) return;
              printWindow.document.write(`<html><head><title>Storefront QR Code</title></head><body style="font-family:system-ui,sans-serif;text-align:center;padding:32px"><h2>${storefront.name}</h2><img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(SHOP_PUBLIC_URL)}" width="200" height="200"/><p>${SHOP_PUBLIC_URL}</p><script>window.onload=()=>window.print()</script></body></html>`);
              printWindow.document.close();
            }}
            style={S.btn("secondary")}
          >
            Print
          </button>
        </div>
      </div>
    </div>
  </div>;
}

function SmsTermsPage({ nav }) {
  return <div style={{ minHeight: "100vh", fontFamily: "system-ui, sans-serif", background: COLORS.gray50, color: COLORS.gray900 }}>
    <header style={{ background: COLORS.navy, color: "#fff", padding: "24px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div>
        <div style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.85 }}>TreadFlow</div>
        <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>SMS Messaging Terms & Conditions</div>
      </div>
      <button onClick={() => nav("home")} style={{ ...S.btn("secondary", "sm"), color: "#fff", borderColor: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.08)" }}>Home</button>
    </header>
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px", display: "grid", gap: 24 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: 28, boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)" }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>TreadFlow SMS Messaging Terms & Conditions</div>
        <p style={{ fontSize: 15, lineHeight: 1.75, color: COLORS.gray700, marginBottom: 20 }}>These messages are sent by TreadFlow and participating tire shops to provide order confirmations, appointment reminders, and status updates for tire services and reservations.</p>
        <div style={{ display: "grid", gap: 18 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Message frequency</div>
            <div style={{ color: COLORS.gray700, lineHeight: 1.6 }}>Message frequency varies based on order activity, appointment scheduling, and status updates.</div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Rates</div>
            <div style={{ color: COLORS.gray700, lineHeight: 1.6 }}>Message and data rates may apply according to your carrier plan.</div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Opt-out</div>
            <div style={{ color: COLORS.gray700, lineHeight: 1.6 }}>Reply STOP to unsubscribe at any time.</div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Help</div>
            <div style={{ color: COLORS.gray700, lineHeight: 1.6 }}>Reply HELP for help.</div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Support</div>
            <div style={{ color: COLORS.gray700, lineHeight: 1.6 }}>Support email: <a href="mailto:support@treadflow.cc" style={{ color: COLORS.blue }}>support@treadflow.cc</a></div>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <button onClick={() => nav("home")} style={{ ...S.btn("primary", "lg"), width: "100%", maxWidth: 240 }}>Return to Home</button>
      </div>
    </main>
  </div>;
}

function ShopBilling({ shopId, plan, status }) {
  const [copiedReferral, setCopiedReferral] = useState(false);
  const planDef = LOCAL_PLANS.find(p => p.name === plan) ?? LOCAL_PLANS.find(p => p.name === "Growth Partner");
  const planStatus = status || "Active";
  const referralCode = String(shopId || "").slice(0, 8).toUpperCase();
  const referralMessage = `Hey, I use TreadFlow to manage my tire shop online. Use my code ${referralCode} when you apply at www.treadflow.cc and we both get a month free.`;
  const smsHref = `sms:?body=${encodeURIComponent(referralMessage)}`;

  const copyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralMessage);
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2000);
    } catch (error) {
      console.warn("Referral copy failed", error);
    }
  };

  return <div>
    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Billing</h2>
    <div style={{ ...S.card, maxWidth: 520, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.gray400 }}>CURRENT PLAN</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.blue }}>{planDef.name}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.gray700 }}>${planDef.price}/month</div>
        </div>
        <span style={S.badge(planStatus)}>{planStatus}</span>
      </div>
      <div style={{ borderTop: "1px solid #E2E8F0", marginTop: 16, paddingTop: 16, fontSize: 14, color: COLORS.gray500 }}>
        Next billing date: <strong>June 1, 2026</strong><br />Member since: November 2025
      </div>
    </div>
    <div style={{ ...S.card, maxWidth: 520 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: COLORS.gray900 }}>Everything included in your plan</div>
      <p style={{ fontSize: 14, color: COLORS.gray500, margin: "0 0 16px", lineHeight: 1.5 }}>
        Your <strong>{planDef.name}</strong> subscription includes all {planDef.features.length} features below — including everything from lower tiers.
      </p>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {planDef.features.map(f => (
          <li key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: COLORS.gray700, marginBottom: 10, lineHeight: 1.5 }}>
            <span style={{ color: COLORS.green, flexShrink: 0, fontWeight: 700, fontSize: 15 }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
    <div style={{ ...S.card, maxWidth: 520, marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.gray900 }}>Refer a Shop</div>
          <div style={{ fontSize: 13, color: COLORS.gray500 }}>Refer another tire shop to TreadFlow and get one month free when they sign up.</div>
        </div>
        <span style={{ ...S.badge("secondary"), background: COLORS.gray100, color: COLORS.gray700, border: "none" }}>{referralCode}</span>
      </div>
      <div style={{ fontSize: 14, color: COLORS.gray700, marginBottom: 14, lineHeight: 1.6 }}>{referralMessage}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <button onClick={copyReferral} style={{ ...S.btn("primary"), minWidth: 160, justifyContent: "center" }}>
          {copiedReferral ? "Copied!" : "Copy Message"}
        </button>
        <a href={smsHref} style={{ ...S.btn("secondary"), minWidth: 160, justifyContent: "center", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
          Share via Text
        </a>
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

function parseTimeString(time) {
  const match = String(time || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (hour === 12) hour = period === "AM" ? 0 : 12;
  if (period === "PM" && hour < 12) hour += 12;
  return hour * 60 + minute;
}

function formatTimeString(totalMinutes) {
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  let hour = hour24 % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}

function buildMobileTimeSlots(startTime, endTime) {
  const start = parseTimeString(startTime) ?? 480;
  const end = parseTimeString(endTime) ?? 1080;
  const slots = [];
  const block = 90;
  for (let pointer = start; pointer + block <= end; pointer += block) {
    const startLabel = formatTimeString(pointer);
    const endLabel = formatTimeString(pointer + block);
    slots.push(`${startLabel} - ${endLabel}`);
  }
  return slots;
}

// SQL to add mobile service support to shops table:
// alter table shops add column if not exists mobile_service_enabled boolean default false;
// alter table shops add column if not exists mobile_service_radius integer default 25;
// alter table shops add column if not exists mobile_service_fee numeric default 50;
// alter table shops add column if not exists mobile_service_hours_start text default '8:00 AM';
// alter table shops add column if not exists mobile_service_hours_end text default '6:00 PM';
// alter table shops add column if not exists gallery_images text[] default array[]::text[];
// -- alter table shops add column if not exists hero_video_url text;
// -- alter table waitlist: id uuid, shop_id uuid, tire_id uuid, tire_name text, email text, created_at timestamptz
// -- create table storefront_views (id uuid default gen_random_uuid() primary key, shop_id uuid, page text, tire_id uuid, created_at timestamptz default now());

async function storefrontSubmitReservation(shopId, {
  orderTire,
  name,
  phone,
  email,
  vehicleRaw,
  quantity,
  smsConsent = false,
  shopName = "TreadFlow Shop",
  ownerPhone = "",
  isMobile = false,
  serviceAddress = "",
  mobileTimeSlot = "",
  mobileDate = "",
  notes = "",
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
      sms_consent: smsConsent,
      is_mobile: isMobile,
      service_address: serviceAddress,
      mobile_time_slot: mobileTimeSlot,
      mobile_date: mobileDate,
      notes,
    })
    .select("id")
    .single();

  // Run in Supabase SQL Editor: alter table orders add column if not exists sms_consent boolean default false;
  // Run in Supabase SQL Editor: alter table orders add column if not exists is_mobile boolean default false;
  // Run in Supabase SQL Editor: alter table orders add column if not exists service_address text;
  // Run in Supabase SQL Editor: alter table orders add column if not exists mobile_time_slot text;
  // Run in Supabase SQL Editor: alter table orders add column if not exists mobile_date text;
  if (orderErr) throw orderErr;
  
  // Send SMS to shop owner about new reservation when consent is provided
  if (ownerPhone && smsConsent === true) {
    const tireName = `${orderTire.brand} ${orderTire.model}`;
    await sendSms(ownerPhone, `New tire reservation from ${name} for ${tireName}. Check your TreadFlow dashboard.`);
  }
  
  return orderRow.id;
}

// ── 6. PUBLIC STOREFRONT ──────────────────────────────────────────────────
function Storefront({ nav, initialTireSlug }) {
  const width = useWindowWidth();
  const isMobile = width < 768;
  const [publicShopId, setPublicShopId] = useState(FALLBACK_PUBLIC_SHOP_ID);
  const [publicShopInfo, setPublicShopInfo] = useState({
    name: storefront.name,
    email: "",
    phone: "",
    mobile_service_enabled: false,
    mobile_service_radius: 25,
    mobile_service_fee: 50,
    mobile_service_hours_start: "8:00 AM",
    mobile_service_hours_end: "6:00 PM",
    hero_video_url: "",
    storefront_sections: {},
  });
  const [activePromotion, setActivePromotion] = useState(null);
  const [searchMode, setSearchMode] = useState("size");
  const [vehicleYear, setVehicleYear] = useState("2024");
  const [vehicleMake, setVehicleMake] = useState("Toyota");
  const [vehicleModel, setVehicleModel] = useState("Camry");
  const vehicleYears = ["2026", "2025", "2024", "2023", "2022", "2021"];
  const vehicleMakes = ["Toyota", "Honda", "Ford", "Chevrolet", "Nissan"];
  const vehicleModelsByMake = {
    Toyota: ["Camry", "Corolla", "RAV4"],
    Honda: ["Civic", "Accord", "CR-V"],
    Ford: ["F-150", "Escape", "Mustang"],
    Chevrolet: ["Silverado", "Equinox", "Malibu"],
    Nissan: ["Altima", "Rogue", "Sentra"],
  };
  const vehicleModelOptions = vehicleModelsByMake[vehicleMake] || [];
  const vehicleSizeMap = {
    "Toyota|Camry": ["225/55R17", "205/65R16"],
    "Toyota|Corolla": ["205/55R16", "195/65R15"],
    "Toyota|RAV4": ["225/65R17", "235/55R19"],
    "Honda|Civic": ["215/55R16", "205/55R16"],
    "Honda|Accord": ["235/45R18", "225/50R17"],
    "Honda|CR-V": ["225/65R17", "235/60R18"],
    "Ford|F-150": ["275/65R18", "265/70R17"],
    "Ford|Escape": ["235/60R18", "235/55R19"],
    "Ford|Mustang": ["235/55R18", "255/40R19"],
    "Chevrolet|Silverado": ["275/65R18", "265/70R17"],
    "Chevrolet|Equinox": ["225/65R17", "235/55R19"],
    "Chevrolet|Malibu": ["225/55R17", "215/55R17"],
    "Nissan|Altima": ["215/55R17", "225/45R18"],
    "Nissan|Rogue": ["225/65R17", "235/55R19"],
    "Nissan|Sentra": ["205/55R16", "215/45R18"],
  };
  const vehicleSearchSizes = vehicleSizeMap[`${vehicleMake}|${vehicleModel}`] || [];

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("shops")
      .select("id, name, email, phone, mobile_service_enabled, mobile_service_radius, mobile_service_fee, mobile_service_hours_start, mobile_service_hours_end, hero_video_url, storefront_sections")
      .eq("slug", PUBLIC_STOREFRONT_SLUG)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data?.id) return;
        setPublicShopId(data.id);
        setPublicShopInfo({
          name: data.name || storefront.name,
          email: (data.email || "").trim(),
          phone: (data.phone || "").trim(),
          mobile_service_enabled: data.mobile_service_enabled ?? false,
          mobile_service_radius: data.mobile_service_radius ?? 25,
          mobile_service_fee: data.mobile_service_fee ?? 50,
          mobile_service_hours_start: data.mobile_service_hours_start || "8:00 AM",
          mobile_service_hours_end: data.mobile_service_hours_end || "6:00 PM",
          hero_video_url: (data.hero_video_url || "").trim(),
          storefront_sections: (data.storefront_sections && typeof data.storefront_sections === "object") ? data.storefront_sections : {},
        });
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!publicShopId) return;
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);
    (async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("shop_id", publicShopId)
        .eq("active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("start_date", { ascending: false });
      if (cancelled) return;
      if (error) {
        console.warn("Promotion lookup failed:", error.message);
        return;
      }
      setActivePromotion((data || [])[0] || null);
    })();
    return () => { cancelled = true; };
  }, [publicShopId]);

  // Handle deposit payment success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("deposit_success") === "true") {
      const pending = sessionStorage.getItem("pendingReservation");
      if (pending) {
        try {
          const data = JSON.parse(pending);
          (async () => {
            try {
              const id = await storefrontSubmitReservation(publicShopId, data);
              setSavedOrderId(id);
              sessionStorage.removeItem("pendingReservation");
              // Clean URL
              window.history.replaceState({}, document.title, window.location.pathname);
            } catch (e) {
              console.warn("Post-deposit order error:", e);
              setOrderError("Order creation failed. Please contact support.");
            } finally {
              setOrderSubmitting(false);
            }
          })();
        } catch (e) {
          console.warn("Pending reservation parse error:", e);
        }
      }
    }
  }, [publicShopId]);

  const [search, setSearch] = useState("");
  const [condFilter, setCondFilter] = useState("All");
  const [selectedTire, setSelectedTire] = useState(null);
  const [waitlistTire, setWaitlistTire] = useState(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSuccess, setWaitlistSuccess] = useState("");
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [shareTire, setShareTire] = useState(null);
  const [showOrder, setShowOrder] = useState(false);
  const [orderTire, setOrderTire] = useState(null);
  const [orderDone, setOrderDone] = useState(false);
  const [resName, setResName] = useState("");
  const [resPhone, setResPhone] = useState("");
  const [resEmail, setResEmail] = useState("");
  const [resVehicle, setResVehicle] = useState("");
  const [resQuantity, setResQuantity] = useState("1");
  const [resService, setResService] = useState("shop");
  const [resDate, setResDate] = useState("");
  const [resTime, setResTime] = useState("8:00 AM");
  const [resServiceAddress, setResServiceAddress] = useState("");
  const [resMobileTimeSlot, setResMobileTimeSlot] = useState("");
  const [resPayment, setResPayment] = useState("Pay deposit online ($50)");
  const [resNotes, setResNotes] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [mobileTimeSlots, setMobileTimeSlots] = useState([]);
  const [mobileTakenSlots, setMobileTakenSlots] = useState([]);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    setMobileTimeSlots(buildMobileTimeSlots(publicShopInfo.mobile_service_hours_start, publicShopInfo.mobile_service_hours_end));
  }, [publicShopInfo.mobile_service_hours_start, publicShopInfo.mobile_service_hours_end]);

  useEffect(() => {
    if (!publicShopId || resService !== "mobile" || !resDate) {
      setMobileTakenSlots([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("mobile_time_slot")
        .eq("shop_id", publicShopId)
        .eq("is_mobile", true)
        .eq("mobile_date", resDate);
      if (cancelled) return;
      if (!error) {
        setMobileTakenSlots((data || []).map(row => row.mobile_time_slot).filter(Boolean));
      }
    })();
    return () => { cancelled = true; };
  }, [publicShopId, resService, resDate]);

  useEffect(() => {
    if (!publicShopId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("shops").select("gallery_images").eq("id", publicShopId).maybeSingle();
      if (cancelled) return;
      const imgs = data?.gallery_images || [];
      if (Array.isArray(imgs) && imgs.length > 0) {
        setGalleryImages(imgs);
      } else {
        setGalleryImages([1, 2, 3, 4, 5, 6].map(i => `https://picsum.photos/400/300?random=${i}`));
      }
    })();
    return () => { cancelled = true; };
  }, [publicShopId]);
  const [savedOrderId, setSavedOrderId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([{ from: "bot", text: "Hi! Welcome to Greenville Tire Pros. Ask me anything about our inventory, services, or hours." }]);
  const [showTireSizeFinder, setShowTireSizeFinder] = useState(false);
  const [tireWidth, setTireWidth] = useState("");
  const [tireAspectRatio, setTireAspectRatio] = useState("");
  const [tireRimSize, setTireRimSize] = useState("");
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState([]);
  const trackedHomeViewRef = useRef(false);
  const trackedTireViewsRef = useRef(new Set());

  const filtered = mockTires.filter(t => {
    if ((t.status !== "Active" && Number(t.qty) !== 0) || (condFilter !== "All" && t.condition !== condFilter)) return false;
    if (searchMode === "vehicle") {
      return vehicleSearchSizes.includes(t.size);
    }
    return (t.brand + t.model + t.size).toLowerCase().includes(search.toLowerCase());
  });
  const defaultHeroVideoUrl = "https://videos.pexels.com/video-files/4065675/4065675-uhd_2560_1440_24fps.mp4";
  const heroVideoUrl = publicShopInfo.hero_video_url || defaultHeroVideoUrl;
  const heroVideoEnabled = publicShopInfo.storefront_sections?.hero_video !== false;
  const heroVideoType = heroVideoUrl.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4";
  const selectedTireUrl = selectedTire ? `${window.location.origin}${tirePagePath(selectedTire)}` : `${window.location.origin}/shop/${PUBLIC_STOREFRONT_SLUG}`;

  useEffect(() => {
    if (!initialTireSlug || selectedTire) return;
    const match = mockTires.find(t => tireSlug(t) === initialTireSlug);
    if (match) setSelectedTire(match);
  }, [initialTireSlug, selectedTire]);

  useEffect(() => {
    if (!publicShopId || trackedHomeViewRef.current) return;
    trackedHomeViewRef.current = true;
    supabase.from("storefront_views").insert({ shop_id: publicShopId, page: "home" }).then(({ error }) => {
      if (error) console.warn("Storefront view tracking failed:", error.message);
    });
  }, [publicShopId]);

  useEffect(() => {
    const onPopState = () => {
      setSelectedTire(null);
      document.title = "TreadFlow";
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!selectedTire) {
      document.title = `${publicShopInfo.name || storefront.name} | TreadFlow`;
      return;
    }
    const path = tirePagePath(selectedTire);
    if (window.location.pathname !== path) window.history.pushState({ tireId: selectedTire.id }, "", path);
    document.title = `${selectedTire.brand} ${selectedTire.model} ${selectedTire.size} - ${publicShopInfo.name || storefront.name} | TreadFlow`;
    const trackKey = String(selectedTire.id);
    if (publicShopId && !trackedTireViewsRef.current.has(trackKey)) {
      trackedTireViewsRef.current.add(trackKey);
      supabase.from("storefront_views").insert({ shop_id: publicShopId, page: "tire", tire_id: selectedTire.id }).then(({ error }) => {
        if (error) console.warn("Tire view tracking failed:", error.message);
      });
    }
  }, [publicShopId, publicShopInfo.name, selectedTire]);

  const openWaitlist = (tire) => {
    setWaitlistTire(tire);
    setWaitlistEmail("");
    setWaitlistSuccess("");
  };

  const submitWaitlist = async () => {
    if (!waitlistTire || !waitlistEmail.trim()) return;
    setWaitlistSubmitting(true);
    const tireName = `${waitlistTire.brand} ${waitlistTire.model} ${waitlistTire.size}`;
    const { error } = await supabase.from("waitlist").insert({
      shop_id: publicShopId,
      tire_id: waitlistTire.id,
      tire_name: tireName,
      email: waitlistEmail.trim(),
      created_at: new Date().toISOString(),
    });
    setWaitlistSubmitting(false);
    if (error) {
      setWaitlistSuccess(error.message || "Unable to save your request.");
      return;
    }
    setWaitlistSuccess("We will email you when this tire is back in stock!");
  };

  const openShare = (tire) => setShareTire(tire);

  const copyShareLink = async () => {
    const url = shareTire ? `${window.location.origin}${tirePagePath(shareTire)}` : selectedTireUrl;
    await navigator.clipboard?.writeText(url);
  };

  const waitlistModal = waitlistTire && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Get Notified When Available</h2>
          <button onClick={() => setWaitlistTire(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: COLORS.gray400 }}>×</button>
        </div>
        <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 14 }}>{waitlistTire.brand} {waitlistTire.model} {waitlistTire.size}</div>
        <label style={S.label}>Email</label>
        <input type="email" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} style={{ ...S.input, marginBottom: 14 }} placeholder="you@example.com" />
        <button onClick={submitWaitlist} disabled={waitlistSubmitting} style={{ ...S.btn("orange"), width: "100%", justifyContent: "center" }}>{waitlistSubmitting ? "Submitting..." : "Submit"}</button>
        {waitlistSuccess && <div style={{ fontSize: 13, color: waitlistSuccess.startsWith("We will") ? COLORS.green : COLORS.red, marginTop: 12 }}>{waitlistSuccess}</div>}
      </div>
    </div>
  );

  const shareUrl = shareTire ? `${window.location.origin}${tirePagePath(shareTire)}` : selectedTireUrl;
  const shareName = shareTire ? `${shareTire.brand} ${shareTire.model} ${shareTire.size}` : "";
  const shareModal = shareTire && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, width: "100%", maxWidth: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Share Tire</h2>
          <button onClick={() => setShareTire(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: COLORS.gray400 }}>×</button>
        </div>
        <div style={{ background: COLORS.navy, color: "#fff", borderRadius: 12, padding: 20, minHeight: 210, display: "flex", flexDirection: "column", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: COLORS.orange, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>{(publicShopInfo.name || storefront.name).charAt(0)}</div>
            <div style={{ fontWeight: 800 }}>{publicShopInfo.name || storefront.name}</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.1 }}>{shareTire.brand} {shareTire.model}</div>
            <div style={{ color: "#CBD5E1", marginTop: 4 }}>{shareTire.size} • {shareTire.condition}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
            <div style={{ color: COLORS.orange, fontSize: 30, fontWeight: 900 }}>${shareTire.price}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#CBD5E1" }}>TreadFlow</div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <button onClick={copyShareLink} style={{ ...S.btn("primary"), justifyContent: "center" }}>Copy Link</button>
          <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")} style={{ ...S.btn("secondary"), justifyContent: "center" }}>Share to Facebook</button>
          <a href={`sms:?body=${encodeURIComponent(`Check out this tire: ${shareName} $${shareTire.price} at ${publicShopInfo.name || storefront.name}: ${shareUrl}`)}`} style={{ ...S.btn("secondary"), justifyContent: "center", textDecoration: "none" }}>Share via Text</a>
        </div>
      </div>
    </div>
  );

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
          <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 1fr", isMobile), gap: 14 }}>
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
                <option value="shop">Installation at Shop</option>
                <option value="pickup">Pickup Only</option>
                {publicShopInfo.mobile_service_enabled && <option value="mobile">Mobile Installation (We Come To You) +${publicShopInfo.mobile_service_fee}</option>}
              </select>
            </div>
            <div>
              <label style={S.label}>Preferred Date</label>
              <input type="date" style={S.input} value={resDate} onChange={e => setResDate(e.target.value)} />
            </div>
            {resService !== "mobile" ? (
              <div>
                <label style={S.label}>Preferred Time</label>
                <select style={{ ...S.select, width: "100%" }} value={resTime} onChange={e => setResTime(e.target.value)}>
                  {["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            ) : (
              <>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={S.label}>Service Address</label>
                  <textarea style={{ ...S.input, height: 80, resize: "vertical" }} value={resServiceAddress} onChange={e => setResServiceAddress(e.target.value)} placeholder="Street, city, zip" />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={S.label}>Preferred Time Window</label>
                  <select style={{ ...S.select, width: "100%" }} value={resMobileTimeSlot} onChange={e => setResMobileTimeSlot(e.target.value)}>
                    <option value="">Select a time window</option>
                    {mobileTimeSlots.map(slot => {
                      const taken = mobileTakenSlots.includes(slot);
                      return <option key={slot} value={slot} disabled={taken}>{slot}{taken ? " — Unavailable" : ""}</option>;
                    })}
                  </select>
                </div>
                <div style={{ gridColumn: "1/-1", color: COLORS.gray500, fontSize: 13 }}>
                  Our technician will call 30 minutes before arrival. Jobs are scheduled 90 minutes apart minimum.
                </div>
              </>
            )}
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
            <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "flex-start", gap: 10, marginTop: 8 }}>
              <input
                type="checkbox"
                id="smsConsent"
                checked={smsConsent}
                onChange={e => setSmsConsent(e.target.checked)}
                style={{ marginTop: 3, accentColor: COLORS.blue, width: 16, height: 16, flexShrink: 0 }}
              />
              <label htmlFor="smsConsent" style={{ fontSize: 13, color: COLORS.gray600, lineHeight: 1.5, cursor: "pointer" }}>
                I agree to receive text message updates about my order from this shop. Message and data rates may apply. Reply STOP to unsubscribe. <a href="/sms-terms" target="_blank" style={{ color: COLORS.blue }}>SMS Terms</a>
              </label>
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
              if (!smsConsent) {
                setOrderError("Please agree to receive SMS updates before submitting your reservation.");
                return;
              }
              const isMobile = resService === "mobile";
              if (isMobile) {
                if (!resServiceAddress.trim()) {
                  setOrderError("Please provide your service address for mobile installation.");
                  return;
                }
                if (!resMobileTimeSlot) {
                  setOrderError("Please choose a preferred mobile time window.");
                  return;
                }
                if (!resDate) {
                  setOrderError("Please choose a date for mobile service.");
                  return;
                }
              }
              setOrderSubmitting(true);
              
              // Handle deposit collection via Stripe
              if (resPayment === "Pay deposit online ($50)") {
                const depositLink = import.meta.env.VITE_STRIPE_DEPOSIT_LINK;
                if (depositLink) {
                  // Store reservation data temporarily for after payment
                  sessionStorage.setItem("pendingReservation", JSON.stringify({
                    orderTire,
                    name,
                    phone,
                    email,
                    vehicleRaw,
                    quantity: resQuantity,
                    smsConsent,
                    shopName: publicShopInfo.name,
                    ownerPhone: publicShopInfo.phone,
                    isMobile,
                    serviceAddress: resServiceAddress,
                    mobileTimeSlot: resMobileTimeSlot,
                    mobileDate: resDate,
                    notes: resNotes,
                  }));
                  // Redirect to Stripe with return URL
                  window.location.href = `${depositLink}?return=${encodeURIComponent(window.location.href + "?deposit_success=true")}`;
                  return;
                }
              }
              
              try {
                const id = await storefrontSubmitReservation(publicShopId, {
                  orderTire,
                  name,
                  phone,
                  email,
                  vehicleRaw,
                  quantity: resQuantity,
                  smsConsent,
                  shopName: publicShopInfo.name,
                  ownerPhone: publicShopInfo.phone,
                  isMobile,
                  serviceAddress: resServiceAddress,
                  mobileTimeSlot: resMobileTimeSlot,
                  mobileDate: resDate,
                  notes: resNotes,
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
      <div style={{ maxWidth: 900, margin: "32px auto", padding: "0 20px", display: "grid", gridTemplateColumns: gridCols("1fr 1fr", isMobile), gap: 32 }}>
        <div>
          <div style={{ background: COLORS.gray100, borderRadius: 16, height: 300, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, marginBottom: 16 }}>🛞</div>
        </div>
        <div>
          <span style={S.badge(selectedTire.condition)}>{selectedTire.condition}</span>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: "10px 0 4px" }}>{selectedTire.brand} {selectedTire.model}</h1>
          <div style={{ fontSize: 18, color: COLORS.gray500, marginBottom: 20 }}>{selectedTire.size}</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: COLORS.blue }}>${selectedTire.price}<span style={{ fontSize: 16, fontWeight: 400, color: COLORS.gray400 }}>/tire</span></div>
          {selectedTire.setPrice && <div style={{ fontSize: 18, color: COLORS.green, fontWeight: 700 }}>Set of 4: ${selectedTire.setPrice}</div>}
          <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 1fr", isMobile), gap: 10, margin: "20px 0" }}>
            {[["In Stock", selectedTire.qty + " available"], selectedTire.tread ? ["Tread Depth", selectedTire.tread] : ["DOT Date", selectedTire.dot], ["Load Index", selectedTire.load], ["Speed Rating", selectedTire.speed], ["Type", selectedTire.type], ["Install Fee", "$" + selectedTire.installFee]].map(([k, v]) => <div key={k} style={{ background: COLORS.gray50, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.gray400 }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{v}</div>
            </div>)}
          </div>
          <p style={{ fontSize: 14, color: COLORS.gray600, lineHeight: 1.7, marginBottom: 20 }}>{selectedTire.desc}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {selectedTire.qty === 0 ? (
              <button onClick={() => openWaitlist(selectedTire)} style={{ ...S.btn("orange", "lg"), justifyContent: "center", fontWeight: 700, ...(isMobile ? { width: "100%" } : {}) }}>Notify Me When Available</button>
            ) : (
              <button onClick={() => { setOrderTire(selectedTire); setShowOrder(true); }} style={{ ...S.btn("orange", "lg"), justifyContent: "center", fontWeight: 700, ...(isMobile ? { width: "100%" } : {}) }}>Reserve Now →</button>
            )}
            <button onClick={() => openShare(selectedTire)} style={{ ...S.btn("secondary", "lg"), justifyContent: "center" }}>Share</button>
            <button style={{ ...S.btn("primary", "lg"), justifyContent: "center" }}>📅 Book Installation</button>
            <a href="tel:8645550142" style={{ ...S.btn("secondary", "lg"), justifyContent: "center", textDecoration: "none" }}>📞 Call Shop</a>
          </div>
        </div>
      </div>
      {waitlistModal}
      {shareModal}
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
          {!isMobile && ["Inventory","Services","About","Contact"].map(l => <span key={l} style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, cursor: "pointer" }}>{l}</span>)}
          <a href="tel:8645550142" style={{ ...S.btn("orange", "sm"), textDecoration: "none", fontWeight: 700 }}>📞 Call Now</a>
        </div>
      </div>
      {/* Announcement Bar */}
      <div style={{ background: COLORS.orange, padding: "8px 32px", textAlign: "center", fontSize: 14, color: "#fff", fontWeight: 600 }}>
        🏷️ Free installation on any set of 4 tires — Limited time offer!
      </div>
      {activePromotion && (
        <div style={{ padding: "14px 24px", background: "#F8FAFC", borderBottom: `1px solid ${COLORS.gray200}`, color: COLORS.gray900, display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", justifyContent: "center", gap: 12, fontSize: 14 }}>
          <span style={{ fontWeight: 700 }}>{activePromotion.title}</span>
          <span>{activePromotion.discount_type === "percentage" ? `${activePromotion.discount_value}% off` : `$${activePromotion.discount_value} off`}</span>
          {activePromotion.promo_code ? <span style={{ fontWeight: 700 }}>Use code {activePromotion.promo_code} for {activePromotion.discount_type === "percentage" ? `${activePromotion.discount_value}% off` : `$${activePromotion.discount_value} off`}</span> : null}
        </div>
      )}
      {/* Hero with Video Background */}
      <div style={{ background: storefront.heroBg, padding: "80px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {heroVideoEnabled && (
          <video autoPlay loop muted playsInline style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }}>
            <source src={heroVideoUrl} type={heroVideoType} />
          </video>
        )}
        <div style={{ position: "absolute", inset: 0, background: "rgba(10,22,40,0.7)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: 44, fontWeight: 800, color: "#fff", margin: "0 auto 16px", maxWidth: 700, lineHeight: 1.2 }}>{storefront.hero}</h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", maxWidth: 540, margin: "0 auto 32px", lineHeight: 1.6 }}>{storefront.heroSub}</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: isMobile ? "wrap" : "nowrap", marginBottom: 16 }}>
            {[["size","Search by Size"], ["vehicle","Search by Vehicle"]].map(([mode, label]) => (
              <button key={mode} onClick={() => setSearchMode(mode)} style={{ padding: "10px 18px", borderRadius: 999, border: searchMode === mode ? `1px solid ${COLORS.white}` : `1px solid rgba(255,255,255,0.5)`, background: searchMode === mode ? "rgba(255,255,255,0.2)" : "transparent", color: "#fff", cursor: "pointer", fontWeight: 700, minWidth: 150 }}>
                {label}
              </button>
            ))}
          </div>
          {searchMode === "vehicle" && (
            <div style={{ display: "grid", gridTemplateColumns: gridCols("repeat(3, minmax(140px, 1fr))", isMobile), gap: 12, justifyContent: "center", maxWidth: 780, margin: "0 auto 18px", width: isMobile ? "100%" : undefined }}>
              <select value={vehicleYear} onChange={e => setVehicleYear(e.target.value)} style={{ ...S.input, width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14 }}>
                {vehicleYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
              <select value={vehicleMake} onChange={e => { const make = e.target.value; setVehicleMake(make); const nextModels = vehicleModelsByMake[make] || []; setVehicleModel(nextModels[0] || ""); }} style={{ ...S.input, width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14 }}>
                {vehicleMakes.map(make => <option key={make} value={make}>{make}</option>)}
              </select>
              <select value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} style={{ ...S.input, width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #CBD5E1", fontSize: 14 }}>
                {vehicleModelOptions.map(model => <option key={model} value={model}>{model}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", maxWidth: 520, margin: "0 auto", background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 12, flexDirection: isMobile ? "column" : "row", width: isMobile ? "100%" : undefined, boxSizing: "border-box" }}>
            <input style={{ ...S.input, flex: isMobile ? undefined : 1, width: isMobile ? "100%" : undefined, background: "#fff", boxSizing: "border-box" }} placeholder={searchMode === "vehicle" ? `Search tires for ${vehicleYear} ${vehicleMake} ${vehicleModel}` : "Search by size, brand, or model (e.g. 225/55R17)..."} value={search} onChange={e => setSearch(e.target.value)} />
            <button style={{ ...S.btn("orange"), fontWeight: 700, whiteSpace: "nowrap", ...(isMobile ? { width: "100%", justifyContent: "center" } : {}) }}>{searchMode === "vehicle" ? "Search by Vehicle" : "Search Tires"}</button>
          </div>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
            {[["📍","1420 Wade Hampton Blvd, Greenville SC"],["🕐","Mon–Fri 8am–6pm · Sat 8am–4pm"],["⭐","4.9/5 — 127 reviews"]].map(([icon, text]) => <span key={text} style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{icon} {text}</span>)}
          </div>
        </div>
      </div>
      {/* Trust Badges */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${COLORS.gray200}`, padding: "8px 16px", maxHeight: 40, overflowX: "auto", overflowY: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: isMobile ? "flex-start" : "center", gap: 10, maxWidth: 900, margin: "0 auto", minWidth: "max-content" }}>
          {[["✅","Licensed & Insured"],["⭐","5-Star Rated"],["⚡","Same Day Service"],["🔧","Expert Installation"]].map(([icon, title]) => <div key={title} style={{ display: "flex", alignItems: "center", gap: 5, background: COLORS.gray50, borderRadius: 8, padding: "3px 8px", whiteSpace: "nowrap", height: 22 }}>
            <div style={{ fontSize: 13, lineHeight: 1 }}>{icon}</div>
            <div style={{ fontWeight: 700, fontSize: 12, color: COLORS.navy, lineHeight: 1 }}>{title}</div>
          </div>)}
        </div>
      </div>
      {/* Tire Size Finder Modal */}
      {showTireSizeFinder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 480, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Find Your Tire Size</h2>
              <button onClick={() => setShowTireSizeFinder(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: COLORS.gray400 }}>×</button>
            </div>
            <div style={{ background: COLORS.gray50, borderRadius: 12, padding: 20, marginBottom: 20, textAlign: "center" }}>
              <svg width="140" height="140" viewBox="0 0 140 140" style={{ margin: "0 auto", display: "block" }}>
                <circle cx="70" cy="70" r="65" fill="none" stroke="#999" strokeWidth="2" />
                <circle cx="70" cy="70" r="55" fill="none" stroke="#666" strokeWidth="3" />
                <text x="50" y="75" fontSize="12" fontWeight="bold" fill="#000">225</text>
                <text x="82" y="75" fontSize="12" fontWeight="bold" fill="#000">55</text>
                <text x="105" y="75" fontSize="12" fontWeight="bold" fill="#000">R17</text>
                <line x1="45" y1="35" x2="45" y2="10" stroke="#1E6FD9" strokeWidth="2" />
                <text x="15" y="28" fontSize="11" fill="#1E6FD9" fontWeight="bold">Width</text>
                <line x1="80" y1="20" x2="100" y2="5" stroke="#1E6FD9" strokeWidth="2" />
                <text x="85" y="8" fontSize="11" fill="#1E6FD9" fontWeight="bold">Ratio</text>
                <line x1="120" y1="70" x2="135" y2="70" stroke="#1E6FD9" strokeWidth="2" />
                <text x="115" y="90" fontSize="11" fill="#1E6FD9" fontWeight="bold">Rim</text>
              </svg>
            </div>
            <p style={{ fontSize: 14, color: COLORS.gray600, marginBottom: 20, lineHeight: 1.6 }}>Look at the sidewall of your current tire. You'll see a number like <strong>225/55R17</strong>. Enter each part below to find matching tires.</p>
            <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={S.label}>Section Width (mm)</label>
                <input style={S.input} placeholder="e.g. 225" value={tireWidth} onChange={e => setTireWidth(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Aspect Ratio (%)</label>
                <input style={S.input} placeholder="e.g. 55" value={tireAspectRatio} onChange={e => setTireAspectRatio(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Rim Diameter (inches)</label>
                <input style={S.input} placeholder="e.g. 17" value={tireRimSize} onChange={e => setTireRimSize(e.target.value)} />
              </div>
            </div>
            <button onClick={() => { const size = `${tireWidth}/${tireAspectRatio}R${tireRimSize}`; setSearch(size); setShowTireSizeFinder(false); setTireWidth(""); setTireAspectRatio(""); setTireRimSize(""); }} style={{ ...S.btn("primary", "lg"), width: "100%", justifyContent: "center", fontWeight: 700 }}>Find These Tires →</button>
          </div>
        </div>
      )}

      {/* Inventory */}
      <div style={{ padding: "60px 40px", background: COLORS.gray50 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Tire Inventory</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowTireSizeFinder(true)} style={{ ...S.btn("secondary", "sm"), fontWeight: 700 }}>🔍 Find My Size</button>
            {["All","New","Used"].map(c => <button key={c} onClick={() => setCondFilter(c)} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 14, cursor: "pointer", border: `1px solid ${condFilter === c ? storefront.primaryColor : COLORS.gray300}`, background: condFilter === c ? storefront.primaryColor : "#fff", color: condFilter === c ? "#fff" : COLORS.gray600 }}>{c}</button>)}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: gridCols("repeat(auto-fill, minmax(260px, 1fr))", isMobile), gap: 20 }}>
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
              {t.qty === 0 ? (
                <button onClick={e => { e.stopPropagation(); openWaitlist(t); }} style={{ ...S.btn("orange"), width: "100%", justifyContent: "center", fontWeight: 700 }}>Notify Me When Available</button>
              ) : (
                <button onClick={e => { e.stopPropagation(); setOrderTire(t); setShowOrder(true); }} style={{ ...S.btn("orange"), width: "100%", justifyContent: "center", fontWeight: 700 }}>Reserve Now</button>
              )}
            </div>
          </div>)}
        </div>
      </div>
      {/* Services */}
      <div style={{ padding: "60px 40px", background: "#fff" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 32 }}>Our Services</h2>
        <div style={{ display: "grid", gridTemplateColumns: gridCols("repeat(auto-fit, minmax(180px, 1fr))", isMobile), gap: 16, maxWidth: 900, margin: "0 auto" }}>
          {[["🔧","Tire Installation","$25–$35/tire"],["⚖️","Wheel Balancing","$12/wheel"],["🔄","Tire Rotation","$19.99"],["🩹","Flat Repair","$19.99"],["🔩","TPMS Service","$15/sensor"],["🚗","Used Tire Mounting","$15/tire"]].map(([i,s,p]) => <div key={s} style={{ background: COLORS.gray50, borderRadius: 12, padding: "20px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{i}</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s}</div>
            <div style={{ fontSize: 14, color: COLORS.blue, fontWeight: 600 }}>{p}</div>
          </div>)}
        </div>
      </div>
      {/* Photo Gallery */}
      <div style={{ padding: "60px 40px", background: "#fff" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 32 }}>Our Work</h2>
        <div style={{ display: "grid", gridTemplateColumns: gridCols("repeat(3, 1fr)", isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)"), gap: 16, maxWidth: 900, margin: "0 auto" }}>
          {galleryImages.map((img, idx) => (
            <div key={idx} style={{ position: "relative", overflow: "hidden", borderRadius: 12, cursor: "pointer", aspectRatio: "4/3" }} onClick={() => { setShowLightbox(true); setLightboxIndex(idx); }}>
              <img src={img} alt={"Gallery " + idx} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }} onMouseEnter={e => e.target.style.transform = "scale(1.05)"} onMouseLeave={e => e.target.style.transform = "scale(1)"} />
            </div>
          ))}
        </div>
      </div>
      {/* Lightbox */}
      {showLightbox && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img src={galleryImages[lightboxIndex]} alt="Gallery" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            <button onClick={() => setShowLightbox(false)} style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", fontSize: 32, cursor: "pointer", width: 50, height: 50, borderRadius: "50%" }}>×</button>
            {lightboxIndex > 0 && <button onClick={() => setLightboxIndex(lightboxIndex - 1)} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", fontSize: 24, cursor: "pointer", width: 40, height: 40, borderRadius: "50%" }}>‹</button>}
            {lightboxIndex < galleryImages.length - 1 && <button onClick={() => setLightboxIndex(lightboxIndex + 1)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", fontSize: 24, cursor: "pointer", width: 40, height: 40, borderRadius: "50%" }}>›</button>}
            <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", color: "#fff", fontSize: 14 }}>{lightboxIndex + 1} / {galleryImages.length}</div>
          </div>
        </div>
      )}
      {/* Reviews */}
      <div style={{ padding: "60px 40px", background: COLORS.gray50 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 32 }}>Customer Reviews</h2>
        <div style={{ display: "grid", gridTemplateColumns: gridCols("repeat(3, 1fr)", isMobile), gap: 20, maxWidth: 900, margin: "0 auto" }}>
          {[["Terrence H.","⭐⭐⭐⭐⭐","Great prices on used tires. In and out in 45 minutes. Will definitely be back!"],["Angela P.","⭐⭐⭐⭐⭐","Reserved online and they had my tires ready when I arrived. Super easy process."],["Devon C.","⭐⭐⭐⭐⭐","Best used tire shop in Greenville. Honest people and fair pricing."]].map(([n, r, t]) => <div key={n} style={{ ...S.card }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{n}</div>
            <div style={{ marginBottom: 8 }}>{r}</div>
            <div style={{ fontSize: 14, color: COLORS.gray500, lineHeight: 1.6 }}>{t}</div>
          </div>)}
        </div>
      </div>
      {/* Google Maps */}
      <div style={{ padding: "60px 40px", background: "#fff" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 32 }}>Find Us</h2>
        <div style={{ display: "grid", gridTemplateColumns: gridCols("1fr 1fr", isMobile), gap: 32, maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ borderRadius: 12, overflow: "hidden", height: 300 }}>
            <iframe width="100%" height="100%" style={{ border: "none" }} src={`https://maps.google.com/maps?q=${encodeURIComponent(storefront.address)}&output=embed`} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
          </div>
          {!isMobile && <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 4 }}>ADDRESS</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{storefront.address}</div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 4 }}>PHONE</div>
              <a href="tel:8645550142" style={{ fontSize: 16, fontWeight: 700, color: COLORS.blue, textDecoration: "none" }}>(864) 555-0142</a>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 4 }}>HOURS</div>
              <div style={{ fontSize: 14, color: COLORS.gray600, lineHeight: 1.6 }}>
                <div>Mon–Fri: 8am–6pm</div>
                <div>Saturday: 8am–4pm</div>
                <div>Sunday: Closed</div>
              </div>
            </div>
          </div>}
        </div>
        {isMobile && <div style={{ marginTop: 20, textAlign: "center" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 4 }}>ADDRESS</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{storefront.address}</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 4 }}>PHONE</div>
            <a href="tel:8645550142" style={{ fontSize: 14, fontWeight: 700, color: COLORS.blue, textDecoration: "none" }}>(864) 555-0142</a>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray500, marginBottom: 4 }}>HOURS</div>
            <div style={{ fontSize: 13, color: COLORS.gray600, lineHeight: 1.6 }}>
              <div>Mon–Fri: 8am–6pm · Sat: 8am–4pm · Sun: Closed</div>
            </div>
          </div>
        </div>}
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
      {waitlistModal}
      {shareModal}
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
  const initialStorefrontMatch = typeof window !== "undefined" ? window.location.pathname.match(/^\/shop\/([^/]+)\/([^/]+)\/?$/) : null;
  const [page, setPage] = useState(() => {
    if (typeof window !== "undefined" && window.location.pathname === "/sms-terms") return "sms-terms";
    if (initialStorefrontMatch) return "storefront";
    if (typeof window !== "undefined" && window.location.search.includes("deposit_success=true")) return "storefront";
    return "home";
  });
  const [initialTireSlug, setInitialTireSlug] = useState(initialStorefrontMatch?.[2] || "");
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
    if (p !== "storefront") setInitialTireSlug("");
    setPage(p);
  };

  const navBar = (
    <div style={{ background: COLORS.navy, padding: "10px 20px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontFamily: "system-ui, sans-serif" }}>
      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginRight: 4 }}>Navigate:</span>
      {[["home","🌐 Public Site"],["login","🔐 Login"],["signup","✨ Sign Up"],["invite","📝 Request Invite"],["market","📍 Market Check"],["onboarding","🔑 Invite Onboarding"],["admin","🛠 Super Admin"],["shop","🏪 Shop Dashboard"],["storefront","🛞 Shop Storefront"],["sms-terms","💬 SMS Terms"]].map(([p, l]) => <button key={p} onClick={() => nav(p)} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, cursor: "pointer", background: page === p ? COLORS.blue : "rgba(255,255,255,0.1)", color: "#fff", border: "none", fontWeight: page === p ? 700 : 400 }}>{l}</button>)}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      {page === "home" && <LandingPage nav={nav} />}
      {page === "login" && <LoginPage nav={nav} />}
      {page === "signup" && <SignUpPage nav={nav} />}
      {page === "invite" && <InvitePage nav={nav} />}
      {page === "market" && <MarketPage nav={nav} />}
      {page === "onboarding" && <InviteOnboarding nav={nav} />}
      {page === "admin" && <SuperAdmin nav={nav} />}
      {page === "shop" && (authReady ? (session ? <ShopDashboard nav={nav} /> : <LoginPage nav={nav} />) : <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>Loading...</div>)}
      {page === "storefront" && <Storefront nav={nav} initialTireSlug={initialTireSlug} />}
      {page === "sms-terms" && <SmsTermsPage nav={nav} />}
    </div>
  );
}
