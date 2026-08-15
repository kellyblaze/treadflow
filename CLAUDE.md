# TreadFlow — session continuity notes

Read this before re-deriving anything from git history or past conversation.
It's the running state of the project across sessions — not user-facing
docs (that's [README.md](README.md)). **Update the "Change log" section
below every time a change is made**, newest entry first; keep the rest of
the file in sync with reality rather than letting it drift.

## Live infrastructure

| What | Value |
|---|---|
| GitHub repo | `kellyblaze/treadflow`, default branch `main` |
| Production URL | `https://www.treadflow.cc` (aliases: `treadflow.cc`, `treadflow.vercel.app`) |
| Vercel project | `treadflow` under team `powerlink-marketing-groups-projects` |
| Vercel deploys | Auto-deploys on push/merge to `main` via GitHub integration. Manual `vercel --prod` from this CLI session returns "Not authorized" (needs `--scope powerlink-marketing-groups-projects`) — usually irrelevant since merging to `main` deploys automatically anyway. |
| Supabase project | ref `uuivxrphoviaqehhpxdy`, org `mhwkxpyazswbrylzrxpb`, region us-east-2, under account `info@treadflow.cc` — **always confirm with `list_projects` before running any migration**; a differently-named project ("EverBranch") has shown up connected in this environment before. |
| Platform admin | `kellyblazeent@gmail.com` is the first (and currently only) `platform_admins` row, granted via manual SQL after self-registering through the real signup flow. |
| Migrations | Every file in `supabase/migrations/` has been applied to the live project, through `20260720000010_shop_owner_invite_acceptance.sql`. Apply new ones with the Supabase MCP `apply_migration` tool, not raw `psql`. |

## What's actually built vs. what just looks built

Full audit history and setup docs are in [README.md](README.md). The
pricing page (`src/App.jsx`, `Storefront`) advertises 17 features across 3
tiers — confirmed status of the ones that were in doubt:

- ✅ Real: promotions & coupons, advanced reporting/analytics,
  multi-location, CSV inventory upload, staff accounts, SMS notifications,
  appointment booking, online deposits/payments (Stripe Checkout Session,
  webhook-verified).
- ✅ Real (as of this session): plan-tier gating — `planHasFeature()` in
  `src/helpers.js` enforces which of the above a shop's plan actually
  includes, everywhere they're used.
- ✅ Removed (as of this session): **AI chatbot** — was never real AI
  (`sendChat()` in `Storefront` was a hardcoded keyword-matcher, and not
  even shop-specific — every shop showed a widget hardcoded to
  "Greenville Tire Chat"/a demo phone number). Decision was to rip out
  the fake widget and the pricing claim rather than build a real one —
  no chatbot ships today on any plan. See change log.
- ❌ **Custom domain support** — still doesn't exist anywhere in the
  codebase. As of this session the pricing page no longer claims
  otherwise (see change log) — this line now just tracks that the
  underlying feature remains unbuilt, not a false-advertising bug.
- ✅ Real (as of this session): **shop creation after signup** — was
  confirmed broken (no code path, client or database, ever created a
  `shops` row after invite → approve → signup), now fixed via
  `accept_shop_invite()`, see change log.
- ✅ Fixed (as of this session): **landing-page checkout bypassing the
  invite-only funnel** — re-investigated; this wasn't just a soft
  funnel-skip as previously logged, it was an active billing bug: a
  stranger could pay a real recurring Stripe subscription with zero
  confirmation and zero shop/account ever created (the webhook no-ops
  when it can't match an existing `shops` row). Confirmed unintended
  with the user; "Get Started" now routes to the invite-application
  form instead of Stripe Checkout. See change log.
- ⚠️ Real Stripe Price IDs for the 3 plans (`STRIPE_PRICE_EARLY_PARTNER`
  etc.) — status not reconfirmed this session; see README's env var table.

## Environment constraints worth remembering

- Cannot log in to the app or complete a real Stripe payment from this
  environment (credential/payment rules) — live verification of anything
  behind auth or requiring a real charge is limited to code review, build/
  test/lint, and unauthenticated-route checks via the Browser tools.
- `src/App.jsx` carries a large **pre-existing** ESLint baseline (~35
  problems, mostly `react-hooks/set-state-in-effect` and
  `react-hooks/immutability`) predating any of this session's work.
  Verify changes by diffing the error count against `main`, not by
  expecting a clean `npx eslint` pass.
- `api/*.js` files all show `no-undef` for `process`/`Buffer` — a
  pre-existing ESLint config gap (Node globals unconfigured for that
  directory), not a real issue. Confirmed on unmodified files too.
- Workflow used all session: branch off `main` → commit → `gh pr create`
  → `gh pr merge --merge --delete-branch` → (if schema changed) apply
  migration via Supabase MCP → Vercel auto-deploys.

## Change log

### 2026-08-15 — Disabled the landing-page checkout bypass
Re-investigated the "landing-page checkout bypasses invite funnel" item
flagged (but left as-is) in an earlier session, at the user's request to
confirm whether it was intended. It wasn't just a funnel-skip: the public
pricing page's "Get Started" buttons created a real Stripe subscription
Checkout Session for anyone, invited or not
(`/api/create-checkout-session`). On success Stripe redirected to
`/?checkout_success=true`, which the app never handled anywhere — no
confirmation, no next steps. The `checkout.session.completed` webhook
looks up a `shops` row by `stripe_customer_id`/email to apply the
update; a brand-new payer with no invited account matches nothing, so
`applyShopUpdate` silently no-ops. Net effect: a stranger could be
charged a real recurring subscription and get nothing — no account, no
shop, no error, no automated recovery path. Presented the finding to the
user, who confirmed this was unintended and chose to disable public
checkout entirely. Fix: "Get Started" buttons now call `nav("invite")`
instead of `startCheckout()`, routing to the invite-application form —
matches the pricing section's own existing copy ("Plans are assigned
after your application is reviewed and approved"). Removed the dead
`startCheckout()`/`checkoutLoadingPlan` state and the unused
module-level `redirectTo()` helper. Left `api/create-checkout-session.js`
in place (unreachable from the UI now, but harmless — reusable if a real
post-approval self-serve billing flow is ever built; today
`ShopBilling`/Settings > Billing is read-only, plan is set manually by a
super admin on approval). Build clean, lint baseline unchanged (36), all
54 tests pass. Not yet merged to `main` (open on
`claude/next-build-tasks-bypuec`, no PR opened per instructions not to
open one unless asked).

### 2026-08-15 — Removed the fake AI chatbot instead of building it
Decision: rip out the "AI chatbot" claim rather than wire it to a real
LLM. Removed from `src/helpers.js` (Market Leader pricing bullet) and
from `src/App.jsx`: the storefront's floating chat widget
(`chatOpen`/`chatInput`/`chatMessages` state, `sendChat()`
keyword-matcher, and its JSX), plus the now-inert "Live Chatbot" toggle
in Shop Settings > Storefront Sections (nothing read
`storefrontSections.chatbot` once the widget was gone). The widget was
never real AI and wasn't even shop-specific — it showed "Greenville Tire
Chat" and a demo phone number on every shop's live storefront regardless
of which real shop was running it, so this was a live broken feature for
any real customer, not just a marketing overclaim. Left the "AI chatbot"
checkbox on the invite-application form (`InvitePage`) untouched — that's
an applicant interest survey, not a claim of an existing feature. Build
clean, lint baseline unchanged (36), all 54 tests pass. Not yet merged to
`main` (open on `claude/next-build-tasks-bypuec`, no PR opened per
instructions not to open one unless asked).

### 2026-08-15 — Stop advertising nonexistent custom domain support
Pricing-page FAQ claimed "Yes — custom domain support is available on the
Market Leader plan," and "Custom domain support" appeared as a Market
Leader bullet in `PLAN_TIER_DEFS` (`src/helpers.js`) — both false, no code
anywhere implements it (every storefront is served at
`treadflow.cc/shop/{slug}`). Rewrote the FAQ answer to say honestly that
it isn't available yet, and dropped the bullet. Not read by
`planHasFeature()` gating anywhere, so copy-only, no behavior change.
Building the real feature (DNS verification + Vercel Domains API) is
still open, tracked in the audit table above. Not yet merged to `main`
(open on `claude/next-build-tasks-bypuec`, no PR opened per instructions
not to open one unless asked).

### 2026-08-15 — Shop creation on signup was completely broken; fixed
Confirmed the open item from the audit: no code path anywhere — client or
database — ever created a `shops` row after a shop owner completed the
real invite → signup flow. Verified directly against the live project via
`pg_trigger` (no application-defined trigger on `auth.users`) and by
reading `SignUpPage.onSubmit` (only ever called `auth.signUp()`, nothing
else). Any real approved applicant who signed up got a working login and
a permanently dead account (the "Shop not found" screen) — this was the
single most important flow in the product and it silently didn't work.
Fix: new `accept_shop_invite(p_code)` SQL function mirroring the existing
`accept_staff_invite` pattern — creates the `shops` row (enriched from the
originating `applications` row when available), generates a unique slug,
marks the invite used, idempotent. Hardened with an `auth.uid() is null`
check and `revoke ... from public` before granting to `authenticated`
only — `invite_codes` has an open public SELECT policy, so without that
check an anonymous caller could have burned a real customer's invite code
with no account ever attached to it (caught and fixed before merge).
`SignUpPage` calls it when signup returns a live session; `LoginPage`
calls it on first login (the common path, since email confirmation is
normally required) — same as the existing staff-invite call site.
PR [#6](https://github.com/kellyblaze/treadflow/pull/6), merged, deployed.
Migration `20260720000010_shop_owner_invite_acceptance.sql` applied live.

### 2026-08-15 — Plan-tier feature gating
Added `planHasFeature(planName, featureName)` (cumulative tier check) to
`src/helpers.js`. Enforced it across the shop dashboard sidebar + section
render (Staff, Promotions, Analytics, Locations, Appointments — hidden and
guarded with a `PlanUpgradeGate` fallback), the CSV upload button, every
`sendSms()` call site, and the storefront's payment dropdown (deposit/
full-pay options only shown when the shop's plan includes them). Root
cause: only multi-location was ever actually checking `shop.plan` — every
other tier-exclusive feature was available to every shop for free.
No live shops existed yet, so no customer impact from shipping this.
PR [#4](https://github.com/kellyblaze/treadflow/pull/4), merged to `main`,
deployed. No new migration.

### 2026-08-14/15 — Real deposit Checkout Session
Replaced the client-trusted `?deposit_success=true` deposit flow (zero
server-side payment verification) with a real Stripe Checkout Session:
new `api/create-deposit-checkout.js` (prices server-side from the shop's
own `deposit_amount` or the order's own `total`, never from the client),
`api/webhook.js` extended to confirm the order and email the customer only
on a signed `checkout.session.completed` event. Also fixed "Pay in full
online" (previously did nothing) and wired the decorative Shop Settings
"Deposit Amount" field to a real `shops.deposit_amount` column.
PR [#3](https://github.com/kellyblaze/treadflow/pull/3), merged, deployed.
Migration `20260720000009_deposit_checkout.sql` applied to live DB.

### 2026-08-14 — Live deploy setup + `/admin` routing fix
Stood up a brand-new Supabase project (`uuivxrphoviaqehhpxdy`) after the
old one's login was lost; applied all 10 existing migrations; fixed
Vercel production env vars (`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`
were never set, so the client silently fell back to a hardcoded old
project baked into `src/supabase.js`); bootstrapped the first platform
admin account; found and fixed a bug where `/admin` had no working route
at all (the only `nav("admin")` call site was in dead, unrendered code).

### 2026-08-13 — Full audit remediation (14 items)
Root-level dead `App.jsx` duplicate removed; Super Admin dashboard wired
to real data; real staff invites/roles; real markets management; platform
settings persistence; hardened Stripe billing (real Checkout Sessions +
full webhook coverage); invoicing/quotes; in-dashboard POS; Google review
link; password reset UI; versioned Supabase migrations
(`supabase/migrations/`); multi-location support; test suite
(Vitest + RTL); real README. All merged to `main` via individual PRs.
