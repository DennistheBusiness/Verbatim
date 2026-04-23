-- Restore RLS policies for production security

-- 1. Re-enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop old policies if they exist
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- 3. Create comprehensive RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 4. Re-enable RLS on memorization_sets if not already enabled
ALTER TABLE memorization_sets ENABLE ROW LEVEL SECURITY;

-- 5. Create/update policies for memorization_sets
DROP POLICY IF EXISTS "Users can view their own sets" ON memorization_sets;
DROP POLICY IF EXISTS "Users can insert their own sets" ON memorization_sets;
DROP POLICY IF EXISTS "Users can update their own sets" ON memorization_sets;
DROP POLICY IF EXISTS "Users can delete their own sets" ON memorization_sets;

CREATE POLICY "Users can view their own sets"
  ON memorization_sets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sets"
  ON memorization_sets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sets"
  ON memorization_sets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sets"
  ON memorization_sets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Ensure chunks table has RLS
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view chunks of their sets" ON chunks;
DROP POLICY IF EXISTS "Users can insert chunks for their sets" ON chunks;
DROP POLICY IF EXISTS "Users can update chunks of their sets" ON chunks;
DROP POLICY IF EXISTS "Users can delete chunks of their sets" ON chunks;

CREATE POLICY "Users can view chunks of their sets"
  ON chunks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = chunks.set_id
      AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chunks for their sets"
  ON chunks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = chunks.set_id
      AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update chunks of their sets"
  ON chunks FOR UPDATE
  TO authenticated
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
  ON chunks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = chunks.set_id
      AND memorization_sets.user_id = auth.uid()
    )
  );

-- 7. Ensure tags table has RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tags" ON tags;
DROP POLICY IF EXISTS "Users can insert their own tags" ON tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON tags;

CREATE POLICY "Users can view their own tags"
  ON tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 8. Ensure set_tags table has RLS
ALTER TABLE set_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view set_tags for their sets" ON set_tags;
DROP POLICY IF EXISTS "Users can insert set_tags for their sets" ON set_tags;
DROP POLICY IF EXISTS "Users can delete set_tags for their sets" ON set_tags;

CREATE POLICY "Users can view set_tags for their sets"
  ON set_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = set_tags.set_id
      AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert set_tags for their sets"
  ON set_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = set_tags.set_id
      AND memorization_sets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete set_tags for their sets"
  ON set_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = set_tags.set_id
      AND memorization_sets.user_id = auth.uid()
    )
  );

-- 9. Verify all policies are in place
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Success message
SELECT 'RLS policies restored successfully!' as status;
