# Verbatim — Changelog
**Dates:** April 23–24, 2026
**PRs Merged:** #20 – #28

---

## April 24

### PR #28 — Audio Improvements (`audio-improvements`)

#### AI Transcription (Groq Whisper)
- New API route `app/api/transcribe/route.ts` — accepts a `multipart/form-data` audio upload, calls the Groq Whisper API, and returns a plain transcript plus word-level timestamps
- `voice-recorder.tsx` and `audio-test.tsx` now POST to `/api/transcribe` instead of using the browser's Web Speech API — improves accuracy significantly across all browsers
- `memorization-context.tsx` extended with `transcript` (string) and `transcriptWords` (array with start/end times) fields; `getAudioUrl()` added for signed URL caching
- `supabase-add-transcript.sql` — migration adds `transcript` (text) and `transcript_words` (jsonb) columns to `memorization_sets`
- `.env.local.example` updated with `GROQ_API_KEY`

#### Timed Audio Player (`components/timed-audio-player.tsx`) — new component
- Plays Supabase Storage audio with word-by-word highlighting driven by Groq timestamps
- Controls: play/pause, ±15s skip buttons, speed dropdown (0.5×–2×), scrub slider with live elapsed/total display, mute toggle
- Click any word in the transcript to seek to that position

#### TTS Player Upgrade (`components/text-to-speech-player.tsx`)
- Added voice picker — curated list capped at 5 best English voices across macOS, Windows, and Chrome (Samantha, Google US English, Microsoft Zira, Microsoft David, Alex)
- Added ±15s skip buttons, scrub slider with estimated elapsed/total time, mute toggle
- Click any word in the text to start playback from that point
- Speed change or voice change while playing restarts from current word

#### Today's session (uncommitted)
- Tightened `pickBestVoices()` threshold from `< 4` to `< 5` and added hard `.slice(0, 5)` cap — voice dropdown now always shows exactly 5 options (or fewer if the device has fewer available)

---

## April 23

### PR #27 — Example Set Seeding + Create/Edit Polish (`seed-example`)

#### Database
- `supabase-seed-example-set.sql` — `SECURITY DEFINER` trigger function seeds "Star Spangled Banner" (5 custom chunks) + "Sample" tag for every new user on `profiles` INSERT; includes idempotent backfill for existing accounts
- `supabase-delete-test-users.sql` — safe preview-then-delete script for removing test accounts and all cascaded data

#### Create page (`app/create/page.tsx`)
- Sticky save bar fixed to bottom; content padded to clear it
- Chunk selector always a 2×2 grid
- Tags: inline Plus icon replaces separate Add button
- Simplified live stats (words + chunk label only)
- Header title updated to "New Memorization"

#### Edit page (`app/edit/[id]/page.tsx`)
- Same sticky save/delete bar pattern as create page; Delete moved into bar (AlertDialog confirm preserved)
- Matching 2×2 chunk selector and inline tag Plus icon
- `COMMON_ABBREVIATIONS` list synced into sentence-mode parser

---

### PR #26 — Library Card Redesign (`library-UX`)

**File:** `app/page.tsx`, `components/loading-skeletons.tsx`

- Replaced flat progress bar + text preview with a 3-node step track (Read → Train → Test)
  - Filled + checkmark = complete; outlined ring = active; muted = upcoming
  - Left-border accent colour matches recommended step (blue / purple / emerald)
- Top-right action pill shows "Start Reading / Train / Take Test / Done ✓" in step colour
- "Last practiced" sourced from `sessionState.lastVisitedAt` (real practice timestamp, not `updatedAt`); shows "New" for untouched sets
- Best test score shown inline, colour-coded by threshold (green / amber / red)
- Mic indicator for voice-created or audio-attached sets
- Tags capped at 3 with `+N` overflow badge
- Entire card is the tap target (`onClick` + `cursor-pointer` + `touch-manipulation` on the `Card` element) for reliable mobile taps
- Skeleton updated to mirror new card structure exactly

---

### PR #25 — Familiarize UX + Session Header (`familiarize-step-updates`)

**Files:** `app/memorization/[id]/page.tsx`, `components/onboarding-tip.tsx`, `components/session-layout.tsx`

- Familiarize step now has a **landing view** (Read / Listen / Flashcards CTAs) and a separate **reader view** (Full Text / By Chunk) entered via "Start Reading" — users can exit back to landing without leaving the step
- Chunk mode selector in By Chunk view replaced with a clean `<Select>` dropdown ("Split by: Line / Paragraph / Sentence / Custom") — was a crowded 4-button group
- By-line chunking preview in create and edit pages normalises `\r\n` Windows line endings before splitting
- "Not Started" status badges and empty circle icons removed from step cards on the detail page
- `OnboardingTip` converted from a fixed bottom-right card to a `Dialog` modal — no longer blocks buttons on mobile
- `SessionLayout` header redesigned: back chevron · centred logo · hamburger nav, with a context strip below showing step indicator and set title

---

### PR #24 — Security Hardening (`security-updates`)

