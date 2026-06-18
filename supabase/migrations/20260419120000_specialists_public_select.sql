-- Allow any authenticated user to read all specialist profiles.
--
-- Without this policy, member users receive an empty result set from the
-- `specialists` table because the existing RLS only allows each specialist
-- to read their own row (user_id = auth.uid()).
--
-- This policy makes the telehealth directory visible to all logged-in users
-- while the existing write policies remain unchanged.

ALTER TABLE public.specialists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "specialists_public_select" ON public.specialists;
CREATE POLICY "specialists_public_select"
  ON public.specialists
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow specialists to insert their own row (onboarding submit)
DROP POLICY IF EXISTS "specialists_self_insert" ON public.specialists;
CREATE POLICY "specialists_self_insert"
  ON public.specialists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow specialists to update their own row (profile edit, fee changes)
DROP POLICY IF EXISTS "specialists_self_update" ON public.specialists;
CREATE POLICY "specialists_self_update"
  ON public.specialists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Also ensure telehealth_bookings allows member INSERT so book.tsx works
DROP POLICY IF EXISTS "member_insert_booking" ON public.telehealth_bookings;
CREATE POLICY "member_insert_booking"
  ON public.telehealth_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow members to UPDATE their own bookings (status upgrade after payment)
DROP POLICY IF EXISTS "member_update_own_booking" ON public.telehealth_bookings;
CREATE POLICY "member_update_own_booking"
  ON public.telehealth_bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
