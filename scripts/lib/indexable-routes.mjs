// Shared by generate-sitemap.mjs and prerender.mjs so both agree on
// exactly which routes are real, indexable content: the static
// marketing/tool pages, plus every published Insights post (queried live
// from Supabase so new posts are picked up on the next deploy with no
// code change). Internal/session-specific pages (workspace, admin, scan
// processing/results, public generated-label pages) are deliberately
// excluded — they're already noindexed via useSeo, so there's nothing to
// gain from sitemap-listing or prerendering them.
import { createClient } from "@supabase/supabase-js";

export const STATIC_ROUTES = ["/", "/scan", "/generate", "/insights"];

export async function getPublishedInsightRoutes() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "indexable-routes: VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY not set, skipping Insights posts"
    );
    return [];
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("insights")
      .select("slug, updated_at")
      .eq("published", true);
    if (error) throw error;
    return (data ?? []).map((post) => ({
      path: `/insights/${post.slug}`,
      updatedAt: post.updated_at || undefined,
    }));
  } catch (e) {
    console.warn("indexable-routes: could not fetch Insights posts:", e.message);
    return [];
  }
}

export async function getAllIndexableRoutes() {
  const posts = await getPublishedInsightRoutes();
  return [...STATIC_ROUTES.map((path) => ({ path, updatedAt: undefined })), ...posts];
}
