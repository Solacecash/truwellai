-- Conversion onboarding profile fields (Guardian + Professional paths)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS care_goals TEXT[],
  ADD COLUMN IF NOT EXISTS health_conditions TEXT[],
  ADD COLUMN IF NOT EXISTS lifestyle_factors TEXT[],
  ADD COLUMN IF NOT EXISTS care_recipient TEXT,
  ADD COLUMN IF NOT EXISTS commitment_level TEXT,
  ADD COLUMN IF NOT EXISTS specialization TEXT,
  ADD COLUMN IF NOT EXISTS practice_type TEXT,
  ADD COLUMN IF NOT EXISTS patient_focus TEXT[],
  ADD COLUMN IF NOT EXISTS preferred_tools TEXT[],
  ADD COLUMN IF NOT EXISTS professional_goals TEXT[],
  ADD COLUMN IF NOT EXISTS wellness_plan_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_role_path TEXT;
