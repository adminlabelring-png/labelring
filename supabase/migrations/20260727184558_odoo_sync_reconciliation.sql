-- pg_net has no built-in retry: a single transient failure (e.g. a cold-
-- start 502 from the edge function) silently drops that sync forever, with
-- no error visible anywhere except net._http_response. This adds a
-- scheduled reconciliation job that retries anything that never landed.
create extension if not exists pg_cron;

-- Tracks when a scan/label's Odoo enrichment note was actually posted, so
-- the reconciliation job below doesn't re-send duplicate notes for rows
-- that already succeeded.
alter table public.scans
  add column if not exists odoo_synced_at timestamptz;

alter table public.generated_labels
  add column if not exists odoo_synced_at timestamptz;

create or replace function public.reconcile_odoo_sync()
returns void
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  webhook_secret text;
  r record;
begin
  select decrypted_secret into webhook_secret
  from vault.decrypted_secrets
  where name = 'odoo_webhook_secret'
  limit 1;

  -- Retry signups whose Odoo lead was never created. Give the original
  -- trigger 2 minutes before assuming it needs a retry.
  for r in
    select * from public.early_access_signups
    where odoo_lead_id is null
      and created_at < now() - interval '2 minutes'
      and created_at > now() - interval '24 hours'
    limit 20
  loop
    perform net.http_post(
      url := 'https://iufpejjamjiuluuugkjn.supabase.co/functions/v1/sync-odoo-lead',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', coalesce(webhook_secret, '')),
      body := jsonb_build_object('type', 'signup', 'record', to_jsonb(r))
    );
  end loop;

  -- Retry scan enrichments that never landed.
  for r in
    select s.*, e.odoo_lead_id as target_odoo_lead_id
    from public.scans s
    join public.early_access_signups e on e.id = s.signup_id
    where s.odoo_synced_at is null
      and e.odoo_lead_id is not null
      and s.created_at < now() - interval '2 minutes'
      and s.created_at > now() - interval '24 hours'
    limit 20
  loop
    perform net.http_post(
      url := 'https://iufpejjamjiuluuugkjn.supabase.co/functions/v1/sync-odoo-lead',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', coalesce(webhook_secret, '')),
      body := jsonb_build_object('type', 'enrich', 'table', 'scans', 'odoo_lead_id', r.target_odoo_lead_id, 'record', to_jsonb(r))
    );
  end loop;

  -- Retry generated_labels enrichments that never landed.
  for r in
    select g.*, e.odoo_lead_id as target_odoo_lead_id
    from public.generated_labels g
    join public.early_access_signups e on e.id = g.signup_id
    where g.odoo_synced_at is null
      and e.odoo_lead_id is not null
      and g.created_at < now() - interval '2 minutes'
      and g.created_at > now() - interval '24 hours'
    limit 20
  loop
    perform net.http_post(
      url := 'https://iufpejjamjiuluuugkjn.supabase.co/functions/v1/sync-odoo-lead',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', coalesce(webhook_secret, '')),
      body := jsonb_build_object('type', 'enrich', 'table', 'generated_labels', 'odoo_lead_id', r.target_odoo_lead_id, 'record', to_jsonb(r))
    );
  end loop;
end;
$$;

select cron.schedule('reconcile-odoo-sync', '*/5 * * * *', 'select public.reconcile_odoo_sync();');

-- Postgres functions are EXECUTE-granted to PUBLIC by default, which
-- PostgREST turns into a callable RPC endpoint (POST /rest/v1/rpc/...).
-- This job should only ever run on its own schedule via pg_cron, not be
-- triggerable by anon/authenticated clients.
revoke execute on function public.reconcile_odoo_sync() from public, anon, authenticated;
