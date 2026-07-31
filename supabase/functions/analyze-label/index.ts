import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a product label compliance analyst. You receive one or more images of a single product's packaging — often different sides or faces of the same item (front, ingredients/nutrition panel, back-of-pack, base, etc), submitted together as one scan.

CRITICAL RULE: you may only report a field's status as "missing" if you have confirmed you can see the ENTIRE product packaging (all sides, the base, and the top/shoulder where applicable) across ALL submitted images combined. If you cannot see enough of the packaging to be sure, use "not_verified" instead — never guess "missing" from partial coverage. Getting this distinction right is the single most important part of your job: a false "missing" on a compliance tool causes real harm to a business relying on it.

Your job:
1. Assess image coverage first, across ALL submitted images together — not per image. Consider the packaging's shape (bottle, jar, tube, aerosol can, box, pouch, etc.) and judge what fraction of its surface is visible when you combine everything shown across every image. Cylindrical or wraparound packaging (cans, bottles, tubes, jars) almost always has information on faces not visible from a single angle — assume coverage is INCOMPLETE unless the combined images clearly show every panel (front, back, base, and any wraparound sides), or the packaging is flat and fully visible in one shot (e.g. a box photographed to show every panel at once).

2. Extract all visible text from every image (OCR). Treat all submitted images as one combined view of the same product — a field found in any one image counts as found; don't report a field as missing just because it wasn't in the first image if it's visible in another. Be thorough — examine every area including:
   - Near barcodes and QR codes (batch/lot numbers are often printed adjacent to or below barcodes)
   - Bottom edges and corners of the label
   - Small print areas
   - Back-of-pack panels
   - Regulatory information panels

3. Map the extracted text into the following fields. For each field, determine a FOUR-STATE status:
   - "verified" — clearly visible, extracted with high confidence, no ambiguity
   - "low_confidence" — detected but the text is unclear, blurry, partially obscured, or you're inferring it rather than reading it directly
   - "not_verified" — you cannot confirm this because the area where it would normally appear isn't visible in the submitted image
   - "missing" — ONLY if you've confirmed full packaging coverage (see the critical rule above) and the field is genuinely absent

Fields to extract:
- Product Name
- Ingredients (include both active and inactive ingredients if listed separately)
- Warnings
- Manufacturer / Responsible Person (also look for "Distributed by", "Manufactured by", "Made by" etc.)
- Country of Origin
- Batch / Lot Number (IMPORTANT: look near barcodes, at bottom of label, and in small print — often formatted as numeric codes like "30056090" or prefixed with "LOT", "Batch", "L:")
- Expiry / Best Before
- Allergens
- Net Quantity (weight, volume, count)
- Storage Instructions (also look for "Other information" sections)

4. Detect the product category — one of: Cosmetic, Food, Beverage, Supplement, Household, Other.
   "Cosmetic" covers ALL personal care and cosmetic products — skincare, haircare (including hairsprays, shampoos, styling products), makeup, fragrance, oral care, personal-care aerosols, etc. Don't default to "Other" just because a product isn't facial skincare.

5. For each field with status other than "verified", provide a brief suggestedFix — phrase it according to WHY the field isn't verified:
   - "not_verified" (blocked by incomplete coverage): phrase it as a request for an ADDITIONAL IMAGE, not an instruction to add something to the label (e.g. "Capture an additional image showing the base or opposite side — batch/lot numbers are commonly printed separately from the main label.").
   - "missing" (confirmed absent after full coverage): phrase it as what needs to be ADDED to the label.
   - "low_confidence": phrase it as what would help clarify (e.g. re-take with better lighting/focus on that area).

You MUST respond with ONLY valid JSON matching this exact schema (no markdown, no code fences):
{
  "category": "string",
  "coverage": {
    "isComplete": boolean,
    "visibleAreas": ["string", ...],
    "missingAreas": ["string", ...],
    "note": "one plain-language sentence, e.g. 'Only the front label is visible; the base, top and opposite side were not captured.'"
  },
  "fields": [
    {
      "label": "string",
      "value": "string or null",
      "status": "verified | low_confidence | not_verified | missing",
      "suggestedFix": "string or null"
    }
  ]
}`;

class AIError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ImageInput {
  mimeType: string;
  base64: string;
}

async function callOpenRouter(system: string, userText: string, images: ImageInput[]) {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://labelring.com",
      "X-Title": "Labelring",
    },
    body: JSON.stringify({
      model: "google/gemini-flash-latest",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            ...images.map((img) => ({
              type: "image_url",
              image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
            })),
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter error:", response.status, errorText);
    throw new AIError(response.status, `OpenRouter request failed (${response.status}): ${errorText.slice(0, 300)}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content in OpenRouter response");
  return content;
}

