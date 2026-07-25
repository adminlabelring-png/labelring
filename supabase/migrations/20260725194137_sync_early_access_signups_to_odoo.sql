-- Fires the sync-odoo-lead edge function on every new early_access_signups
-- row so the sales team's Odoo CRM gets a lead for each Scan/Generate
-- signup in real time. Uses pg_net for async outbound HTTP, and reads the
-- shared webhook secret from Vault at runtime (the secret value itself is
-- never stored in a migration file / git history).
create extension if not exists pg_net;

create or replace function public.notify_odoo_new_signup()
returns trigger
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  webhook_secret text;
begin
  select decrypted_secret into webhook_secret
  from vault.decrypted_secrets
  where name = 'odoo_webhook_secret'
  limit 1;

  perform net.http_post(
    url := 'https://iufpejjamjiuluuugkjn.supabase.co/functions/v1/sync-odoo-lead',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', coalesce(webhook_secret, '')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'early_access_signups',
      'record', to_jsonb(NEW)
    )
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_odoo_new_signup on public.early_access_signups;
create trigger trg_notify_odoo_new_signup
after insert on public.early_access_signups
for each row execute function public.notify_odoo_new_signup();
