
CREATE TABLE public.generated_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT,
  product_name TEXT,
  category TEXT,
  ingredients TEXT,
  allergens TEXT,
  country_of_origin TEXT,
  net_quantity TEXT,
  batch_number TEXT,
  best_before TEXT,
  responsible_person TEXT,
  certifications TEXT,
  preview_text TEXT,
  compliance_score INTEGER NOT NULL DEFAULT 0,
  lead_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.generated_labels TO anon;
GRANT SELECT, INSERT ON public.generated_labels TO authenticated;
GRANT ALL ON public.generated_labels TO service_role;

ALTER TABLE public.generated_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create generated labels"
  ON public.generated_labels FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view generated labels"
  ON public.generated_labels FOR SELECT
  TO anon, authenticated
  USING (true);
