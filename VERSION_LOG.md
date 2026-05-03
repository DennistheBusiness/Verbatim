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
| **v3.0 Pending – Mobile Store Expansion** | Next milestone | Capacitor wrapper for iOS + Android, app store packaging and deployment pipeline | *(planned next phase)* |

## Why `v3.0 Pending` Is a Reasonable Current Label

- The product has moved beyond MVP and core stabilization into **distribution expansion** (web product mostly mature; mobile store delivery next).
- Recent releases delivered both **reliability fixes** (keyboard input hardening) and **growth mechanics** (share links), which are typical pre-3.0 readiness indicators.
- The next step (Capacitor wrapper + App Store/Play Store operations) is a clear platform milestone suitable for a major version boundary.

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
