-- Migration: Add 'finish_phrase' to test_attempts.mode check constraint
-- Run this against your Supabase project (SQL Editor)

ALTER TABLE test_attempts DROP CONSTRAINT IF EXISTS test_attempts_mode_check;

ALTER TABLE test_attempts
  ADD CONSTRAINT test_attempts_mode_check
  CHECK (mode IN ('first_letter', 'full_text', 'audio', 'finish_phrase'));
