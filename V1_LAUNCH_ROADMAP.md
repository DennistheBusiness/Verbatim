# Verbatim — V1 Launch Roadmap

**Created:** May 2, 2026
**Current Version:** 1.0.0
**Status:** Live — first user cohort onboarded
**Built on:** [V0_LAUNCH_ROADMAP.md](V0_LAUNCH_ROADMAP.md)

---

## What We Built to Get Here

V0 launched as a localStorage-only prototype. Everything the V0 roadmap described as "v1.0 goals" has now been shipped. Here's what was accomplished:

### Backend & Infrastructure (V0 → V1)
V0 called Supabase the "recommended option for v1." We chose it. The entire app is now cloud-native.

| V0 Goal | Status |
|---|---|
| Authentication (email + social login) | ✅ Shipped — email/password + Google OAuth |
| Cloud sync across devices | ✅ Shipped — Supabase PostgreSQL, real-time RLS |
| Database migration (localStorage → backend) | ✅ Shipped — migration tool at `/migrate` |
| User profiles & settings | ✅ Shipped — `profiles` table, account page |
| Data export / account deletion | ✅ Shipped — account page handles both |
| End-to-end input security | ✅ Shipped — Zod validation + DOMPurify sanitization |

### Features Beyond V0's Scope
These were never in the V0 roadmap — they were discovered needs or product bets:

- **Voice Recording + AI Transcription** — MediaRecorder API, audio stored in Supabase Storage, Web Speech API transcription with timed word timestamps
- **Text-to-Speech Playback** — synchronized audio player for Familiarize mode
- **Spaced Repetition (SM-2)** — full SM-2 algorithm on chunk-level, `chunk_progress` table, configurable per-set (AI / manual / off)
- **Test History** — append-only `test_attempts` table tracking every test score
- **Chunk Modes** — four splitting modes: paragraph, sentence, line, custom delimiter
- **Admin Panel** — server-side role checks, service-role API routes, user management, View Sets, stats dashboard
- **Analytics** — PostHog integration: user identification, event tracking, page views
- **Security Hardening** — removed localStorage impersonation (security risk), server-only service role key, middleware admin gate, no client-side role trust
- **Legal Pages** — Privacy Policy, Terms of Service, About, Help all live

### Infrastructure Choices Made
- **Hosting:** Vercel (as recommended in V0)
- **Database:** Supabase PostgreSQL (recommended option in V0)
- **Domain:** `verbatim.squaredthought.com` under Squared Thought brand
- **Analytics:** PostHog (above Vercel Analytics)
- **Package manager:** pnpm

---

## First User Cohort — May 2026

The first real users are not strangers. They are friends personally onboarded and encouraged to use the app and give feedback. This is the most valuable signal we will get.

**Cohort:** ~8 users (see PostHog Users dashboard)
**Engagement type:** Active use + direct feedback
**Goal:** Understand real usage patterns before scaling

### What to Track From This Cohort
- Which chunk mode do they default to?
- Do they complete Familiarize before jumping to Encode?
- Are they using voice recording or text input?
- Where do they drop off in the 3-step flow?
- Do they return after completing a set?
- What do they ask about or get confused by?

### How to Collect Feedback
1. Direct messages — highest signal, ask specific questions
2. PostHog activity feed — see exact event sequences
3. In-app feedback (if added — see roadmap below)

---

## Current State Assessment — V1 Baseline

### Strengths
- Core learning flow is complete and stable (Familiarize → Encode → Test)
- Voice-first input works end-to-end including AI transcription
- Spaced repetition infrastructure is built (SM-2, chunk_progress table, review queue)
- Auth is solid — Google + email, session management, token refresh
- Admin can manage users, view sets, change roles, delete accounts
- Security posture is strong — no client-side trust, validated inputs, server-only service role

### Active Gaps
- **Groups feature** — plan approved, not built. Members share sets, import to personal library, join via invite code. This is the next major feature.
- **PostHog events not appearing in dashboard** — events confirm 200 OK to `/e/` endpoint but nothing shows in Activity. Likely API key mismatch between Vercel env and PostHog project — needs resolution.
- **No push notifications / reminders** — spaced repetition is meaningless without "time to review" prompts
- **No in-app feedback mechanism** — users have to reach out directly
- **No onboarding for voice sets** — the recording UX is powerful but undiscoverable

---

## V1 Roadmap

### v1.1 — Feedback + Stability (Now, ~2 weeks)
**Goal:** Make the first cohort successful. Fix what they find.

- [ ] **Resolve PostHog** — verify exact API key character-by-character in Vercel vs PostHog Settings → Project. Restore `advanced_disable_feature_flags: true` and proxy config after diagnostic. Remove `ph.debug()` from production once confirmed.
- [ ] **In-app feedback button** — simple link to a form (Tally or direct email) accessible from all pages
- [ ] **Cohort check-in** — reach out to each onboarded user after one week for structured feedback (5 questions max)
- [ ] **Fix any bugs reported** by cohort in first two weeks
- [ ] **Usage review** — PostHog: identify drop-off points in the 3-step flow

---

