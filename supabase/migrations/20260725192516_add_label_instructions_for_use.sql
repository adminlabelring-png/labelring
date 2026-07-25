-- Cosmetics-only "Instructions for use / precautions" field, distinct from
-- storage instructions per UK Cosmetic Products Enforcement Regulations.
alter table public.generated_labels
  add column if not exists instructions_for_use text;
