-- Location columns for telehealth filtering and onboarding
ALTER TABLE user_health_profiles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE user_health_profiles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE user_health_profiles ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE user_health_profiles ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'global';

ALTER TABLE specialists ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS continent TEXT;

-- Allow authenticated users to insert meal rows for personalized plans (referenced by meal_plans)
DROP POLICY IF EXISTS "authenticated_insert_meals" ON meals;
CREATE POLICY "authenticated_insert_meals" ON meals FOR INSERT TO authenticated WITH CHECK (true);
