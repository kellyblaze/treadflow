-- TreadFlow: Google review link
--
-- Same rules as prior migrations: review and run yourself.

alter table public.shops
  add column if not exists google_review_url text;
