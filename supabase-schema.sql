-- Verbatim Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create profile automatically on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- MEMORIZATION SETS TABLE
-- =====================================================
CREATE TABLE memorization_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  chunk_mode TEXT NOT NULL DEFAULT 'paragraph' CHECK (chunk_mode IN ('paragraph', 'sentence', 'line', 'custom')),
  progress JSONB NOT NULL DEFAULT '{
    "familiarizeCompleted": false,
    "encode": {
      "stage1Completed": false,
      "stage2Completed": false,
      "stage3Completed": false,
      "lastScore": null
    },
    "tests": {
      "firstLetter": {
        "bestScore": null,
        "lastScore": null
      },
      "fullText": {
        "bestScore": null,
        "lastScore": null
      }
    }
  }'::jsonb,
  session_state JSONB NOT NULL DEFAULT '{
    "currentStep": null,
    "currentChunkIndex": null,
    "currentEncodeStage": null,
    "lastVisitedAt": null
  }'::jsonb,
  recommended_step TEXT NOT NULL DEFAULT 'familiarize' CHECK (recommended_step IN ('familiarize', 'encode', 'test')),
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_memorization_sets_user_id ON memorization_sets(user_id);
CREATE INDEX idx_memorization_sets_created_at ON memorization_sets(user_id, created_at DESC);

-- RLS Policies for memorization_sets
ALTER TABLE memorization_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sets"
  ON memorization_sets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sets"
  ON memorization_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sets"
  ON memorization_sets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sets"
  ON memorization_sets FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- CHUNKS TABLE
-- =====================================================
CREATE TABLE chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id UUID NOT NULL REFERENCES memorization_sets(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(set_id, order_index)
);

-- Create index for ordered retrieval
CREATE INDEX idx_chunks_set_id_order ON chunks(set_id, order_index);

-- RLS Policies for chunks
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chunks of their own sets"
  ON chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = chunks.set_id
      AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chunks for their own sets"
  ON chunks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = chunks.set_id
      AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update chunks of their own sets"
  ON chunks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = chunks.set_id
      AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chunks of their own sets"
  ON chunks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = chunks.set_id
      AND memorization_sets.user_id = auth.uid()
    )
  );

-- =====================================================
-- TAGS TABLE
-- =====================================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create index for tag lookups
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_name ON tags(user_id, name);

-- RLS Policies for tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- SET_TAGS JUNCTION TABLE
-- =====================================================
CREATE TABLE set_tags (
  set_id UUID NOT NULL REFERENCES memorization_sets(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (set_id, tag_id)
);

-- Create indexes for junction table
CREATE INDEX idx_set_tags_set_id ON set_tags(set_id);
CREATE INDEX idx_set_tags_tag_id ON set_tags(tag_id);

-- RLS Policies for set_tags
ALTER TABLE set_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view set_tags for their own sets"
  ON set_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = set_tags.set_id
      AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create set_tags for their own sets"
  ON set_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = set_tags.set_id
      AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete set_tags for their own sets"
  ON set_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = set_tags.set_id
      AND memorization_sets.user_id = auth.uid()
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get all tags for a user
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memorization_sets_updated_at
  BEFORE UPDATE ON memorization_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================

-- Run this after you've created your first user account
-- Replace 'your-user-id-here' with your actual auth.users.id

-- Example:
-- INSERT INTO memorization_sets (user_id, title, content, chunk_mode)
-- VALUES (
--   'your-user-id-here',
--   'Sample Memorization Set',
--   'This is a sample paragraph for testing.\n\nThis is another paragraph.',
--   'paragraph'
-- );
