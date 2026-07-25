// Edge function: syncs new early_access_signups rows into Odoo CRM as leads.
// Invoked by a Postgres trigger (see the accompanying migration) via pg_net
// on INSERT into early_access_signups. Auth is a shared secret header, not
// a Supabase user JWT, since the caller is a database trigger.

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

interface TriggerPayload {
  type: string;
  table: string;
  record: SignupRecord;
}

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
    if (payload.table !== "early_access_signups" || payload.type !== "INSERT") {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const r = payload.record;

    const odooUrl = Deno.env.get("ODOO_URL");
    const db = Deno.env.get("ODOO_DB");
    const username = Deno.env.get("ODOO_USERNAME");
    const apiKey = Deno.env.get("ODOO_API_KEY");
    if (!odooUrl || !db || !username || !apiKey) {
      throw new Error(
        "Odoo connection not configured — set ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY as edge function secrets."
      );
    }

    const uid = await odooRpc(odooUrl, "common", "authenticate", [db, username, apiKey, {}]);
    if (!uid) {
      throw new Error("Odoo authentication failed — check ODOO_DB, ODOO_USERNAME and ODOO_API_KEY.");
    }

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

    return new Response(JSON.stringify({ success: true, odoo_lead_id: leadId }), {
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
