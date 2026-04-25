-- Migration: Spaced Repetition System
-- Run this in Supabase SQL Editor

-- Add repetition mode columns to memorization_sets
ALTER TABLE memorization_sets
  ADD COLUMN IF NOT EXISTS repetition_mode TEXT NOT NULL DEFAULT 'ai'
    CHECK (repetition_mode IN ('ai', 'manual', 'off')),
  ADD COLUMN IF NOT EXISTS repetition_config JSONB NOT NULL DEFAULT '{}';
-- repetition_config for 'manual' mode: { "frequency": 3, "period": "week" }

-- chunk_progress: one row per (user, chunk), upserted after each practice session
CREATE TABLE IF NOT EXISTS chunk_progress (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  set_id           UUID NOT NULL REFERENCES memorization_sets(id) ON DELETE CASCADE,
  chunk_id         UUID NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  ease_factor      FLOAT NOT NULL DEFAULT 2.5,    -- SM-2 ease, clamped [1.3, 2.5]
  interval_days    FLOAT NOT NULL DEFAULT 1,       -- FLOAT so manual fractions work
  repetitions      INTEGER NOT NULL DEFAULT 0,
  last_score       INTEGER,                        -- 0-100
  last_reviewed_at TIMESTAMPTZ,
  next_review_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, chunk_id)
);

CREATE INDEX IF NOT EXISTS idx_chunk_progress_user_next
  ON chunk_progress(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_chunk_progress_set
  ON chunk_progress(set_id);

ALTER TABLE chunk_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own chunk progress"
  ON chunk_progress FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON chunk_progress TO authenticated;
