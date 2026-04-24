# Verbatim — CLAUDE.md

## What This App Is

Verbatim is a text memorization app. Users paste or record content, which gets split into chunks, then progress through three learning stages: **Familiarize → Train (Encode) → Test**. It's live (post-v0 launch) with real users.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui (40+ components in `components/ui/`) |
| Backend | Supabase (auth, PostgreSQL, storage) |
| Analytics | PostHog (`lib/analytics.ts`) + Vercel Analytics |
| Validation | Zod (`lib/schemas.ts`) |
| Forms | React Hook Form + `@hookform/resolvers` |
| Toasts | Sonner |
| Package manager | pnpm (use `pnpm` not `npm`) |

---

## Project Structure

```
app/
  api/admin/          # Server-side admin routes (service role, bypass RLS)
    users/            # GET list, PATCH role, DELETE user
    users/[userId]/sets/  # GET user's sets
    stats/            # GET dashboard stats
  auth/               # login, signup, forgot-password, reset-password, callback
  admin/              # Admin panel UI
  memorization/[id]/  # Learning flow (Familiarize/Encode/Test tabs)
  create/             # Create new set
  edit/[id]/          # Edit existing set
  account/            # Account settings, delete account
  onboarding/         # First-time user flow
  migrate/            # localStorage → Supabase migration tool
  about/, help/, privacy/, terms/

components/
  ui/                 # shadcn/ui primitives (don't modify)
  guided-flow.tsx     # 3-step learning flow controller
  chunk-encoder.tsx   # Progressive encoding component
  voice-recorder.tsx  # MediaRecorder + Web Speech API transcription
  audio-player.tsx    # Supabase Storage audio playback
  loading-skeletons.tsx  # Skeleton loaders (LibrarySkeletons, SetDetailSkeleton, AdminSkeleton)
  error-display.tsx   # ErrorDisplay, ErrorPage, getSupabaseErrorMessage
  onboarding-tip.tsx  # Contextual tips with localStorage persistence
  header.tsx, navigation-menu.tsx, session-handler.tsx, session-layout.tsx

lib/
  supabase/
    client.ts         # Browser Supabase client
    server.ts         # Server Supabase client (RSC / API routes)
    service.ts        # Service-role client — bypasses RLS, server-only
    types.ts          # Generated DB types
  memorization-context.tsx   # Main React context (Supabase-backed CRUD)
  sanitize.ts         # XSS prevention — sanitizeText(), sanitizeTags()
  schemas.ts          # Zod schemas — createSetSchema, updateSetSchema
  analytics.ts        # PostHog wrapper — identifyUser, trackEvent, etc.
  analytics-events.ts # Event name constants
  text-utils.ts       # Chunking logic
  impersonation.ts    # DEPRECATED shim — returns actualUserId unchanged

middleware.ts         # Auth gate + admin role check (server-side)
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Server-only — never expose to client
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## Database (Supabase PostgreSQL)

**Tables:** `profiles`, `memorization_sets`, `chunks`, `tags`, `set_tags`

**Storage bucket:** `audio-recordings` (private, RLS-gated)
- Path format: `{user_id}/{set_id}.{extension}`

**Key constraints:**
- `profiles.user_role` CHECK: `'admin' | 'general' | 'vip'` (default `'general'`)
- `memorization_sets.chunk_mode` CHECK: `'line' | 'paragraph' | 'sentence' | 'custom'`
- `memorization_sets.created_from` CHECK: `'text' | 'voice'`
- RLS is enabled on all tables — always use the correct client

**SQL migration files** in repo root (run in Supabase SQL Editor when needed):
- `supabase-schema.sql` — full schema
- `supabase-migration-add-chunk-modes.sql`
- `supabase-add-content-sources.sql`
- `supabase-restore-rls.sql`

---

## Auth & Security

### Middleware (`middleware.ts`)
- Auth-only paths: `/auth/login`, `/auth/signup`, `/auth/callback` — redirect to `/` if logged in
- Admin paths: `/admin/*` — server-side role check (queries `profiles.user_role`), never trusts client
- Protected paths: `/`, `/create`, `/edit`, `/memorization`, `/migrate` — redirect to login if not authenticated
- Forgot-password and public pages (`/about`, `/help`, `/privacy`, `/terms`) are NOT in the protected list

### Admin API Routes (`app/api/admin/`)
- All routes call `requireAdmin()` which verifies session AND `user_role === 'admin'` server-side
- Use `createServiceClient()` (service role) for cross-user data access — **never on the client**
- Admin actions: list users, PATCH role, DELETE user+data, GET user's sets, GET stats

### Input Validation
- All user input goes through `lib/schemas.ts` (Zod) before hitting the DB
- Text content goes through `lib/sanitize.ts` (DOMPurify client-side, regex fallback server-side)
- Never trust client-side role checks for sensitive operations

### Impersonation
- **localStorage-based impersonation has been removed** (was a security risk)
- `lib/impersonation.ts` is a deprecated no-op shim kept for import compatibility
- Admin user-data access now goes through `/api/admin/users/[userId]/sets` (server-side, service role)

---

## Core Data Model

```typescript
// lib/memorization-context.tsx
type ChunkMode = "line" | "paragraph" | "sentence" | "custom"
type InputMethod = "text" | "voice"

interface MemorizationSet {
  id: string
  title: string
  content: string
  chunkMode: ChunkMode
  chunks: Chunk[]
  progress: Progress      // familiarize, encode stages, test scores
  sessionState: SessionState
  recommendedStep: "familiarize" | "encode" | "test"
  tags: string[]
  audioFilePath?: string | null
  originalFilename?: string | null
  createdFrom: InputMethod
}
```

The context (`useMemorization()`) provides: `sets`, `isLoaded`, `isLoading`, `error`, `addSet()`, `updateSet()`, `deleteSet()`, `updateProgress()`, `updateSessionState()`, etc.

---

## Key Features

### 3-Step Learning Flow
1. **Familiarize** — read-through, chunk by chunk, optional audio playback
2. **Train (Encode)** — 3 progressive stages: 25% → 50% → 100% concealment
3. **Test** — two modes:
   - *First Letter Recall*: type first letter of each word
   - *Full Text Recall*: type complete passage from memory

### Chunk Modes
- `line` — split by newline
- `paragraph` — split by double newline
- `sentence` — split by `.`, `!`, `?`
- `custom` — user-defined delimiter

### Voice Recording
- `components/voice-recorder.tsx`
- Uses MediaRecorder API + Web Speech API (browser-native, no cost)
- Audio stored in Supabase Storage `audio-recordings` bucket
- English only, best in Chrome/Edge; manual transcription fallback for other browsers

### Analytics
- PostHog initialized in `lib/analytics.ts`; event constants in `lib/analytics-events.ts`
- `identifyUser()` called after auth; `resetUser()` on logout
- Feature flags disabled (`advanced_disable_feature_flags: true`) — not in use yet

---

## Duplicate Files (Ignore)

Several files have accidental " 2" copies — **do not edit these**:
- `components/error-display 2.tsx`
- `components/loading-skeletons 2.tsx`
- `components/onboarding-tip 2.tsx`
- `components/posthog-provider 2.tsx`
- `lib/analytics 2.ts`
- `lib/analytics-events 2.ts`

The canonical files are the ones **without** " 2" in the name.

---

## Development Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint
```

---

## Current Branch: `security-updates`

Active security work — changes on this branch vs `main`:
- `.env.local.example` — added `SUPABASE_SERVICE_ROLE_KEY`
- `app/admin/page.tsx` — migrated admin CRUD to API routes
- `components/voice-recorder.tsx` — security/sanitization updates
- `lib/impersonation.ts` — replaced with no-op shim
- `lib/memorization-context.tsx` — added Zod validation + sanitization
- `middleware.ts` — server-side admin role check
- New: `app/api/` routes, `lib/sanitize.ts`, `lib/schemas.ts`, `lib/supabase/service.ts`

---

## What NOT to Do

- Never use `createServiceClient()` in client components or `lib/supabase/client.ts` — service role key must stay server-only
- Never skip Zod validation (`lib/schemas.ts`) on user-supplied data before DB writes
- Never skip `sanitizeText()` on user content before storing
- Don't use `npm` — this project uses `pnpm`
- Don't trust client-side role claims for admin operations — always verify server-side
- Don't edit files ending in " 2" — they're accidental duplicates
