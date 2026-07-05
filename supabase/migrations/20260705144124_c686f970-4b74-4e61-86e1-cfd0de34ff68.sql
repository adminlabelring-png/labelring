
-- Replace WITH CHECK (true) / USING (true) with auth.uid() IS NOT NULL on write policies
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['brands','change_requests','product_versions','products','suppliers'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can insert %1$s" ON public.%1$s', t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can update %1$s" ON public.%1$s', t);
    EXECUTE format('CREATE POLICY "Authenticated can insert %1$s" ON public.%1$s FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)', t);
    EXECUTE format('CREATE POLICY "Authenticated can update %1$s" ON public.%1$s FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t);
  END LOOP;
END $$;
