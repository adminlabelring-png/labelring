GRANT SELECT ON public.early_access_signups TO authenticated;

CREATE POLICY "Authenticated users can view signups"
  ON public.early_access_signups
  FOR SELECT
  TO authenticated
  USING (true);
