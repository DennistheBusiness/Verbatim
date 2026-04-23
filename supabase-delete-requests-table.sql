-- Create delete_requests table for admin management
-- Run this in Supabase SQL Editor if you want to implement delete requests tracking

-- 1. Create delete_requests table
CREATE TABLE IF NOT EXISTS delete_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  reason TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_delete_requests_user_id ON delete_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_delete_requests_status ON delete_requests(status);
CREATE INDEX IF NOT EXISTS idx_delete_requests_requested_at ON delete_requests(requested_at DESC);

-- 3. Enable RLS
ALTER TABLE delete_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Users can view their own delete requests
CREATE POLICY "Users can view own delete requests"
  ON delete_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own delete requests
CREATE POLICY "Users can create delete requests"
  ON delete_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all delete requests
CREATE POLICY "Admins can view all delete requests"
  ON delete_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role = 'admin'
    )
  );

-- Admins can update delete requests (approve/deny)
CREATE POLICY "Admins can update delete requests"
  ON delete_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_role = 'admin'
    )
  );

-- 5. Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_delete_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to update updated_at on changes
CREATE TRIGGER update_delete_requests_updated_at
  BEFORE UPDATE ON delete_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_delete_request_updated_at();

-- 7. Function to create a delete request from the account page
CREATE OR REPLACE FUNCTION create_delete_request(p_reason TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_user_email TEXT;
  v_request_id UUID;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Create delete request
  INSERT INTO delete_requests (user_id, user_email, reason)
  VALUES (auth.uid(), v_user_email, p_reason)
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage from the account page:
-- const { data, error } = await supabase.rpc('create_delete_request', { p_reason: 'User reason here' })
