-- Diagnostic: Check what RLS policies actually exist
-- Run this in Supabase SQL Editor

-- 1. Check if RLS is enabled on profiles
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 2. List ALL policies on profiles table  
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text[] as roles,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- 3. If no policies shown above, profiles table has RLS enabled but NO policies
--    This would block everything! Run this fix:

-- EMERGENCY FIX: Create the missing SELECT policy
CREATE POLICY "profiles_read_own"
  ON profiles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- Then re-run query #2 above to confirm policy exists
