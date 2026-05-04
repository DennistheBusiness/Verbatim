-- Drop and recreate with nonce as the primary key (state column removed).
-- The nonce is embedded in the redirectTo URL so the callback can read it directly.

DROP TABLE IF EXISTS native_auth_transfers;

CREATE TABLE native_auth_transfers (
  nonce      TEXT        PRIMARY KEY,
  code       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS policies = no direct client access; service role bypasses RLS.
ALTER TABLE native_auth_transfers ENABLE ROW LEVEL SECURITY;
