## Changes

1. **Landing hero — add Scan CTA**
   - In `src/pages/LandingPage.tsx`, next to the "Create your digital label" button, add a secondary `<Link to="/scan">` button ("Scan to check compliance") using `variant="outline"` for visual balance. Keep the existing "See how it works" ghost link or move it to a second row — leaning toward replacing it to avoid three CTAs.

2. **Nav — move Workspace out of top pill into footer**
   - `src/components/PillNav.tsx`: remove the `Workspace` entry from `links`.
   - `src/components/BottomTabBar.tsx`: also remove Workspace (mobile tab bar mirrors the top nav; otherwise mobile still exposes it prominently). Switch grid to `grid-cols-3`.
   - `src/components/landing/LandingFooter.tsx`: below the LinkedIn/Instagram icon row, add a tiny `text-[10px] text-muted-foreground` link `<Link to="/workspace">Workspace</Link>` aligned under the icons.

3. **Fix Product Category dropdown in EarlyAccessForm**
   - `src/components/landing/EarlyAccessForm.tsx` uses shadcn `Select` inside a form. Root cause is typically that the Radix Select portal + pointer-events interact badly, or the empty-string initial value (`product_category: ""`) which Radix Select disallows. Fix: initialize as `undefined`, keep type as optional in state, and ensure the `SelectItem` values are non-empty (they already are). Also verify no parent has `pointer-events-none`. Confirm via Playwright: open the select, pick an item, submit.

4. **"Get started" button target**
   - `src/components/PillNav.tsx`: change the trailing `<Link to="/generate">` wrapping the "Get started" button to an anchor `<a href="/#early-access">` (or use `HashLink` behavior — a plain `<a>` works since `#early-access` already exists as the section id on `LandingPage`). On non-home routes this navigates home and scrolls to the form.

## Out of scope
No backend, no design token changes, workspace routes untouched.

## Verification
Playwright at 1280×1800 and 390×844: home page shows both CTAs, dropdown opens and selects a category, footer shows tiny Workspace link, "Get started" scrolls to the form.
