-- Packaging often has label information split across multiple faces (front,
-- ingredients/nutrition panel, back with barcode/address, base, etc). This
-- lets a single scan carry every captured image instead of just one.
--
-- file_path/file_name/mime_type stay in place, unchanged, holding the first
-- image so existing readers (AdminLeadsPage's single-image preview, the
-- Odoo enrichment note) keep working without modification.
alter table public.scans
  add column if not exists images jsonb;

comment on column public.scans.images is
  'Array of {path, file_name, mime_type} for every image captured for this scan, in capture order. file_path/file_name/mime_type mirror the first entry for backward compatibility.';
