
# Redesign — Public landing (/)

Rewrite `src/pages/LandingPage.tsx` to match the Labelring Content & SEO Strategy v3. Slate design tokens only (no purple). Primary CTA sends visitors to `/generate`.

## New page structure

1. **Nav / meta** — update `index.html` title + description to the v3 copy.
2. **Hero** — "Your shortcut to compliant products." Sub-copy, primary CTA `Create Your Digital Label → /generate`, secondary `See how it works →` (scrolls to How it works). Split hero: copy left, mock label preview card right (uses existing slate/risk tokens).
3. **Problem section** — H2 "Right now, UK labelling is broken…" rendered as a two-column comparison table (Current reality vs With Labelring), 4 rows from the PDF. Red-tinted left column, green-tinted right column using existing `--risk-high-bg` / `--risk-low-bg` tokens.
4. **Who it's for** — 3 cards: Food & FMCG, Cosmetics & Wellness, Importers & Distributors. Emoji + heading + description from PDF.
5. **Regulation section** — H2 "Four regulatory waves. One platform built for all of them." 4 cards in a 2×2 grid: PRMA 2025, EPR, EU DPP, HFSS & Cosmetics. Each card has a "in force from…" pill.
6. **How it works** — keep existing 3-step block (Upload → Scan → Review), retargeted copy.
7. **Early Access section** — H2 + subtext from PDF. Form: Name, Work email, Company, Product category (dropdown: Food & Drink / Cosmetics & Wellness / Jewellery & Accessories / Import & Distribution / Other). Zod-validated, submits to Supabase.
8. **Footer** — © 2026 Labelring Ltd. Registered in England and Wales. Company No. 16816508. LinkedIn + Instagram icons. "Built in the UK · Compliant with UK GDPR".

## Backend

New table `early_access_signups`:

- `name text`, `email text`, `company text`, `product_category text`
- `created_at timestamptz default now()`
- RLS on. Policy: anyone (anon + authenticated) can INSERT; only service_role can SELECT (form is public, submissions private).
- Grants: `GRANT INSERT ON public.early_access_signups TO anon, authenticated; GRANT ALL TO service_role;` (no SELECT to anon/authenticated).
- Client-side zod validation (name 1–100, email valid + ≤255, company 1–200, category enum).

## Visual language

- Slate base (`bg-background`, `bg-card`, `border`), existing `--risk-*` tokens for status/comparison accents. No new colors, no purple.
- Hero uses a soft gradient wash of `--muted` behind the copy; a mocked "Live compliance score" card floats on the right (static, echoes `ComplianceScoreBadge`).
- Comparison table: two stacked cards on mobile, side-by-side on md+. Icons: `XCircle` for reality, `CheckCircle2` for Labelring.
- Regulation cards: `border-l-2 border-primary` accent, small "Jan 2026" style pill.
- Micro-motion: framer-motion fade/slide-in on section enter (already used on page).

## Files touched

- `index.html` — meta title + description.
- `src/pages/LandingPage.tsx` — full rewrite.
- `src/components/landing/EarlyAccessForm.tsx` — new, zod + supabase insert.
- `src/components/landing/ComparisonTable.tsx` — new.
- `src/components/landing/RegulationCards.tsx` — new.
- `src/components/landing/LandingFooter.tsx` — new.
- Migration: create `early_access_signups` with grants + RLS + insert-only policy.

## Out of scope (from the PDF, deferred)

- Sitemap.xml / robots.txt / SoftwareApplication schema / `/blog` route / PageSpeed work — flagged in the PDF as "Part 2 SEO fixes" but separate from the homepage redesign. I can tackle these next in a follow-up if you want.
- Workspace home tab stays unchanged.
