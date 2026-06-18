-- Wellness reminder preferences (hydration + breathing) with per-user sound
-- choices, schedule windows, and enable flags. These columns extend the
-- existing `user_preferences` row that already stores notification toggles,
-- so we keep everything in one place.

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS hydration_reminder_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hydration_reminder_interval_min integer NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS hydration_reminder_start_hour integer NOT NULL DEFAULT 9,
  ADD COLUMN IF NOT EXISTS hydration_reminder_end_hour integer NOT NULL DEFAULT 21,
  ADD COLUMN IF NOT EXISTS hydration_reminder_sound text NOT NULL DEFAULT 'water_drop',
  ADD COLUMN IF NOT EXISTS breathing_reminder_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS breathing_reminder_times jsonb NOT NULL DEFAULT '["10:00","15:00","21:00"]'::jsonb,
  ADD COLUMN IF NOT EXISTS breathing_reminder_sound text NOT NULL DEFAULT 'chime';

-- Sanity bounds so the client never schedules something nonsensical.
ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS hydration_interval_bounds;
ALTER TABLE user_preferences
  ADD CONSTRAINT hydration_interval_bounds
  CHECK (hydration_reminder_interval_min BETWEEN 30 AND 360);

ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS hydration_hour_bounds;
ALTER TABLE user_preferences
  ADD CONSTRAINT hydration_hour_bounds
  CHECK (
    hydration_reminder_start_hour BETWEEN 0 AND 23
    AND hydration_reminder_end_hour BETWEEN 0 AND 23
    AND hydration_reminder_end_hour > hydration_reminder_start_hour
  );

ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS hydration_sound_values;
ALTER TABLE user_preferences
  ADD CONSTRAINT hydration_sound_values
  CHECK (hydration_reminder_sound IN ('water_drop', 'bubble', 'stream', 'chime', 'none'));

ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS breathing_sound_values;
ALTER TABLE user_preferences
  ADD CONSTRAINT breathing_sound_values
  CHECK (breathing_reminder_sound IN ('chime', 'ocean', 'zen', 'bell', 'none'));
