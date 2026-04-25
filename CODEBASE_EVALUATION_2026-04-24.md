# Verbatim — Comprehensive Codebase & Business Evaluation

**Evaluated:** April 24, 2026
**Stack:** Next.js 16.2, React 19, Supabase, TypeScript, Tailwind v4
**Repo age:** ~5 days, 70 commits

---

## 1. Codebase Quality & Engineering Review

### Strengths

**Modern, well-chosen stack.** Next.js App Router, React 19, Supabase, Zod, shadcn/ui, Tailwind v4 — every dependency is current and justified. No legacy baggage, no obvious bad fits.

**Security was actually addressed.** The `security-updates` branch delivered real hardening: server-side admin gate in middleware, service-role API routes that never touch the client, Zod validation on all writes, DOMPurify/regex XSS sanitization, MIME + size locks on uploads. For a 5-day-old codebase, this is unusually mature.

**`lib/text-utils.ts` is a model file.** Clean, documented, well-typed `compareTexts()` with correct normalization (punctuation stripping, case folding, missing/extra word detection). This is the kind of utility code that ages well.

**`lib/schemas.ts` and `lib/sanitize.ts`** are minimal, focused, and easy to audit. No unnecessary abstraction.

**Type system is used consistently.** `Database` types from Supabase codegen, typed context interface, Zod-inferred input types — no stranded `any` chains (with one exception noted below).

**PostHog integration is solid.** Proper user identification, 35+ events, DAU/WAU deduplication via localStorage — better analytics instrumentation than most Series A companies.

---

### Weaknesses

**`memorization-context.tsx` is a god file.** 1,353 lines, 20+ exported functions, handles CRUD, audio upload, chunking, progress computation, analytics firing, signed URL caching — all in one React context. This is the #1 technical debt risk. It's already hard to reason about and will become unmaintainable.

**`app/memorization/[id]/page.tsx` is 1,478 lines.** Single page component managing 9 distinct `PageMode` states (`"view" | "familiarize" | "flashcards" | "chunk-select" | "practice" | "test-select" | ...`). This is a state machine written as conditional JSX. It should be broken into sub-routes or a proper state machine (XState or Zustand).

**Chunking logic is duplicated in three places.** `parseIntoParagraphs`, `parseIntoSentences`, `parseIntoLines`, `parseCustomChunks` exist in `memorization-context.tsx`, `app/create/page.tsx`, and `app/edit/[id]/page.tsx`. The canonical version should be in `lib/text-utils.ts` only. The current arrangement has already caused bugs (the `\r\n` fix was applied in some places but not others).

**20 untracked SQL files in the root directory.** Several have names like `supabase-disable-rls-temp.sql`, `supabase-debug-rls.sql`, `supabase-diagnose-rls.sql` — evidence of a chaotic schema evolution process. There is no migration framework, no sequential numbering, no audit trail of what has or hasn't been applied to production. Running the wrong file in the wrong order could corrupt the schema.

**`progress` and `session_state` stored as opaque JSON blobs.** The DB columns are typed `Json`. You cannot write a meaningful analytics query on progress data without JSONB path expressions, and there's no enforced shape. A malformed progress object persists silently. This will bite at scale.

**Duplicate " 2" files are committed to the repo** (`error-display 2.tsx`, `loading-skeletons 2.tsx`, etc.) and `lib/memorization-context-localstorage.backup.tsx` is a committed backup. These are code hygiene issues that signal a messy workflow.

**`/api/transcribe` returns HTTP 200 on errors** (lines 53 and 67). This breaks any client code that checks `response.ok`. It also makes error monitoring useless — Sentry/PostHog would never see a 500.

**No rate limiting on API routes.** The transcription endpoint passes audio to the AI transcription service at your cost with no per-user throttle. A malicious user could send 1,000 requests and run up your bill.

**`(data.words ?? []).map((w: any) => ...)` in `transcribe/route.ts`.** The one `any` in the codebase is in a security-adjacent path. Should be typed against the AI provider's response schema.

**Zero test coverage.** Not one test file. A 1,353-line context file with no tests is a refactoring hazard.

---

