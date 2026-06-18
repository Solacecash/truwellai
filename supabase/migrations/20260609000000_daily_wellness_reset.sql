-- Add last_daily_reset column to track when metrics were last reset
ALTER TABLE user_wellness
  ADD COLUMN IF NOT EXISTS last_daily_reset date DEFAULT NULL;

-- Add daily contribution columns for health score calculation
ALTER TABLE user_wellness
  ADD COLUMN IF NOT EXISTS daily_score_contribution integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cumulative_health_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_updated_at timestamptz DEFAULT now();

-- Function: reset daily metrics if last_daily_reset < today
CREATE OR REPLACE FUNCTION reset_daily_wellness_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today date := current_date;
BEGIN
  -- Calculate score contribution before reset
  -- Score formula: water(max 30pts) + breathing(max 20pts) + calories(max 20pts) = max 70pts/day
  UPDATE user_wellness
  SET
    -- Add yesterday's contribution to cumulative score
    cumulative_health_score = LEAST(100, COALESCE(cumulative_health_score, 0) + COALESCE(daily_score_contribution, 0)),
    -- Reset daily counters
    daily_water_cups = 0,
    breathing_sessions_today = 0,
    calories_consumed = 0,
    daily_score_contribution = 0,
    last_daily_reset = today,
    score_updated_at = now()
  WHERE
    last_daily_reset IS NULL
    OR last_daily_reset < today;
END;
$$;

-- Schedule daily reset at midnight UTC via pg_cron
SELECT cron.schedule(
  'reset-daily-wellness-metrics',
  '0 0 * * *',
  $$ SELECT reset_daily_wellness_metrics(); $$
);

-- Function: calculate and update daily score contribution
-- Called after each metric update (water, breathing, calories)
CREATE OR REPLACE FUNCTION calculate_daily_score_contribution(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_water integer;
  v_water_goal integer;
  v_breath integer;
  v_breath_goal integer;
  v_calories integer;
  v_calorie_target integer;
  v_score integer;
  v_water_pts integer;
  v_breath_pts integer;
  v_calorie_pts integer;
BEGIN
  SELECT
    COALESCE(daily_water_cups, 0),
    COALESCE(water_goal, 8),
    COALESCE(breathing_sessions_today, 0),
    COALESCE(breathing_goal, 3),
    COALESCE(calories_consumed, 0),
    COALESCE(calorie_target, 2000)
  INTO
    v_water, v_water_goal,
    v_breath, v_breath_goal,
    v_calories, v_calorie_target
  FROM user_wellness
  WHERE user_id = p_user_id;

  -- Water: up to 30 points (proportional to goal)
  v_water_pts := LEAST(30, ROUND((v_water::numeric / NULLIF(v_water_goal, 0)) * 30));

  -- Breathing: up to 20 points (proportional to goal)
  v_breath_pts := LEAST(20, ROUND((v_breath::numeric / NULLIF(v_breath_goal, 0)) * 20));

  -- Calories: up to 20 points (within 20% of target = full score)
  IF v_calorie_target > 0 AND v_calories > 0 THEN
    DECLARE ratio numeric := v_calories::numeric / v_calorie_target;
    BEGIN
      IF ratio BETWEEN 0.8 AND 1.2 THEN
        v_calorie_pts := 20;
      ELSIF ratio BETWEEN 0.6 AND 1.4 THEN
        v_calorie_pts := 10;
      ELSE
        v_calorie_pts := 5;
      END IF;
    END;
  ELSE
    v_calorie_pts := 0;
  END IF;

  v_score := COALESCE(v_water_pts, 0) + COALESCE(v_breath_pts, 0) + COALESCE(v_calorie_pts, 0);

  UPDATE user_wellness
  SET
    daily_score_contribution = v_score,
    score_updated_at = now()
  WHERE user_id = p_user_id;

  RETURN v_score;
END;
$$;

-- Run reset immediately for all existing users
SELECT reset_daily_wellness_metrics();
