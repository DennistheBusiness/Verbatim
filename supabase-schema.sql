-- Verbatim — Complete Database Schema
-- Single source of truth. Run in Supabase SQL Editor to provision from scratch.
-- Last updated: 2026-05-02
--
-- Incorporates all migrations:
--   supabase-migration-add-chunk-modes.sql
--   supabase-add-content-sources.sql
--   supabase-add-roles-fix-rls.sql
--   supabase-add-flashcard-tracking.sql
--   supabase-add-transcript.sql
--   supabase-migration-spaced-repetition.sql
--   supabase-migration-test-attempts.sql
--   supabase-restore-rls.sql

-- =====================================================
-- EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, user_role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'general'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_tags(user_uuid UUID)
RETURNS TABLE (name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT t.name
  FROM tags t
  WHERE t.user_id = user_uuid
  ORDER BY t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PROFILES
-- =====================================================

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  user_role   TEXT NOT NULL DEFAULT 'general' CHECK (user_role IN ('admin', 'general', 'vip')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_role ON profiles(user_role);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MEMORIZATION SETS
-- =====================================================

CREATE TABLE memorization_sets (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  content           TEXT NOT NULL,
  chunk_mode        TEXT NOT NULL DEFAULT 'paragraph'
                      CHECK (chunk_mode IN ('paragraph', 'sentence', 'line', 'custom')),
  -- Input method
  created_from      TEXT DEFAULT 'text' CHECK (created_from IN ('text', 'voice', 'pdf')),
  audio_file_path   TEXT,
  original_filename TEXT,
  -- AI transcript (voice sets)
  transcript        TEXT,
  transcript_words  JSONB DEFAULT '[]'::jsonb,
  -- Familiarize state
  reviewed_chunks   JSONB DEFAULT '[]'::jsonb,
  marked_chunks     JSONB DEFAULT '[]'::jsonb,
  is_custom_chunked BOOLEAN DEFAULT false,
  -- Spaced repetition
  repetition_mode   TEXT NOT NULL DEFAULT 'ai' CHECK (repetition_mode IN ('ai', 'manual', 'off')),
  repetition_config JSONB NOT NULL DEFAULT '{}',
  -- Learning progress
  progress          JSONB NOT NULL DEFAULT '{
    "familiarizeCompleted": false,
    "encode": {
      "stage1Completed": false,
      "stage2Completed": false,
      "stage3Completed": false,
      "lastScore": null
    },
    "tests": {
      "firstLetter": { "bestScore": null, "lastScore": null },
      "fullText":    { "bestScore": null, "lastScore": null }
    }
  }'::jsonb,
  session_state     JSONB NOT NULL DEFAULT '{
    "currentStep": null,
    "currentChunkIndex": null,
    "currentEncodeStage": null,
    "lastVisitedAt": null
  }'::jsonb,
  recommended_step  TEXT NOT NULL DEFAULT 'familiarize'
                      CHECK (recommended_step IN ('familiarize', 'encode', 'test')),
  share_token       TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memorization_sets_user_id ON memorization_sets(user_id);
CREATE INDEX idx_memorization_sets_created_at ON memorization_sets(user_id, created_at DESC);

ALTER TABLE memorization_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sets"
  ON memorization_sets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sets"
  ON memorization_sets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sets"
  ON memorization_sets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sets"
  ON memorization_sets FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_memorization_sets_updated_at
  BEFORE UPDATE ON memorization_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CHUNKS
-- =====================================================

CREATE TABLE chunks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id      UUID NOT NULL REFERENCES memorization_sets(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(set_id, order_index)
);

CREATE INDEX idx_chunks_set_id_order ON chunks(set_id, order_index);

ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chunks of their sets"
  ON chunks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = chunks.set_id
        AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chunks for their sets"
  ON chunks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = chunks.set_id
        AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update chunks of their sets"
  ON chunks FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = chunks.set_id
        AND memorization_sets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = chunks.set_id
        AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chunks of their sets"
  ON chunks FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = chunks.set_id
        AND memorization_sets.user_id = auth.uid()
    )
  );

-- =====================================================
-- TAGS
-- =====================================================

CREATE TABLE tags (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_name ON tags(user_id, name);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tags"
  ON tags FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
  ON tags FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON tags FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON tags FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =====================================================
-- SET_TAGS
-- =====================================================

CREATE TABLE set_tags (
  set_id     UUID NOT NULL REFERENCES memorization_sets(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (set_id, tag_id)
);

CREATE INDEX idx_set_tags_set_id ON set_tags(set_id);
CREATE INDEX idx_set_tags_tag_id ON set_tags(tag_id);

ALTER TABLE set_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view set_tags for their sets"
  ON set_tags FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = set_tags.set_id
        AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert set_tags for their sets"
  ON set_tags FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = set_tags.set_id
        AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete set_tags for their sets"
  ON set_tags FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = set_tags.set_id
        AND memorization_sets.user_id = auth.uid()
    )
  );

-- =====================================================
-- CHUNK_PROGRESS  (spaced repetition — SM-2 algorithm)
-- =====================================================

CREATE TABLE chunk_progress (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  set_id           UUID NOT NULL REFERENCES memorization_sets(id) ON DELETE CASCADE,
  chunk_id         UUID NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  ease_factor      FLOAT NOT NULL DEFAULT 2.5,   -- SM-2 ease, clamped [1.3, 2.5]
  interval_days    FLOAT NOT NULL DEFAULT 1,
  repetitions      INTEGER NOT NULL DEFAULT 0,
  last_score       INTEGER,                       -- 0–100
  last_reviewed_at TIMESTAMPTZ,
  next_review_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, chunk_id)
);

CREATE INDEX idx_chunk_progress_user_next ON chunk_progress(user_id, next_review_at);
CREATE INDEX idx_chunk_progress_set ON chunk_progress(set_id);

ALTER TABLE chunk_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own chunk progress"
  ON chunk_progress FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON chunk_progress TO authenticated;

-- =====================================================
-- TEST_ATTEMPTS  (append-only test history)
-- =====================================================

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

-- Ownership checked via memorization_sets (no direct user_id column)
CREATE POLICY "Users can view their own test attempts"
  ON test_attempts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = test_attempts.set_id
        AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own test attempts"
  ON test_attempts FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = test_attempts.set_id
        AND memorization_sets.user_id = auth.uid()
    )
  );

-- No UPDATE/DELETE — attempts are immutable records

GRANT SELECT, INSERT ON test_attempts TO authenticated;

-- =====================================================
-- STORAGE  (manage in Supabase Dashboard → Storage)
-- =====================================================
-- Bucket: audio-recordings (private)
-- Path format: {user_id}/{set_id}.{extension}
-- RLS policies (set via Dashboard):
--   INSERT: (storage.foldername(name))[1] = auth.uid()::text
--   SELECT: (storage.foldername(name))[1] = auth.uid()::text
--   DELETE: (storage.foldername(name))[1] = auth.uid()::text
