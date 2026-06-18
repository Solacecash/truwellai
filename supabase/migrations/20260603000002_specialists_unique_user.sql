-- Remove duplicate specialist rows keeping only the earliest one per user
DELETE FROM public.specialists a
USING public.specialists b
WHERE a.user_id = b.user_id
  AND a.id::text > b.id::text;

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.specialists
  DROP CONSTRAINT IF EXISTS specialists_user_id_key;

ALTER TABLE public.specialists
  ADD CONSTRAINT specialists_user_id_key UNIQUE (user_id);
