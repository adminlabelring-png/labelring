
-- Lock down write access on workspace demo tables to authenticated users only
DROP POLICY IF EXISTS "Anyone can insert brands" ON public.brands;
DROP POLICY IF EXISTS "Anyone can update brands" ON public.brands;
CREATE POLICY "Authenticated can insert brands" ON public.brands FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update brands" ON public.brands FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Anyone can update change requests" ON public.change_requests;
CREATE POLICY "Authenticated can insert change requests" ON public.change_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update change requests" ON public.change_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert versions" ON public.product_versions;
DROP POLICY IF EXISTS "Anyone can update versions" ON public.product_versions;
CREATE POLICY "Authenticated can insert versions" ON public.product_versions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update versions" ON public.product_versions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert products" ON public.products;
DROP POLICY IF EXISTS "Anyone can update products" ON public.products;
CREATE POLICY "Authenticated can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update products" ON public.products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Anyone can update suppliers" ON public.suppliers;
CREATE POLICY "Authenticated can insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Restrict generated_labels SELECT to authenticated (removes public read of lead-linked data)
DROP POLICY IF EXISTS "Anyone can view generated labels" ON public.generated_labels;
CREATE POLICY "Authenticated can view generated labels" ON public.generated_labels FOR SELECT TO authenticated USING (true);

-- Tighten lead_clicks INSERT with field validation to prevent analytics pollution
DROP POLICY IF EXISTS "Anyone can log a click" ON public.lead_clicks;
CREATE POLICY "Anyone can log a click" ON public.lead_clicks
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(landing_path) BETWEEN 1 AND 2048
    AND (lead_id IS NULL OR length(lead_id) <= 128)
    AND (utm_source IS NULL OR length(utm_source) <= 256)
    AND (utm_medium IS NULL OR length(utm_medium) <= 256)
    AND (utm_campaign IS NULL OR length(utm_campaign) <= 256)
    AND (utm_content IS NULL OR length(utm_content) <= 256)
    AND (utm_term IS NULL OR length(utm_term) <= 256)
    AND (referrer IS NULL OR length(referrer) <= 2048)
    AND (user_agent IS NULL OR length(user_agent) <= 1024)
    AND (raw_query IS NULL OR length(raw_query) <= 4096)
  );
