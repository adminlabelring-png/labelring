// Runs after `vite build` (see package.json's "postbuild" script) and
// writes dist/sitemap.xml. Static marketing routes are always included;
// published Insights posts are queried from Supabase at build time so new
// posts show up in the sitemap on the next deploy without a code change.
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const SITE_URL = "https://labelring.vercel.app";

const STATIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/scan", changefreq: "monthly", priority: "0.8" },
  { path: "/generate", changefreq: "monthly", priority: "0.8" },
  { path: "/insights", changefreq: "weekly", priority: "0.7" },
];

const urlEntry = ({ path, lastmod, changefreq, priority }) =>
  [
    "  <url>",
    `    <loc>${SITE_URL}${path}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");

async function main() {
  const entries = STATIC_ROUTES.map(urlEntry);

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from("insights")
        .select("slug, updated_at")
        .eq("published", true);
      if (error) throw error;
      for (const post of data ?? []) {
        entries.push(
          urlEntry({
            path: `/insights/${post.slug}`,
            lastmod: post.updated_at ? new Date(post.updated_at).toISOString().slice(0, 10) : undefined,
            changefreq: "monthly",
            priority: "0.6",
          })
        );
      }
    } catch (e) {
      console.warn("generate-sitemap: could not fetch Insights posts, writing static-only sitemap:", e.message);
    }
  } else {
    console.warn("generate-sitemap: VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY not set, writing static-only sitemap");
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;

  writeFileSync(new URL("../dist/sitemap.xml", import.meta.url), xml);
  console.log(`generate-sitemap: wrote dist/sitemap.xml with ${entries.length} URLs`);
}

main();