### v1.2 — Groups (4–6 weeks)
**Goal:** Enable shared practice. Build the feature the plan describes.

This is fully specced in the plan file. Summary:

- [ ] `groups` and `group_members` tables + RLS
- [ ] `memorization_sets.group_id` and `source_group_set_id` columns
- [ ] Group hub page `/groups` — list groups, join via invite code, create group
- [ ] Member view `/groups/[groupId]` — read group sets, import to personal library
- [ ] Admin view `/groups/admin/[groupId]` — manage sets, members, invite code
- [ ] API routes: create, join, import, CRUD sets
- [ ] Library toggle on home page (My Sets | Group Sets) shown when user has groups
- [ ] Navigation link for Groups
- [ ] Filter personal library to exclude group sets

**Why this is v1.2 priority:** The first cohort are friends — this is exactly the use case. They can practice the same texts together, share sets, and give each other content.

---

### v1.3 — Retention Mechanics (6–8 weeks)
**Goal:** Give users a reason to come back daily.

- [ ] **Review reminders** — browser notifications (or email if push permission denied) for SM-2 scheduled reviews
- [ ] **Streak tracking** — days practiced, shown on home page
- [ ] **Today's Practice** banner (component already stubbed) — show due review count prominently
- [ ] **Weekly summary** — email or in-app card: sets practiced, words encoded, review streak
- [ ] **Progress milestones** — first completed set, 7-day streak, 100 words encoded

---

### v1.4 — Content & UX Polish (2–3 months)
**Goal:** Remove friction, expand content types.

#### Input Improvements
- [ ] **PDF import** — extract text from uploaded PDF (`created_from: 'pdf'` already in schema, not yet built)
- [ ] **Paste detection** — recognize URL paste, offer to fetch page content
- [ ] **Content preview** — show chunked preview before saving, let user adjust chunk mode

#### Practice Improvements
- [ ] **Chunk-level audio** — play audio for just the current chunk during Familiarize (not full recording)
- [ ] **Custom chunk delimiter UI** — visible field when `chunk_mode: 'custom'` selected
- [ ] **Keyboard shortcut reference** — `/` or `?` to show shortcuts overlay

#### Library Improvements
- [ ] **Sort options** — by date, title, progress, last practiced
- [ ] **Filter by status** — not started, in progress, mastered
- [ ] **Bulk actions** — select multiple sets to tag, delete, or move to group
- [ ] **Duplicate set** — copy a set as a starting point

---

### v1.5 — Monetization Foundation (3–4 months)
**Goal:** Make the business viable without degrading the free experience.

The V0 roadmap described a freemium model. With a real user base, we can validate what people pay for. Hypothesis:

**Free (always):**
- All core features
- Up to 25 memorization sets
- Text + voice input
- Basic spaced repetition

**Pro ($6–8/month):**
- Unlimited sets
- Groups (or groups stay free but Pro unlocks group creation)
- Advanced analytics (personal learning stats, retention curves)
- Priority review scheduling
- PDF import

**Decision gate:** Do not build the paywall until we have at least 50 regular users and have talked to at least 10 about willingness to pay. Launch with Pro as "early supporter" pricing.

---

### v2.0 — Platform Expansion (6–12 months)
**Goal:** Expand reach beyond the web app.

- Native iOS app (React Native — reuse component logic)
- Native Android app
- Notion integration — import pages directly into Verbatim
- Anki export — export a set as an Anki deck
- Public set library — browse and copy community-created sets
- API for third-party integrations

---

## Success Metrics — V1

### 30-Day Goals (Cohort Phase)
- 8+ users actively using the app weekly
- At least 3 direct feedback conversations completed
- PostHog activity confirmed working and showing real data
- Zero data-loss or auth bugs reported

### 90-Day Goals (v1.1–v1.2 shipped)
- 25+ total users (cohort + referrals)
- Groups feature live and used by at least 2 groups
- 100+ memorization sets created across all users
- PostHog retention graph shows 30% D7 return

### 6-Month Goals (v1.3–v1.4 shipped)
- 100+ total accounts
- 50+ monthly active users
- At least 5 users on streak of 7+ days
- First monetization test run (Pro waitlist or soft paywall)

---

## What the V0 Roadmap Got Right

Looking back, the V0 doc predicted the path well:
- Called Supabase the right choice for v1 — correct
- Called Vercel the hosting — correct
- Predicted the v1 feature set accurately (auth, sync, profiles, export) — all shipped
- Identified the right "v0 limitations" (localStorage, no sync, no auth) — all resolved

What it underestimated:
- **Voice/audio** — this became a core differentiator, not a v2 multimedia feature
- **Spaced repetition** — shipped earlier than v0.5 suggested
- **Security work** — the admin impersonation was a real risk that needed to be addressed before growing users

---

## Open Questions for the Cohort

Before building v1.2+, get answers to these from the first cohort:

1. What are you memorizing — speeches, scripture, poems, something else?
2. Do you practice alone or would you use groups with others?
3. Where do you most want to be reminded to practice?
4. Is voice recording useful to you, or do you just type?
5. What's the one thing that would make you use this every day?
