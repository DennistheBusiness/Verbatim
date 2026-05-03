-- Add share token column to memorization_sets for set sharing via link
ALTER TABLE memorization_sets ADD COLUMN share_token TEXT UNIQUE;

CREATE INDEX idx_memorization_sets_share_token ON memorization_sets(share_token);
