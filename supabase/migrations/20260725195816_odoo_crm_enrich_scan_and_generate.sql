-- Links a signup to whatever they actually scan/generate afterward, and
-- enriches the corresponding Odoo CRM lead (created by the signup trigger)
-- with that activity so the sales team sees the full picture, not just the
-- contact-capture form fields.
alter table public.early_access_signups
  add column if not exists odoo_lead_id integer;

-- No FK to early_access_signups: this column is purely for optional CRM
-- enrichment, and a stale/missing signup_id (e.g. cross-session) must never
-- block the core scan/generate save.
alter table public.scans
  add column if not exists signup_id uuid;

alter table public.generated_labels
  add column if not exists signup_id uuid;

drop trigger if exists trg_notify_odoo_new_signup on public.early_access_signups;
drop function if exists public.notify_odoo_new_signup();

create or replace function public.notify_odoo_crm()
returns trigger
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  webhook_secret text;
  target_odoo_lead_id integer;
begin
  select decrypted_secret into webhook_secret
  from vault.decrypted_secrets
  where name = 'odoo_webhook_secret'
  limit 1;

  if TG_TABLE_NAME = 'early_access_signups' then
    perform net.http_post(
      url := 'https://iufpejjamjiuluuugkjn.supabase.co/functions/v1/sync-odoo-lead',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', coalesce(webhook_secret, '')
      ),
      body := jsonb_build_object(
        'type', 'signup',
        'record', to_jsonb(NEW)
      )
    );
  elsif NEW.signup_id is not null then
    select odoo_lead_id into target_odoo_lead_id
    from public.early_access_signups
    where id = NEW.signup_id;

    if target_odoo_lead_id is not null then
      perform net.http_post(
        url := 'https://iufpejjamjiuluuugkjn.supabase.co/functions/v1/sync-odoo-lead',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-webhook-secret', coalesce(webhook_secret, '')
        ),
        body := jsonb_build_object(
          'type', 'enrich',
          'table', TG_TABLE_NAME,
          'odoo_lead_id', target_odoo_lead_id,
          'record', to_jsonb(NEW)
        )
      );
    end if;
  end if;

  return NEW;
end;
$$;

create trigger trg_notify_odoo_signup
after insert on public.early_access_signups
for each row execute function public.notify_odoo_crm();

create trigger trg_notify_odoo_scan
after insert on public.scans
for each row execute function public.notify_odoo_crm();

create trigger trg_notify_odoo_label
after insert on public.generated_labels
for each row execute function public.notify_odoo_crm();
