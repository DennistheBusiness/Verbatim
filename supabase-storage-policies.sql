-- RLS Policies for audio-recordings Storage Bucket
-- ⚠️ NOTE: These policies must be created via the Supabase Dashboard UI
-- Storage policies require special permissions that SQL Editor doesn't have

-- =============================================================================
-- INSTRUCTIONS: Create these policies via Supabase Dashboard → Storage
-- =============================================================================

-- 1. Go to: https://supabase.com/dashboard/project/riryqmkvrkuxhphvhhxs/storage/buckets
-- 2. Click on "audio-recordings" bucket
-- 3. Click "Policies" tab
-- 4. Click "New Policy" button
-- 5. Create the following 3 policies:

-- -----------------------------------------------------------------------------
-- POLICY 1: INSERT (Upload)
-- -----------------------------------------------------------------------------
-- Policy name: Users can upload their own audio files
-- Allowed operation: Check only "INSERT"
-- Target roles: Select "authenticated" (NOT public)
-- Policy definition: In the code editor, paste this FULL expression:
(bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1])

-- Click "Review" → "Save policy"

-- -----------------------------------------------------------------------------
-- POLICY 2: SELECT (Download/View)
-- -----------------------------------------------------------------------------
-- Policy name: Users can view their own audio files
-- Allowed operation: Check only "SELECT"
-- Target roles: Select "authenticated" (NOT public)
-- Policy definition: In the code editor, paste this FULL expression:
(bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1])

-- Click "Review" → "Save policy"

-- -----------------------------------------------------------------------------
-- POLICY 3: DELETE (Remove)
-- -----------------------------------------------------------------------------
-- Policy name: Users can delete their own audio files
-- Allowed operation: Check only "DELETE"
-- Target roles: Select "authenticated" (NOT public)
-- Policy definition: In the code editor, paste this FULL expression:
(bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1])

-- Click "Review" → "Save policy"

-- =============================================================================
-- How the policies work:
-- =============================================================================
-- 
-- Path format: {user_id}/{set_id}.{extension}
-- Example:     550e8400-e29b-41d4-a716-446655440000/abc-123.webm
--
-- storage.foldername(name) returns: ['550e8400-e29b-41d4-a716-446655440000', 'abc-123.webm']
-- [1] gets the first element (user_id)
-- auth.uid()::text converts the authenticated user's UUID to text
--
-- So each policy checks: "Does the first folder in the path match the user's ID?"
-- This ensures users can only access their own audio files.
-- =============================================================================
