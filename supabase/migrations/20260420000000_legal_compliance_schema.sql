-- Legal compliance schema additions
-- Phase 2: watchlist disputes table + consent/deletion columns on profiles

CREATE TABLE IF NOT EXISTS watchlist_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  ingredient_name TEXT NOT NULL,
  jurisdiction TEXT,
  dispute_description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE watchlist_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_disputes" ON watchlist_disputes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_read_own_disputes" ON watchlist_disputes
  FOR SELECT USING (auth.uid() = user_id);

-- Health data consent columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS health_data_consent_given BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS health_data_consent_timestamp TIMESTAMPTZ;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS health_data_consent_version TEXT;

-- Jurisdiction support for specialists
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS doctor_license_jurisdictions TEXT[] DEFAULT '{}';

-- Age confirmation
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS age_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS age_confirmed_at TIMESTAMPTZ;

-- Account deletion tracking
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deletion_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
