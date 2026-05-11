# Verbatim Revenue Plan

**Status:** Pre-implementation planning document  
**Owner:** Dennis  
**Goal:** Ship a complete billing system before launch — web (Stripe) + mobile (RevenueCat) + feature gating + pricing page + onboarding plan selection

---

## Does RevenueCat Satisfy All Requirements?

**Yes, with one addition (Stripe for web).** Here's why:

| Platform | Tool | Why |
|---|---|---|
| iOS subscriptions | RevenueCat | Required by Apple — must use StoreKit. RevenueCat wraps it. |
| Android subscriptions | RevenueCat | Required by Google — must use Play Billing. RevenueCat wraps it. |
| Web subscriptions | Stripe | RevenueCat supports Stripe as a backend, giving unified entitlement checking across all platforms. |
| Entitlement checks (feature gating) | RevenueCat SDK | Single SDK call tells you what a user is entitled to, regardless of where they subscribed. |
| Trial management | RevenueCat | Handles 7-day trial natively via product configuration. |
| Capacitor | RevenueCat | `@revenuecat/purchases-capacitor` is the official Capacitor plugin — fully supported. |

**Short answer: RevenueCat + Stripe = full stack.** RevenueCat unifies entitlement state across iOS, Android, and web into a single API. You do not maintain separate subscription logic per platform.

---

## Roles

| Role | Description | How Assigned |
|---|---|---|
| `admin` | Full admin panel access, bypasses all limits | SQL directly or admin panel UI |
| `general` | Standard user — default on signup | Auto-assigned on profile creation |
| `vip` | Early access to new features before general release | Admin grants in admin panel |
| `student` | 60-day free trial, then normal plan choice | Via student promo code or student signup page |

Roles stored in `profiles.user_role`. No column name change needed — just extend the valid value set.

---

## Membership / Plan Types

| Plan | Price | Billing | Advertised |
|---|---|---|---|
| **Monthly** | $7/month | Monthly recurring | Yes — pricing page |
| **Annual** | $60/year ($5/month) | Annual recurring | Yes — **primary advertised plan** |
| **3-Year** | $100 / 3 years | 3-year recurring | Yes — pricing page |
| **Free** | $0 | None | **Never** — admin-granted only |
| *(Student trial)* | $0 for 60 days | None during trial | **Never** — not on site |

### Messaging Rule
> Always frame Annual as **"$5/month"** — never "$60/year" as the primary figure.
> Headline: *"Get full access for just $5/month when you pay annually."*

### What Justifies the Price (copy foundation)
Always emphasize in pricing messaging:
- **AI transcription** — Groq-powered voice-to-text
- **Text-to-speech** — high-quality AI audio for any set
- **Image-to-text** — photograph scripture, scripts, sheet music, notes
- **Cloud storage** — audio files, transcripts, progress history
- **Spaced repetition** — algorithm-driven review scheduling
- **Advanced users** — AI features are rate-limited; power users may access additional credits *(infrastructure ready — don't surface credit model yet)*

---

## Trial Logic

### Standard Trial (all new signups)
- **7 days free** — full access, no credit card required at signup
- After 7 days: plan selection wall — must choose Annual, Monthly, or 3-Year to continue
- Trial acknowledged in the final step of account creation

### Student Trial
- **60 days free** — full access
- Triggered by: promo code at signup OR dedicated `/auth/student-signup` page
- After 60 days: same plan selection wall (Annual, Monthly, 3-Year)
- `student` role is assigned to the profile — the trial period is longer, the plans afterward are identical
- **Never mentioned on the public pricing page or main site**

### Free Membership
- No expiration
- Applied by admin manually (SQL or admin panel Grant Free button)
- **Never advertised or shown on pricing page**

---

## Feature Gating

A lightweight config-driven system. Admin changes one line to promote a feature from VIP-only to general release — no database migration, no deploy pipeline.

```typescript
// lib/feature-flags.ts
export const FEATURE_FLAGS = {
  advancedAnalytics:     { access: "vip" },
  betaExport:            { access: "vip" },
  newSortingAlgorithm:   { access: "vip" },
  flashcards:            { access: "general" },  // all paid users
} as const

export type FeatureFlag = keyof typeof FEATURE_FLAGS
export type FeatureAccess = "vip" | "general" | "hidden"



