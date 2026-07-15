// Edge function: AI helper for the label generator.
// Modes:
//   - "field":   suggest a value for a single field given current context
//   - "preview": compose the on-pack copy block from current fields
// Packs: "food" (UK FIC), "cosmetic" (INCI/CPNP), "generic".

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MODEL = "google/gemini-2.5-flash";

type Pack = "food" | "cosmetic" | "generic";

interface NutritionTable {
  energyKj?: string;
  energyKcal?: string;
  fat?: string;
  saturates?: string;
  carbs?: string;
  sugars?: string;
  protein?: string;
  salt?: string;
}

interface FieldsIn {
  brandName?: string;
  productName?: string;
  category?: string;
  ingredients?: string;
  allergens?: string;
  countryOfOrigin?: string;
  netQuantity?: string;
  batchNumber?: string;
  bestBefore?: string;
  responsiblePerson?: string;
  certifications?: string;
  dateType?: "use_by" | "best_before" | "";
  storageInstructions?: string;
  quidPercent?: string;
  alcoholAbv?: string;
  nutrition?: NutritionTable;
  packagedProtectiveAtmosphere?: boolean;
  nano?: boolean;
  irradiated?: boolean;
}

// ---------------------------------------------------------------
// Per-pack field instructions
// ---------------------------------------------------------------
const FOOD_FIELDS: Record<string, string> = {
  brandName: "Suggest a plausible UK food brand name that fits the category. Return ONLY the name.",
  productName: "Suggest a concise, marketable UK food product name (max 6 words). Return ONLY the name.",
  ingredients: "Return a realistic ingredients list for this food product, comma-separated, in DESCENDING order of weight. EMPHASISE the 14 UK allergens (gluten/wheat/rye/barley/oats, crustaceans, eggs, fish, peanuts, soybeans, milk, tree nuts, celery, mustard, sesame, sulphites, lupin, molluscs) in ALL CAPS wherever they appear. Include % QUID after the ingredient in brackets where regulation requires it. Return ONLY the list.",
  allergens: "Summarise the 14 UK allergens present in the ingredients as a comma-separated list. If none, return exactly 'None'. Return ONLY the list.",
  countryOfOrigin: "Suggest a plausible country of origin. Return ONLY the country name.",
  netQuantity: "Suggest a realistic net quantity using metric units (g, kg, ml, cl, l). Return ONLY the value.",
  batchNumber: "Generate a realistic batch/lot code (e.g. 'L2026-118A'). Return ONLY the code.",
  bestBefore: "Suggest a plausible date in DD/MM/YYYY format that matches the product's shelf life. Return ONLY the date.",
  responsiblePerson: "Suggest a UK Food Business Operator address in the format 'Company Ltd, Street, City POSTCODE'. Must include a valid UK postcode. Return ONLY the address line.",
  certifications: "Suggest 2-4 relevant food certifications (e.g. 'Red Tractor, RSPCA Assured, Organic'), comma-separated. Return ONLY the list.",
  storageInstructions: "Suggest concise storage instructions appropriate for this product (e.g. 'Keep refrigerated below 5°C. Once opened, consume within 3 days.'). Return ONLY the instruction text.",
  quidPercent: "Suggest a plausible QUID declaration for the main characterising ingredient (e.g. 'Beef 62%'). Return ONLY the declaration.",
  alcoholAbv: "Suggest a realistic ABV (percentage) for this drink. Return ONLY the number followed by '% vol'.",
  nutrition: "Return a realistic nutrition declaration per 100g for this product as strict JSON with keys: energyKj, energyKcal, fat, saturates, carbs, sugars, protein, salt. Values as strings with units (e.g. '2.4g', '0.5g'). Return ONLY the JSON.",
};

