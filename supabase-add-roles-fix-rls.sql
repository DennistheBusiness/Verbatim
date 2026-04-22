-- Fix RLS and Add User Roles System
-- Run this in Supabase SQL Editor

-- 1. Add missing INSERT policy for profiles (needed for trigger to work properly)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Add user_role column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_role TEXT NOT NULL DEFAULT 'general' 
CHECK (user_role IN ('admin', 'general', 'vip'));

-- 3. Create index for role queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON profiles(user_role);

-- 4. Update the trigger to set initial role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, user_role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'general'  -- Default role for new users
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Set existing users to 'general' role (update your own to 'admin' manually)
UPDATE profiles SET user_role = 'general' WHERE user_role IS NULL;

-- 6. Check RLS policies are working
-- Run these to test (replace with your actual user ID):
-- SELECT auth.uid(); -- This should return your current user ID
-- SELECT * FROM memorization_sets WHERE user_id = auth.uid();

-- 7. To make yourself an admin, find your ID and run:
-- First, get your user info:
SELECT id, email, user_role FROM profiles;

-- Then update your role (replace 'YOUR-EMAIL' with your actual email):
-- UPDATE profiles SET user_role = 'admin' WHERE email = 'YOUR-EMAIL-HERE@example.com';

-- 8. Verify all RLS policies exist:
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
