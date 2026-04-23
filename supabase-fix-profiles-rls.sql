-- Fix RLS Policies for Profiles Table
-- This fixes the 403 error when the navigation menu tries to check user roles
-- Run this in Supabase SQL Editor

-- 1. Drop policy if it exists, then create it
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Verify profiles table has RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. List all current policies on profiles table
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Expected policies after running this:
-- 1. Users can insert their own profile (INSERT)
-- 2. Users can view own profile (SELECT) <- This is the one that was missing!
-- 3. Users can update own profile (UPDATE) - if exists
-- 4. Admins can view all profiles (SELECT) - optional for admin panel
