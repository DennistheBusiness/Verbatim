# Verbatim Version Log (Inferred from Commit History)

This log maps product evolution from `v0.1` to `v3.0 Pending` by evaluating major commits and merged PR milestones.

> Note: These versions are **release narrative labels** (inferred) rather than git tags.

## Version Timeline

| Version | Date Window | Major Feature Releases | Representative Commits |
|---|---|---|---|
| **v0.1 – Project Bootstrap** | 2026-04-19 | Initial app scaffold, file upload POC, basic documentation and setup | `070226b` Initial commit, `fd691f7` Add files via upload, `694f6a3` Added documentation + project setup |
| **v0.5 – Encoding Core MVP** | 2026-04-19 | Memorization selection editing, progressive encoding, encode entire selection flow | `2c1a16b` Edit memorization selection, `c472a0c` Progressive encoding, `142e55f` Encode entire selection |
| **v1.0 – Core Product Live** | 2026-04-19 → 2026-04-23 | Onboarding flow, backend persistence migration, flashcards, create/edit memorization sets, mobile UX pass, familiarization improvements, admin pages | `e8a18bb` Onboarding flow, `2d59242` LocalStorage to Database, `7eb94e3` Flashcards, `4a57621` Create + Edit sets, `75e0093` + `d4dfada` mobile improvements, `95483b8` admin pages |
| **v1.5 – Product Hardening** | 2026-04-23 | Auth completion + forgot password, security cleanup, chunking modes expansion, analytics/provider fixes | `888c45f` Complete auth system, `3196983` forgot password updates, `5cf41b1` security validation pass, `4894f8d` line/custom chunking, `37e9a0e` PostHog fix commits |
| **v2.0 – Intelligence + Performance** | 2026-04-24 → 2026-04-26 | AI transcription, timed audio player + TTS controls, Sentry + rate limiting + context split, score charts and test UX polish, spaced repetition, improved landing/domain routing, OCR image-to-text input | `c380549` transcription/audio/TTS, `ad9d39d` monitoring/performance/rate limiting, `494ba26` score chart + keystroke accuracy, `0527f62` spaced repetition + progressive UX, `4349da9` OCR input |
| **v2.5 – Activation + Reliability** | 2026-04-27 → 2026-05-02 | Improved onboarding + analytics instrumentation, mobile typing UX refinement, robust first-letter keyboard responsiveness hardening, TTS generation endpoint | `dc6d79c` onboarding + PostHog integration, `92f1e87`/`f004008`/`8e846a2` Start Typing CTA flow, `8ca48d2` + `e81fc77` keyboard responsiveness hardening, `0611faf` TTS endpoint |
| **v2.9 – Sharing/Growth Loop** | 2026-05-02 | Set sharing by tokenized link (viral acquisition loop) merged to main | `b8155b5` Add set sharing via link with viral acquisition loop, merge `ea02edb` PR #39 |
| **v2.9.1 – Haptics + First Letter Chunking** | 2026-05-03 → 2026-05-04 | Haptic feedback on errors and exercise completion; First Letter Method now combines selected chunks into unified practice session with CTA returning to chunk selection; notification card mobile/web fix + manual schedule presets | PR #82 chunk combining, PR #83 haptic feedback, PR #85 notification + presets |
| **v2.9.2 – Streak Tracking + Unified History** | 2026-05-05 | Per-set streak tracking (current + longest, persisted in `progress.streak` JSONB); all 6 scored methods (First Letter, Full Recall, Audio, Finish Phrase, Sorting Game, Encode L1/L2/L3) dual-write to `test_attempts` for unified analytics; `step` column added to `test_attempts` distinguishing Train vs Test phase | PR #84 per-set streak + unified test_attempts |
| **v2.9.3 – Mobile Scroll + Read It Auto-Complete** | 2026-05-07 → 2026-05-09 | Fixed last-line obscured by keyboard in Progressive Encoder, First Letter Recall Test, and Finish That Phrase (permanent `h-[50vh]` spacer); fixed iOS scroll-to-top on every keypress in First Letter Test (hidden input `position: fixed` instead of `sr-only`); "Read It" (Teach step) now auto-marks familiarize complete on first open | `d357764` Encoder keyboard spacer, `0705cb5` First Letter spacer, `324de34` Finish Phrase spacer, `e7b0de3` iOS scroll fix, `d83995c` Read It auto-complete |
| **v2.9.4 – Analytics Dashboard + Library CTAs** | 2026-05-10 | Full Analytics page rebuild: horizontal set picker, Train/Test tab toggle with attempt counts, score history area charts, stage/method breakdown, personal bests grid, performance radar chart, recent sessions list, Continue Memorizing CTA; "View Analytics" buttons added to Home Page (desktop + mobile); Overall Progress card on memorization detail page is now clickable and routes to analytics | PR #86/#87 analytics rebuild + View Analytics CTAs |
| **v3.0 Pending – Mobile Store Expansion** | Next milestone | Capacitor wrapper for iOS + Android, app store packaging and deployment pipeline | *(planned next phase)* |

## Why `v3.0 Pending` Is a Reasonable Current Label

- The product has moved beyond MVP and core stabilization into **distribution expansion** (web product mostly mature; mobile store delivery next).
- Recent releases (`v2.9.1` through `v2.9.4`) delivered haptics, unified analytics, streak tracking, mobile UX hardening, and a full analytics dashboard — the UX is shipping-quality on web.
- The Capacitor shell is already scaffolded (`capacitor.config.ts`, `android/`, `ios/` present in repo) but not yet in App Store / Play Store.
- The next step (Capacitor finalization + store submission) is the clear platform milestone suitable for a major version boundary.

## Suggested Scope for `v3.0`

1. Capacitor shell integration with current Next.js web app.
2. Native permissions and media handling validation (audio playback/recording paths).
3. Deep link/open-share flow parity with web sharing tokens.
4. Build signing + CI/CD lanes for TestFlight and Play Internal Testing.
5. Mobile analytics/event parity and crash monitoring confirmation.

## Quick Release Labeling Recommendation

- Keep current shipped state labeled as **`v2.9`**.
- Announce **`v3.0 Pending`** during mobile wrapper implementation.
- Promote to **`v3.0`** when both iOS and Android beta distributions are live with core memorization flows verified.
