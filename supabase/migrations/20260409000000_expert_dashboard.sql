-- Expert dashboard: prescriptions, KYC, reviews, specialist columns, RLS helpers
-- Run in Supabase SQL editor if migrations folder is not applied automatically.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE specialists ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS allows_anonymous BOOLEAN DEFAULT FALSE;
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending';
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS license_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS researchgate_url TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT;

CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  patient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  dosage_unit TEXT,
  frequency TEXT,
  duration TEXT,
  instructions TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_expert ON prescriptions(expert_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_user_id);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expert_manage_prescriptions" ON prescriptions;
CREATE POLICY "expert_manage_prescriptions" ON prescriptions FOR ALL
  USING (
    auth.uid() = (SELECT s.user_id FROM specialists s WHERE s.id = prescriptions.expert_id LIMIT 1)
  )
  WITH CHECK (
    auth.uid() = (SELECT s.user_id FROM specialists s WHERE s.id = prescriptions.expert_id LIMIT 1)
  );

DROP POLICY IF EXISTS "patient_view_prescriptions" ON prescriptions;
CREATE POLICY "patient_view_prescriptions" ON prescriptions FOR SELECT
  USING (auth.uid() = patient_user_id);

CREATE TABLE IF NOT EXISTS kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID REFERENCES specialists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_document_url TEXT,
  government_id_url TEXT,
  selfie_url TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_submissions(user_id);

ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expert_own_kyc" ON kyc_submissions;
CREATE POLICY "expert_own_kyc" ON kyc_submissions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS specialist_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  patient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS specialist_reviews_one_per_booking
  ON specialist_reviews (patient_user_id, booking_id)
  WHERE booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_specialist_reviews_spec ON specialist_reviews(specialist_id);

ALTER TABLE specialist_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patient_insert_specialist_reviews" ON specialist_reviews;
CREATE POLICY "patient_insert_specialist_reviews" ON specialist_reviews FOR INSERT
  WITH CHECK (auth.uid() = patient_user_id);

DROP POLICY IF EXISTS "users_read_specialist_reviews" ON specialist_reviews;
CREATE POLICY "users_read_specialist_reviews" ON specialist_reviews FOR SELECT USING (true);

-- Experts read bookings for their specialist row
DROP POLICY IF EXISTS "expert_read_bookings" ON telehealth_bookings;
CREATE POLICY "expert_read_bookings" ON telehealth_bookings FOR SELECT
  USING (
    auth.uid() = (SELECT s.user_id FROM specialists s WHERE s.id = telehealth_bookings.professional_id LIMIT 1)
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "expert_update_bookings" ON telehealth_bookings;
CREATE POLICY "expert_update_bookings" ON telehealth_bookings FOR UPDATE
  USING (
    auth.uid() = (SELECT s.user_id FROM specialists s WHERE s.id = telehealth_bookings.professional_id LIMIT 1)
  );

-- specialist_availability: experts manage own slots (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'specialist_availability') THEN
    ALTER TABLE specialist_availability ADD COLUMN IF NOT EXISTS blocked_by_expert BOOLEAN DEFAULT FALSE;
    ALTER TABLE specialist_availability ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "expert_manage_availability" ON specialist_availability;
    CREATE POLICY "expert_manage_availability" ON specialist_availability FOR ALL
      USING (
        auth.uid() = (SELECT s.user_id FROM specialists s WHERE s.id = specialist_availability.specialist_id LIMIT 1)
      )
      WITH CHECK (
        auth.uid() = (SELECT s.user_id FROM specialists s WHERE s.id = specialist_availability.specialist_id LIMIT 1)
      );
  END IF;
END $$;

