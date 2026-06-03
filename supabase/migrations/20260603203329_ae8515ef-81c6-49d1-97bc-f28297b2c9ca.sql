
-- brands
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  vertical text NOT NULL DEFAULT 'skincare',
  logo_url text,
  default_market text DEFAULT 'UK',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.brands TO anon, authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Anyone can insert brands" ON public.brands FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update brands" ON public.brands FOR UPDATE USING (true);

-- suppliers
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  verification_status text NOT NULL DEFAULT 'verified',
  verification_score int NOT NULL DEFAULT 80,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.suppliers TO anon, authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update suppliers" ON public.suppliers FOR UPDATE USING (true);

-- products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  product_key text NOT NULL,
  name text NOT NULL,
  sku text,
  category text,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  material_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_seasonal boolean NOT NULL DEFAULT false,
  season_tag text,
  launch_date date,
  label_status text NOT NULL DEFAULT 'approved',
  label_version text DEFAULT 'v1.0',
  label_types text[] NOT NULL DEFAULT ARRAY['analog']::text[],
  thumbnail text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_brand_idx ON public.products(brand_id);
GRANT SELECT, INSERT, UPDATE ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update products" ON public.products FOR UPDATE USING (true);
