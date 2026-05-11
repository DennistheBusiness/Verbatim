# Verbatim Revenue Plan

**Status:** Phase 1 implemented — foundations complete  
**Last Updated:** May 10, 2026

---

## Overview

Verbatim uses a freemium-trial + subscription model with three payment paths:

| Platform | Processor | Notes |
|---|---|---|
| Web | Stripe | Checkout + Customer Portal |
| iOS | RevenueCat → App Store IAP | Not yet implemented |
| Android | RevenueCat → Google Play IAP | Not yet implemented |

---

## Roles

| Role | Access | How Assigned |
|---|---|---|
| `general` | Full app, standard features (flashcards, etc.) | Default after trial |
| `student` | Same as general, 60-day trial via student code | Student code redemption |
| `vip` | Same as general + VIP features | Admin-assigned |
| `admin` | All features, no paywall, all admin tools | Admin-assigned |

---

## Plans

| Plan | Price | Notes |
|---|---|---|
| Monthly | $7/month | Cancel anytime |
| Annual | $60/year (advertised $5/mo) | Most popular |
| 3-Year | $100 one-time | Web-only if Apple/Google reject |
| Free | $0 | Admin-granted only, never advertised |
| Student Trial | $0 for 60 days | Via master code or admin-created codes |

---

## Trial

- **All new users:** 7-day free trial, no credit card required
- **Trigger:** `set_trial_on_signup` DB trigger sets `trial_ends_at = NOW() + 7 days`
- **Student code extension:** Extends to 60 days, sets `user_role = 'student'`
- **After trial:** Middleware redirects to `/subscribe` paywall

---

## Feature Flags at Launch

| Flag | Access | UI Exposed | Notes |
|---|---|---|---|
| `flashcards` | general | ✅ | Standard test mode |
| `pdfImport` | vip | ❌ | Works, just not shown in UI |
| `aiImageGeneration` | vip | ❌ | Not built yet, Coming Soon in admin |

---

## DB Schema

Billing columns added to `profiles`:

```sql
plan_type           TEXT  DEFAULT 'none'      -- none | monthly | annual | three_year | free
subscription_status TEXT  DEFAULT 'trialing'  -- trialing | active | past_due | canceled | paused
trial_ends_at       TIMESTAMPTZ               -- set automatically on signup
plan_expires_at     TIMESTAMPTZ               -- for annual/3-year plans
revenuecat_id       TEXT                      -- for mobile IAP
stripe_customer_id  TEXT                      -- for web billing
```

New table:

```sql
student_codes (id, code, max_uses, use_count, created_by, created_at, expires_at)
```

Migration file: `supabase-migration-billing.sql`

---

## Architecture

### Web (Stripe)

1. User clicks "Choose plan" on `/pricing` or `/subscribe`
2. `POST /api/billing/create-checkout` creates a Stripe Checkout session
3. User completes payment on Stripe-hosted page
4. Stripe fires `checkout.session.completed` → `POST /api/billing/webhook`
5. Webhook updates `profiles` with `stripe_customer_id`, `plan_type`, `subscription_status = 'active'`
6. Middleware allows access on next request

**TODO:** Install `stripe` package and configure env vars:
```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_ANNUAL_PRICE_ID=price_...
STRIPE_THREE_YEAR_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_THREE_YEAR_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=https://app.verbatim.com
```

### Mobile (RevenueCat)

**TODO:** Install `@revenuecat/purchases-capacitor` and implement:

```
- Configure RevenueCat dashboard (App Store + Google Play products)
- Initialize Purchases in app init (Capacitor)
- Add RevenueCat webhook: POST /api/revenuecat/webhook
- Map RC entitlements → profiles.subscription_status
```

---

## Student Code Flow

1. Admin creates code in Admin Panel → Student Codes tab
2. Code format: `VERB-XXXX-XXXX` (auto-generated)
3. User enters code on Plan Selection screen during onboarding
4. `POST /api/billing/redeem-student-code` validates code and extends trial to 60 days
5. Master code: `STUDENT_MASTER_CODE` env var (no DB entry, unlimited use)

---

## Middleware Paywall Gate

Protected routes check billing status on every request:

```
admin → always pass
planType === 'free' → always pass
status === 'active' → pass
status === 'trialing' AND trial_ends_at > now() → pass
otherwise → redirect to /subscribe
```

---

## Pages

| Path | Status |
|---|---|
| `/pricing` | ✅ Built |
| `/subscribe` | ✅ Built |
| `/billing/success` | TODO |
| `/account` → billing section | TODO |

---

## Admin Panel Extensions

- **Users tab:** Role dropdown now includes `student`, billing info displayed
- **Student Codes tab:** Create/revoke codes, see use counts
- **API routes added:**
  - `GET/POST /api/admin/student-codes`
  - `DELETE /api/admin/student-codes/[codeId]`

---

## Implementation Checklist

### Phase 1 — Foundations ✅ (complete)
- [x] DB migration (`supabase-migration-billing.sql`)
- [x] `lib/feature-flags.ts` — feature definitions
- [x] `lib/entitlements.ts` — entitlement resolution
- [x] `hooks/use-entitlements.ts` — React hook 
- [x] Updated `lib/supabase/types.ts` with billing columns + student_codes table
- [x] Middleware paywall gate
- [x] `/pricing` page
- [x] `/subscribe` paywall page
- [x] Plan selection step in onboarding (step 3)
- [x] Student code input in onboarding
- [x] `POST /api/billing/redeem-student-code`
- [x] `POST /api/billing/create-checkout` (Stripe stub — needs env vars)
- [x] `POST /api/billing/portal` (Stripe stub)
- [x] `POST /api/billing/webhook` (Stripe stub)
- [x] `GET/POST /api/admin/student-codes`
- [x] `DELETE /api/admin/student-codes/[codeId]`
- [x] Admin panel Student Codes tab
- [x] Admin panel student role + billing columns in user list
- [x] Navigation menu Pricing link

### Phase 2 — Stripe Integration (next)
- [ ] `pnpm add stripe`
- [ ] Uncomment Stripe code in `create-checkout/route.ts`, `portal/route.ts`, `webhook/route.ts`
- [ ] Configure Stripe dashboard (products + prices + webhook endpoint)
- [ ] Add all `STRIPE_*` env vars to Vercel
- [ ] `/billing/success` page
- [ ] Test end-to-end web payment flow

### Phase 3 — RevenueCat (mobile, after Stripe works)
- [ ] `pnpm add @revenuecat/purchases-capacitor`
- [ ] `POST /api/revenuecat/webhook`
- [ ] Configure RC dashboard with App Store + Google Play products
- [ ] Initialize RC in Capacitor app init

### Phase 4 — Account Billing Management
- [ ] Billing section in `/account` — show current plan, trial days remaining
- [ ] "Manage subscription" button → Stripe Customer Portal
- [ ] Past-due banner in app header

### Phase 5 — VIP Features
- [ ] Expose PDF Import in create UI (behind `canUse('pdfImport')` gate)
- [ ] Build AI Image Generation feature