### Risk Level: Medium (trending toward High without intervention)

### What Would Break at Scale

| Scenario | What Breaks |
|---|---|
| 10k users with 50 sets each | `fetchSets()` loads all sets client-side with no pagination. Supabase query returns 500k rows. Context freezes. |
| Concurrent AI transcription requests | No rate limit — cost explosion and provider rate-limit errors surface to users |
| Schema change to `progress` JSON | Silent corruption of user progress data with no migration path |
| Refactoring the god-context | No tests — any change is blind |
| Multiple regions / edge deployments | Signed URL caching is per-session in memory, not shared — no real caching at scale |

---

## 2. Production Readiness

### Verdict: MVP-ready. Not yet production-ready.

The app is functional, deployed, and has real users. The core security hardening is done. But there are gaps that create real risk at production scale.

| Area | Status | Notes |
|---|---|---|
| Authentication | ✅ | Supabase auth, session handling, password reset, 20-min session check |
| Authorization | ✅ | Server-side admin gate, service-role API routes, RLS on all tables |
| Input validation | ✅ | Zod + sanitization on all writes |
| Database integrity | ⚠️ | JSON blobs for progress, no migration framework, 20 scattered SQL files |
| API design | ⚠️ | Admin routes are clean; transcription route returns wrong HTTP codes |
| Error monitoring | ❌ | No Sentry or equivalent — only `console.error` |
| Logging | ❌ | No structured logging — `console.error` strings only |
| Rate limiting | ❌ | None on any API route |
| CI/CD | ❌ | No `.github/workflows` visible — deploys are manual pushes to Vercel |
| Pagination | ❌ | All sets fetched at once — no cursor/offset pagination |
| Offline/PWA | ❌ | No service worker, no offline mode |
| Load testing | ❌ | Never tested |

### Top Blockers to Production

1. **No error monitoring** — flying blind in production right now
2. **No rate limiting** — AI transcription is an open cost vector
3. **No pagination** — will break for power users with many sets
4. **SQL migration chaos** — one wrong script execution corrupts production data
5. **Transcription endpoint HTTP semantics** — returns 200 on errors

### Estimated Effort to Address Blockers: 40–60 hours

| Task | Hours |
|---|---|
| Sentry integration | 4h |
| Rate limiting (Upstash or simple in-memory) | 6h |
| Pagination on `fetchSets` | 8h |
| Migrate to Supabase CLI migrations | 12h |
| Fix transcription HTTP codes + input size validation | 4h |
| Extract chunking logic to text-utils | 6h |
| Basic tests for context + text-utils | 16h |

---

## 3. Feature & Product Assessment

### What Problem Does This Solve?

Verbatim targets **rote memorization of text** — speeches, scripts, poems, scripture, medical content. The core insight is that reading → encoding → testing is more effective than flashcard drilling alone. The progressive concealment model (25% → 50% → 100% hidden) has real pedagogical backing (retrieval practice effect).

### Target User

Students, actors, public speakers, clergy, medical/law students memorizing long-form text. The voice recorder + AI transcription suggests a secondary use case: record a lecture, then memorize it.

### Feature Completeness Score: 6.5 / 10

| Feature | Status |
|---|---|
| 3-step learning flow (Familiarize → Encode → Test) | ✅ Complete |
| Multiple chunk modes (line/paragraph/sentence/custom) | ✅ Complete |
| First-letter recall test | ✅ Complete |
| Full-text typing test | ✅ Complete |
| Voice recording + AI transcription | ✅ Complete |
| Timed audio playback with word highlighting | ✅ Complete |
| TTS with voice picker + seek | ✅ Complete |
| Tags + search + filtering | ✅ Complete |
| Progress tracking + recommended step | ✅ Complete |
| Onboarding flow | ✅ Basic |
| Admin panel | ✅ Basic |
| PDF import | ⚠️ Component exists (`pdf-uploader.tsx`), integration unclear |
| Spaced repetition algorithm | ❌ Missing |
| Set sharing / public library | ❌ Missing |
| Collaborative sets | ❌ Missing |
| Mobile native app | ❌ Web only |
| Offline mode | ❌ Missing |
| Subscription / paywall | ❌ Missing |
| Bulk import (CSV, DOCX) | ❌ Missing |
| Score history / progress charts | ❌ Missing |

