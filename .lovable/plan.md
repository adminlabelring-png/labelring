Replace all em dashes (—) and en dashes (–) in the landing-page copy with commas or periods so the text reads cleanly without dash punctuation.

Affected files and changes:
- `src/pages/LandingPage.tsx`
  - Hero subtitle: "regulations — all in one place" → "regulations, all in one place"
  - Audience card: "HFSS classification — all managed in one place" → "HFSS classification, all managed in one place"
- `src/components/landing/ComparisonTable.tsx`
  - "Trading Standards — no single source of truth" → "Trading Standards, no single source of truth"
  - "inspections — or worse, a product recall" → "inspections, or worse, a product recall"
  - "ESPR — four regulatory waves" → "ESPR, four regulatory waves"
  - "day one — DPP export" → "day one. DPP export"
- `src/components/landing/EarlyAccessForm.tsx`
  - Success heading: "Thanks — you're on the list." → "Thanks, you're on the list."
- `src/components/landing/RegulationCards.tsx`
  - Date range: "2026–2030" → "2026 to 2030"

Decorative middle dots (·) in badges and the footer are not dashes and will be left unchanged.