-- =====================================================
-- Add AI transcript columns to memorization_sets
-- Run in Supabase SQL Editor
-- =====================================================

ALTER TABLE public.memorization_sets
  ADD COLUMN IF NOT EXISTS transcript TEXT,
  ADD COLUMN IF NOT EXISTS transcript_words JSONB DEFAULT '[]'::jsonb;

-- transcript_words shape:
-- [{ "word": "hello", "start": 0.0, "end": 0.32 }, ...]
-- Populated by Groq Whisper after voice recording.
-- Empty array for text-based sets.
