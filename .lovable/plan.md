## Root causes

**1 & 3 (Suggest does nothing, Live Digital Label stuck):** The `generate-label` edge function code exists in the repo but has never been deployed. Every call to `/functions/v1/generate-label` fails with `Failed to fetch` (visible in network logs), which is why `suggestField` and `generatePreview` silently fail.

**2 (Product Details overlap):** The `Label Generator` page uses `lg:grid-cols-[1fr,420px]` at the outer level *and* `sm:grid-cols-2` inside the "Product details" and "Origin & compliance" sections. On desktop the sidebar eats ~256px, so at 1025px viewport the left column ends up ~320px wide — each inner 2‑col cell is only ~150px. "Product name" label wraps and the `✨ Suggest` chip collides with the neighbouring "Category" cell. Same class of issue for the batch/best‑before and origin/quantity rows.

## Fix

1. **Deploy `supabase/functions/generate-label/index.ts`** (no code change needed — it's already implemented correctly). This unblocks the `Suggest` buttons and the debounced Live Digital Label preview.

2. **Fix layout collisions in `src/pages/GenerateLabelPage.tsx`:**
   - Switch inner `sm:grid-cols-2` groups (product name/category, origin/quantity, batch/best-before) to `xl:grid-cols-2` so they only split when there's genuine room. Below that they stack vertically.
   - Add `min-w-0` to grid cells so labels/inputs can shrink without overflowing.
   - In the `withSuggest` row, add `gap-2`, `min-w-0`, `truncate` on the label and `shrink-0 whitespace-nowrap` on the Suggest button so the chip never overlaps.
   - Bump the outer split from `lg:grid-cols-[1fr,420px]` to `xl:grid-cols-[1fr,400px]` so on ~1024px screens the preview stacks below the form instead of squeezing it.

3. **Verify** by reloading `/generate`, clicking a Suggest button (expect a value to populate) and typing a brand name (expect the Live Digital Label to render composed text within ~1s).

No changes to business logic, DB schema, or the edge function contents.