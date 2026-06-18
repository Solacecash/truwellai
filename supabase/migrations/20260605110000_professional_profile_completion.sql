-- Professional Trust Profile completion sprint

-- Malpractice insurance columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS malpractice_provider TEXT,
  ADD COLUMN IF NOT EXISTS malpractice_coverage NUMERIC,
  ADD COLUMN IF NOT EXISTS malpractice_expiry DATE,
  ADD COLUMN IF NOT EXISTS malpractice_cert_path TEXT,
  ADD COLUMN IF NOT EXISTS malpractice_cert_url TEXT,
  ADD COLUMN IF NOT EXISTS malpractice_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS malpractice_cert_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS language_fluency JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_compliance_violations BOOLEAN DEFAULT FALSE;

-- Professional content table
CREATE TABLE IF NOT EXISTS public.professional_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  published_date DATE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.professional_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own content" ON public.professional_content;
CREATE POLICY "Users own content"
  ON public.professional_content
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Content is public" ON public.professional_content;
CREATE POLICY "Content is public"
  ON public.professional_content
  FOR SELECT
  USING (TRUE);

-- Private bucket for professional documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('professional-docs', 'professional-docs', false, 10485760)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Owners access own docs" ON storage.objects;
CREATE POLICY "Owners access own docs"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'professional-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'professional-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
