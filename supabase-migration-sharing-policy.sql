-- Grant table-level SELECT to anon and authenticated roles
-- (RLS policies alone aren't enough — the role needs the privilege first)
GRANT SELECT ON memorization_sets TO anon, authenticated;
GRANT SELECT ON chunks TO anon, authenticated;

-- Allow unauthenticated (anon) users to read memorization_sets that have a share_token
-- This enables the public share preview page without needing service role
CREATE POLICY "Public can read shared sets by share_token"
  ON memorization_sets FOR SELECT
  USING (share_token IS NOT NULL);

-- Allow reading chunks that belong to a shared set
CREATE POLICY "Public can read chunks of shared sets"
  ON chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memorization_sets
      WHERE memorization_sets.id = chunks.set_id
      AND memorization_sets.share_token IS NOT NULL
    )
  );

-- Creator names for share links are resolved via RPC:
-- public.get_shared_creator_meta(p_share_token text)
