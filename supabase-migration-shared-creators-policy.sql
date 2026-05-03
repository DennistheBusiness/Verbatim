-- Incremental sharing migration: allow public read of shared creators' names only

-- Table-level privilege required before RLS policy can allow row access
GRANT SELECT ON profiles TO anon, authenticated;

-- Allow reading profile names for users who have at least one shared set
DROP POLICY IF EXISTS "Public can read shared creators" ON profiles;
CREATE POLICY "Public can read shared creators"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.user_id = profiles.id
      AND memorization_sets.share_token IS NOT NULL
    )
  );
