# TreadFlow Supabase schema

## Why this file exists

Until now, TreadFlow's database schema lived only in the live Supabase project
— nothing was checked into version control. If the project ref were lost, or
you needed to stand up a second environment (staging, a teammate's local
project), there was no record of the schema to rebuild from.

This directory now tracks schema changes as SQL migrations going forward
(`supabase/migrations/*.sql`, one file per task, all additive — see each
file's header comment). **What it does not natively contain is a verified
baseline capture of the tables that existed before this migration folder
did**: `shops`, `tires`, `orders`, `customers`, `appointments`,
`promotions`, `invite_codes`, `storefront_views`, `waitlist`, and the
`shop-gallery` storage bucket. Claude has no Supabase CLI, no project
credentials, and no outbound network access in the environment these
migrations were written in — so capturing the *real* current schema for
those tables is a step only you can do. Which path applies depends on
whether you still have access to the original project.

## If you still have access to the original project (ref `egaxolujduyhcomkbuum`)

Do this — it's authoritative, unlike anything else in this file:

```bash
# If you don't have the CLI: npm install -g supabase
supabase login
# Already linked (supabase/.temp shows a cached link to this project), but if not:
# supabase link --project-ref egaxolujduyhcomkbuum

# Pulls the live schema into a new migration file reflecting everything
# currently in the database that isn't yet represented in migration history:
supabase db pull
```

This writes a new timestamped migration under `supabase/migrations/`
containing the *actual* current definitions (types, constraints, indexes,
RLS policies) for every pre-existing table. Commit that file, and **delete
`20260719000000_foundational_schema.sql`** — it's a best-effort
reconstruction meant only as a fallback for a project where the real
schema is unreachable, and running both would fight over the same tables.

## If you're starting a brand-new, empty Supabase project instead

`20260719000000_foundational_schema.sql` is a from-scratch reconstruction
of those same base tables, built entirely from what the app code itself
was observed reading and writing — not a verified dump. Read its header
comment before running it; it explains exactly what's reconstructed vs.
genuinely unknown, and one known gap (platform-admin write access to
`invite_codes`, which can't be added until after `20260720000000` runs).

Its filename timestamp sorts before all the others on purpose — several
of them (`shop_staff`, `invoices`) have foreign keys into `shops`/`orders`
and will fail to apply if those tables don't exist yet.

## Apply the migrations

Ten migrations now live in this folder — the foundational one above (only
if starting from empty) plus nine written during this session's audit
work (`20260720000000` through `20260720000008`). Review each one, then
either paste it into the Supabase SQL editor or run:

```bash
supabase db push
```

Each file's header comment explains what it does and confirms it's additive
(new tables/columns/policies only — nothing here drops or alters existing
owner-scoped access), except the foundational one, which necessarily
creates the base tables from nothing.

## What's confirmed vs. unverified

The table below is **not a schema** — the executable version of this same
information is `20260719000000_foundational_schema.sql`. This table exists
to sanity-check the real `db pull` output against, once you have it: it's a
running list of columns this session directly observed the app code read
or write. Anything not listed here (types, defaults, constraints, indexes,
RLS policies, and any column the app never happened to touch) is genuinely
unknown from this side.

| Table | Columns observed in app code |
|---|---|
| `shops` | `id, name, owner_name, email, phone, city, state, status, plan, slug, user_id, mobile_service_enabled, mobile_service_radius, mobile_service_fee, mobile_service_hours_start, mobile_service_hours_end, hero_video_url, gallery_images, storefront_sections` (+ `stripe_customer_id, stripe_subscription_id, google_review_url` added this session) |
| `tires` | `id, shop_id, quantity, price` confirmed directly; brand/model/size/condition/etc. are read via `select("*")` so they exist, but exact column names weren't independently confirmed beyond what's in `tireFromSupabaseRow` |
| `orders` | `id, shop_id, tire_id, customer_name, customer_email, customer_phone, quantity, total, status, created_at, sms_consent, is_mobile, mobile_time_slot, mobile_date, service_address` |
| `customers` | `id, shop_id, name, phone, email, created_at` |
| `appointments` | `id, shop_id, customer_id, order_id, date, time, status, vehicle_info, notes, created_at` |
| `promotions` | `id, shop_id, title, discount_type, discount_value, applies_to, start_date, end_date, promo_code, active` |
| `invite_codes` | `code, status, expires_at, used_at, is_active` confirmed; `email, shop_name, plan, application_id` added this session |
| `storefront_views` | `id, shop_id, page, tire_id, created_at` |
| `waitlist` | `shop_id, tire_id, tire_name, email, created_at` |

## Going forward

Every schema change from here on should be a new file in this folder,
timestamped after the last one, following the same pattern: a short header
comment explaining what it does and confirming it's additive, then the SQL.
Run it against the live project the same way (SQL editor or `supabase db
push`), and commit the file alongside the app code that depends on it.
