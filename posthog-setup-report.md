# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Verbatim. PostHog was already installed and partially instrumented (user identification, memorization lifecycle events, and library search events were in place). This pass filled in the missing pieces: auth events at the login/signup boundary, user identification at signup, and learning-flow start events in the memorization detail page and edit page.

## Changes made

| Event | Description | File |
|---|---|---|
| `user_logged_in` | Fired after a successful email/password login with `method: 'email'` | `app/auth/login/page.tsx` |
| `user_signed_up` | Fired after a successful email signup; also calls `identifyUser()` with the new user's Supabase ID when a session is immediately available | `app/auth/signup/page.tsx` |
| `memorization_updated` | Fired after saving changes to an existing set from the edit page | `app/edit/[id]/page.tsx` |
| `memorization_deleted` | Fired when a user confirms deletion of a set from the edit page | `app/edit/[id]/page.tsx` |
| `encode_started` | Fired when a user begins a training (encode) session for a chunk; includes `set_id` and `chunk_index` | `app/memorization/[id]/page.tsx` |
| `test_started` | Fired when a user starts any test mode; includes `set_id` and `test_type` (`first_letter`, `full_text`, or `audio`) | `app/memorization/[id]/page.tsx` |

### Already instrumented (no changes needed)

These events were already tracked before this session:

- `identifyUser()` — called in `lib/memorization-context.tsx` on every authenticated session load
- `memorization_created`, `familiarize_completed`, `encode_completed`, `test_completed`, `memorization_deleted`, `chunk_mode_changed` — all tracked in `lib/memorization-context.tsx`
- `tag_filter_applied`, `filters_cleared`, `search_performed` — tracked in `app/page.tsx`

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/394357/dashboard/1531222
- **New Signups Over Time** (daily line chart): https://us.posthog.com/project/394357/insights/E88DsJBE
- **Memorization Lifecycle Funnel** (created → familiarize → encode → test): https://us.posthog.com/project/394357/insights/z4lMbrsC
- **Signup-to-First-Set Funnel** (signed up → created set → started training): https://us.posthog.com/project/394357/insights/DnGq9CmC
- **Test Type Breakdown** (first_letter vs full_text vs audio, weekly bar chart): https://us.posthog.com/project/394357/insights/Ejl3b3C7
- **Weekly Active Learners** (unique users doing encode or test sessions): https://us.posthog.com/project/394357/insights/kVdttOwA

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
