-- Web /verify portal timestamps (mobile reads status after deep link return).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.verification_submitted_at IS
  'Set when user submits identity verification on truwellai.xyz/verify';
COMMENT ON COLUMN public.profiles.verification_completed_at IS
  'Set when verification is approved on truwellai.xyz/verify';