**Files:** `middleware.ts`, `lib/impersonation.ts`, `lib/memorization-context.tsx`, `lib/schemas.ts` *(new)*, `lib/sanitize.ts` *(new)*, `lib/supabase/service.ts` *(new)*, `app/api/admin/*` *(new)*, `app/admin/page.tsx`, `components/navigation-menu.tsx`

- **Server-side admin gate** — `middleware.ts` queries `profiles.user_role` before rendering any `/admin*` route; non-admins get a hard server redirect
- **Impersonation removed** — `lib/impersonation.ts` replaced with a no-op shim; all context queries now use `user.id` from the authenticated session; "Login As" replaced with "View Sets" via API route; dead UI removed from nav
- **Admin API routes** (service-role, never in client bundle):
  - `GET /api/admin/users` — list profiles
  - `GET /api/admin/stats` — aggregate counts
  - `GET /api/admin/users/[userId]/sets` — view any user's sets
  - `PATCH /api/admin/users/[userId]` — change role (Zod-validated)
  - `DELETE /api/admin/users/[userId]` — delete user + data + auth record
  - All routes call `requireAdmin()` — verifies session and `user_role` before touching the service client
- **Zod validation** (`lib/schemas.ts`) — `createSetSchema` / `updateSetSchema` applied before every DB write; invalid input surfaces a toast and returns early
- **XSS sanitization** (`lib/sanitize.ts`) — `sanitizeText()` (DOMPurify client / regex server) and `sanitizeTags()` applied to all user-supplied text before validation
- **File upload locks** — 50 MB size check + MIME allowlist (`audio/webm`, `audio/mp4`, `audio/mpeg`, `audio/ogg`, `audio/wav`) in `addSet()`, `updateSet()`, and `voice-recorder.tsx`

---

### PR #23 — Auth: Forgot/Reset Password + Session Handling (`forgot-pass-flow`)

**New files:** `app/auth/forgot-password/page.tsx`, `app/auth/reset-password/page.tsx`, `components/session-handler.tsx`, `supabase-migration-add-chunk-modes.sql`

- **Forgot password page** — email input → `resetPasswordForEmail()` → success confirmation screen
- **Reset password page** — verifies valid session from reset link; password + confirm fields with show/hide toggles; calls `updateUser({ password })`; signs out and redirects to login on success
- **SessionHandler** (`app/layout.tsx`) — global `onAuthStateChange` listener:
  - `PASSWORD_RECOVERY` → redirect to `/auth/reset-password`
  - `SIGNED_IN` → redirect to `/` only if on an auth page (excluding reset page)
  - `SIGNED_OUT` → redirect to `/auth/login`
  - Session validity check every 20 minutes
- **"Forgot password?" link** added to login page

---

### PR #22 — Chunking Fixes (`fix-chunking`)

- **DB migration** (`supabase-migration-add-chunk-modes.sql`) — dropped old `chunk_mode CHECK ('paragraph','sentence')` constraint; replaced with `('paragraph','sentence','line','custom')`
- **Custom chunking regex** — changed from `/\n\s*\/\s*\n/` to `/\/+/`; `/` now splits anywhere in text, not just on its own line
- **Create page** — `parseIntoParagraphs` corrected to split only on blank lines (not `/`); chunk preview repositioned below stats bar
- **Edit page** — all four chunk modes now compute accurate stats; chunk mode label and custom hint updated

---

### PRs #19–21 — Analytics, Onboarding, Skeletons (`UX-and-Analytics`, `PostHog-updates-fix-commits`, `custom-chunking`)

- **PostHog SDK** installed; `components/posthog-provider.tsx` initialises PostHog and tracks page views (wrapped in `<Suspense>` to fix Vercel static prerender error)
- **`lib/analytics.ts`** — `identifyUser()`, `resetUser()`, `trackEvent()`, `trackPageView()`, DAU/WAU deduplication helpers
- **`lib/analytics-events.ts`** — 35+ typed event constants across user lifecycle, memorization lifecycle, learning progress, feature usage, retention, admin, and error categories
- **`lib/memorization-context.tsx`** — tracking added to `fetchSets`, `addSet`, `deleteSet`, `updateChunkMode`, `markFamiliarizeComplete`, `updateEncodeProgress`, `updateTestScore`
- **`app/page.tsx`** — debounced search tracking (1s delay), tag filter tracking, filter clear tracking
- **`components/loading-skeletons.tsx`** — `LibrarySkeletons`, `SetDetailSkeleton`, `AdminSkeleton` — replace generic spinners with layout-accurate skeletons
- **`components/onboarding-tip.tsx`** — 7 contextual tips with localStorage persistence, page-specific filtering, Previous/Next navigation, and dismissal
- **`components/error-display.tsx`** — `ErrorDisplay`, `ErrorPage`, `getSupabaseErrorMessage` with Supabase error code mapping (23505, 23503, 42501, PGRST116, JWT errors, network errors)

---

## Pending Actions

- [ ] Run `supabase-add-transcript.sql` in Supabase SQL Editor (adds `transcript` + `transcript_words` columns)
- [ ] Run `supabase-seed-example-set.sql` to seed example sets for existing users
- [ ] Confirm `GROQ_API_KEY` is set in production environment variables
- [ ] Add `GROQ_API_KEY` to Vercel project settings