const COSMETIC_FIELDS: Record<string, string> = {
  brandName: "Suggest a plausible skincare/cosmetic brand name. Return ONLY the name.",
  productName: "Suggest a concise, marketable cosmetic product name (max 6 words). Return ONLY the name.",
  ingredients: "Return a realistic INCI ingredient list appropriate for this cosmetic, comma-separated, ordered by proportion. Use INCI names only (Aqua, Glycerin, etc.). Return ONLY the list.",
  allergens: "List any of the 26 EU fragrance allergens likely present (comma-separated). If none, return 'None'. Return ONLY the list.",
  countryOfOrigin: "Suggest a plausible country of origin. Return ONLY the country name.",
  netQuantity: "Suggest a realistic nominal content with unit (e.g. '30ml', '50g'). Return ONLY the value.",
  batchNumber: "Generate a realistic batch code (e.g. 'BT-2026-441'). Return ONLY the code.",
  bestBefore: "Suggest a best-before date in MM/YYYY, ~30 months out. Return ONLY the date.",
  responsiblePerson: "Suggest a UK Responsible Person address 'Company Ltd, Street, City POSTCODE'. Return ONLY the address.",
  certifications: "Suggest 2-4 cosmetic certifications (e.g. 'Cruelty Free International, Vegan Society, COSMOS Organic'). Return ONLY the list.",
  storageInstructions: "Suggest storage instructions (e.g. 'Store below 25°C. Keep out of direct sunlight.'). Return ONLY the text.",
  quidPercent: "",
  alcoholAbv: "",
  nutrition: "",
};

const GENERIC_FIELDS: Record<string, string> = {
  ...COSMETIC_FIELDS,
  ingredients: "Return a realistic ingredient/material list appropriate for this product, comma-separated. Return ONLY the list.",
};

function pickFieldMap(pack: Pack): Record<string, string> {
  if (pack === "food") return FOOD_FIELDS;
  if (pack === "cosmetic") return COSMETIC_FIELDS;
  return GENERIC_FIELDS;
}

function contextBlock(fields: FieldsIn, pack: Pack): string {
  const lines: string[] = [`Regulatory pack: ${pack.toUpperCase()}`];
  if (fields.category) lines.push(`Category: ${fields.category}`);
  if (fields.brandName) lines.push(`Brand: ${fields.brandName}`);
  if (fields.productName) lines.push(`Product: ${fields.productName}`);
  if (fields.ingredients) lines.push(`Ingredients: ${fields.ingredients}`);
  if (fields.allergens) lines.push(`Allergens: ${fields.allergens}`);
  if (fields.quidPercent) lines.push(`QUID: ${fields.quidPercent}`);
  if (fields.countryOfOrigin) lines.push(`Origin: ${fields.countryOfOrigin}`);
  if (fields.netQuantity) lines.push(`Net quantity: ${fields.netQuantity}`);
  if (fields.alcoholAbv) lines.push(`Alcohol: ${fields.alcoholAbv}`);
  if (fields.dateType && fields.bestBefore)
    lines.push(
      `${fields.dateType === "use_by" ? "Use by" : "Best before"}: ${fields.bestBefore}`
    );
  else if (fields.bestBefore) lines.push(`Date: ${fields.bestBefore}`);
  if (fields.batchNumber) lines.push(`Batch/Lot: ${fields.batchNumber}`);
  if (fields.storageInstructions) lines.push(`Storage: ${fields.storageInstructions}`);
  if (fields.responsiblePerson) lines.push(`FBO / Responsible person: ${fields.responsiblePerson}`);
  if (fields.certifications) lines.push(`Certifications: ${fields.certifications}`);
  if (fields.packagedProtectiveAtmosphere) lines.push("Packaged in a protective atmosphere.");
  if (fields.nano) lines.push("Contains engineered nanomaterials.");
  if (fields.irradiated) lines.push("Treated with ionising radiation.");
  if (fields.nutrition && Object.keys(fields.nutrition).length > 0) {
    const n = fields.nutrition;
    lines.push(
      `Nutrition per 100g — Energy: ${n.energyKj || "?"}kJ / ${n.energyKcal || "?"}kcal, Fat: ${n.fat || "?"} (Saturates: ${n.saturates || "?"}), Carbohydrate: ${n.carbs || "?"} (Sugars: ${n.sugars || "?"}), Protein: ${n.protein || "?"}, Salt: ${n.salt || "?"}`
    );
  }
  return lines.length ? lines.join("\n") : "(no data yet)";
}

