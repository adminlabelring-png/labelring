-- Product versions (locked artwork)
CREATE TABLE public.product_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key text NOT NULL,
  product_name text,
  scan_id uuid NOT NULL,
  version_number integer NOT NULL,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('approved','archived')),
  approved_by_name text,
  approved_note text,
  approved_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  archived_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_versions_key ON public.product_versions(product_key);
CREATE UNIQUE INDEX idx_one_approved_per_product
  ON public.product_versions(product_key) WHERE status = 'approved';

GRANT SELECT, INSERT, UPDATE ON public.product_versions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.product_versions TO authenticated;
GRANT ALL ON public.product_versions TO service_role;

ALTER TABLE public.product_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read versions" ON public.product_versions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert versions" ON public.product_versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update versions" ON public.product_versions FOR UPDATE USING (true);

-- Change requests
CREATE TABLE public.change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key text NOT NULL,
  product_name text,
  new_scan_id uuid NOT NULL,
  locked_version_id uuid REFERENCES public.product_versions(id) ON DELETE SET NULL,
  changes jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  decided_by_name text,
  decision_note text,
  decided_at timestamptz,
  promote_to_locked boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_change_requests_key ON public.change_requests(product_key);
CREATE INDEX idx_change_requests_status ON public.change_requests(status);

GRANT SELECT, INSERT, UPDATE ON public.change_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.change_requests TO authenticated;
GRANT ALL ON public.change_requests TO service_role;

ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read change requests" ON public.change_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert change requests" ON public.change_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update change requests" ON public.change_requests FOR UPDATE USING (true);