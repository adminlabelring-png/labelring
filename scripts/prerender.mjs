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
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getAllIndexableRoutes } from "./lib/indexable-routes.mjs";

const PORT = 4322;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DIST_DIR = fileURLToPath(new URL("../dist", import.meta.url));

function startPreviewServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "npx",
      ["vite", "preview", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    let settled = false;
    const onData = (chunk) => {
      if (!settled && chunk.toString().includes("Local:")) {
        settled = true;
        resolve(proc);
      }
    };
    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.on("exit", (code) => {
      if (!settled) {
        settled = true;
        reject(new Error(`vite preview exited early with code ${code}`));
      }
    });
    setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("vite preview did not start within 15s"));
      }
    }, 15000);
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

  let previewProc;
  let browser;
  let written = 0;

  try {
    previewProc = await startPreviewServer();
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
    previewProc?.kill();
  }

  console.log(`prerender: wrote ${written}/${routes.length} route(s)`);
}

// Prerendering is an enhancement on top of the real build output, not a
// requirement for it — the SPA still works via the 404-redirect trick
// without these files. If anything here fails (sandbox network quirks,
// a browser launch issue, whatever), warn and exit 0 rather than failing
// the whole `npm run build` and blocking the actual deploy.
main().catch((e) => {
  console.warn(`prerender: failed, dist/ still has the plain SPA build (${e.message})`);
});
