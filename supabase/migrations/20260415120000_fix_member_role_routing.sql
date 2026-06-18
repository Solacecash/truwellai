-- ============================================================
-- Fix member role routing: force-sync ALL profiles.user_type
-- from auth.users.raw_user_meta_data (source of truth).
-- ============================================================

-- 1. Force every profile.user_type to match what the user chose at signup.
--    This overwrites any wrong 'expert' value on member accounts and vice-versa.
UPDATE profiles p
SET user_type = CASE
  WHEN lower(trim(u.raw_user_meta_data->>'user_type')) = 'expert' THEN 'expert'
  ELSE 'user'
END
FROM auth.users u
WHERE u.id = p.id;

-- 2. Ensure profiles that somehow have NULL or empty user_type default to 'user'.
UPDATE profiles
SET user_type = 'user'
WHERE user_type IS NULL OR trim(user_type) = '';

-- 3. Replace handle_new_user trigger so it ALWAYS overwrites user_type
--    (previous version preserved existing value — which locked in bad data).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type   TEXT;
  v_display_name TEXT;
BEGIN
  -- Read the role the user selected in the app (default: 'user')
  v_user_type := COALESCE(
    NULLIF(trim(lower(new.raw_user_meta_data->>'user_type')), ''),
    'user'
  );
  IF v_user_type NOT IN ('user', 'expert') THEN
    v_user_type := 'user';
  END IF;

  v_display_name := COALESCE(
    trim(CONCAT_WS(' ',
      NULLIF(trim(new.raw_user_meta_data->>'first_name'), ''),
      NULLIF(trim(new.raw_user_meta_data->>'last_name'), '')
    )),
    ''
  );
  IF v_display_name = '' THEN
    v_display_name := split_part(new.email, '@', 1);
  END IF;

  INSERT INTO public.profiles (id, email, user_type, subscription_tier, display_name)
  VALUES (new.id, new.email, v_user_type, 'free', v_display_name)
  ON CONFLICT (id) DO UPDATE
    SET
      -- ALWAYS update user_type to match current signup intent
      user_type      = EXCLUDED.user_type,
      email          = COALESCE(profiles.email, EXCLUDED.email),
      display_name   = CASE
        WHEN trim(profiles.display_name) = '' OR profiles.display_name IS NULL
        THEN EXCLUDED.display_name
        ELSE profiles.display_name
      END;

  RETURN new;
END;
$$;

-- 4. Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