// ---------------------------------------------------------------
// Preview prompts per pack
// ---------------------------------------------------------------
const FOOD_PREVIEW_SYSTEM = `You compose the on-pack copy block for a UK pre-packed food label following the UK Food Information for Consumers (FIC) regulations. Return clean plain text (no markdown, no code fences).

Structure exactly in this order, skipping any section with no data:

=== FIELD OF VISION ===
PRODUCT NAME (uppercase, bold effect via caps)
Net quantity | ABV (if drink over 1.2%)

INGREDIENTS: comma-separated in descending order of weight. EMPHASISE any of the 14 UK allergens in ALL CAPS wherever they appear. Include (%) QUID after the ingredient name where required.

ALLERGENS: brief allergen advice sentence if not already obvious.

USE BY: date  OR  BEST BEFORE: date   (use the label the FBO chose; 'Use by' means a safety date)
BATCH / LOT: code

STORAGE: instructions (mandatory if 'Use by')
COUNTRY OF ORIGIN: country

NUTRITION (per 100g):
Energy: X kJ / Y kcal
Fat: Xg   of which saturates: Xg
Carbohydrate: Xg   of which sugars: Xg
Protein: Xg
Salt: Xg

WARNINGS: only the regulatory phrases that apply (aspartame, liquorice, caffeine, polyols, sweeteners, plant sterols). One per line.

RESPONSIBLE FBO: name and full UK address (must include a UK postcode).

CERTIFICATIONS: comma-separated.

Rules:
- British English.
- No markdown, no emojis, no fabricated data.
- If a field is empty, drop the whole line.
- Keep spacing tight and retail-ready.`;

const COSMETIC_PREVIEW_SYSTEM = `You compose the on-pack copy block for a UK cosmetic product. Return clean plain text (no markdown).
Line 1: PRODUCT NAME (uppercase, brand line underneath if provided).
Then labelled sections, each on its own paragraph, skipping empties:
- Ingredients (INCI): ...
- Allergens: ...
- Nominal content: ...
- Best before / PAO: ...
- Batch: ...
- Country of origin: ...
- Responsible person: ...
- Certifications: ...
British English. Concise, factual, retail-ready.`;

const GENERIC_PREVIEW_SYSTEM = COSMETIC_PREVIEW_SYSTEM;

function pickPreviewSystem(pack: Pack): string {
  if (pack === "food") return FOOD_PREVIEW_SYSTEM;
  if (pack === "cosmetic") return COSMETIC_PREVIEW_SYSTEM;
  return GENERIC_PREVIEW_SYSTEM;
}

async function callAI(system: string, user: string) {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) throw new Error("OPENROUTER_API_KEY not configured");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://labelring.com",
      "X-Title": "Labelring",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("AI gateway error", res.status, t);
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 402) throw new Error("CREDITS");
    throw new Error("AI_FAILED");
  }
  const json = await res.json();
  return (json.choices?.[0]?.message?.content ?? "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const mode = body.mode as "field" | "preview";
    const fields: FieldsIn = body.fields ?? {};
    const pack: Pack = (body.pack as Pack) || "generic";

    if (mode === "field") {
      const field = String(body.field ?? "");
      const map = pickFieldMap(pack);
      const instr = map[field];
      if (!instr) {
        return new Response(JSON.stringify({ error: "unknown field for pack" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const system = `You are a product-label copywriter and UK regulatory expert. ${instr} No quotes, no markdown, no explanations.`;
      const user = `Current label context:\n${contextBlock(fields, pack)}\n\nSuggest a value for: ${field}`;
      const value = (await callAI(system, user))
        .replace(/^```(?:json)?\s*|\s*```$/g, "")
        .replace(/^["'`]+|["'`]+$/g, "")
        .replace(/^\s*[-•]\s*/, "")
        .trim();
      return new Response(JSON.stringify({ value }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "preview") {
      const system = pickPreviewSystem(pack);
      const user = `Compose the on-pack copy block for this label:\n${contextBlock(fields, pack)}`;
      const preview = await callAI(system, user);
      return new Response(JSON.stringify({ preview }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown mode" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg === "RATE_LIMIT" ? 429 : msg === "CREDITS" ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
