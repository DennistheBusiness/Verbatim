-- DEBUG: Test memorization_sets INSERT
-- Run these queries ONE AT A TIME in Supabase SQL Editor

-- Step 1: Check if you're authenticated
SELECT auth.uid() as my_user_id, auth.email() as my_email;
-- This should return your UUID and email. If NULL, you're not logged in to Supabase SQL Editor.

-- Step 2: Check your profile exists
SELECT * FROM profiles WHERE id = auth.uid();
-- This should return your profile row.

-- Step 3: Try to insert a test memorization set
INSERT INTO memorization_sets (user_id, title, content, chunk_mode)
VALUES (
  auth.uid(),
  'Test Set',
  'This is test content for debugging.',
  'paragraph'
)
RETURNING *;
-- If this works, the RLS is fine and the issue is in the app code.
-- If this fails with 403, there's an RLS problem.

-- Step 4: Check all RLS policies on memorization_sets
SELECT * FROM pg_policies WHERE tablename = 'memorization_sets';

-- Step 5: If Step 3 failed, temporarily disable RLS to test
-- ALTER TABLE memorization_sets DISABLE ROW LEVEL SECURITY;
-- (Re-enable it after testing: ALTER TABLE memorization_sets ENABLE ROW LEVEL SECURITY;)
