-- Storage bucket for scan files (private; admins read via authenticated SELECT policy)
INSERT INTO storage.buckets (id, name, public) VALUES ('scans', 'scans', false)
ON CONFLICT (id) DO NOTHING;

-- Anyone (anon) can upload to scans bucket
CREATE POLICY "Anyone can upload scan files"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'scans');

-- Authenticated users (admins) can read scan files
CREATE POLICY "Authenticated users can view scan files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'scans');

-- Scans table
CREATE TABLE public.scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT,
  mime_type TEXT,
  category TEXT,
  market TEXT,
  found_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  needs_attention_count INTEGER NOT NULL DEFAULT 0,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  lead_id TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a scan"
ON public.scans FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can view scans"
ON public.scans FOR SELECT
TO authenticated
USING (true);

CREATE INDEX idx_scans_created_at ON public.scans (created_at DESC);
CREATE INDEX idx_scans_lead_id ON public.scans (lead_id);