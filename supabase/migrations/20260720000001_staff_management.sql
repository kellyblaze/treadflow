-- TreadFlow: Real staff management (invites, roles, shop access)
--
-- Same rules as 20260720000000_admin_and_applications.sql: review and run this
-- yourself (SQL Editor or `supabase db push`), Claude has no DB credentials
-- here. Additive only — new table, new RPCs, and new permissive SELECT/
-- INSERT/UPDATE policies on existing shop-owned tables. Existing owner-scoped
-- policies are untouched; Postgres OR's multiple permissive policies together.
--
-- Design note: unlike the public applications form, staff invite codes are
-- NOT exposed via an open SELECT policy on the table (that pattern is fine
-- for the low-stakes applications intake, but staff rows carry emails/names
-- you don't want scraped by anyone who can enumerate rows). Instead,
-- validating and accepting an invite goes through two SECURITY DEFINER RPCs
-- that only ever return/mutate the one row matching the exact code.

-- ── 1. Shop staff table ─────────────────────────────────────────────────────
create table if not exists public.shop_staff (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  role text not null default 'Inventory Staff',
  status text not null default 'Invited',
  invite_code text unique,
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.shop_staff enable row level security;

-- Shop owners manage staff on their own shop(s).
drop policy if exists "shop_staff_all_owner" on public.shop_staff;
create policy "shop_staff_all_owner" on public.shop_staff
  for all
  using (shop_id in (select id from public.shops where user_id = auth.uid()))
  with check (shop_id in (select id from public.shops where user_id = auth.uid()));

-- Staff can see their own membership row (e.g. to know their own role).
drop policy if exists "shop_staff_select_self" on public.shop_staff;
create policy "shop_staff_select_self" on public.shop_staff
  for select
  using (user_id = auth.uid());

-- ── 2. Helper: is the current user active staff on a given shop? ───────────
create or replace function public.is_shop_staff(p_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.shop_staff
    where shop_id = p_shop_id and user_id = auth.uid() and status = 'Active'
  );
$$;

-- ── 3. Staff invite validation (public, unauthenticated) ────────────────────
create or replace function public.validate_staff_invite(p_code text)
returns table (shop_id uuid, shop_name text, name text, email text, role text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
    select ss.shop_id, s.name, ss.name, ss.email, ss.role
    from public.shop_staff ss
    join public.shops s on s.id = ss.shop_id
    where ss.invite_code = p_code
      and ss.status = 'Invited';
end;
$$;

grant execute on function public.validate_staff_invite(text) to anon, authenticated;

-- ── 4. Staff invite acceptance (authenticated — links the new auth user) ──
create or replace function public.accept_staff_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
begin
  update public.shop_staff
  set user_id = auth.uid(), status = 'Active', joined_at = now(), invite_code = null
  where invite_code = p_code and status = 'Invited'
  returning shop_id into v_shop_id;

  if v_shop_id is null then
    raise exception 'Invalid or already-used invite code.';
  end if;

  return v_shop_id;
end;
$$;

grant execute on function public.accept_staff_invite(text) to authenticated;

-- ── 5. Staff read/write access to shop-owned tables ─────────────────────────
-- Staff need at least SELECT on shops (so the dashboard shop-lookup finds
-- their shop, not just the owner's). Read/write on tires/orders/customers/
-- appointments/promotions so day-to-day work is actually possible; the app's
-- UI is responsible for hiding sections a given role shouldn't use (e.g. only
-- Owner/Manager see Settings/Billing) — RLS here is deliberately role-coarse
-- (any active staff row = access), matching what the UI currently models.
drop policy if exists "shops_select_staff" on public.shops;
create policy "shops_select_staff" on public.shops
  for select
  using (public.is_shop_staff(id));

drop policy if exists "tires_all_staff" on public.tires;
create policy "tires_all_staff" on public.tires
  for all
  using (public.is_shop_staff(shop_id))
  with check (public.is_shop_staff(shop_id));

drop policy if exists "orders_all_staff" on public.orders;
create policy "orders_all_staff" on public.orders
  for all
  using (public.is_shop_staff(shop_id))
  with check (public.is_shop_staff(shop_id));

drop policy if exists "customers_all_staff" on public.customers;
create policy "customers_all_staff" on public.customers
  for all
  using (public.is_shop_staff(shop_id))
  with check (public.is_shop_staff(shop_id));

drop policy if exists "appointments_all_staff" on public.appointments;
create policy "appointments_all_staff" on public.appointments
  for all
  using (public.is_shop_staff(shop_id))
  with check (public.is_shop_staff(shop_id));

drop policy if exists "promotions_all_staff" on public.promotions;
create policy "promotions_all_staff" on public.promotions
  for all
  using (public.is_shop_staff(shop_id))
  with check (public.is_shop_staff(shop_id));
