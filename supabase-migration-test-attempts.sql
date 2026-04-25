-- Migration: Add test_attempts table for per-test progress tracking
-- Run this in Supabase SQL Editor

CREATE TABLE test_attempts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id        UUID NOT NULL REFERENCES memorization_sets(id) ON DELETE CASCADE,
  chunk_id      UUID REFERENCES chunks(id) ON DELETE SET NULL,
  mode          TEXT NOT NULL CHECK (mode IN ('first_letter', 'full_text', 'audio')),
  score         INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  total_words   INTEGER NOT NULL DEFAULT 0,
  correct_words INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_test_attempts_set_id ON test_attempts(set_id, created_at DESC);
CREATE INDEX idx_test_attempts_chunk_id ON test_attempts(chunk_id);

ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own test attempts"
  ON test_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = test_attempts.set_id
        AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own test attempts"
  ON test_attempts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = test_attempts.set_id
        AND memorization_sets.user_id = auth.uid()
    )
  );

-- No UPDATE or DELETE policies — attempts are append-only records

-- Grant access to authenticated users (required when creating tables via SQL)
GRANT SELECT, INSERT ON test_attempts TO authenticated;
