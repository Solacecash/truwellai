-- Predictive Impact Reports, Global Watchlist, and OCR scan tagging.
-- These three tables/columns power the five "Scan Intelligence" features:
-- predictive impact reporting, snap-food calorie, batch tracking,
-- global watchlist, and OCR label scanning.

-- ── Predictive Reports quota tracking ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.predictive_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT,
  overall_risk_score INTEGER,
  recommendation TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictive_reports_user_created
  ON public.predictive_reports (user_id, created_at DESC);

ALTER TABLE public.predictive_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_predictive_reports" ON public.predictive_reports;
CREATE POLICY "users_own_predictive_reports" ON public.predictive_reports
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Global Watchlist (regulatory alerts) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.global_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT,
  ingredient TEXT,
  status TEXT NOT NULL CHECK (status IN ('banned', 'recalled', 'restricted', 'warning')),
  jurisdiction TEXT NOT NULL,
  reason TEXT NOT NULL,
  date_added DATE,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_global_watchlist_ingredient
  ON public.global_watchlist (LOWER(ingredient));
CREATE INDEX IF NOT EXISTS idx_global_watchlist_jurisdiction
  ON public.global_watchlist (jurisdiction);

ALTER TABLE public.global_watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_watchlist" ON public.global_watchlist;
CREATE POLICY "public_read_watchlist" ON public.global_watchlist
  FOR SELECT USING (true);

-- Seed regulatory alerts (idempotent via ON CONFLICT on (ingredient, jurisdiction, status))
CREATE UNIQUE INDEX IF NOT EXISTS uq_global_watchlist_key
  ON public.global_watchlist (LOWER(COALESCE(ingredient, '')), jurisdiction, status);

INSERT INTO public.global_watchlist (ingredient, status, jurisdiction, reason, source) VALUES
  ('parabens', 'restricted', 'EU', 'Endocrine disruption concerns above certain concentrations', 'EU Cosmetics Regulation'),
  ('formaldehyde', 'banned', 'EU', 'Known carcinogen prohibited in cosmetics', 'EU Cosmetics Regulation 1223/2009'),
  ('mercury', 'banned', 'Global', 'Highly toxic heavy metal banned in cosmetics worldwide', 'WHO/FDA/EU'),
  ('lead acetate', 'banned', 'USA', 'Banned by FDA for use in cosmetics', 'FDA 21 CFR'),
  ('hydroquinone', 'restricted', 'EU', 'Banned in cosmetics above 0.3% concentration', 'EU Cosmetics Regulation'),
  ('asbestos', 'banned', 'Global', 'Known carcinogen, zero tolerance', 'WHO/FDA/EU/NAFDAC'),
  ('triclosan', 'restricted', 'USA', 'FDA banned in hand soaps, restricted elsewhere', 'FDA 2016 ruling'),
  ('phthalates', 'restricted', 'EU', 'Reproductive toxicity concerns, restricted in cosmetics', 'EU REACH'),
  ('mineral oil', 'warning', 'EU', 'Refined mineral oil restrictions apply', 'EU Cosmetics Regulation'),
  ('talc', 'warning', 'USA', 'Asbestos contamination risk in some talc sources', 'FDA warning 2020'),
  ('bha', 'restricted', 'EU', 'Possible human carcinogen at high exposure levels', 'EU Cosmetics Regulation'),
  ('bht', 'warning', 'EU', 'Potential endocrine disruptor; monitored in cosmetics', 'EU Cosmetics Regulation'),
  ('trans fat', 'banned', 'USA', 'FDA prohibits partially hydrogenated oils in food', 'FDA 2018'),
  ('bromate', 'banned', 'EU', 'Potassium bromate banned as flour improver', 'EU Food Law'),
  ('olaquindox', 'banned', 'EU', 'Prohibited animal growth promoter residue', 'EU 2003/2374'),
  ('hydroquinone', 'banned', 'NAFDAC', 'Banned in skin-lightening cosmetics in Nigeria', 'NAFDAC'),
  ('steroid cream', 'restricted', 'NAFDAC', 'Restricted; prescription-only in Nigeria', 'NAFDAC')
ON CONFLICT DO NOTHING;

-- ── scans.scan_method + batch columns ────────────────────────────────────
ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS scan_method TEXT;
ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS batch_data JSONB;
