-- Health intelligence events from all 10 source layers
CREATE TABLE IF NOT EXISTS public.health_intel_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source         text NOT NULL,
  trust_score    int  NOT NULL DEFAULT 80,
  event_type     text NOT NULL,
  -- event_type values:
  -- recall | ban | approval | trial_update | adverse_event |
  -- lawsuit | journal_finding | breakthrough | safety_alert | outbreak
  product_name   text,
  ingredients    text[] DEFAULT '{}',
  countries      text[] DEFAULT '{}',
  severity       text DEFAULT 'medium',
  -- severity: critical | high | medium | low | informational
  headline       text NOT NULL,
  summary        text,
  source_url     text UNIQUE,
  raw_data       jsonb,
  published_at   timestamptz DEFAULT now(),
  ingested_at    timestamptz DEFAULT now(),
  is_active      boolean DEFAULT true
);

-- Risk scores per product or ingredient
CREATE TABLE IF NOT EXISTS public.product_risk_scores (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_name       text NOT NULL,
  entity_type       text NOT NULL, -- product | ingredient | drug | device
  safety_score      int DEFAULT 50,
  recall_score      int DEFAULT 0,
  litigation_score  int DEFAULT 0,
  clinical_score    int DEFAULT 50,
  regulatory_score  int DEFAULT 50,
  composite_score   int DEFAULT 50,
  last_calculated   timestamptz DEFAULT now(),
  UNIQUE(entity_name, entity_type)
);

-- Personalised alerts matched to user profiles
CREATE TABLE IF NOT EXISTS public.user_health_alerts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id    uuid REFERENCES public.health_intel_events(id) ON DELETE CASCADE,
  alert_type  text,
  -- alert_type: recall_match | ingredient_ban | breakthrough | outbreak | profile_match
  read        boolean DEFAULT false,
  dismissed   boolean DEFAULT false,
  sent_at     timestamptz DEFAULT now()
);

-- Country-level health status for heat map
CREATE TABLE IF NOT EXISTS public.country_health_status (
  country_code    text PRIMARY KEY,
  active_recalls  int DEFAULT 0,
  active_alerts   int DEFAULT 0,
  outbreaks       int DEFAULT 0,
  risk_level      text DEFAULT 'normal',
  updated_at      timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.health_intel_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_risk_scores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_health_alerts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_health_status  ENABLE ROW LEVEL SECURITY;

-- Everyone can read intel events (public health data)
CREATE POLICY "public_read_intel" ON public.health_intel_events
  FOR SELECT USING (true);

CREATE POLICY "public_read_risk" ON public.product_risk_scores
  FOR SELECT USING (true);

CREATE POLICY "public_read_country" ON public.country_health_status
  FOR SELECT USING (true);

-- Users can only read their own alerts
CREATE POLICY "user_alerts_select" ON public.user_health_alerts
  FOR SELECT USING (user_id = auth.uid());

-- Seed some demo data so the screen isn't empty on first open
INSERT INTO public.health_intel_events
  (source, trust_score, event_type, product_name, ingredients, countries, severity, headline, summary, source_url, published_at)
VALUES
  ('FDA', 100, 'recall', 'Metformin XR 500mg', ARRAY['metformin'], ARRAY['US','CA','UK'], 'critical',
   'Class I Recall: Metformin Extended Release 500mg — NDMA contamination detected',
   'FDA has classified this as the most serious recall level. Lots manufactured Jan–Apr 2026 affected. Immediate discontinuation advised.',
   'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts',
   now() - interval '14 minutes'),

  ('EMA', 98, 'ban', NULL, ARRAY['titanium dioxide','E171'], ARRAY['EU','UK','AU'], 'high',
   'EMA flags titanium dioxide (E171) in 340 food products — genotoxicity evidence confirmed',
   'New peer-reviewed evidence links prolonged exposure to potential DNA damage. EU-wide ban expected Q3 2026.',
   'https://www.ema.europa.eu/en/news-events',
   now() - interval '2 hours'),

  ('NAFDAC', 80, 'regulation', NULL, ARRAY[]::text[], ARRAY['NG'], 'medium',
   'NAFDAC updates labelling requirements for herbal supplements — effective July 2026',
   'New mandatory disclosure rules for herbal products sold in Nigeria. Manufacturers have 90 days to comply.',
   'https://nafdac.gov.ng',
   now() - interval '5 hours'),

  ('NEJM', 95, 'breakthrough', 'CagriSema', ARRAY['cagrilintide','semaglutide'], ARRAY['US','EU'], 'informational',
   'Novo Nordisk CagriSema Phase 3: 22.7% weight loss vs 2.4% placebo — FDA fast-track anticipated',
   'Combination of cagrilintide and semaglutide shows superior efficacy. Phase 3 SCALE NEXT trial complete.',
   'https://www.nejm.org',
   now() - interval '6 hours'),

  ('FDA', 100, 'approval', 'Donanemab (Kisunla)', ARRAY['donanemab'], ARRAY['US'], 'informational',
   'FDA approves Donanemab (Kisunla) for early Alzheimer''s — first new mechanism in 20 years',
   'Eli Lilly''s amyloid-targeting antibody clears beta-amyloid plaques and slows cognitive decline by 35%.',
   'https://www.fda.gov/news-events/press-announcements',
   now() - interval '3 hours')
ON CONFLICT (source_url) DO NOTHING;

INSERT INTO public.country_health_status (country_code, active_recalls, active_alerts, outbreaks, risk_level)
VALUES
  ('US', 8, 12, 0, 'elevated'),
  ('UK', 4, 7,  0, 'elevated'),
  ('NG', 2, 3,  0, 'normal'),
  ('EU', 6, 9,  0, 'elevated'),
  ('AU', 2, 4,  0, 'normal'),
  ('CA', 3, 5,  0, 'normal')
ON CONFLICT (country_code) DO NOTHING;
