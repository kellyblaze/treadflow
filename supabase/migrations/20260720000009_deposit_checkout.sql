-- TreadFlow: Real deposit checkout support
--
-- Same rules as prior migrations: review and run yourself.
--
-- The Shop Settings "Deposit Amount" field already existed in the UI but
-- was never wired to anything — this gives it somewhere real to save.
-- Server-side deposit-checkout code reads this value directly (never
-- trusts a client-supplied amount), so it also has to be a real column.

alter table public.shops
  add column if not exists deposit_amount numeric not null default 50;
