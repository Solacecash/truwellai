-- Food scan history table (unified — products + snap food + ingredients)
CREATE TABLE IF NOT EXISTS food_scan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  scan_type text NOT NULL CHECK (scan_type IN (
    'barcode', 'visual_ai', 'ocr', 'manual'
  )),
  -- Food identity
  food_name text,
  brand_name text,
  barcode text,
  cuisine_region text, -- 'west_african','east_african','north_african',
                       -- 'south_asian','east_asian','latin_american',
                       -- 'middle_eastern','european','global'
  -- Nutrition
  calories_kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  sugar_g numeric,
  sodium_mg numeric,
  -- Portion
  portion_description text, -- '1 cup', '1 plate', '200g'
  portion_weight_g numeric,
  cooking_method text,      -- 'fried','grilled','boiled','raw','baked'
  -- Ingredient safety (for product scans)
  safety_grade text,        -- A+, A, B, C, D, F
  safety_score integer,
  -- AI confidence
  confidence_score numeric, -- 0.0 to 1.0
  ai_estimated boolean DEFAULT false,
  -- User control
  meal_type text CHECK (meal_type IN (
    'breakfast','lunch','dinner','snack','drink'
  )),
  user_notes text,
  image_url text,
  was_edited boolean DEFAULT false,
  -- Soft delete for undo support
  deleted_at timestamptz DEFAULT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS food_scan_history_user_date
  ON food_scan_history(user_id, scanned_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS food_scan_history_scan_type
  ON food_scan_history(user_id, scan_type)
  WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE food_scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own food history"
  ON food_scan_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily calorie summary view
CREATE OR REPLACE VIEW daily_calorie_summary AS
SELECT
  user_id,
  date_trunc('day', scanned_at)::date AS log_date,
  COUNT(*) AS item_count,
  ROUND(SUM(calories_kcal)::numeric, 0) AS total_calories,
  ROUND(SUM(protein_g)::numeric, 1) AS total_protein_g,
  ROUND(SUM(carbs_g)::numeric, 1) AS total_carbs_g,
  ROUND(SUM(fat_g)::numeric, 1) AS total_fat_g
FROM food_scan_history
WHERE deleted_at IS NULL
GROUP BY user_id, date_trunc('day', scanned_at)::date;

-- Grant access
GRANT SELECT ON daily_calorie_summary TO authenticated;
