## Problem

The lead-capture dialog fails with "Something went wrong" because the `early_access_signups` INSERT policy's `WITH CHECK` still whitelists the old category slugs (`food_drink`, `cosmetics_wellness`, `jewellery_accessories`, `import_distribution`, `other`). The unified form now sends the rule-pack labels (`Food`, `Beverage`, `Supplement`, `Skincare`, `Household`, `Other`), so every insert is rejected by RLS.

## Fix

**1. Migration** — replace the INSERT policy on `public.early_access_signups`:
- Drop `"Anyone can submit early access signup"`.
- Recreate with the same length checks but update the category whitelist to `('Food','Beverage','Supplement','Skincare','Household','Other')`.
- Keep roles `anon, authenticated`; no other policy or grant changes.

**2. Email label copy** — accept any email, not just work email:
- `src/components/LeadCaptureDialog.tsx`: label "Work email" → "Email"; zod message "Please enter a valid work email" → "Please enter a valid email".
- `src/components/landing/EarlyAccessForm.tsx`: same two changes.
- Validation stays `z.string().email()` (already accepts any email domain).

## Out of scope

No schema changes, no changes to already-stored rows, no UI restructuring beyond the label text.
