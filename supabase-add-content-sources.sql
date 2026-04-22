-- Add content source tracking to memorization_sets
-- Run this in Supabase SQL Editor

-- Add audio_file_path column (path to audio file in Supabase Storage)
ALTER TABLE memorization_sets 
ADD COLUMN IF NOT EXISTS audio_file_path TEXT;

-- Add created_from column to track input method
-- Note: 'pdf' is reserved for future use but not currently implemented in the app
ALTER TABLE memorization_sets 
ADD COLUMN IF NOT EXISTS created_from TEXT DEFAULT 'text' 
CHECK (created_from IN ('text', 'pdf', 'voice'));

-- Add original_filename column (currently used for voice recordings)
-- Reserved for future PDF upload feature
ALTER TABLE memorization_sets 
ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Update existing rows to have 'text' as default
UPDATE memorization_sets 
SET created_from = 'text' 
WHERE created_from IS NULL;

-- Verify changes
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'memorization_sets' 
  AND column_name IN ('audio_file_path', 'created_from', 'original_filename')
ORDER BY column_name;

SELECT 'Content source tracking columns added successfully' as status;

-- NOTE: Create storage buckets in Supabase Dashboard -> Storage:
-- 1. Create bucket 'audio-recordings' (private)
-- 2. Add RLS policies:
--    - INSERT: auth.uid() = owner
--    - SELECT: auth.uid() = owner  
--    - DELETE: auth.uid() = owner
