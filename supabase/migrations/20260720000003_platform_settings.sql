-- TreadFlow: Real platform settings (singleton row)
--
-- Same rules as prior migrations: review and run yourself.

create table if not exists public.platform_settings (
  id boolean primary key default true,
  platform_name text not null default 'TreadFlow',
  support_email text not null default 'support@treadflow.io',
  default_invite_expiry_days integer not null default 14,
  max_shops_per_market integer not null default 3,
  updated_at timestamptz not null default now(),
  constraint platform_settings_singleton check (id)
);

-- Seed the one settings row if it doesn't already exist.
insert into public.platform_settings (id) values (true)
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

drop policy if exists "platform_settings_select_admin" on public.platform_settings;
create policy "platform_settings_select_admin" on public.platform_settings
  for select
  using (public.is_platform_admin());

drop policy if exists "platform_settings_update_admin" on public.platform_settings;
create policy "platform_settings_update_admin" on public.platform_settings
  for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
