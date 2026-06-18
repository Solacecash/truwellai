-- Professional verification and agreement fields (idempotent with earlier migrations)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_status text
    DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','pending','verified','rejected')),
  ADD COLUMN IF NOT EXISTS professional_agreement_signed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS professional_agreement_signed_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_verification_status_idx
  ON public.profiles (verification_status);
