-- Cosmetic PAO / minimum-durability date and fragrance-allergen fields
-- for generated_labels (label generator: PAO months, product type used to
-- pick the fragrance-allergen concentration threshold, and the selected
-- fragrance allergens themselves).
alter table public.generated_labels
  add column if not exists pao_months text,
  add column if not exists cosmetic_product_type text,
  add column if not exists fragrance_allergens_json jsonb;
