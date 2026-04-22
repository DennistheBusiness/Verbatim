-- Fix RLS Policies for Profile Creation
-- Run this in Supabase SQL Editor to fix the 403 errors

-- Add INSERT policy for profiles (users can create their own profile)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Verify the trigger exists and is correct
-- If you see this in the output, the trigger is working correctly
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check if profiles exist for authenticated users
SELECT COUNT(*) as profile_count FROM profiles;

-- If the count is 0 and you've already signed up, manually create your profile:
-- First, get your user ID:
SELECT id, email FROM auth.users;

-- Then insert your profile (replace 'YOUR-USER-ID' with actual ID from above):
-- INSERT INTO profiles (id, email, full_name)
-- VALUES ('YOUR-USER-ID', 'your-email@example.com', 'Your Name');
