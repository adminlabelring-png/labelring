ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS is_seasonal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS season_tag text,
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS product_key text,
  ADD COLUMN IF NOT EXISTS compared_to_scan_id uuid,
  ADD COLUMN IF NOT EXISTS changes_detected jsonb;

CREATE INDEX IF NOT EXISTS scans_product_key_idx ON public.scans (product_key, created_at DESC);