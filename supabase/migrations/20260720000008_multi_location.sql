-- TreadFlow: Multi-location support
--
-- Same rules as prior migrations: review and run yourself.
--
-- No client code anywhere in this app currently inserts a row into `shops` —
-- shop creation after the invite/signup flow appears to happen outside the
-- app entirely (manually, or via a DB trigger not visible from the client
-- code). This migration adds the one thing needed for owners to create an
-- additional location under their own account: permission to insert a shops
-- row for themselves. It does not touch how the first shop gets created.

drop policy if exists "shops_insert_owner" on public.shops;
create policy "shops_insert_owner" on public.shops
  for insert
  with check (user_id = auth.uid());

-- Note: slugs are used in the public storefront URL (/shop/:slug/:tire) and
-- should be unique. Not adding a unique constraint here — if any duplicate
-- slugs already exist in your data (shop creation has apparently happened
-- outside app code, so this isn't guaranteed clean), a unique index would
-- fail to apply. The app checks for slug collisions before inserting a new
-- location; add `create unique index shops_slug_key on shops (slug);`
-- yourself once you've confirmed there are no existing duplicates.
