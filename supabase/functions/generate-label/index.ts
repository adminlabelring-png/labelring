// Edge function: AI helper for the label generator.
// Two modes:
//   - "field":   suggest a value for a single field given current context
//   - "preview": compose the on-pack copy block from current fields

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MODEL = "google/gemini-2.5-flash";

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
}

const FIELD_INSTRUCTIONS: Record<string, string> = {
  brandName: "Suggest a plausible brand name that fits the product context. Return ONLY the name.",
  productName: "Suggest a concise, marketable product name (max 6 words). Return ONLY the name.",
  ingredients: "Return a realistic, comma-separated INCI/ingredient list appropriate for the product category. Use INCI names for skincare, plain names for food. Order by proportion (highest first). Return ONLY the comma-separated list, no preamble.",
  allergens: "List common allergens present in the ingredients (comma-separated). If none, return exactly 'None'. Return ONLY the list.",
  countryOfOrigin: "Suggest a likely country of origin. Return ONLY the country name.",
  netQuantity: "Suggest a realistic net quantity with unit (e.g. '30ml', '250g'). Return ONLY the value.",
  batchNumber: "Generate a realistic batch/lot code (e.g. 'LOT-2026-04A'). Return ONLY the code.",
  bestBefore: "Suggest a best-before date in MM/YYYY format ~24-36 months out. Return ONLY the date.",
  responsiblePerson: "Suggest a UK responsible person address in the format 'Company Ltd, Street, City POSTCODE'. Return ONLY the address line.",
  certifications: "Suggest 2-4 relevant certifications for the category, comma-separated (e.g. 'Organic, Cruelty Free, Vegan'). Return ONLY the list.",
};

function contextBlock(fields: FieldsIn): string {
  const lines: string[] = [];
  if (fields.category) lines.push(`Category: ${fields.category}`);
  if (fields.brandName) lines.push(`Brand: ${fields.brandName}`);
  if (fields.productName) lines.push(`Product: ${fields.productName}`);
  if (fields.ingredients) lines.push(`Ingredients: ${fields.ingredients}`);
  if (fields.allergens) lines.push(`Allergens: ${fields.allergens}`);
  if (fields.countryOfOrigin) lines.push(`Origin: ${fields.countryOfOrigin}`);
  if (fields.netQuantity) lines.push(`Quantity: ${fields.netQuantity}`);
  if (fields.responsiblePerson) lines.push(`Responsible person: ${fields.responsiblePerson}`);
  if (fields.certifications) lines.push(`Certifications: ${fields.certifications}`);
  return lines.length ? lines.join("\n") : "(no other fields filled yet)";
}

async function callAI(system: string, user: string) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
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

    if (mode === "field") {
      const field = String(body.field ?? "");
      const instr = FIELD_INSTRUCTIONS[field];
      if (!instr) {
        return new Response(JSON.stringify({ error: "unknown field" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const system = `You are a product-label copywriter and regulatory expert. ${instr} No quotes, no markdown, no explanations.`;
      const user = `Current label context:\n${contextBlock(fields)}\n\nSuggest a value for: ${field}`;
      const value = (await callAI(system, user))
        .replace(/^["'`]+|["'`]+$/g, "")
        .replace(/^\s*[-•]\s*/, "")
        .trim();
      return new Response(JSON.stringify({ value }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "preview") {
      const system = `You compose the on-pack copy block for a product label. Return clean plain text (no markdown, no code fences) that would appear printed on the physical label. Structure:
Line 1: PRODUCT NAME (uppercase, brand tagline underneath if provided)
Then labelled sections in this order, each on its own paragraph:
- Ingredients: ...
- Allergens: ... (bold-emphasise inside using CAPS for allergen names)
- Net quantity: ...
- Best before: ... | Batch: ...
- Country of origin: ...
- Responsible person: ...
- Certifications: ...
Skip any section that has no data. Keep it concise, factual, retail-ready. British English.`;
      const user = `Compose the on-pack copy block for this label:\n${contextBlock(fields)}`;
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
