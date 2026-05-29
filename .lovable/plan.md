## Plan: Seasonal SKU Risk Mode + Supplier Change Detection

Two new features integrated into the existing scan flow, fully functional with storage.

### 1. Seasonal / Temporary SKU Risk Mode
- **Upload page (`/scan`)**: Add a "Seasonal / Promo SKU" toggle (with optional season tag: Christmas, Diwali, Summer, Promo Pack, Limited Edition).
- **AI prompt**: When seasonal flag is on, edge function injects stricter rules — extra scrutiny on promo claims, date stamps, allergen carry-over, on-pack offers, batch traceability.
- **Results page**: Show a prominent amber "Seasonal Risk Mode" banner explaining heightened checks were applied.
- **Storage**: Persist `is_seasonal` + `season_tag` on each scan.

### 2. Supplier Change Detection
- **Auto-match**: After AI extracts the product name, the system queries past scans with a fuzzy match on product name (lowercase trimmed similarity).
- **Diff engine** (client-side): Compares ingredients, allergens, manufacturer/responsible person, country of origin between newest scan and the most recent prior scan of the same product.
- **Results page**: New "Supplier & Spec Change Detection" card shows:
  - "Compared against scan from [date]"
  - Added ingredients (green), Removed ingredients (red), Allergen changes, Manufacturer changes
  - If first scan → "Baseline saved — future scans will be compared against this."
- **Admin (`/admin/leads` → Scans tab)**: Show seasonal badge + "Change detected" badge on scan rows.

### Technical details

**Database migration** — add columns to `scans`:
- `is_seasonal boolean default false`
- `season_tag text`
- `product_name text` (extracted, indexed for matching)
- `compared_to_scan_id uuid`
- `changes_detected jsonb` (cached diff result)

**Files to edit**:
- `supabase/migrations/...` — schema changes
- `supabase/functions/analyze-label/index.ts` — accept `isSeasonal`/`seasonTag`, inject seasonal rules into prompt
- `src/lib/scan-context.tsx` — add seasonal flag + comparison result to context
- `src/pages/ScanUploadPage.tsx` — seasonal toggle + season tag selector
- `src/pages/ScanProcessingPage.tsx` — pass seasonal flag, after AI returns, query prior scan, compute diff, store everything
- `src/pages/ScanResultsPage.tsx` — seasonal banner + supplier-change card
- `src/pages/AdminLeadsPage.tsx` — seasonal/change badges in Scans tab
- New: `src/lib/scan-diff.ts` — pure diff utility

**Diff logic** (client-side, no extra edge function):
- Normalize ingredient strings → split on commas → lowercase trim → set diff
- Manufacturer/Country: direct string compare
- Allergens: set diff

```text
Upload (seasonal? prior product?) 
   ↓
Processing → AI (stricter if seasonal) → fetch prior scan by product name → diff → save scan w/ changes
   ↓
Results: [Seasonal banner] [Supplier-change card] [existing fields]
```

### Out of scope (deferred per image)
- Version Lock + Approval Workflow (feature #3)
- Peak season dashboard (just badges in admin for now)
