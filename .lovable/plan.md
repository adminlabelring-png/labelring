# Workspace Dashboard Rebuild

Build a multi-brand workspace dashboard inspired by the mockup, **without** replacing the existing scan funnel or switching the theme. Jewelry is added as a third vertical alongside Skincare and Food. Auth stays demo-mode (no login).

## What changes vs the mockup

- **Theme**: keep current slate / semantic-risk tokens. Do NOT introduce `#534AB7` purple. Map the mockup's purple → existing `--primary`, purple-tint surfaces → `--accent` / `--muted`.
- **Brand switcher**: works in demo mode by switching a `brand_id` in localStorage; no per-user auth.
- **Jewelry**: added as a category. Jewelry-specific compliance rules (REACH nickel, UK hallmarking, DPP material data) are stubbed with realistic seed data but reuse the existing scan/version-lock pipeline.

## Information architecture

New shell at `/workspace` (the existing scan funnel at `/`, `/scan`, `/scan/results`, and `/admin/*` stay untouched). Sidebar groups:

```text
Workspace
  /workspace                  Dashboard
  /workspace/labels           Label library
  /workspace/products         Product data
  /workspace/compliance       Compliance
Monitoring
  /workspace/suppliers        Suppliers
  /workspace/seasonal         Seasonal SKUs
  /workspace/versions         Version history (cross-product list)
  /workspace/dpp              Digital passport
Settings
  /workspace/team             Team (stub)
  /workspace/settings         Settings (brand profile)
```

The existing admin routes (`/admin/leads`, `/admin/products/:productKey`) are kept and linked from the new pages so prior work (approvals, version timeline) is reused, not duplicated.

## Pages

1. **Dashboard** — mirrors the mockup: header with brand name + active SKU count, DPP readiness banner (jewelry brands only), 4 metric tiles (Total labels, Approved, Flagged, In review), Label Library table preview (5 rows + "View all"), two-column Compliance Alerts + Supplier Monitoring.
2. **Label library** — full table with tabs (All / Analog / Digital / Archived), search, filter by status. Rows link to existing `ProductHistoryPage`.
3. **Product data** — list of products (SKU, name, category, supplier, last scan). Click → product detail with material composition fields (jewelry-only: metal, alloy %, stones, nickel ppm).
4. **Compliance** — feed of alerts (REACH, hallmarking, seasonal expiry, ingredient flags, missing fields). Uses existing `scans.fields` + jewelry rule engine.
5. **Suppliers** — list with verification %, status (Verified / Spec change / Flagged), last activity. Each row → supplier detail with linked products + spec-change history (reuses `scan-diff` data).
6. **Seasonal SKUs** — list filtered to `is_seasonal=true`, with launch date and approval status.
7. **Version history** — cross-product list of `product_versions` + `change_requests` (existing per-product page becomes the detail view).
8. **Digital passport** — readiness checklist per SKU (material data complete? supplier verified? hallmark declared?). Generates a stub QR/JSON preview.
9. **Team** + **Settings** — minimal stubs (Settings holds brand name, logo, default market).

## Data model

Add three tables; reuse existing `scans`, `product_versions`, `change_requests`.

- `brands` — `id`, `name`, `slug`, `vertical` ('skincare' | 'food' | 'jewelry'), `logo_url`, `default_market`, `active_sku_count` (computed in app).
- `products` — `id`, `brand_id` → brands, `product_key` (matches existing `scans.product_key`), `name`, `sku`, `category`, `supplier_id` (nullable), `material_data` jsonb (jewelry composition), `is_seasonal`, `season_tag`, `launch_date`.
- `suppliers` — `id`, `brand_id`, `name`, `verification_status` ('verified' | 'spec_change' | 'flagged'), `verification_score` int 0–100, `last_activity_at`, `notes`.

Backfill: a one-time SQL seed inserts one demo brand per vertical (Skincare "GlowLab", Food "Pantry Co.", Jewelry "Aurelia Jewels") with 4–6 products and 3–4 suppliers each. Existing scans without a `brand_id` stay attached to "GlowLab" by default.

All three tables follow the established demo-mode RLS: `SELECT` / `INSERT` / `UPDATE` open to `public`, no `DELETE`. GRANTs to `anon`, `authenticated`, `service_role`.

## Brand switcher

- `BrandProvider` in `src/lib/brand-context.tsx` — loads brands from Supabase, persists active `brand_id` in localStorage, exposes `{ brand, brands, switchBrand }`.
- Nav uses `<Popover>` with brand list + "Aurelia Jewels"-style colored dot (color derived from vertical, not new palette).
- All workspace queries filter by `brand.id`.

## Component reuse

- Sidebar: extend existing `AppSidebar` with a `variant` prop. The scan funnel keeps current sidebar; `/workspace/*` uses the new grouped sidebar variant. Both share `SidebarProvider`.
- Status badges: use existing `StatusBadge` + `RiskBadge` with new variants (`approved`, `in_review`, `flagged`, `archived`).
- Tables: shadcn `Table` + reusable `<DataTableTabs>` for the All/Analog/Digital/Archived filter row.
- Alerts feed: reuses card patterns from `ScanResultsPage` banners.

## Out of scope (deferred)

- Real auth / per-user roles.
- Editing material composition or supplier records (read-only views, seed only).
- Generating a real DPP QR (preview placeholder only).
- Team invites, billing, notifications.
- Migrating the scan funnel into the workspace shell — the funnel stays separate.

## Build order

1. Migration: `brands`, `products`, `suppliers` + seed data.
2. `BrandProvider` + brand switcher + new `WorkspaceLayout`/sidebar variant + routes.
3. Dashboard page (highest-fidelity to mockup).
4. Label library, Suppliers, Compliance (reuse existing data).
5. Product data, Seasonal SKUs, Version history (cross-product), DPP readiness.
6. Team + Settings stubs.

After approval I'll start with the migration so the seed is available before the UI work.
