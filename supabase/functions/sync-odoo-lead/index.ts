// Edge function: syncs Labelring signups and their subsequent scan/generate
// activity into Odoo CRM.
//
// Invoked by Postgres triggers (see the accompanying migrations) via pg_net:
//   - type "signup": a new early_access_signups row -> creates a crm.lead,
//     then writes the new Odoo lead id back onto the signup row so later
//     "enrich" events know which lead to update.
//   - type "enrich": a new scans/generated_labels row whose signup_id maps
//     to an already-synced lead -> posts a chatter note on that crm.lead
//     with what the person actually scanned/generated.
//
// Auth is a shared secret header, not a Supabase user JWT, since the
// caller is a database trigger.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-webhook-secret",
};

interface SignupRecord {
  id: string;
  name: string;
  email: string;
  company: string;
  product_category: string;
  source: string | null;
  created_at: string;
}

interface SignupPayload {
  type: "signup";
  record: SignupRecord;
}

interface EnrichPayload {
  type: "enrich";
  table: "scans" | "generated_labels";
  odoo_lead_id: number;
  record: Record<string, unknown>;
}

type TriggerPayload = SignupPayload | EnrichPayload;

async function odooRpc(baseUrl: string, service: string, method: string, args: unknown[]) {
  const res = await fetch(`${baseUrl}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
      id: Date.now(),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Odoo HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  if (json.error) {
    const message = json.error.data?.message || json.error.message || "Unknown Odoo error";
    throw new Error(`Odoo RPC error: ${message}`);
  }
  return json.result;
}

async function odooAuthenticate(odooUrl: string, db: string, username: string, apiKey: string) {
  const uid = await odooRpc(odooUrl, "common", "authenticate", [db, username, apiKey, {}]);
  if (!uid) {
    throw new Error("Odoo authentication failed — check ODOO_DB, ODOO_USERNAME and ODOO_API_KEY.");
  }
  return uid as number;
}

function getSupabaseAdmin() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not available — sync state not recorded.");
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

function buildEnrichmentNote(table: string, record: Record<string, unknown>): string {
  if (table === "scans") {
    const productName =
      (record.product_name as string) || (record.file_name as string) || "Unknown product";
    return [
      "<b>Label scan completed</b>",
      `Product: ${productName}`,
      `Category: ${(record.category as string) || "—"}`,
      `Fields found: ${record.found_count ?? "?"}/${record.total_count ?? "?"} (${
        record.needs_attention_count ?? "?"
      } need attention)`,
    ].join("<br/>");
  }
  if (table === "generated_labels") {
    const productName = (record.product_name as string) || "Unnamed product";
    const brand = record.brand_name ? ` (${record.brand_name as string})` : "";
    return [
      "<b>Label generated</b>",
      `Product: ${productName}${brand}`,
      `Category: ${(record.category as string) || "—"} · Pack: ${(record.pack as string) || "—"}`,
      `Compliance score: ${record.compliance_score ?? "—"}%`,
    ].join("<br/>");
  }
  return `Update on ${table}.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const expectedSecret = Deno.env.get("ODOO_WEBHOOK_SECRET");
  const providedSecret = req.headers.get("x-webhook-secret");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload: TriggerPayload = await req.json();

    const odooUrl = Deno.env.get("ODOO_URL");
    const db = Deno.env.get("ODOO_DB");
    const username = Deno.env.get("ODOO_USERNAME");
    const apiKey = Deno.env.get("ODOO_API_KEY");
    if (!odooUrl || !db || !username || !apiKey) {
      throw new Error(
        "Odoo connection not configured — set ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY as edge function secrets."
      );
    }

    const uid = await odooAuthenticate(odooUrl, db, username, apiKey);

    if (payload.type === "signup") {
      const r = payload.record;
      const sourceLabel =
        r.source === "scan" ? "Scan" : r.source === "generate" ? "Generate" : r.source || "Website";

      const leadId = await odooRpc(odooUrl, "object", "execute_kw", [
        db,
        uid,
        apiKey,
        "crm.lead",
        "create",
        [
          {
            name: `${sourceLabel} signup — ${r.name}`,
            contact_name: r.name,
            email_from: r.email,
            partner_name: r.company,
            type: "lead",
            description: `Signed up via Labelring ${sourceLabel} page.\nProduct category: ${r.product_category}\nSubmitted: ${r.created_at}`,
          },
        ],
      ]);

      const supabaseAdmin = getSupabaseAdmin();
      if (supabaseAdmin) {
        const { error: updateError } = await supabaseAdmin
          .from("early_access_signups")
          .update({ odoo_lead_id: leadId })
          .eq("id", r.id);
        if (updateError) {
          console.error("Failed to store odoo_lead_id:", updateError.message);
        }
      }

      return new Response(JSON.stringify({ success: true, odoo_lead_id: leadId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.type === "enrich") {
      const note = buildEnrichmentNote(payload.table, payload.record);
      await odooRpc(odooUrl, "object", "execute_kw", [
        db,
        uid,
        apiKey,
        "crm.lead",
        "message_post",
        [[payload.odoo_lead_id]],
        { body: note },
      ]);

      // Mark this row as synced so the reconciliation job (which retries
      // anything that never landed, since pg_net itself never retries)
      // doesn't post a duplicate note for it.
      const recordId = (payload.record as { id?: string }).id;
      const supabaseAdmin = getSupabaseAdmin();
      if (supabaseAdmin && recordId) {
        const { error: updateError } = await supabaseAdmin
          .from(payload.table)
          .update({ odoo_synced_at: new Date().toISOString() })
          .eq("id", recordId);
        if (updateError) {
          console.error(`Failed to mark ${payload.table} row as synced:`, updateError.message);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown payload type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("sync-odoo-lead error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
