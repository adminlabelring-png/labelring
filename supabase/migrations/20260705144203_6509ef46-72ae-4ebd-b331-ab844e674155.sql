
-- Remove stale space-named permissive policies (superseded by underscore-named signed-in policies)
DROP POLICY IF EXISTS "Authenticated can insert change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Authenticated can update change requests" ON public.change_requests;
DROP POLICY IF EXISTS "Authenticated can insert versions" ON public.product_versions;
DROP POLICY IF EXISTS "Authenticated can update versions" ON public.product_versions;

-- Replace scans INSERT with a validated predicate
DROP POLICY IF EXISTS "Anyone can create a scan" ON public.scans;
CREATE POLICY "Anyone can create a scan" ON public.scans
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(file_name) BETWEEN 1 AND 512
    AND found_count >= 0
    AND total_count >= 0
    AND needs_attention_count >= 0
    AND (lead_id IS NULL OR length(lead_id) <= 128)
  );

-- Replace generated_labels INSERT with a validated predicate
DROP POLICY IF EXISTS "Anyone can create generated labels" ON public.generated_labels;
CREATE POLICY "Anyone can create generated labels" ON public.generated_labels
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    compliance_score BETWEEN 0 AND 100
    AND (lead_id IS NULL OR length(lead_id) <= 128)
    AND (product_name IS NULL OR length(product_name) <= 512)
    AND (brand_name IS NULL OR length(brand_name) <= 512)
  );
