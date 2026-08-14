// Runs after `vite build` (see package.json's "postbuild" script) and
// writes dist/sitemap.xml, covering every route from
// scripts/lib/indexable-routes.mjs.
import { writeFileSync } from "node:fs";
import { getAllIndexableRoutes } from "./lib/indexable-routes.mjs";

const SITE_URL = "https://www.labelring.co.uk";

const PRIORITY_BY_PATH = {
  "/": "1.0",
  "/scan": "0.8",
  "/generate": "0.8",
  "/insights": "0.7",
};

const urlEntry = ({ path, updatedAt }) => {
  const priority = PRIORITY_BY_PATH[path] ?? "0.6";
  const changefreq = path in PRIORITY_BY_PATH ? (path === "/" || path === "/insights" ? "weekly" : "monthly") : "monthly";
  return [
    "  <url>",
    `    <loc>${SITE_URL}${path}</loc>`,
    updatedAt ? `    <lastmod>${new Date(updatedAt).toISOString().slice(0, 10)}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
};

async function main() {
  const routes = await getAllIndexableRoutes();
  const entries = routes.map(urlEntry);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;

  writeFileSync(new URL("../dist/sitemap.xml", import.meta.url), xml);
  console.log(`generate-sitemap: wrote dist/sitemap.xml with ${entries.length} URLs`);
}

main();