### Missing Must-Haves for Serious Users

1. **Spaced repetition** — Anki's killer feature. Without SM-2 or equivalent, power users will leave when they discover they can't schedule reviews.
2. **Set sharing / import** — Network effect driver. Users want to share "Hamlet Act 1" and let others import it.
3. **Score history charts** — Users can't see their improvement over time. This directly undermines retention.
4. **Subscription layer** — The app has no monetization path.

### Suggested Roadmap

**Phase 1 (next 30 days) — Retention & monetization foundation**
- Spaced repetition scheduler (SM-2 is 100 lines of well-understood code)
- Score history charts (Recharts is already installed)
- Subscription with Stripe (free tier: 5 sets; paid: unlimited)
- Fix the 5 production blockers above

**Phase 2 (30–90 days) — Growth & network effects**
- Public set library (browse/import community sets)
- Share a set via link (read-only copy)
- Bulk import: paste from DOCX, CSV, PDF (PDF uploader already exists)
- Mobile PWA with offline mode

**Phase 3 (90–180 days) — Platform**
- Native iOS/Android with React Native (code is ~70% reusable)
- Collaborative sets / study groups
- LMS integrations (Canvas, Google Classroom)
- API for third-party content providers

---

## 4. Development Cost & Time Estimation

**Actual timeline:** April 19–24, 2026 — 5 days, 70 commits.

This was built with heavy AI pair-programming (commit messages confirm "Co-Authored-By: Claude Sonnet 4.6"). That changes the cost calculus significantly.

**Application code volume:** ~18,000–22,000 lines (excluding shadcn/ui primitives and generated types).

### Traditional Estimate (No AI Tooling)

| Component | Hours |
|---|---|
| Auth system (Supabase, session, password reset) | 40h |
| Data layer (context, Supabase CRUD, types) | 60h |
| Core memorization flow (3 steps, all test modes) | 80h |
| Voice recording + audio playback | 30h |
| AI transcription + timed player | 25h |
| TTS player with controls | 20h |
| Library UI (cards, search, tags, filtering) | 30h |
| Create/Edit pages | 25h |
| Admin panel + API routes | 20h |
| Security hardening | 20h |
| Analytics (PostHog) | 15h |
| Onboarding, skeletons, error handling | 15h |
| **Total** | **~380–420 hours** |

**At US senior rates ($150–200/hr):** $57k–$84k
**At blended offshore rates ($60–80/hr):** $23k–$34k

### Actual Cost with AI Tooling

A solo founder using Claude Code could realistically produce this in 60–100 hours of human effort. At $200/hr founder time + ~$200 in AI API costs, actual cost is roughly **$12k–$20k**.

**Confidence level: Medium** — the velocity is unusually high even for AI-assisted development; some features may be partially complete or have hidden bugs not visible from code inspection alone.

---

## 5. Valuation (Pre-Revenue)

### Replacement Cost Valuation

- Traditional: **$60k–$85k**
- AI-assisted: **$15k–$25k**

The market doesn't pay replacement cost. It pays for users, retention, and growth trajectory.

### Early-Stage Startup Valuation Range

| Scenario | Range |
|---|---|
| Prototype only, no users | $50k–$150k |
| MVP with <100 active users, no revenue | $150k–$500k |
| MVP with 500+ active users, measurable retention | $500k–$1.5M |
| Revenue ($2k+ MRR) | $2M–$6M (20–30x MRR, pre-seed SaaS) |

**Current position:** This is a **sellable MVP** — not a prototype. The core loop works, it has real users, security is addressed, and the feature set is differentiated enough to stand out from Quizlet. It is not yet fundable without user/retention data.

The AI transcription + timed word highlighting is genuinely novel and creates a moat that Anki/Quizlet do not have today. That's worth something.

---

## 6. Key Risks

