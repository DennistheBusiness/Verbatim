-- Complete RLS Policy Reset for Profiles Table
-- This will fix the 403 errors by ensuring proper policies are in place
-- Run this ENTIRE script in Supabase SQL Editor

-- Step 1: View current policies (for debugging)
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 2: Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- Step 3: Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create fresh policies

-- Allow users to read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to insert their own profile (for new user signup)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 5: Test the policy (should return your profile)
SELECT id, email, user_role FROM profiles WHERE id = auth.uid();

-- Step 6: Verify new policies are in place
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- You should see 3 policies:
-- 1. profiles_insert_own (INSERT)
-- 2. profiles_select_own (SELECT)
-- 3. profiles_update_own (UPDATE)
