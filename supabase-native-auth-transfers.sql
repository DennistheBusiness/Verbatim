-- Temporary store linking a native OAuth flow (identified by state + nonce)
-- to the raw auth code returned by the callback.
-- The code is fetched by WKWebView and exchanged client-side with its own PKCE verifier,
-- bypassing the SFSafariViewController ↔ WKWebView cookie isolation on iOS.

CREATE TABLE IF NOT EXISTS native_auth_transfers (
  state      TEXT        PRIMARY KEY,
  nonce      TEXT        NOT NULL UNIQUE,
  code       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS policies = no direct client access; service role bypasses RLS.
ALTER TABLE native_auth_transfers ENABLE ROW LEVEL SECURITY;
