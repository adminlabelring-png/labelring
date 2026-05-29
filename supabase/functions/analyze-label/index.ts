import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a product label compliance analyst. You receive an image of a product label.

Your job:
1. Extract all visible text from the label image (OCR). Be thorough — examine every area of the label including:
   - Near barcodes and QR codes (batch/lot numbers are often printed adjacent to or below barcodes)
   - Bottom edges and corners of the label
   - Small print areas
   - Back-of-pack panels
   - Regulatory information panels

2. Map the extracted text into the following fields. For each field, determine a status:
   - "found" — the information is clearly present
   - "needs_review" — something is present but unclear, partial, or possibly incorrect
   - "not_found" — the information is completely missing

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

3. Detect the product category (one of: Skincare, Food, Beverage, Supplements, Household, Other).

4. For each field with status "needs_review" or "not_found", provide a brief suggested fix.

You MUST respond with ONLY valid JSON matching this exact schema (no markdown, no code fences):
{
  "category": "string",
  "fields": [
    {
      "label": "string",
      "value": "string or null",
      "status": "found | needs_review | not_found",
      "suggestedFix": "string or null"
    }
  ]
}`;
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { imageBase64, fileName, isSeasonal, seasonTag } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "imageBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const seasonalAddendum = isSeasonal
      ? `\n\nSEASONAL / TEMPORARY SKU RISK MODE IS ACTIVE${seasonTag ? ` (tag: ${seasonTag})` : ""}.\nApply stricter scrutiny: be especially critical about (a) on-pack promotional claims and "limited edition" wording that must still meet labelling rules, (b) batch/lot codes — seasonal runs often skip these, (c) date markings (best-before / expiry) clearly visible, (d) allergen carry-over from shared seasonal production lines, (e) net quantity changes for promo packs / multipacks, (f) any temporary co-branding or partner logos that may need additional declarations. When in doubt, mark fields as "needs_review" rather than "found".`
      : "";

    // Detect mime type from base64 header or default to jpeg
    let mimeType = "image/jpeg";
    if (imageBase64.startsWith("/9j/")) mimeType = "image/jpeg";
    else if (imageBase64.startsWith("iVBOR")) mimeType = "image/png";
    else if (imageBase64.startsWith("JVBER")) mimeType = "application/pdf";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + seasonalAddendum },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this product label image. File name: ${fileName || "unknown"}. Extract all fields and return JSON only.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
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
