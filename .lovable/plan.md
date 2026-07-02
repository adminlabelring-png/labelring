## Goal

Turn the Label Generator into a full UK FIC (Food Information for Consumers) compliance tool for food/drink labels, while keeping skincare (INCI/CPNP) support behind a category-driven rule pack switch.

## 1. Category-driven rule packs

Top of `GenerateLabelPage`, treat `category` as the mode switch:

- `Food` / `Beverage` / `Supplement` → **UK FIC pack**
- `Skincare` → **Cosmetic pack** (current INCI + allergen behaviour)
- Empty / `Other` / `Household` → generic pack (today's basic 7 rules)

Rule pack picked once in `label-rules.ts`; the form conditionally shows food-only or cosmetic-only fields based on pack.

## 2. New fields (added to `LabelFields`)

Shared:
- `dateType` — `use_by` | `best_before` (radio, food only)
- `storageInstructions` — textarea
- `nanoIngredients` — checkbox (adds "(nano)" hint)
- `irradiated` — checkbox

Food/drink only:
- `quidPercent` — text (e.g. "Pork 80%")
- `nutrition` — structured mini-table (energy kJ/kcal, fat, saturates, carbs, sugars, protein, salt per 100g)
- `alcoholAbv` — number, triggers ABV display + "responsible drinking" if >1.2%
- `warnings` — multi-select derived automatically from ingredients (aspartame → phenylalanine, liquorice thresholds, caffeine >150 mg/L, polyols >10%, sweeteners, plant sterols)
- `packagedInProtectiveAtmosphere` — checkbox

Cosmetic keeps existing fields.

## 3. Compliance rules (`src/lib/label-rules.ts`)

Rewrite `evaluateLabel(fields)` to return the pack-specific rule list.

**UK FIC pack (food/drink):**

| Key | Check |
|---|---|
| identity | product name + FBO trading name |
| ingredients_heading | ingredients present, ordered by weight (heuristic: comma count ≥ 2) |
| allergens_caps | allergens from the 14 UK list detected in ingredients rendered in CAPS |
| quid | if product name references an ingredient with a picture keyword, QUID % supplied |
| net_quantity | number + valid metric unit (g, kg, ml, l, cl) |
| date_mark | `use_by` OR `best_before` supplied, `use_by` flagged for perishables |
| fbo_uk_address | responsible person contains UK-style postcode regex |
| storage | storage instructions present when `use_by` or refrigerated keywords |
| nutrition_table | mandatory unless single-ingredient / exempt category |
| abv | drinks >1.2% must show "% vol" |
| warnings | conditional warnings present when triggers detected |
| field_of_vision | name + net qty + ABV grouped in preview's first block |

Each rule returns `ok | review | missing` with a short "why" tooltip string.

**Cosmetic pack:** keeps current rules + adds:
- INCI-only ingredient list check (no plain names)
- Allergen fragrance list matches EU 26/81 allergens
- PAO (period after opening) symbol or best-before ≥ 30 months

## 4. Edge function (`supabase/functions/generate-label/index.ts`)

- Accept `pack: "food" | "cosmetic" | "generic"` in the request body.
- Split `FIELD_INSTRUCTIONS` into `FOOD_FIELD_INSTRUCTIONS` and `COSMETIC_FIELD_INSTRUCTIONS`; pick by pack.
- Rewrite the `preview` system prompt per pack:
  - Food prompt enforces UK FIC ordering: line 1 name; field-of-vision block (name / net quantity / ABV); ingredients heading; allergens in CAPS; QUID; date mark with correct "Use by" vs "Best before"; storage; FBO UK address; country of origin; nutrition table (as ASCII rows); warnings block; certifications last. British English, no markdown.
  - Cosmetic prompt keeps current INCI-centric composition.
- Add a `warnings` derivation helper server-side that scans ingredients for aspartame / liquorice / caffeine / polyols / sterols and returns the exact regulatory sentences to inline.

## 5. UI changes (`GenerateLabelPage.tsx`)

- Category select moves to top; changing it swaps visible sections via the pack.
- New "Nutrition" section (food pack): 7 inputs in a compact grid, "Suggest full table" AI button that fills all seven from ingredients context.
- New "Warnings & handling" section (food pack): checkboxes + `dateType` radio + storage textarea + protective atmosphere.
- "Alcohol" row appears only for `Beverage` pack when ABV > 0.
- Add a per-rule "why" popover on the compliance list using the tooltip string from rule evaluation.
- Preview block groups the field-of-vision items visually (bordered top block).

## 6. Files touched

- `src/lib/label-rules.ts` — extend `LabelFields`, add pack detection, rewrite `evaluateLabel`, expose `getPack(category)` and `deriveWarnings(fields)`.
- `src/lib/generate-label.ts` — pass `pack` through to the edge function.
- `supabase/functions/generate-label/index.ts` — pack-aware prompts + warnings helper.
- `src/pages/GenerateLabelPage.tsx` — conditional sections, new fields, pack-aware form.
- `src/components/generator/LivePreview.tsx` — split field-of-vision top block visually.
- `src/components/generator/ComplianceCheck.tsx` — add tooltip / "why" line.
- `src/pages/PublicLabelPage.tsx` — render new fields if present.
- **Migration** — add nullable columns to `generated_labels`: `pack`, `date_type`, `storage_instructions`, `quid_percent`, `nutrition_json`, `alcohol_abv`, `warnings_json`, `packaged_protective_atmosphere`, `nano`, `irradiated`.

## 7. Out of scope (deferred)

- Automated x-height / font-size print validation (needs artwork upload).
- Category-specific enforcement variations for NI vs GB (`UK(NI)` origin).
- Nutrition claim validation ("high in fibre" thresholds).

## Technical notes

- No breaking change to existing rows: all new columns nullable, existing preview links still render.
- Rule evaluation stays fully client-side; only prompt composition/AI suggestions round-trip to the edge function.
- British English, no purple, keep slate + risk tokens.
