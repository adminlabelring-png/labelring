-- Persists the image coverage assessment (whether the submitted image(s)
-- show the full packaging, which areas are/aren't visible, and a
-- plain-language note) alongside each scan, so a "missing" verdict is
-- never shown without a confirmed full-coverage check.
alter table public.scans
  add column if not exists coverage_assessment jsonb;
