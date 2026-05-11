-- ============================================================
-- Verbatim Billing Migration
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. Add billing columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan_type          TEXT    NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT   NOT NULL DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS trial_ends_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_expires_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revenuecat_id      TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Allowed values for plan_type:    'none' | 'monthly' | 'annual' | 'three_year' | 'free'
-- Allowed values for subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused'

-- 2. Set trial_ends_at automatically for new users (7 days from signup)
CREATE OR REPLACE FUNCTION set_trial_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.trial_ends_at := NOW() + INTERVAL '7 days';
  NEW.subscription_status := 'trialing';
  NEW.plan_type := 'none';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_trial_on_signup ON profiles;
CREATE TRIGGER trigger_set_trial_on_signup
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_trial_on_signup();

-- 3. Backfill existing users: give them a grace trial that ends 7 days from now
UPDATE profiles
SET
  trial_ends_at       = NOW() + INTERVAL '7 days',
  subscription_status = 'trialing',
  plan_type           = 'none'
WHERE trial_ends_at IS NULL
  AND user_role NOT IN ('admin');

-- Admin accounts get a permanent free plan
UPDATE profiles
SET
  plan_type           = 'free',
  subscription_status = 'active'
WHERE user_role = 'admin';

-- 4. Student codes table
CREATE TABLE IF NOT EXISTS student_codes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT        UNIQUE NOT NULL,
  max_uses    INT         NOT NULL DEFAULT 1,
  use_count   INT         NOT NULL DEFAULT 0,
  created_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ
);

-- Only admins can read/write student_codes
ALTER TABLE student_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_student_codes" ON student_codes;
CREATE POLICY "admin_all_student_codes" ON student_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.user_role = 'admin'
    )
  );

-- 5. Add 'student' to role options comment (no enum constraint, just docs)
COMMENT ON COLUMN profiles.user_role IS
  'Allowed values: general | vip | student | admin';

-- 6. Indexes for billing lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_revenuecat      ON profiles(revenuecat_id)      WHERE revenuecat_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at   ON profiles(trial_ends_at);
