-- TEMPORARY FIX: Disable RLS on profiles to test
-- This will allow reads while we debug
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- After saving this, refresh your browser
-- If Admin Panel appears, then RLS was the issue

-- TO RE-ENABLE (after testing):
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
