## 1. Unified category list

Both dropdowns use the Generate page rule-pack list:
`Food`, `Beverage`, `Supplement`, `Skincare`, `Household`, `Other`.

- Extract to a shared module `src/lib/categories.ts` exporting `CATEGORIES` and a `CategoryValue` type.
- `GenerateLabelPage.tsx`: import from the shared module instead of the local const.
- `EarlyAccessForm.tsx`: replace the current 5-option list with the shared list. Values stored as lowercase slugs (`food`, `beverage`, `supplement`, `skincare`, `household`, `other`) so the DB column stays clean.
- DB migration on `early_access_signups.product_category`: it's currently a text column with a check constraint on the old 5 values. Drop the old constraint and add a new one for the new slugs. Existing rows (if any) map: `food_drink`→`food`, `cosmetics_wellness`→`skincare`, `jewellery_accessories`→`other`, `import_distribution`→`other`, `other`→`other`.

## 2. Lead-capture popup (gate before result)

New component `src/components/LeadCaptureDialog.tsx` — a shadcn `Dialog` with the same four fields as the home form (Name, Work email, Company, Product category) and identical zod validation. On submit it inserts into `early_access_signups` (same table), sets `sessionStorage.setItem("labelring_lead_submitted", "1")` plus stores the returned id, and calls an `onSuccess` callback.

Gating rules:

- **Scan flow** (`ScanUploadPage.tsx`): when the user clicks the primary "Analyse label" / continue button after picking a file, check the session flag. If missing, open the dialog; on success, proceed to `/scan/processing`. If flag present, proceed immediately.
- **Generate flow** (`GenerateLabelPage.tsx`): the current "Generate" action (whatever button navigates to the generated label / triggers `generate-label`) is intercepted the same way. Dialog opens, on success continues to the existing generate handler.
- Skip logic: `sessionStorage["labelring_lead_submitted"] === "1"` → don't show. Cleared naturally when the tab closes.
- Prefill the dialog's `product_category` from `fields.category` on the Generate page for convenience.

The home page inline `EarlyAccessForm` also writes the session flag on success, so a visitor who signs up from the landing form isn't asked again in the same session.

## 3. Files touched

New:
- `src/lib/categories.ts`
- `src/components/LeadCaptureDialog.tsx`
- one Supabase migration updating the `product_category` check constraint

Edited:
- `src/components/landing/EarlyAccessForm.tsx` — shared list, sets session flag
- `src/pages/GenerateLabelPage.tsx` — shared list, gate generate action
- `src/pages/ScanUploadPage.tsx` — gate proceed action
- (no changes to `ScanProcessingPage`, backend edge functions, or workspace)

## Out of scope

Workspace, existing scans/labels data, auth, styling redesign, and the other three items already shipped in the previous turn.

## Verification

Playwright at 1280×1800 and 390×844:
1. Home form dropdown shows the new 6 options and submits.
2. `/scan`: upload an image, click continue → dialog appears, submit → routes to processing.
3. `/generate`: fill fields, click generate → dialog appears, submit → label generates.
4. Re-run either flow in the same tab → dialog does not reappear.
5. Confirm rows land in `early_access_signups` with the new category slugs.
