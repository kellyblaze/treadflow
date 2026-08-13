-- TreadFlow: Foundational schema (best-effort reconstruction)
--
-- IMPORTANT — read this before running:
--
-- This is NOT a verified dump of the original project's schema. It's a
-- reconstruction built entirely from what this codebase's own app code
-- (src/App.jsx) was observed reading and writing, across the session that
-- produced every other migration in this folder. Use it to stand up a
-- BRAND NEW, EMPTY Supabase project so the app has something to run
-- against. If you ever regain access to the original project, prefer
-- `supabase db pull` against that project instead — it will be correct in
-- a way this file cannot guarantee to be.
--
-- Column choices are cited to the app code they're derived from. Anything
-- NOT read from a real Supabase row by the app (e.g. tread depth, DOT code,
-- load/speed rating, tire photos — tireFromSupabaseRow hardcodes these as
-- constants rather than reading row.* for them) is deliberately left out
-- rather than guessed.
--
-- Run this BEFORE the other 9 migrations in this folder — they assume
-- shops/orders/etc. already exist (shop_staff and invoices both have
-- foreign keys into shops/orders). Its filename timestamp
-- (20260719...) sorts before all of them for exactly this reason.
--
-- RLS here is intentionally minimal: owner access + whatever the public
-- storefront needs anonymously (confirmed by which tables the storefront
-- queries without being logged in). The later migrations add staff and
-- platform-admin access on top of this. One known gap: nothing here grants
-- INSERT on invite_codes to platform admins — is_platform_admin() doesn't
-- exist until 20260720000000 runs, so it can't be referenced yet. If the
-- admin "Generate & Send Invite" flow needs it, add that policy after
-- 20260720000000 has run.

-- ── shops ────────────────────────────────────────────────────────────────
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  owner_name text,
  email text,
  phone text,
  city text,
  state text,
  status text not null default 'Trial', -- Trial | Active | Suspended | Cancelled | Past Due
  plan text, -- Early Partner | Growth Partner | Market Leader
  slug text unique,
  -- Mobile service + storefront customization (confirmed via a leftover
  -- comment in App.jsx documenting the exact ALTER TABLE statements once
  -- run for these columns):
  mobile_service_enabled boolean not null default false,
  mobile_service_radius integer not null default 25,
  mobile_service_fee numeric not null default 50,
  mobile_service_hours_start text not null default '8:00 AM',
  mobile_service_hours_end text not null default '6:00 PM',
  gallery_images text[] not null default array[]::text[],
  hero_video_url text,
  storefront_sections jsonb,
  created_at timestamptz not null default now()
);

alter table public.shops enable row level security;

-- Public storefront and market-check pages query shops anonymously with no
-- auth — this has to be at least this permissive for those to work as
-- coded. It does mean every shop's contact info is publicly readable; a
-- future tightening could split public-safe fields into a view instead.
drop policy if exists "shops_select_public" on public.shops;
create policy "shops_select_public" on public.shops
  for select
  using (true);

drop policy if exists "shops_update_owner" on public.shops;
create policy "shops_update_owner" on public.shops
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- (Owner INSERT on shops is added by 20260720000008_multi_location.sql.)

-- ── tires ────────────────────────────────────────────────────────────────
create table if not exists public.tires (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  brand text not null default '',
  model text not null default '',
  size text not null default '',
  condition text not null default 'New', -- New | Used
  quantity integer not null default 0,
  price numeric not null default 0,
  status text not null default 'Active', -- Active | Out of Stock
  created_at timestamptz not null default now()
);
create index if not exists tires_shop_id_idx on public.tires (shop_id);

alter table public.tires enable row level security;

drop policy if exists "tires_select_public" on public.tires;
create policy "tires_select_public" on public.tires
  for select
  using (true); -- storefront tire search/browse is anonymous

drop policy if exists "tires_all_owner" on public.tires;
create policy "tires_all_owner" on public.tires
  for all
  using (shop_id in (select id from public.shops where user_id = auth.uid()))
  with check (shop_id in (select id from public.shops where user_id = auth.uid()));

-- ── customers ────────────────────────────────────────────────────────────
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null default '',
  phone text,
  email text,
  vehicle_year integer,
  vehicle_make text,
  vehicle_model text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists customers_shop_id_idx on public.customers (shop_id);

alter table public.customers enable row level security;

drop policy if exists "customers_all_owner" on public.customers;
create policy "customers_all_owner" on public.customers
  for all
  using (shop_id in (select id from public.shops where user_id = auth.uid()))
  with check (shop_id in (select id from public.shops where user_id = auth.uid()));

-- The public storefront reservation flow creates a customer record for a
-- first-time buyer before any auth exists (storefrontSubmitReservation).
drop policy if exists "customers_insert_public" on public.customers;
create policy "customers_insert_public" on public.customers
  for insert
  with check (true);

-- ── orders ───────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  tire_id uuid references public.tires(id) on delete set null,
  customer_name text not null default '',
  customer_email text,
  customer_phone text,
  quantity integer not null default 1,
  total numeric not null default 0,
  -- Note: the app inserts new orders with status "pending" (lowercase) but
  -- elsewhere reads/displays "Pending" (capitalized) as its own fallback —
  -- an inconsistency in the app itself, reproduced here as observed rather
  -- than silently normalized.
  status text not null default 'pending',
  sms_consent boolean not null default false,
  is_mobile boolean not null default false,
  service_address text,
  mobile_time_slot text,
  mobile_date text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists orders_shop_id_idx on public.orders (shop_id);

