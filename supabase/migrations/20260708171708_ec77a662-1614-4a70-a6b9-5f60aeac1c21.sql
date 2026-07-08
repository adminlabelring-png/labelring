DROP POLICY IF EXISTS "Anyone can submit early access signup" ON public.early_access_signups;

CREATE POLICY "Anyone can submit early access signup"
ON public.early_access_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(name) >= 1 AND length(name) <= 100
  AND length(email) >= 3 AND length(email) <= 255
  AND length(company) >= 1 AND length(company) <= 200
  AND product_category = ANY (ARRAY['Food','Beverage','Supplement','Skincare','Household','Other'])
);