-- APK test report: profiles constraint, professional fields, intel sources, notifications, agreements, storage.

-- subscription_plan (may exist in production without repo migration)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_plan_check
  CHECK (subscription_plan IN (
    'free',
    'preview',
    'boost',
    'top_performer',
    'mastery',
    'guardian_monthly',
    'guardian_annual',
    'professional',
    'professional_monthly',
    'professional_annual',
    'trial',
    'none',
    'pro',
    'pro_monthly',
    'pro_yearly',
    'family',
    'lifetime'
  ));

UPDATE public.profiles SET subscription_plan = 'free' WHERE subscription_plan IS NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS professional_agreement_signed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS professional_agreement_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_submitted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS specialization TEXT,
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS license_document_url TEXT,
  ADD COLUMN IF NOT EXISTS earnings_total NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS earnings_pending NUMERIC DEFAULT 0;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IS NULL OR role IN ('guardian', 'professional', 'admin', 'user', 'expert'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_verification_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_verification_status_check
  CHECK (verification_status IN (
    'unverified', 'pending', 'verified', 'rejected', 'suspended'
  ));

-- Intelligence sources fallback (edge function offline)
CREATE TABLE IF NOT EXISTS public.health_intelligence_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.health_intelligence_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read intelligence sources" ON public.health_intelligence_sources;
CREATE POLICY "Read intelligence sources"
  ON public.health_intelligence_sources FOR SELECT
  USING (auth.uid() IS NOT NULL);

INSERT INTO public.health_intelligence_sources (title, category, description)
SELECT v.title, v.category, v.description
FROM (VALUES
  ('WHO Health Guidelines', 'clinical', 'World Health Organization evidence-based health guidelines'),
  ('CDC Prevention Resources', 'preventive', 'Centers for Disease Control prevention protocols'),
  ('NIH Research Database', 'research', 'National Institutes of Health research summaries'),
  ('Drug Interaction Database', 'medication', 'Comprehensive medication interaction reference'),
  ('Clinical Decision Support', 'clinical', 'Evidence-based clinical decision support protocols')
) AS v(title, category, description)
WHERE NOT EXISTS (SELECT 1 FROM public.health_intelligence_sources LIMIT 1);

-- Professional legal agreements
CREATE TABLE IF NOT EXISTS public.professional_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreed_at TIMESTAMPTZ NOT NULL,
  full_name TEXT NOT NULL,
  license_number TEXT NOT NULL,
  agreement_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.professional_agreements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own agreement" ON public.professional_agreements;
CREATE POLICY "Users read own agreement"
  ON public.professional_agreements FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own agreement" ON public.professional_agreements;
CREATE POLICY "Users insert own agreement"
  ON public.professional_agreements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- In-app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, token)
);

ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own push tokens" ON public.user_push_tokens;
CREATE POLICY "Users manage own push tokens"
  ON public.user_push_tokens FOR ALL USING (auth.uid() = user_id);

-- Consultation events (audit + notification triggers)
CREATE TABLE IF NOT EXISTS public.consultation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID,
  booking_id UUID,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'booking_confirmed', 'booking_cancelled', 'booking_rescheduled',
    'reminder_24h', 'reminder_1h', 'session_started', 'session_ended',
    'payment_received', 'review_received'
  )),
  user_id UUID REFERENCES auth.users(id),
  specialist_id UUID,
  payload JSONB,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.consultation_events ENABLE ROW LEVEL SECURITY;

-- Fee split columns on telehealth_bookings (existing table)
CREATE OR REPLACE FUNCTION public.calculate_telehealth_booking_fees()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $fee_calc$
BEGIN
  IF NEW.consultation_fee IS NOT NULL AND NEW.consultation_fee > 0 THEN
    NEW.platform_fee := ROUND(NEW.consultation_fee * 0.20, 2);
    NEW.specialist_earnings := ROUND(NEW.consultation_fee * 0.80, 2);
  END IF;
  RETURN NEW;
END;
$fee_calc$;

DO $apply_booking_fees$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'telehealth_bookings'
  ) THEN
    ALTER TABLE public.telehealth_bookings
      ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC,
      ADD COLUMN IF NOT EXISTS platform_fee NUMERIC,
      ADD COLUMN IF NOT EXISTS specialist_earnings NUMERIC,
      ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

    DROP TRIGGER IF EXISTS telehealth_booking_fee_calculator ON public.telehealth_bookings;
    CREATE TRIGGER telehealth_booking_fee_calculator
      BEFORE INSERT OR UPDATE OF consultation_fee ON public.telehealth_bookings
      FOR EACH ROW EXECUTE FUNCTION public.calculate_telehealth_booking_fees();
  END IF;
END;
$apply_booking_fees$;

-- Specialist payouts
CREATE TABLE IF NOT EXISTS public.specialist_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID REFERENCES public.specialists(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'paid', 'failed'
  )),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  reference TEXT
);

ALTER TABLE public.specialist_payouts ENABLE ROW LEVEL SECURITY;

-- Storage bucket for professional documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'professional-documents',
  'professional-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Professionals upload own documents" ON storage.objects;
CREATE POLICY "Professionals upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'professional-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Professionals read own documents" ON storage.objects;
CREATE POLICY "Professionals read own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'professional-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