alter table public.orders enable row level security;

drop policy if exists "orders_all_owner" on public.orders;
create policy "orders_all_owner" on public.orders
  for all
  using (shop_id in (select id from public.shops where user_id = auth.uid()))
  with check (shop_id in (select id from public.shops where user_id = auth.uid()));

-- Public storefront reservations/deposits create an order anonymously.
drop policy if exists "orders_insert_public" on public.orders;
create policy "orders_insert_public" on public.orders
  for insert
  with check (true);

-- ── appointments ─────────────────────────────────────────────────────────
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  date date,
  time text,
  status text not null default 'Pending',
  vehicle_info text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists appointments_shop_id_idx on public.appointments (shop_id);

alter table public.appointments enable row level security;

drop policy if exists "appointments_all_owner" on public.appointments;
create policy "appointments_all_owner" on public.appointments
  for all
  using (shop_id in (select id from public.shops where user_id = auth.uid()))
  with check (shop_id in (select id from public.shops where user_id = auth.uid()));

-- ── promotions ───────────────────────────────────────────────────────────
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  title text not null,
  discount_type text not null default 'percentage', -- percentage | fixed
  discount_value numeric not null default 0,
  applies_to text not null default 'All tires',
  start_date date not null default current_date,
  end_date date not null default current_date,
  promo_code text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists promotions_shop_id_idx on public.promotions (shop_id);

alter table public.promotions enable row level security;

drop policy if exists "promotions_all_owner" on public.promotions;
create policy "promotions_all_owner" on public.promotions
  for all
  using (shop_id in (select id from public.shops where user_id = auth.uid()))
  with check (shop_id in (select id from public.shops where user_id = auth.uid()));

-- Storefront shows active promotions to anonymous visitors.
drop policy if exists "promotions_select_public" on public.promotions;
create policy "promotions_select_public" on public.promotions
  for select
  using (true);

-- ── invite_codes ─────────────────────────────────────────────────────────
-- Base shape only. 20260720000000_admin_and_applications.sql adds
-- status/expires_at/used_at/is_active/email/shop_name/plan/application_id
-- defensively on top of this, so it's safe if this table already has them.
create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.invite_codes enable row level security;

-- SignUpPage validates an invite code before the user is authenticated
-- (validateInviteCode), so this has to be readable anonymously.
drop policy if exists "invite_codes_select_public" on public.invite_codes;
create policy "invite_codes_select_public" on public.invite_codes
  for select
  using (true);

-- ── storefront_views ─────────────────────────────────────────────────────
-- Schema taken verbatim from a leftover comment in App.jsx documenting the
-- exact CREATE TABLE statement once run for this table.
create table if not exists public.storefront_views (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade,
  page text,
  tire_id uuid references public.tires(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists storefront_views_shop_id_idx on public.storefront_views (shop_id);

alter table public.storefront_views enable row level security;

-- Anonymous page-view tracking on the public storefront.
drop policy if exists "storefront_views_insert_public" on public.storefront_views;
create policy "storefront_views_insert_public" on public.storefront_views
  for insert
  with check (true);

drop policy if exists "storefront_views_select_owner" on public.storefront_views;
create policy "storefront_views_select_owner" on public.storefront_views
  for select
  using (shop_id in (select id from public.shops where user_id = auth.uid()));

-- ── waitlist ─────────────────────────────────────────────────────────────
-- Schema taken verbatim from the same leftover App.jsx comment as
-- storefront_views above.
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade,
  tire_id uuid references public.tires(id) on delete set null,
  tire_name text,
  email text,
  created_at timestamptz default now()
);
create index if not exists waitlist_shop_id_idx on public.waitlist (shop_id);

alter table public.waitlist enable row level security;

-- Anonymous "notify me when back in stock" signup on the storefront.
drop policy if exists "waitlist_insert_public" on public.waitlist;
create policy "waitlist_insert_public" on public.waitlist
  for insert
  with check (true);

drop policy if exists "waitlist_select_owner" on public.waitlist;
create policy "waitlist_select_owner" on public.waitlist
  for select
  using (shop_id in (select id from public.shops where user_id = auth.uid()));

-- ── shop-gallery storage bucket ─────────────────────────────────────────
-- Confirmed upload path convention from handleGalleryUpload in App.jsx:
-- objects are stored as "<shop_id>/<filename>", i.e. the first path
-- segment is always the owning shop's id.
insert into storage.buckets (id, name, public)
values ('shop-gallery', 'shop-gallery', true)
on conflict (id) do nothing;

drop policy if exists "shop_gallery_select_public" on storage.objects;
create policy "shop_gallery_select_public" on storage.objects
  for select
  using (bucket_id = 'shop-gallery');

drop policy if exists "shop_gallery_owner_write" on storage.objects;
create policy "shop_gallery_owner_write" on storage.objects
  for insert
  with check (
    bucket_id = 'shop-gallery'
    and (storage.foldername(name))[1] in (select id::text from public.shops where user_id = auth.uid())
  );

drop policy if exists "shop_gallery_owner_delete" on storage.objects;
create policy "shop_gallery_owner_delete" on storage.objects
  for delete
  using (
    bucket_id = 'shop-gallery'
    and (storage.foldername(name))[1] in (select id::text from public.shops where user_id = auth.uid())
  );