async function callGemini(system: string, userText: string, images: ImageInput[]) {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY is not configured");

  const model = Deno.env.get("GEMINI_MODEL") || "gemini-flash-latest";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [
          {
            role: "user",
            parts: [
              { text: userText },
              ...images.map((img) => ({ inline_data: { mime_type: img.mimeType, data: img.base64 } })),
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini error:", response.status, errorText);
    throw new AIError(response.status, `Gemini request failed (${response.status}): ${errorText.slice(0, 300)}`);
  }

  const json = await response.json();
  const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("No content in Gemini response");
  return content;
}

async function callAI(system: string, userText: string, images: ImageInput[]) {
  const provider = (Deno.env.get("AI_PROVIDER") || "openrouter").toLowerCase();
  if (provider === "gemini") return callGemini(system, userText, images);
  return callOpenRouter(system, userText, images);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images: rawImages, isSeasonal, seasonTag } = await req.json();

    if (!Array.isArray(rawImages) || rawImages.length === 0) {
      return new Response(
        JSON.stringify({ error: "images (non-empty array) is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const seasonalAddendum = isSeasonal
      ? `\n\nSEASONAL / TEMPORARY SKU RISK MODE IS ACTIVE${seasonTag ? ` (tag: ${seasonTag})` : ""}.\nApply stricter scrutiny: be especially critical about (a) on-pack promotional claims and "limited edition" wording that must still meet labelling rules, (b) batch/lot codes — seasonal runs often skip these, (c) date markings (best-before / expiry) clearly visible, (d) allergen carry-over from shared seasonal production lines, (e) net quantity changes for promo packs / multipacks, (f) any temporary co-branding or partner logos that may need additional declarations. When in doubt, mark fields as "low_confidence" or "not_verified" rather than "verified" or "missing".`
      : "";

    // Detect mime type per image from its base64 header, default to jpeg
    const images: ImageInput[] = rawImages.map((img: { base64: string }) => {
      let mimeType = "image/jpeg";
      if (img.base64.startsWith("/9j/")) mimeType = "image/jpeg";
      else if (img.base64.startsWith("iVBOR")) mimeType = "image/png";
      else if (img.base64.startsWith("JVBER")) mimeType = "application/pdf";
      return { mimeType, base64: img.base64 };
    });

    const fileNames = rawImages.map((img: { fileName?: string }) => img.fileName || "unknown").join(", ");
    const userText =
      images.length > 1
        ? `Analyze these ${images.length} images together — they are different sides/faces of the same product's packaging, submitted as one scan. File names: ${fileNames}. Extract all fields and return JSON only.`
        : `Analyze this product label image. File name: ${fileNames}. Extract all fields and return JSON only.`;

    let content: string;
    try {
      content = await callAI(SYSTEM_PROMPT + seasonalAddendum, userText, images);
    } catch (e) {
      if (e instanceof AIError) {
        if (e.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (e.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ error: e.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw e;
    }

    // Parse the JSON from the AI response (strip markdown fences if present)
    let parsed;
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI analysis result");
    }

    // Critical rule enforcement — defense in depth alongside the client's
    // own enforcement in buildScanResult(): a false "missing" must never
    // leave this function, even if the model didn't follow instructions.
    const coverageComplete = parsed?.coverage?.isComplete === true;
    if (!parsed?.coverage) {
      parsed.coverage = {
        isComplete: false,
        visibleAreas: [],
        missingAreas: [],
        note: "Coverage could not be assessed for this image.",
      };
    }
    if (!coverageComplete && Array.isArray(parsed.fields)) {
      parsed.fields = parsed.fields.map((f: { status?: string }) =>
        f?.status === "missing" ? { ...f, status: "not_verified" } : f
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-label error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
