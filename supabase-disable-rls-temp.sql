-- TEMPORARY: Disable RLS to test functionality
-- Run this in Supabase SQL Editor
-- WARNING: This disables security - only use for testing!

ALTER TABLE memorization_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE chunks DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE set_tags DISABLE ROW LEVEL SECURITY;

-- Profiles should stay protected
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

SELECT 'RLS temporarily disabled for testing' as status;
