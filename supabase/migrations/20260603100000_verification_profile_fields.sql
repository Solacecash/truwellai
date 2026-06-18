ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_reference TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS professional_agreements_user_id_key
  ON public.professional_agreements (user_id);
