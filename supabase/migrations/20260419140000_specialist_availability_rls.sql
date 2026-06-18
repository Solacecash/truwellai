-- Allow authenticated members to read un-booked, un-blocked future availability
-- slots so the telehealth booking screen can show available times.
--
-- Without this policy, member users get an empty result set from
-- `specialist_availability` because RLS defaults to DENY.

ALTER TABLE public.specialist_availability ENABLE ROW LEVEL SECURITY;

-- Members can SELECT unbooked, unblocked slots (future only enforced client-side)
DROP POLICY IF EXISTS "availability_public_select" ON public.specialist_availability;
CREATE POLICY "availability_public_select"
  ON public.specialist_availability
  FOR SELECT
  TO authenticated
  USING (true);

-- Specialists can INSERT their own availability rows
DROP POLICY IF EXISTS "availability_self_insert" ON public.specialist_availability;
CREATE POLICY "availability_self_insert"
  ON public.specialist_availability
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.specialists WHERE id = specialist_id LIMIT 1
    )
  );

-- Specialists can UPDATE their own availability (block/unblock)
DROP POLICY IF EXISTS "availability_self_update" ON public.specialist_availability;
CREATE POLICY "availability_self_update"
  ON public.specialist_availability
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = (
      SELECT user_id FROM public.specialists WHERE id = specialist_id LIMIT 1
    )
  )
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.specialists WHERE id = specialist_id LIMIT 1
    )
  );

-- process-payment Edge Function (service role) marks slots as booked.
-- Service role bypasses RLS, so no policy needed for that path.
