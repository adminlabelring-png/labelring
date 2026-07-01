# Label Generator — Plan

Add a new public page `/generate` (linked in the sidebar below "Scan Label") that lets anyone build a compliant product label from scratch, with AI assistance, a live preview, live compliance scoring, and real Save/Export/QR actions backed by Lovable Cloud.

## Layout (matches uploaded reference, adapted to our slate/green-amber-red design tokens — no purple)

```
┌─ Header: LABELRING logo · "Compliance score: 72%" ──────────┐
│ ┌── LEFT (form) ─────────┐  ┌── RIGHT (preview) ─────────┐  │
│ │ PRODUCT DETAILS         │  │ LIVE DIGITAL LABEL          │ │
│ │  Brand name       [✨] │  │  (rendered on-pack block:   │ │
│ │  Product name / Category│  │   name, ingredients, warn., │ │
│ │ INGREDIENTS & ALLERGENS │  │   allergens, quantity,      │ │
│ │  Ingredients      [✨] │  │   responsible person, batch,│ │
│ │  Allergens        [✨] │  │   best-before, origin, certs)│ │
│ │ ORIGIN & COMPLIANCE     │  │                             │ │
│ │  Country / Net quantity │  │ COMPLIANCE CHECK            │ │
│ │  Batch / Best before    │  │  ● Product identity   OK    │ │
│ │  Responsible person (UK)│  │  ● Ingredients decl.  Miss. │ │
│ │  Certifications    [✨] │  │  ● Allergens flagged  OK    │ │
│ └────────────────────────┘  │  ● Country of origin  OK    │ │
│                             │  ● Quantity declared  Miss. │ │
│                             │  ● Responsible person OK    │ │
│                             │  ● Batch traceability OK    │ │
│                             │ [Copy QR link][Export][Share]│ │
│                             └─────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

Mobile: preview collapses under form; sticky bottom bar shows score + primary action.

## Fields (all from screenshot)
Brand name, Product name, Category (Skincare / Food / Beverage / Supplement / Household / Other), Ingredients, Allergens, Country of origin, Net quantity, Batch number, Best before, Responsible person (UK), Certifications.

## AI behavior (via `generate-label` edge function, model `google/gemini-3-flash-preview`)
- Per-field ✨ button → `POST /generate-label { mode: "field", field, context: {all current fields} }` returns a single suggestion for that field. Category-aware (skincare vs food prompts differ).
- Preview generator → `POST /generate-label { mode: "preview", fields }` returns the composed on-pack copy block (product name headline, ingredients line "Ingredients: ...", allergen callout, quantity, RP address block, batch/BB line, origin, cert icons list).
- Debounced 800ms after any field change; loading shimmer in preview card.

## Live compliance scoring (client-side, no AI)
- 7 rules: product identity, ingredients declared, allergens flagged (present OR explicit "None"), country of origin, quantity declared (must contain a unit), responsible person (must have address), batch traceability.
- Score = passed / 7 · 100, rounded. Header pill updates live; each item in Compliance Check shows OK / Missing / Needs review.

## Actions (all working, persisted)
- **Export label**: client-side jsPDF using existing `generate-report.ts` pattern; downloads `<product>-label.pdf` with the live preview block.
- **Copy QR link**: saves the label row, generates `/label/:id` public view URL, copies to clipboard, and shows QR (using `qrcode` — add via `bun add qrcode`).
- **Share**: `navigator.share` when available, else copies link + toast.
- New public view route `/label/:id` renders the saved live label read-only.

## Backend

New table `generated_labels`:
- `brand_name`, `product_name`, `category`, `ingredients`, `allergens`, `country_of_origin`, `net_quantity`, `batch_number`, `best_before`, `responsible_person`, `certifications` (all text/text[]), `compliance_score` int, `lead_id` text nullable (reuse lead tracker), plus id/created_at.
- RLS: anon INSERT allowed (public funnel), anon SELECT allowed (public share links), no update/delete for anon; service_role full.
- GRANT SELECT, INSERT to anon; GRANT ALL to service_role.

New edge function `generate-label` (verify_jwt=false, CORS) with two modes above, returning JSON.

## Sidebar / routing
- `AppSidebar`: add "Generate Label" item (icon: `Wand2`) under "Scan Label", route `/generate`.
- `App.tsx`: add `/generate` → `GenerateLabelPage`, `/label/:id` → `PublicLabelPage`.

## Files
- New: `src/pages/GenerateLabelPage.tsx`, `src/pages/PublicLabelPage.tsx`, `src/components/generator/LivePreview.tsx`, `src/components/generator/ComplianceCheck.tsx`, `src/lib/label-rules.ts`, `src/lib/generate-label.ts` (client wrapper), `supabase/functions/generate-label/index.ts`.
- Edit: `src/components/AppSidebar.tsx`, `src/App.tsx`.
- Migration: create `generated_labels` table + policies + grants.

## Out of scope
Auth, versioning of generated labels, workspace integration, multi-language, real regulatory validation (still keep the disclaimer used in scan flow).
