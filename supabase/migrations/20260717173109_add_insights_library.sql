CREATE TABLE public.insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  body text NOT NULL,
  background_image_url text,
  author_name text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.insights TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.insights TO authenticated;
GRANT ALL ON public.insights TO service_role;

ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts are publicly readable"
  ON public.insights
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE POLICY "Signed-in users can view all posts"
  ON public.insights
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Signed-in users can create posts"
  ON public.insights
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Signed-in users can update posts"
  ON public.insights
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Signed-in users can delete posts"
  ON public.insights
  FOR DELETE
  TO authenticated
  USING (true);

-- Public bucket for insight background images
INSERT INTO storage.buckets (id, name, public) VALUES ('insight-images', 'insight-images', true);

CREATE POLICY "Insight images are publicly readable"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'insight-images');

CREATE POLICY "Signed-in users can upload insight images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'insight-images');

CREATE POLICY "Signed-in users can update insight images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'insight-images')
  WITH CHECK (bucket_id = 'insight-images');

CREATE POLICY "Signed-in users can delete insight images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'insight-images');