| Risk | Severity | Likelihood |
|---|---|---|
| God-context becomes unmaintainable as features grow | High | Certain if unchecked |
| AI transcription provider goes down / raises prices — feature breaks with no fallback | Medium | Low-medium |
| Progress JSON corruption silently destroys user data | High | Low but catastrophic |
| No tests → regression on any refactor | High | High |
| SQL migration chaos → production schema error | High | Medium |
| No rate limiting → AI transcription cost explosion from one bad actor | Medium | Low but sudden |
| Spaced repetition gap → power users churn to Anki | High | High if user base grows |
| No monetization → no runway to keep building | Critical | Certain without action |
| Supabase vendor lock-in at scale (egress costs, RLS performance at 10k users) | Medium | Long-term |

---

## 7. Strategic Recommendations

### Top 5 Immediate Improvements

**1. Add Sentry (4 hours).** You are blind in production right now. Every 500, every unhandled promise rejection, every AI transcription failure — none of it is visible. This is the highest ROI fix available.

**2. Add spaced repetition (20 hours).** This is the single feature that separates "toy" from "serious tool" in the memorization space. SM-2 is a well-understood 100-line algorithm. Wire it to the existing progress model. This directly drives retention, which drives valuation.

**3. Add score history charts (10 hours).** Recharts is already installed. A simple time-series of test scores per set is the feature that makes users *feel* the product working. It is the primary retention hook after the initial learning experience.

**4. Add Stripe subscriptions before marketing (16 hours).** The unit economics of AI transcription + Supabase storage mean you need revenue before you scale. A $10/month Pro tier (unlimited sets, AI transcription, audio) with a 5-set free tier is the obvious model.

**5. Break up the god-context (20 hours).** Split `memorization-context.tsx` into at minimum: `sets-context`, `progress-context`, `audio-context`. Then add basic tests. This is the prerequisite for every other engineering improvement.

### What to Fix Before Any Marketing Push

- Sentry (you need error visibility before driving traffic)
- Rate limiting on transcription
- Pagination on `fetchSets`
- Fix transcription HTTP error codes

### Hidden Leverage Opportunities

**The AI transcription + timed word sync is the real differentiator.** No competitor (Anki, Quizlet, Brainscape) has "record audio → AI timestamps every word → click any word to seek → practice alongside your own voice." This is a legitimately compelling workflow for students, language learners, and speech memorization. Lean into this in marketing, not the generic "memorization app" framing.

**"Record a lecture and practice it"** is a use case Verbatim already supports technically but hasn't framed as a product. A university student who records a professor, gets an AI transcript, and then practices the key passages has a workflow that no other tool offers end-to-end. This is a specific, defensible wedge.

**A public set library with SEO** — "Memorize the Gettysburg Address," "Learn the Periodic Table" — is a classic low-cost growth loop. Each public set is a searchable landing page. With 100 high-quality sets, you get passive organic traffic.

---

## 8. Final Verdict

**Is this worth building on?** Yes, unambiguously. The core learning loop is solid, the differentiated features (AI transcription, timed audio, progressive concealment) are real, and the codebase is more mature than its age suggests. The security was taken seriously when most founders skip it entirely.

**Is it investable right now?** Not quite. The missing pieces are: (1) measurable retention data, (2) a monetization layer, (3) spaced repetition — the feature that separates "interesting" from "sticky." With 3–4 weeks of focused work addressing those, it becomes a credible pre-seed pitch in the edtech/productivity space.

**What's the fastest path to making it valuable?**

| Week | Focus |
|---|---|
| Week 1 | Sentry + rate limiting + pagination (stop bleeding) |
| Week 2 | Spaced repetition + score history (become sticky) |
| Week 3 | Stripe subscriptions (create revenue) |
| Week 4 | "Record a lecture" landing page + one SEO set library launch (get users) |

The fastest path is *not* adding more features — it's making the existing ones provably worth paying for.

**Bottom line:** This is a technically competent MVP built at remarkable speed. The engineering is at the "promising but fragile" stage — good decisions in the foundation, dangerous concentrations of complexity in a few files, and zero test coverage. The product has a real differentiator. The business has no monetization yet. Fix the fragility, ship spaced repetition, and put a paywall in — in that order.
