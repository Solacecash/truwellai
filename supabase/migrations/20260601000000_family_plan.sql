-- Family groups: one per owner
CREATE TABLE IF NOT EXISTS public.family_groups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code   text NOT NULL UNIQUE,
  max_members   int  NOT NULL DEFAULT 5,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Family members: up to 5 non-owner users per group
CREATE TABLE IF NOT EXISTS public.family_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','removed')),
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, member_id)
);

-- Add family fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS family_group_id uuid REFERENCES public.family_groups(id),
  ADD COLUMN IF NOT EXISTS family_role     text CHECK (family_role IN ('owner','member')),
  ADD COLUMN IF NOT EXISTS phone_number    text,
  ADD COLUMN IF NOT EXISTS referral_code   text,
  ADD COLUMN IF NOT EXISTS referred_by     text;

-- Allow lifetime tier for founder dev / store purchases
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free','pro','family','lifetime'));

-- RLS: owners can read their own group
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_select" ON public.family_groups;
CREATE POLICY "owner_select" ON public.family_groups
  FOR SELECT USING (owner_id = auth.uid());
DROP POLICY IF EXISTS "owner_insert" ON public.family_groups;
CREATE POLICY "owner_insert" ON public.family_groups
  FOR INSERT WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "owner_update" ON public.family_groups;
CREATE POLICY "owner_update" ON public.family_groups
  FOR UPDATE USING (owner_id = auth.uid());

-- RLS: members can see their own membership rows; owners can see all in their group
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member_select_own" ON public.family_members;
CREATE POLICY "member_select_own" ON public.family_members
  FOR SELECT USING (
    member_id = auth.uid()
    OR group_id IN (
      SELECT id FROM public.family_groups WHERE owner_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "member_insert_own" ON public.family_members;
CREATE POLICY "member_insert_own" ON public.family_members
  FOR INSERT WITH CHECK (member_id = auth.uid());
DROP POLICY IF EXISTS "member_update_own" ON public.family_members;
CREATE POLICY "member_update_own" ON public.family_members
  FOR UPDATE USING (
    member_id = auth.uid()
    OR group_id IN (
      SELECT id FROM public.family_groups WHERE owner_id = auth.uid()
    )
  );

-- Function: generate unique 6-char invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  text := '';
  i     int;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$;

-- Function: create family group for owner (called after family purchase)
CREATE OR REPLACE FUNCTION public.create_family_group(p_owner_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code text;
  v_id   uuid;
BEGIN
  -- Generate unique code
  LOOP
    v_code := public.generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.family_groups WHERE invite_code = v_code);
  END LOOP;

  INSERT INTO public.family_groups (owner_id, invite_code)
  VALUES (p_owner_id, v_code)
  RETURNING id INTO v_id;

  -- Mark owner on their profile
  UPDATE public.profiles
  SET family_group_id = v_id, family_role = 'owner'
  WHERE id = p_owner_id;

  RETURN v_id;
END;
$$;

-- Function: join family group via invite code
CREATE OR REPLACE FUNCTION public.join_family_group(p_invite_code text, p_member_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_group   public.family_groups%ROWTYPE;
  v_count   int;
BEGIN
  SELECT * INTO v_group FROM public.family_groups
  WHERE invite_code = upper(p_invite_code) AND active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite code.');
  END IF;

  IF v_group.owner_id = p_member_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are the owner of this plan.');
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.family_members
  WHERE group_id = v_group.id AND status = 'active';

  IF v_count >= v_group.max_members THEN
    RETURN jsonb_build_object('success', false, 'error', 'This family plan is full (5 members maximum).');
  END IF;

  INSERT INTO public.family_members (group_id, member_id, status)
  VALUES (v_group.id, p_member_id, 'active')
  ON CONFLICT (group_id, member_id) DO UPDATE SET status = 'active';

  UPDATE public.profiles
  SET family_group_id = v_group.id, family_role = 'member'
  WHERE id = p_member_id;

  RETURN jsonb_build_object('success', true, 'group_id', v_group.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_family_group(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_family_group(text, uuid) TO authenticated;

