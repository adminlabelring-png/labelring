// Runs after `vite build` (see package.json's "postbuild" script).
//
// GitHub Pages (this app's production host — see
// .github/workflows/deploy-pages.yml) has no server-side routing. This
// repo's client-side React Router routes only work on a fresh/direct
// request via the well-known "SPA on GitHub Pages" 404-redirect trick
// (see the script in index.html and public/404.html) — but that trick
// still means GitHub Pages' web server returns a REAL HTTP 404 status the
// instant a crawler requests any non-root URL, before the redirect's
// client-side JS ever runs. Google (and every other crawler) treats that
// 404 as "this page doesn't exist" and won't index it, regardless of what
// the JS would have shown a browser afterward.
//
// This script fixes that by actually rendering each indexable route with
// a real browser after the build, and writing the fully-rendered HTML to
// its own dist/<route>/index.html. Static hosts (GitHub Pages, Vercel,
// anything) resolve a request for /scan to /scan/index.html automatically
// if that file exists, so each of these routes now returns a genuine 200
// with real content already in the HTML — no JS execution required.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getAllIndexableRoutes } from "./lib/indexable-routes.mjs";

const PORT = 4322;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DIST_DIR = fileURLToPath(new URL("../dist", import.meta.url));

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".xml": "application/xml",
  ".pdf": "application/pdf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

// A minimal static file server instead of shelling out to `vite preview`.
// The subprocess approach was flaky in GitHub Actions specifically (the
// server sometimes didn't finish starting within a generous 30s window,
// for reasons that never showed up the same way locally) and, worse, its
// failure modes could leak an orphaned child process that kept Node's
// event loop alive and hung the whole build. An in-process http server has
// none of that: no subprocess to spawn, start, or fail to kill — `.listen()`
// resolves almost immediately, and `.close()` reliably tears it down.
function startPreviewServer() {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      const pathname = decodeURIComponent(new URL(req.url, BASE_URL).pathname);
      // Same SPA-fallback behavior `vite preview` provides: any request
      // without a file extension is a client-side route, so serve the app
      // shell (index.html) and let the client-side router take it from there.
      const hasExtension = extname(pathname) !== "";
      const filePath = join(DIST_DIR, hasExtension ? pathname : "index.html");
      try {
        const body = await readFile(filePath);
        res.writeHead(200, { "Content-Type": MIME_TYPES[extname(filePath)] ?? "application/octet-stream" });
        res.end(body);
      } catch {
        try {
          const body = await readFile(join(DIST_DIR, "index.html"));
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(body);
        } catch (e) {
          res.writeHead(500);
          res.end(String(e));
        }
      }
    });
    server.on("error", reject);
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

function routeToFilePath(route) {
  if (route === "/") return `${DIST_DIR}/index.html`;
  const clean = route.replace(/^\/|\/$/g, "");
  return `${DIST_DIR}/${clean}/index.html`;
}

async function main() {
  // Vercel already serves every route as a real HTTP 200 via vercel.json's
  // catch-all rewrite to index.html — it doesn't have GitHub Pages' problem
  // of a real 404 status on non-root URLs, so it doesn't need this workaround.
  if (process.env.VERCEL) {
    console.log("prerender: skipping (Vercel serves all routes as 200 via vercel.json rewrites already)");
    return;
  }

  const routes = (await getAllIndexableRoutes()).map((r) => r.path);

  let previewServer;
  let browser;
  let written = 0;

  try {
    previewServer = await startPreviewServer();
    // This sandbox pre-installs Chromium at a fixed path rather than the
    // version Playwright would normally auto-download; in a normal CI
    // environment (e.g. GitHub Actions after `playwright install`), the
    // default launch without executablePath also works fine, so only pass
    // it when the pinned sandbox path actually exists.
    const sandboxChromium = "/opt/pw-browsers/chromium";
    browser = await chromium.launch(
      existsSync(sandboxChromium) ? { executablePath: sandboxChromium } : {}
    );
    const page = await browser.newPage();

    for (const route of routes) {
      try {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle", timeout: 20000 });
        // Let useSeo's effect (title/meta/canonical/JSON-LD) settle after
        // the network-idle data fetches resolve.
        await page.waitForTimeout(300);
        const html = await page.content();
        const filePath = routeToFilePath(route);
        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(filePath, html);
        written++;
      } catch (e) {
        console.warn(`prerender: skipping ${route} (${e.message})`);
      }
    }
  } finally {
    await browser?.close();
    await new Promise((resolve) => (previewServer ? previewServer.close(resolve) : resolve()));
  }

  console.log(`prerender: wrote ${written}/${routes.length} route(s)`);
}

// Prerendering is an enhancement on top of the real build output, not a
// requirement for it — the SPA still works via the 404-redirect trick
// without these files. If anything here fails (network quirks, a browser
// launch issue, whatever), warn and exit 0 rather than failing the whole
// `npm run build` and blocking the actual deploy.
//
// The explicit process.exit is a deliberate safety net, not just cleanup:
// this is a one-shot build step, not a long-running service, and a single
// leaked handle (the browser, the server, anything) is enough to keep
// Node's event loop alive and hang the whole `npm run build` — and
// therefore the CI job — indefinitely.
main()
  .catch((e) => {
    console.warn(`prerender: failed, dist/ still has the plain SPA build (${e.message})`);
  })
  .finally(() => process.exit(0));
