-- TreadFlow: Stripe billing hardening support
--
-- Same rules as prior migrations: review and run yourself.
-- Adds columns needed to match webhook events by Stripe customer ID instead
-- of email (email matching breaks if a shop changes its email; customer ID
-- doesn't). ADD COLUMN IF NOT EXISTS so this is safe regardless of current
-- shops schema.

alter table public.shops
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create unique index if not exists shops_stripe_customer_id_key
  on public.shops (stripe_customer_id)
  where stripe_customer_id is not null;
