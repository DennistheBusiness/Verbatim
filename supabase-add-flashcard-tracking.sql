-- Add flashcard review tracking to memorization_sets
-- Run this in Supabase SQL Editor

-- Add reviewed_chunks column (array of chunk IDs reviewed in flashcard mode)
ALTER TABLE memorization_sets 
ADD COLUMN IF NOT EXISTS reviewed_chunks jsonb DEFAULT '[]'::jsonb;

-- Add marked_chunks column (array of chunk IDs marked for later review)
ALTER TABLE memorization_sets 
ADD COLUMN IF NOT EXISTS marked_chunks jsonb DEFAULT '[]'::jsonb;

-- Add is_custom_chunked flag for manual chunk editing
ALTER TABLE memorization_sets 
ADD COLUMN IF NOT EXISTS is_custom_chunked boolean DEFAULT false;

-- Update existing rows to have empty arrays
UPDATE memorization_sets 
SET reviewed_chunks = '[]'::jsonb 
WHERE reviewed_chunks IS NULL;

UPDATE memorization_sets 
SET marked_chunks = '[]'::jsonb 
WHERE marked_chunks IS NULL;

-- Verify changes
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'memorization_sets' 
  AND column_name IN ('reviewed_chunks', 'marked_chunks', 'is_custom_chunked')
ORDER BY column_name;

SELECT 'Flashcard tracking columns added successfully' as status;
