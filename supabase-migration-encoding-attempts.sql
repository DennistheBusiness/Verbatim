-- Migration: Add encoding_attempts table for per-encode-stage progress tracking
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS encoding_attempts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id           UUID NOT NULL REFERENCES memorization_sets(id) ON DELETE CASCADE,
  chunk_id         UUID REFERENCES chunks(id) ON DELETE SET NULL,
  stage            TEXT NOT NULL CHECK (stage IN ('word', 'sentence', 'full')),
  score            INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  total_words      INTEGER NOT NULL DEFAULT 0,
  correct_words    INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_encoding_attempts_set_created
  ON encoding_attempts(set_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_encoding_attempts_set_stage_created
  ON encoding_attempts(set_id, stage, created_at DESC);

ALTER TABLE encoding_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own encoding attempts"
  ON encoding_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = encoding_attempts.set_id
        AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own encoding attempts"
  ON encoding_attempts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = encoding_attempts.set_id
        AND memorization_sets.user_id = auth.uid()
    )
  );

-- No UPDATE or DELETE policies — attempts are append-only records
GRANT SELECT, INSERT ON encoding_attempts TO authenticated;
