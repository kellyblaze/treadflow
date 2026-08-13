# TreadFlow

Invite-only SaaS platform for tire shops: a branded public storefront with
searchable inventory, online reservations/deposits, appointment and mobile-
service booking, plus a full shop-owner dashboard (inventory, orders, POS,
invoicing/quotes, staff, customers, promotions, analytics, multi-location)
and a Super Admin console for the platform operator.

## Tech stack

- **Frontend**: React 19 + Vite 8, single-page app, manual state-based
  routing (no React Router) — see `src/App.jsx`. `src/helpers.js` holds the
  pure/testable logic split out of that file.
- **Backend**: Supabase — Postgres, Auth, Storage (`shop-gallery` bucket),
  and one Edge Function (`supabase/functions/send-email`) that sends
  transactional email via Resend.
- **Serverless API** (`api/*.js`, deployed as Vercel Functions): Stripe
  billing (Checkout Sessions + webhook), Twilio SMS, and Claude-powered
  voice-to-text tire entry.
- **Payments**: Stripe (subscriptions for shop billing).
- **Tests**: Vitest + React Testing Library.

## Getting started

```bash
npm install
cp .env.example .env   # see below — fill in real values
npm run dev
```

The dev server only serves the frontend. The `api/*.js` functions are
Vercel Functions and don't run under plain `vite dev` — use `vercel dev`,
or just deploy to Vercel and test there, to exercise Stripe webhooks, SMS,
voice-to-text parsing, or the checkout-session endpoint locally.

## Environment variables

### Client-side (`.env`, read at build time via `import.meta.env`)

| Variable | Used for |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/publishable key |

> **Note:** the code reads `VITE_SUPABASE_ANON_KEY` specifically
> (`src/supabase.js`) — if your `.env` has `VITE_SUPABASE_KEY` instead, the
> app silently falls back to a hardcoded key baked into `src/supabase.js`
> rather than reading your `.env` at all. Rename the key if that's not
> what you intend.

### Server-side (set in your Vercel project's environment variables — not read from `.env` in production)

| Variable | Used by | Purpose |
|---|---|---|
| `SUPABASE_URL` | `api/webhook.js` | Falls back to `VITE_SUPABASE_URL` if unset |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/webhook.js` | Elevated access to write shop status from webhook events |
| `STRIPE_SECRET_KEY` | `api/webhook.js`, `api/create-checkout-session.js` | Stripe API access |
| `STRIPE_WEBHOOK_SECRET` | `api/webhook.js` | Verifies incoming Stripe webhook signatures |
| `STRIPE_PRICE_EARLY_PARTNER` | `api/webhook.js`, `api/create-checkout-session.js` | Stripe Price ID for the $149/mo plan |
| `STRIPE_PRICE_GROWTH_PARTNER` | same | Stripe Price ID for the $249/mo plan |
| `STRIPE_PRICE_MARKET_LEADER` | same | Stripe Price ID for the $399/mo plan |
| `ANTHROPIC_API_KEY` | `api/parse-tire.js` | Voice-to-text tire entry parsing |
| `TWILIO_ACCOUNT_SID` | `api/send-sms.js` | Twilio SMS |
| `TWILIO_AUTH_TOKEN` | `api/send-sms.js` | Twilio SMS |
| `TWILIO_PHONE_NUMBER` | `api/send-sms.js` | Twilio SMS sender number |

The three `STRIPE_PRICE_*` variables aren't optional extras — real Stripe
Price objects need to exist and be set here before checkout works at all
(see `api/create-checkout-session.js`).

### Supabase Edge Function secret (set via `supabase secrets set`, not in this repo)

| Variable | Used by | Purpose |
|---|---|---|
| `RESEND_API_KEY` | `supabase/functions/send-email` | Sends all transactional email (order confirmations, invites, receipts, etc.) |

## Database

The schema is managed as SQL migrations in `supabase/migrations/`. **Read
`supabase/README.md` before touching the database** — it explains that the
tables predating this migration folder (`shops`, `tires`, `orders`, etc.)
still need a one-time `supabase db pull` to capture their real definitions,
since nothing in this repo has ever had that command run against it.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

## Project structure

```
src/App.jsx        Entry component tree — every page/dashboard section lives here
src/helpers.js      Pure, independently-tested logic (payload builders, formatters, plan pricing)
src/email.js        Email templates + the sendEmail() call to the Supabase Edge Function
src/supabase.js     Supabase client
src/__tests__/       Vitest unit tests
api/                Vercel serverless functions (Stripe, Twilio, Claude)
api/__tests__/       Vitest tests for the API functions
supabase/migrations/ Versioned schema changes (see supabase/README.md)
supabase/functions/  Supabase Edge Functions
```

## Deployment

Deployed on Vercel (`vercel.json` rewrites all routes to `index.html` for
the SPA, with an explicit rule for `/sms-terms`). Set the server-side env
vars above in the Vercel project settings, and point the Stripe webhook at
`/api/webhook` in your Stripe Dashboard.

## Status

This app went through a full audit-and-build pass covering: real data
wiring for the Super Admin dashboard, staff invites/roles, markets
management, platform settings, hardened Stripe billing, invoicing/quotes,
an in-dashboard POS (records in-person sales; doesn't process card charges
itself), password reset, versioned migrations, multi-location support, and
this test suite. Known open items, in rough priority order:

- **Shop creation after signup is unverified.** No code anywhere creates a
  `shops` row after the invite → approve → signup flow completes — see the
  spawned investigation task from this session, or check for a Postgres
  trigger / manual provisioning step in your Supabase project.
- **The landing-page pricing checkout bypasses the invite-only funnel** —
  a visitor can pay before ever being invited, and that payment doesn't
  create or link to a shop record. Deliberately left as-is (a product
  decision, not a bug) while hardening the billing mechanics underneath it.
- Real Stripe Price IDs need to be created and set as env vars for
  checkout to function (see above).
- Migrations in `supabase/migrations/` need to be run against the live
  project; several features (Super Admin, staff, markets, invoicing, POS,
  multi-location) won't work until they are.
