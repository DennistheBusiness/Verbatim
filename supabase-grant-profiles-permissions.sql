-- Fix: Grant SELECT permission to authenticated users on profiles table
-- Error 42501 means insufficient privileges at the database level (not just RLS)

-- Grant SELECT permission to authenticated role
GRANT SELECT ON profiles TO authenticated;

-- Optionally grant UPDATE if users need to update their own profiles
GRANT UPDATE ON profiles TO authenticated;

-- Verify the grants were applied
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles' 
  AND grantee = 'authenticated';

-- If you want to see all current permissions:
-- SELECT * FROM information_schema.table_privileges WHERE table_name = 'profiles';
