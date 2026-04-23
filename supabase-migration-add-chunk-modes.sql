-- Migration: Add 'line' and 'custom' chunk modes
-- Run this in Supabase SQL Editor
-- This removes the old constraint and adds a new one that includes the new modes

-- Drop the old constraint
ALTER TABLE memorization_sets 
DROP CONSTRAINT IF EXISTS memorization_sets_chunk_mode_check;

-- Add new constraint with all 4 modes
ALTER TABLE memorization_sets
ADD CONSTRAINT memorization_sets_chunk_mode_check 
CHECK (chunk_mode IN ('paragraph', 'sentence', 'line', 'custom'));
