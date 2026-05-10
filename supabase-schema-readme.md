# Verbatim — Database Schema Reference

**Last updated:** 2026-05-10  
**Database:** Supabase (PostgreSQL)  
**Source of truth:** [`supabase-schema.sql`](./supabase-schema.sql)

---

## Overview

Verbatim helps users memorize text through a three-phase learning flow:

1. **Teach (Familiarize)** — read and mark chunks as reviewed
2. **Train (Encode)** — progressive word/sentence/full-recall drills
3. **Test** — first-letter cues, full-text recall, audio, finish-the-phrase

The database stores sets, their chunks, user activity history (attempts), spaced-repetition state, and supporting metadata (tags, profiles).

---

## Entity Relationship Diagram

```
auth.users
    │
    └──▶ profiles (1:1)
              │
              ├──▶ memorization_sets (1:N)
              │         │
              │         ├──▶ chunks (1:N)
              │         │         │
              │         │         ├──▶ chunk_progress (1:1 per user)
              │         │         ├──▶ test_attempts (1:N)
              │         │         └──▶ encoding_attempts (1:N)
              │         │
              │         └──▶ set_tags (N:M) ──▶ tags
              │
              └──▶ tags (1:N)
```

---

## Tables

### `profiles`

Mirrors `auth.users`. Created automatically via the `handle_new_user` trigger on signup.

| Column      | Type        | Notes                                            |
|-------------|-------------|--------------------------------------------------|
| `id`        | UUID PK     | References `auth.users(id)`                      |
| `email`     | TEXT UNIQUE | Copied from auth on creation                     |
| `full_name` | TEXT        | From OAuth metadata                              |
| `avatar_url`| TEXT        | From OAuth metadata                              |
| `user_role` | TEXT        | `'admin'` \| `'general'` \| `'vip'`. Default `'general'` |
| `created_at`| TIMESTAMPTZ |                                                  |
| `updated_at`| TIMESTAMPTZ | Auto-updated by trigger                          |

**RLS:** Users can only read/write their own row.

---

### `memorization_sets`

The primary entity. One row per text a user is memorizing.

| Column              | Type        | Notes                                                       |
|---------------------|-------------|-------------------------------------------------------------|
| `id`                | UUID PK     |                                                             |
| `user_id`           | UUID FK     | → `profiles(id)`                                           |
| `title`             | TEXT        |                                                             |
| `content`           | TEXT        | Full original text                                          |
| `chunk_mode`        | TEXT        | `paragraph` \| `sentence` \| `line` \| `custom`            |
| `created_from`      | TEXT        | `text` \| `voice` \| `pdf`                                 |
| `audio_file_path`   | TEXT        | Storage path for voice sets                                 |
| `original_filename` | TEXT        | Original upload filename                                    |
| `transcript`        | TEXT        | AI-generated transcript (voice input)                       |
| `transcript_words`  | JSONB `[]`  | Word-level timestamps from Whisper                          |
| `reviewed_chunks`   | JSONB `[]`  | Array of chunk IDs marked as read in Familiarize            |
| `marked_chunks`     | JSONB `[]`  | Array of chunk IDs manually marked complete                 |
| `is_custom_chunked` | BOOLEAN     | True when user has manually split chunks                    |
| `repetition_mode`   | TEXT        | `ai` \| `manual` \| `off`                                  |
| `repetition_config` | JSONB `{}`  | SM-2 config overrides                                       |
| `progress`          | JSONB       | Nested learning state (see below)                           |
| `session_state`     | JSONB       | Last active step/chunk/stage (resume support)               |
| `recommended_step`  | TEXT        | `familiarize` \| `encode` \| `test`                         |
| `share_token`       | TEXT UNIQUE | Nullable; set when user shares the set                      |
| `created_at`        | TIMESTAMPTZ |                                                             |
| `updated_at`        | TIMESTAMPTZ | Auto-updated by trigger                                     |

**`progress` JSONB shape:**
```json
{
  "familiarizeCompleted": false,
  "reviewedChunks": [],
  "markedChunks": [],
  "encode": {
    "stage1Completed": false,
    "stage2Completed": false,
    "stage3Completed": false,
    "lastScore": null
  },
  "tests": {
    "firstLetter":  { "bestScore": null, "lastScore": null },
    "fullText":     { "bestScore": null, "lastScore": null },
    "audioTest":    { "bestScore": null, "lastScore": null },
    "finishPhrase": { "bestScore": null, "lastScore": null },
    "sortingGame":  { "bestScore": null, "lastScore": null }
  },
  "streak": {
    "currentStreak": 0,
    "longestStreak": 0,
    "lastPracticeDate": null
  }
}
```

> **Note:** `reviewedChunks` and `markedChunks` exist both as top-level columns on `memorization_sets` (`reviewed_chunks`, `marked_chunks` JSONB columns) AND inside `progress`. The columns are the authoritative source; the progress fields are kept in sync for legacy compatibility.

