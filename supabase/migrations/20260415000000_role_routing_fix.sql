-- =============================================================================
-- Role-routing fix: ensure every auth user has a profile row with the correct
-- user_type. Family Guardians must always resolve to 'user'; Healthcare
-- Professionals to 'expert'. subscription_tier is billing-only and never used
-- to determine dashboard routing.
-- =============================================================================

-- 1. Ensure columns exist with safe defaults (idempotent)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';

-- 2. Backfill: any existing profile with NULL or empty user_type → 'user'
UPDATE profiles
SET user_type = 'user'
WHERE user_type IS NULL OR trim(user_type) = '';

-- 3. Backfill experts from auth.users metadata (for rows created before the trigger)
--    Only promotes to 'expert' if the original signUp metadata explicitly says so.
UPDATE profiles p
SET user_type = 'expert'
FROM auth.users u
WHERE u.id = p.id
  AND (u.raw_user_meta_data->>'user_type') = 'expert'
  AND p.user_type <> 'expert';

-- 4. Create/replace the handle_new_user trigger function.
--    Fires on every INSERT into auth.users so the profile row is available
--    immediately — before the app-level upsert, and even if the app upsert
--    fails due to RLS propagation timing.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type TEXT;
  v_display_name TEXT;
BEGIN
  -- Read user_type from auth signup metadata; default to 'user' if missing/invalid
  v_user_type := COALESCE(
    NULLIF(trim(lower(new.raw_user_meta_data->>'user_type')), ''),
    'user'
  );
  -- Only allow the two valid role values
  IF v_user_type NOT IN ('user', 'expert') THEN
    v_user_type := 'user';
  END IF;

  v_display_name := COALESCE(
    trim(
      CONCAT_WS(' ',
        NULLIF(trim(new.raw_user_meta_data->>'first_name'), ''),
        NULLIF(trim(new.raw_user_meta_data->>'last_name'), '')
      )
    ),
    ''
  );
  IF v_display_name = '' THEN
    v_display_name := split_part(new.email, '@', 1);
  END IF;

  INSERT INTO public.profiles (id, email, user_type, subscription_tier, display_name)
  VALUES (
    new.id,
    new.email,
    v_user_type,
    'free',
    v_display_name
  )
  ON CONFLICT (id) DO UPDATE
    SET
      -- Only overwrite user_type if the existing row has a NULL/empty value.
      -- This prevents a re-signup race from flipping an expert account to user.
      user_type = CASE
        WHEN trim(profiles.user_type) = '' OR profiles.user_type IS NULL
        THEN EXCLUDED.user_type
        ELSE profiles.user_type
      END,
      email = COALESCE(profiles.email, EXCLUDED.email),
      display_name = CASE
        WHEN trim(profiles.display_name) = '' OR profiles.display_name IS NULL
        THEN EXCLUDED.display_name
        ELSE profiles.display_name
      END;

  RETURN new;
END;
$$;

-- 5. Attach trigger to auth.users (drop first so this migration is re-runnable)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RLS: ensure policies use `id` as the PK column (not `user_id`)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_profile"  ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile"  ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile"  ON profiles;
DROP POLICY IF EXISTS "users_delete_own_profile"  ON profiles;
DROP POLICY IF EXISTS "users_own_profile"          ON profiles;

CREATE POLICY "users_select_own_profile" ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own_profile" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_delete_own_profile" ON profiles FOR DELETE
  USING (auth.uid() = id);
