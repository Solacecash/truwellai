-- Patient Health Brief shares: member-generated consult-ready snapshot JSON.
-- RLS: patient owns rows; experts read only when linked via telehealth_bookings or prescriptions.

CREATE TABLE IF NOT EXISTS public.patient_health_brief_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_specialist_id uuid NOT NULL REFERENCES public.specialists(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  consent_granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  assembler_version text NOT NULL DEFAULT 'v1'
);

CREATE INDEX IF NOT EXISTS patient_health_brief_shares_patient_idx
  ON public.patient_health_brief_shares (patient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS patient_health_brief_shares_recipient_idx
  ON public.patient_health_brief_shares (recipient_specialist_id, created_at DESC);

ALTER TABLE public.patient_health_brief_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patient_select_own_brief_shares" ON public.patient_health_brief_shares;
CREATE POLICY "patient_select_own_brief_shares"
  ON public.patient_health_brief_shares FOR SELECT
  USING (auth.uid() = patient_user_id);

DROP POLICY IF EXISTS "patient_insert_own_brief_shares" ON public.patient_health_brief_shares;
CREATE POLICY "patient_insert_own_brief_shares"
  ON public.patient_health_brief_shares FOR INSERT
  WITH CHECK (auth.uid() = patient_user_id);

DROP POLICY IF EXISTS "patient_delete_own_brief_shares" ON public.patient_health_brief_shares;
CREATE POLICY "patient_delete_own_brief_shares"
  ON public.patient_health_brief_shares FOR DELETE
  USING (auth.uid() = patient_user_id);

-- Experts tied to recipient specialist may read when a care relationship exists.
DROP POLICY IF EXISTS "expert_read_brief_shares_with_relationship" ON public.patient_health_brief_shares;
CREATE POLICY "expert_read_brief_shares_with_relationship"
  ON public.patient_health_brief_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.specialists s
      WHERE s.id = patient_health_brief_shares.recipient_specialist_id
        AND s.user_id = auth.uid()
    )
    AND (
      EXISTS (
        SELECT 1
        FROM public.telehealth_bookings tb
        WHERE tb.user_id = patient_health_brief_shares.patient_user_id
          AND tb.professional_id = patient_health_brief_shares.recipient_specialist_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.prescriptions pr
        WHERE pr.patient_user_id = patient_health_brief_shares.patient_user_id
          AND pr.expert_id = patient_health_brief_shares.recipient_specialist_id
      )
    )
  );
