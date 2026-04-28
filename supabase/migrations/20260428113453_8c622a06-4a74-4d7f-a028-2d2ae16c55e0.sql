CREATE TABLE public.lead_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  landing_path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  raw_query TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_clicks_lead_id ON public.lead_clicks(lead_id);
CREATE INDEX idx_lead_clicks_created_at ON public.lead_clicks(created_at DESC);

ALTER TABLE public.lead_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone (anon visitors) can insert a click event
CREATE POLICY "Anyone can log a click"
  ON public.lead_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can read clicks (admin view)
CREATE POLICY "Authenticated users can view clicks"
  ON public.lead_clicks
  FOR SELECT
  TO authenticated
  USING (true);