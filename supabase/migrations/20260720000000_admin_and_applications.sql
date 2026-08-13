-- TreadFlow: Super Admin real-data support
--
-- This migration is NOT applied automatically. Review it, then run it yourself
-- against your Supabase project (SQL Editor, or `supabase db push` if you have
-- the CLI linked). Claude has no service-role/DB credentials in this
-- environment and cannot execute DDL directly.
--
-- Everything here is additive: it creates two new tables (platform_admins,
-- applications) and adds new SELECT policies on shops/orders/tires for
-- platform admins. Postgres RLS OR's multiple permissive policies together,
-- so these additions do not remove or replace any owner-scoped policies you
-- already have on shops/orders/tires. If any of those tables use RESTRICTIVE
-- policies (uncommon default), review compatibility before applying.

-- ── 1. Platform admin membership ────────────────────────────────────────────
create table if not exists public.platform_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

drop policy if exists "platform_admins_select_self" on public.platform_admins;
create policy "platform_admins_select_self" on public.platform_admins
  for select
  using (auth.uid() = id);

-- Reusable check used by the policies below. security definer so it can read
-- platform_admins regardless of the caller's own RLS visibility into that table.
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins where id = auth.uid()
  );
$$;

-- ── 2. Shop applications (public intake form -> admin review queue) ────────
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  shop_name text not null,
  owner_name text not null,
  email text not null,
  phone text,
  address text,
  city text,
  state text,
  website text,
  referral_code text,
  locations text,
  tire_type text,
  inventory_size text,
  current_method text,
  accepts_online_orders text,
  offers_installation text,
  features jsonb not null default '[]'::jsonb,
  notes text,
  market text,
  plan_interest text,
  status text not null default 'New',
  created_at timestamptz not null default now()
);

alter table public.applications enable row level security;

-- The public "Request Access" form submits without being logged in.
drop policy if exists "applications_insert_public" on public.applications;
create policy "applications_insert_public" on public.applications
  for insert
  with check (true);

drop policy if exists "applications_select_admin" on public.applications;
create policy "applications_select_admin" on public.applications
  for select
  using (public.is_platform_admin());

drop policy if exists "applications_update_admin" on public.applications;
create policy "applications_update_admin" on public.applications
  for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ── 3. Admin read access to existing shop-owned tables ──────────────────────
drop policy if exists "shops_select_admin" on public.shops;
create policy "shops_select_admin" on public.shops
  for select
  using (public.is_platform_admin());

drop policy if exists "orders_select_admin" on public.orders;
create policy "orders_select_admin" on public.orders
  for select
  using (public.is_platform_admin());

drop policy if exists "tires_select_admin" on public.tires;
create policy "tires_select_admin" on public.tires
  for select
  using (public.is_platform_admin());

-- Admins can update shop status (e.g. suspend a shop). Scoped to UPDATE only —
-- admins still cannot INSERT/DELETE shops through this policy.
drop policy if exists "shops_update_admin" on public.shops;
create policy "shops_update_admin" on public.shops
  for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ── 4. Defensive columns on invite_codes ────────────────────────────────────
-- invite_codes already exists and is read from in the app (validateInviteCode),
-- but its exact column set isn't recorded anywhere in version control. These
-- ADD COLUMN IF NOT EXISTS statements guarantee the columns the admin
-- "Generate & Send Invite" action needs, without touching any existing data.
alter table public.invite_codes
  add column if not exists status text default 'active',
  add column if not exists expires_at timestamptz,
  add column if not exists used_at timestamptz,
  add column if not exists is_active boolean default true,
  add column if not exists email text,
  add column if not exists shop_name text,
  add column if not exists plan text,
  add column if not exists application_id uuid references public.applications(id) on delete set null;

-- ── 5. Bootstrap ─────────────────────────────────────────────────────────────
-- Add yourself as the first platform admin so the Super Admin dashboard is
-- reachable at all. Find your user id in Supabase Dashboard -> Authentication
-- -> Users, then uncomment and run:
-- insert into public.platform_admins (id) values ('00000000-0000-0000-0000-000000000000');
