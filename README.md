# Verbatim

Verbatim is a Next.js app for structured, word-for-word memorization.
It helps users import or write material, split it into chunks, practice with progressive cues (including first-letter encoding), and test recall.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4 + Radix UI components
- Supabase (Auth + database)
- PostHog (analytics)
- Sentry (error monitoring)
- Upstash Redis (optional API rate limiting)

## Core Product Areas

- **Auth + user isolation** via Supabase and middleware-based session checks
- **Create memorization sets** from text, audio transcription, and extracted text workflows
- **Chunking modes**: paragraph, sentence, line, and custom (`/` separator)
- **Practice + review** flows for progressive recall
- **Edit memorization** with live chunk stats and chunk preview dropdown
- **Onboarding tour** with skip, back, keyboard/swipe nav, and local completion flag (`hasSeenOnboarding`)

## Current Onboarding Focus

The onboarding route (`/onboarding`) currently emphasizes:

1. Who the app is for
2. Core features
3. How users run a practice workflow
4. Practical recall guidance

It is intentionally lightweight and skippable at any point.

## Project Structure (high-level)

```text
app/
	api/              # Route handlers (transcription, extraction, admin, etc.)
	auth/             # Login, signup, callback
	create/           # Create memorization set
	edit/[id]/        # Edit memorization set
	memorization/     # Practice/session pages
	onboarding/       # Product tour
	migrate/          # Local data migration tooling
components/         # UI and feature components
lib/                # Context, analytics, Supabase, shared helpers
```

## Prerequisites

- Node.js 20+
- pnpm
- Supabase project (required)
- Groq API key (required for transcription/extraction routes)

## Quick Start

1. Install dependencies

```bash
pnpm install
```

2. Create your local environment file

```bash
cp .env.local.example .env.local
```

3. Fill required values in `.env.local`

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `GROQ_API_KEY` (server-only)

4. Run the dev server

```bash
pnpm dev
```

Default URL: `http://localhost:3000`

If you prefer port 3001:

```bash
PORT=3001 pnpm dev
```

or

```bash
pnpm exec next dev -p 3001
```

## Environment Variables

Use `.env.local.example` as the source of truth.

### Required

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`

### Recommended / Optional

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

## Available Scripts

- `pnpm dev` — start local dev server
- `pnpm build` — production build
- `pnpm start` — run production build
- `pnpm lint` — lint the codebase

## Supabase Setup

For full database/auth migration and schema setup, see:

- `SUPABASE_SETUP.md`
- `supabase-schema.sql`

Additional migration/policy SQL files are included at the repo root for targeted updates and debugging.

## Notes for Contributors

- The app currently uses a memorization context in `lib/memorization-context.tsx`.
- On first run, users are redirected to onboarding unless `hasSeenOnboarding` is set in localStorage.
- Edit flow (`/edit/[id]`) now includes an in-page **chunk preview accordion** after selecting chunk method.

## Troubleshooting

- **Port already in use**: switch to another port (`PORT=3001 pnpm dev`) or stop the existing process.
- **Auth redirect loops**: verify Supabase keys and `NEXT_PUBLIC_SITE_URL`.
- **Transcription/extraction failing**: verify `GROQ_API_KEY` is set.
- **Rate limit config missing**: add Upstash variables or run without rate limiting in local dev.