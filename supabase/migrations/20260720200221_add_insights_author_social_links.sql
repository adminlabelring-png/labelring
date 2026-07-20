ALTER TABLE public.insights
  ADD COLUMN IF NOT EXISTS author_twitter_url text,
  ADD COLUMN IF NOT EXISTS author_linkedin_url text,
  ADD COLUMN IF NOT EXISTS author_facebook_url text;
