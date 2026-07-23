DROP POLICY IF EXISTS "Authenticated users can view signups" ON public.early_access_signups;

REVOKE SELECT ON public.early_access_signups FROM authenticated;
