-- TreadFlow: Invoices/quotes
--
-- Same rules as prior migrations: review and run yourself.

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  doc_type text not null default 'Invoice', -- 'Invoice' | 'Quote'
  status text not null default 'Draft', -- 'Draft' | 'Sent' | 'Paid' | 'Void'
  customer_name text not null,
  customer_email text,
  customer_phone text,
  line_items jsonb not null default '[]'::jsonb, -- [{ description, quantity, unit_price }]
  subtotal numeric not null default 0,
  tax_rate numeric not null default 0,
  tax_amount numeric not null default 0,
  total numeric not null default 0,
  notes text,
  due_date date,
  created_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

drop policy if exists "invoices_all_owner" on public.invoices;
create policy "invoices_all_owner" on public.invoices
  for all
  using (shop_id in (select id from public.shops where user_id = auth.uid()))
  with check (shop_id in (select id from public.shops where user_id = auth.uid()));

-- Reuses is_shop_staff() from 20260720000001_staff_management.sql, matching
-- the same access shop_staff already has to orders/customers/appointments.
drop policy if exists "invoices_all_staff" on public.invoices;
create policy "invoices_all_staff" on public.invoices
  for all
  using (public.is_shop_staff(shop_id))
  with check (public.is_shop_staff(shop_id));
