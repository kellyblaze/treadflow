-- TreadFlow: Shop-owner invite acceptance (the missing piece)
--
-- Same rules as prior migrations: review and run yourself.
--
-- Confirmed this session: no code path anywhere — client or database — ever
-- creates a `shops` row after a shop owner completes the real invite -> sign
-- up flow (SignUpPage). There's no trigger on auth.users (checked pg_trigger
-- directly on the live project — only Supabase's own storage/realtime
-- triggers exist), no RPC, nothing. A real approved applicant who signs up
-- ends up with a working auth.users row and an otherwise dead account (the
-- "Shop not found" screen). This mirrors the existing staff-invite pattern
-- (validate_staff_invite / accept_staff_invite from
-- 20260720000001_staff_management.sql) for shop owners instead: a
-- SECURITY DEFINER RPC so invite_codes doesn't need a client-writable
-- UPDATE policy just for this.

create or replace function public.accept_shop_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invite_codes%rowtype;
  v_app public.applications%rowtype;
  v_shop_id uuid;
  v_base_slug text;
  v_slug text;
  v_user_email text;
begin
  -- invite_codes is publicly readable (validateInviteCode looks codes up
  -- before the user is authenticated), so without this check an anonymous
  -- caller could burn a real customer's invite by hitting this RPC directly
  -- — auth.uid() would be null, the "does this user already have a shop"
  -- check below would silently pass (comparing to null), and the code
  -- would get marked used with no account ever attached to it.
  if auth.uid() is null then
    raise exception 'You must be signed in to accept an invite.';
  end if;

  select * into v_invite
  from public.invite_codes
  where code = p_code
    and used_at is null
    and (is_active is distinct from false)
    and (status is null or lower(status) = 'active')
    and (expires_at is null or expires_at > now());

  if v_invite.id is null then
    raise exception 'Invalid, expired, or already-used invite code.';
  end if;

  -- Idempotent: if this user already has a shop (retried after a partial
  -- client-side failure, or double-submitted), just mark the code used and
  -- hand back their existing shop rather than creating a duplicate.
  select id into v_shop_id from public.shops where user_id = auth.uid() limit 1;
  if v_shop_id is not null then
    update public.invite_codes set used_at = now() where id = v_invite.id;
    return v_shop_id;
  end if;

  if v_invite.application_id is not null then
    select * into v_app from public.applications where id = v_invite.application_id;
  end if;

  select email into v_user_email from auth.users where id = auth.uid();

  v_base_slug := trim(both '-' from lower(regexp_replace(coalesce(v_invite.shop_name, v_app.shop_name, 'shop'), '[^a-zA-Z0-9]+', '-', 'g')));
  if v_base_slug = '' then v_base_slug := 'shop'; end if;
  v_slug := v_base_slug;
  while exists (select 1 from public.shops where slug = v_slug) loop
    v_slug := v_base_slug || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  insert into public.shops (user_id, name, owner_name, email, phone, city, state, slug, plan, status)
  values (
    auth.uid(),
    coalesce(v_invite.shop_name, v_app.shop_name, 'My Shop'),
    v_app.owner_name,
    coalesce(v_invite.email, v_app.email, v_user_email),
    v_app.phone,
    v_app.city,
    v_app.state,
    v_slug,
    coalesce(v_invite.plan, v_app.plan_interest, 'Early Partner'),
    'Active'
  )
  returning id into v_shop_id;

  update public.invite_codes set used_at = now() where id = v_invite.id;

  return v_shop_id;
end;
$$;

revoke execute on function public.accept_shop_invite(text) from public;
grant execute on function public.accept_shop_invite(text) to authenticated;