**`session_state` JSONB shape:**
```json
{
  "currentStep": "encode",
  "currentChunkIndex": 3,
  "currentEncodeStage": 2,
  "lastVisitedAt": "2026-05-10T12:00:00Z"
}
```

**RLS:** Users can SELECT / INSERT / UPDATE / DELETE only their own sets.

---

### `chunks`

Individual passages within a memorization set. Order is preserved via `order_index`.

| Column        | Type    | Notes                        |
|---------------|---------|------------------------------|
| `id`          | UUID PK |                              |
| `set_id`      | UUID FK | → `memorization_sets(id)`   |
| `order_index` | INTEGER | 0-based, unique per set      |
| `text`        | TEXT    | The passage text             |
| `created_at`  | TIMESTAMPTZ |                          |

**Constraint:** `UNIQUE(set_id, order_index)` — prevents ordering gaps/duplicates.

**RLS:** Ownership determined by joining to `memorization_sets.user_id`.

---

### `tags`

User-defined labels for organizing sets.

| Column      | Type    | Notes                  |
|-------------|---------|------------------------|
| `id`        | UUID PK |                        |
| `user_id`   | UUID FK | → `profiles(id)`       |
| `name`      | TEXT    | Case-sensitive tag name |
| `created_at`| TIMESTAMPTZ |               |

**Constraint:** `UNIQUE(user_id, name)` — each user's tag names are unique.

**Helper function:** `get_user_tags(user_uuid UUID)` returns all distinct tag names for a user, sorted alphabetically — used by the tag picker in the UI.

**RLS:** Users manage only their own tags.

---

### `set_tags`

Many-to-many join between sets and tags.

| Column      | Type    | Notes                     |
|-------------|---------|---------------------------|
| `set_id`    | UUID FK | → `memorization_sets(id)` |
| `tag_id`    | UUID FK | → `tags(id)`              |
| `created_at`| TIMESTAMPTZ |                      |

**PK:** `(set_id, tag_id)` composite.

**RLS:** Ownership determined by joining to `memorization_sets.user_id`.

---

### `chunk_progress`

Per-user spaced-repetition state for each chunk. Implements the **SM-2 algorithm**.

| Column           | Type    | Notes                                        |
|------------------|---------|----------------------------------------------|
| `id`             | UUID PK |                                              |
| `user_id`        | UUID FK | → `profiles(id)`                            |
| `set_id`         | UUID FK | → `memorization_sets(id)`                  |
| `chunk_id`       | UUID FK | → `chunks(id)`                              |
| `ease_factor`    | FLOAT   | SM-2 ease, clamped to [1.3 – 2.5]           |
| `interval_days`  | FLOAT   | Days until next review (grows with success)  |
| `repetitions`    | INTEGER | Total successful reviews                     |
| `last_score`     | INTEGER | 0–100, most recent session score             |
| `last_reviewed_at` | TIMESTAMPTZ |                                        |
| `next_review_at` | TIMESTAMPTZ | Drives the "due today" queue            |
| `created_at`     | TIMESTAMPTZ |                                         |

**Constraint:** `UNIQUE(user_id, chunk_id)` — one SM-2 record per chunk per user.

**RLS:** Users fully manage (`ALL`) their own rows.

---

### `test_attempts`

The **unified, append-only history table** for all scored activities across both the Train and Test phases. Every game or drill that produces a score writes a row here. Used by the Analytics page for all charts, personal bests, method breakdowns, and session history.

**Written by two code paths:**

- `updateTestScore` — called when any of the five Test/Train mini-games completes:

| `mode` value    | Game / Activity                  | Phase  |
|-----------------|----------------------------------|--------|
| `first_letter`  | First Letter Recall Test         | Test   |
| `full_text`     | Full Text Recall (Typing Test)   | Test   |
| `audio`         | Audio Recall Test                | Test   |
| `finish_phrase` | Finish That Phrase               | Train  |
| `sorting_game`  | Sorting Game                     | Train  |

- `updateEncodeProgress` — each First Letter Method (encode) session also dual-writes a row here (in addition to writing to `encoding_attempts`) so that all Train activity appears in unified analytics. It inserts `step = 'train'` and modes `encode_l1`, `encode_l2`, `encode_l3`.

| Column          | Type    | Notes                                                               |
|-----------------|---------|---------------------------------------------------------------------|
| `id`            | UUID PK |                                                                     |
| `set_id`        | UUID FK | → `memorization_sets(id)`                                          |
| `chunk_id`      | UUID FK | → `chunks(id)`, nullable (null = whole-set session)                |
| `step`          | TEXT    | `'test'` (default) for Test phase; `'train'` for Train phase activities |
| `mode`          | TEXT    | `first_letter`, `full_text`, `audio`, `finish_phrase`, `sorting_game`, `encode_l1`, `encode_l2`, `encode_l3` |
| `score`         | INTEGER | 0–100                                                               |
| `total_words`   | INTEGER | Total words in the session                                          |
| `correct_words` | INTEGER | Words answered correctly                                            |
| `created_at`    | TIMESTAMPTZ |                                                                 |

**No UPDATE/DELETE** — records are immutable. The analytics page always works from the full history.

