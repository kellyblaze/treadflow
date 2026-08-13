-- TreadFlow: Real markets management
--
-- Same rules as prior migrations in this folder: review and run yourself
-- (SQL Editor or `supabase db push`). Additive only.

create table if not exists public.markets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  state text not null,
  max_shops integer not null default 1,
  status text not null default 'Open',
  created_at timestamptz not null default now()
);

alter table public.markets enable row level security;

-- Market name/city/state/status are shown on the public "Check your market"
-- page, so anyone can read them. Low sensitivity, no auth required.
drop policy if exists "markets_select_public" on public.markets;
create policy "markets_select_public" on public.markets
  for select
  using (true);

-- Only platform admins can create/edit markets. Reuses is_platform_admin()
-- from 20260720000000_admin_and_applications.sql.
drop policy if exists "markets_insert_admin" on public.markets;
create policy "markets_insert_admin" on public.markets
  for insert
  with check (public.is_platform_admin());

drop policy if exists "markets_update_admin" on public.markets;
create policy "markets_update_admin" on public.markets
  for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
