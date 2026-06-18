-- TruWell Professional Trust Profile schema

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS professional_title TEXT,
  ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_profile_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS is_identity_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_license_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_specialty_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_insurance_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_telehealth_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_background_checked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_elite BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS mission_statement TEXT,
  ADD COLUMN IF NOT EXISTS areas_of_passion TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS professional_type TEXT,
  ADD COLUMN IF NOT EXISTS designations TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS primary_specialty TEXT,
  ADD COLUMN IF NOT EXISTS secondary_specialty TEXT,
  ADD COLUMN IF NOT EXISTS subspecialties TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS medical_school TEXT,
  ADD COLUMN IF NOT EXISTS degree TEXT,
  ADD COLUMN IF NOT EXISTS graduation_year INTEGER,
  ADD COLUMN IF NOT EXISTS residency TEXT,
  ADD COLUMN IF NOT EXISTS fellowship TEXT,
  ADD COLUMN IF NOT EXISTS advanced_certifications TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS academic_positions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_of_practice INTEGER,
  ADD COLUMN IF NOT EXISTS current_organization TEXT,
  ADD COLUMN IF NOT EXISTS hospital_affiliations TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS previous_organizations TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS research_experience TEXT,
  ADD COLUMN IF NOT EXISTS teaching_experience JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS services_offered JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS telehealth_countries TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS telehealth_states TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS telehealth_restrictions_note TEXT,
  ADD COLUMN IF NOT EXISTS consultation_durations INTEGER[] DEFAULT '{30,60}',
  ADD COLUMN IF NOT EXISTS is_emergency_available BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS booking_window_days INTEGER DEFAULT 7,
  ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
  ADD COLUMN IF NOT EXISTS primary_language TEXT DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS additional_languages JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS conditions_treated TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS procedures_offered TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS professional_content JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS ai_settings JSONB DEFAULT '{
    "allow_ai_notes": true,
    "allow_ai_summary": true,
    "allow_ai_care_plans": true,
    "allow_ai_followup": true,
    "allow_ai_scheduling": true
  }',
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS accepts_new_patients BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS auto_approve_bookings BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS malpractice_insurance JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS compliance_records JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.professional_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL,
  issuing_authority TEXT,
  country TEXT,
  state TEXT,
  status TEXT DEFAULT 'active',
  expiry_date DATE,
  verified BOOLEAN DEFAULT FALSE,
  verification_requested_at TIMESTAMPTZ,
  verification_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.professional_licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own licenses" ON public.professional_licenses;
CREATE POLICY "Users own licenses"
  ON public.professional_licenses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.professional_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  reviewer_type TEXT DEFAULT 'patient' CHECK (reviewer_type IN ('patient', 'peer')),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.professional_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are public" ON public.professional_reviews;
CREATE POLICY "Reviews are public"
  ON public.professional_reviews
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Users post own reviews" ON public.professional_reviews;
CREATE POLICY "Users post own reviews"
  ON public.professional_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE OR REPLACE VIEW public.professional_metrics AS
SELECT
  professional_id,
  COUNT(*)::INTEGER AS total_consultations,
  ROUND(AVG(rating)::NUMERIC, 2) AS average_rating,
  COUNT(DISTINCT reviewer_id)::INTEGER AS unique_patients
FROM public.professional_reviews
GROUP BY professional_id;

CREATE OR REPLACE FUNCTION public.generate_trust_profile_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.trust_profile_id IS NULL
     AND NEW.role IN ('professional', 'telehealth', 'expert') THEN
    NEW.trust_profile_id :=
      'TPT-DR-' ||
      LPAD((FLOOR(RANDOM() * 999999))::TEXT, 6, '0');
  END IF;
  NEW.profile_updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_trust_profile_id ON public.profiles;
CREATE TRIGGER set_trust_profile_id
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_trust_profile_id();
