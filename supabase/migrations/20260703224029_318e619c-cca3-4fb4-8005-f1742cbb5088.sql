CREATE TABLE public.early_access_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL,
  product_category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.early_access_signups TO anon, authenticated;
GRANT ALL ON public.early_access_signups TO service_role;

ALTER TABLE public.early_access_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit early access signup"
  ON public.early_access_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 100
    AND length(email) BETWEEN 3 AND 255
    AND length(company) BETWEEN 1 AND 200
    AND product_category IN ('food_drink','cosmetics_wellness','jewellery_accessories','import_distribution','other')
  );