**RLS:** Ownership via `memorization_sets.user_id`. SELECT + INSERT only.

---

### `encoding_attempts`

Immutable append-only log specifically for the **Progressive Chunk Encoder** — the First Letter Method Train drill (Stage 1 = word-level, Stage 2 = sentence-level, Stage 3 = full-recall). This is the only activity that writes to this table; no other Train or Test game writes here.

**Relationship with `test_attempts`:** Every encode session writes to **both** this table and `test_attempts`. `encoding_attempts` is the detailed, stage-specific log (including `duration_seconds`). `test_attempts` receives the same attempt as a unified record (mode `encode_l1/l2/l3`) so that Train analytics can be built from a single source.

| Column            | Type    | Notes                                                              |
|-------------------|---------|--------------------------------------------------------------------|
| `id`              | UUID PK |                                                                    |
| `set_id`          | UUID FK | → `memorization_sets(id)`                                         |
| `chunk_id`        | UUID FK | → `chunks(id)`, nullable (null = whole-set session)               |
| `stage`           | TEXT    | `word` (Stage 1) \| `sentence` (Stage 2) \| `full` (Stage 3); mapped from numeric stage in `updateEncodeProgress` |
| `score`           | INTEGER | 0–100                                                              |
| `total_words`     | INTEGER | Total words in the session                                         |
| `correct_words`   | INTEGER | Words answered correctly                                           |
| `duration_seconds`| INTEGER | Session length in seconds. `NOT NULL DEFAULT 0` — 0 when not tracked      |
| `created_at`      | TIMESTAMPTZ |                                                                |

**No UPDATE/DELETE** — immutable records.

**RLS:** Ownership via `memorization_sets.user_id`. SELECT + INSERT only.

---

## Storage

**Bucket:** `audio-recordings` (private)

**Path format:** `{user_id}/{set_id}.{extension}`

**RLS policies** (configured in Supabase Dashboard → Storage):
- `INSERT`: `(storage.foldername(name))[1] = auth.uid()::text`
- `SELECT`: `(storage.foldername(name))[1] = auth.uid()::text`
- `DELETE`: `(storage.foldername(name))[1] = auth.uid()::text`

---

## Functions & Triggers

### Functions

| Function | Purpose |
|---|---|
| `update_updated_at_column()` | Trigger function — sets `updated_at = NOW()` on any UPDATE |
| `handle_new_user()` | Trigger function — inserts a `profiles` row when a new `auth.users` row is created |
| `get_user_tags(user_uuid)` | Returns distinct tag names for a user, sorted alphabetically |

### Triggers

| Trigger | Table | Event | Function |
|---|---|---|---|
| `on_auth_user_created` | `auth.users` | AFTER INSERT | `handle_new_user()` |
| `update_profiles_updated_at` | `profiles` | BEFORE UPDATE | `update_updated_at_column()` |
| `update_memorization_sets_updated_at` | `memorization_sets` | BEFORE UPDATE | `update_updated_at_column()` |

---

## Row Level Security Summary

All tables have RLS enabled. The general pattern:

- **Owner-column tables** (`profiles`, `tags`, `memorization_sets`, `chunk_progress`): policies use `auth.uid() = user_id` directly.
- **Child tables** (`chunks`, `set_tags`, `test_attempts`, `encoding_attempts`): policies join back to `memorization_sets` to verify `user_id = auth.uid()`.
- **Attempt tables** (`test_attempts`, `encoding_attempts`): SELECT + INSERT only — no update or delete to preserve history integrity.

---

## Key Relationships

```
profiles 1 ──── N memorization_sets
memorization_sets 1 ──── N chunks
memorization_sets N ──── M tags  (via set_tags)
chunks 1 ──── 1 chunk_progress  (per user)
chunks 1 ──── N test_attempts
chunks 1 ──── N encoding_attempts
memorization_sets 1 ──── N test_attempts
memorization_sets 1 ──── N encoding_attempts
```

---

## Analytics Page Queries (reference)

Two components read from these tables: `app/analytics/page.tsx` and `components/score-chart.tsx`. Both query `test_attempts` and `encoding_attempts` in parallel and merge results client-side for charting.

**`test_attempts` query (all scored activities):**
```sql
SELECT id, mode, score, total_words, correct_words, created_at
FROM test_attempts
WHERE set_id = $1
ORDER BY created_at ASC;
```
`mode` values present in production: `first_letter`, `full_text`, `audio`, `finish_phrase`, `sorting_game`. The code also attempts to insert `encode_l1/l2/l3` via dual-write from the encode flow — verify these are accepted by the live DB constraint before filtering on them.

**`encoding_attempts` query (First Letter Method Train drill only):**
```sql
SELECT id, stage, score, total_words, correct_words, duration_seconds, created_at
FROM encoding_attempts
WHERE set_id = $1
ORDER BY created_at ASC;
```
`stage` values: `word`, `sentence`, `full` — corresponding to encode Stage 1, 2, and 3.

Both queries are scoped by RLS — no explicit `user_id` filter needed in the query.
