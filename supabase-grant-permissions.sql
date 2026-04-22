-- Grant proper permissions to authenticated role
-- This is required for RLS to work correctly

-- Grant permissions on memorization_sets
GRANT SELECT, INSERT, UPDATE, DELETE ON memorization_sets TO authenticated;

-- Grant permissions on chunks
GRANT SELECT, INSERT, UPDATE, DELETE ON chunks TO authenticated;

-- Grant permissions on tags
GRANT SELECT, INSERT, UPDATE, DELETE ON tags TO authenticated;

-- Grant permissions on set_tags
GRANT SELECT, INSERT, UPDATE, DELETE ON set_tags TO authenticated;

-- Re-enable RLS now that grants are in place
ALTER TABLE memorization_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_tags ENABLE ROW LEVEL SECURITY;

-- Verify setup
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('memorization_sets', 'chunks', 'tags', 'set_tags')
ORDER BY tablename;

SELECT 'Permissions granted and RLS re-enabled' as status;
