-- TreadFlow: per-shop storefront visual theme
--
-- Lets each shop pick a visual identity for its public storefront from a
-- fixed set defined client-side (STOREFRONT_THEMES in src/helpers.js).
-- "classic" is the default and reproduces the storefront's original look
-- exactly, so existing shops are unaffected until an owner picks something
-- else in Shop Settings > Storefront Theme.
--
-- Same rules as prior migrations: review and run yourself.

alter table public.shops
  add column if not exists storefront_theme text not null default 'classic';
