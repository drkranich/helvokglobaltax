-- Obligations panel foundation: a calendar of accessory tax obligations
-- (filings, payments, registration renewals) per tenant/organization/market,
-- matching the roadmap item "Painel de obrigações (calendário de obrigações
-- acessórias por país)".
--
-- Reuses the existing 'organizations.manage' permission already seeded and
-- granted to roles in the initial foundation migration (same permission the
-- fiscal_registrations and fiscal_certificates features already use for
-- reading and writing per-organization fiscal data) instead of inventing a
-- new permission key.
--
-- "Overdue" is computed at read time from due_date vs. current date rather
-- than via a background job: obligation_json() derives an effective_status
-- that flips a still-'pending' obligation to 'overdue' once its due_date has
-- passed, so the UI is always accurate without needing a scheduled worker.

begin;

create schema if not exists compliance;

create table compliance.obligations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  organization_id uuid,
  market_code text not null,
  title text not null,
  obligation_type text not null default 'tax_return',
  frequency text not null default 'monthly',
  due_date date not null,
  status text not null default 'pending',
  completed_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references core.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint compliance_obligations_type_chk
    check (obligation_type in ('tax_return', 'payment', 'registration_renewal', 'reporting', 'other')),
  constraint compliance_obligations_frequency_chk
    check (frequency in ('one_time', 'monthly', 'quarterly', 'annual')),
  constraint compliance_obligations_status_chk
    check (status in ('pending', 'completed', 'cancelled')),
  constraint compliance_obligations_title_chk
    check (length(trim(title)) > 0),
  constraint compliance_obligations_market_code_chk
    check (length(trim(market_code)) > 0),
  constraint compliance_obligations_metadata_object_chk
    check (jsonb_typeof(metadata) = 'object'),
  constraint compliance_obligations_organization_fk
    foreign key (tenant_id, organization_id)
    references core.organizations (tenant_id, id)
    on delete set null
);

alter table compliance.obligations
  add constraint compliance_obligations_tenant_id_id_key unique (tenant_id, id);

create index compliance_obligations_tenant_status_idx on compliance.obligations (tenant_id, status);
create index compliance_obligations_tenant_due_date_idx on compliance.obligations (tenant_id, due_date);
create index compliance_obligations_tenant_market_idx on compliance.obligations (tenant_id, market_code);
create index compliance_obligations_tenant_org_idx on compliance.obligations (tenant_id, organization_id);

create trigger compliance_obligations_set_updated_at
before update on compliance.obligations
for each row execute function core.set_updated_at();

alter table compliance.obligations enable row level security;
alter table compliance.obligations force row level security;

create policy "obligations are private to RPCs"
on compliance.obligations
for all
to anon, authenticated
using (false)
with check (false);

grant select, insert, update, delete on compliance.obligations to service_role;

-- JSON projection + RPCs ------------------------------------------------------------

create or replace function compliance.obligation_json(p_obligation compliance.obligations)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, compliance, pg_temp
as $$
  select jsonb_build_object(
    'id', p_obligation.id,
    'tenant_id', p_obligation.tenant_id,
    'organization_id', p_obligation.organization_id,
    'market_code', p_obligation.market_code,
    'title', p_obligation.title,
    'obligation_type', p_obligation.obligation_type,
    'frequency', p_obligation.frequency,
    'due_date', p_obligation.due_date,
    'status', p_obligation.status,
    'effective_status', case
      when p_obligation.status = 'pending' and p_obligation.due_date < current_date then 'overdue'
      else p_obligation.status
    end,
    'completed_at', p_obligation.completed_at,
    'notes', p_obligation.notes,
    'metadata', p_obligation.metadata,
    'created_at', p_obligation.created_at,
    'updated_at', p_obligation.updated_at
  )
$$;

create or replace function compliance.list_obligations_as_admin(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, compliance, pg_temp
as $$
  select coalesce(jsonb_agg(compliance.obligation_json(o) order by o.due_date asc), '[]'::jsonb)
  from compliance.obligations as o
  where o.tenant_id = p_tenant_id
$$;

create or replace function compliance.list_obligations_as_current_user(p_tenant_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, compliance, core, pg_temp
as $$
begin
  if not core.user_has_permission(p_tenant_id, 'organizations.manage') then
    raise exception 'organizations.manage permission is required' using errcode = '42501';
  end if;

  return compliance.list_obligations_as_admin(p_tenant_id);
end;
$$;

create or replace function compliance.upsert_obligation_as_current_user(p_tenant_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, compliance, core, audit, auth, pg_temp
as $$
declare
  v_actor_id uuid;
  v_obligation_id uuid;
  v_title text;
  v_market_code text;
  v_due_date date;
  v_organization_id uuid;
  v_before compliance.obligations%rowtype;
  v_after compliance.obligations%rowtype;
  v_event_type text;
begin
  if not core.user_has_permission(p_tenant_id, 'organizations.manage') then
    raise exception 'organizations.manage permission is required' using errcode = '42501';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'payload must be a JSON object' using errcode = '22023';
  end if;

  v_title := nullif(trim(coalesce(p_payload->>'title', '')), '');
  if v_title is null then
    raise exception 'title is required' using errcode = '22023';
  end if;

  v_market_code := nullif(upper(trim(coalesce(p_payload->>'market_code', ''))), '');
  if v_market_code is null then
    raise exception 'market_code is required' using errcode = '22023';
  end if;

  begin
    v_due_date := nullif(p_payload->>'due_date', '')::date;
  exception when others then
    v_due_date := null;
  end;
  if v_due_date is null then
    raise exception 'due_date is required and must be a valid date' using errcode = '22023';
  end if;

  v_organization_id := nullif(p_payload->>'organization_id', '')::uuid;
  if v_organization_id is not null and not exists (select 1 from core.organizations where tenant_id = p_tenant_id and id = v_organization_id) then
    raise exception 'organization not found for this tenant' using errcode = 'P0002';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;
  v_obligation_id := nullif(p_payload->>'id', '')::uuid;

  if v_obligation_id is not null then
    select * into v_before from compliance.obligations where tenant_id = p_tenant_id and id = v_obligation_id for update;
    if not found then
      raise exception 'obligation not found' using errcode = 'P0002';
    end if;

    v_event_type := 'obligation.updated';

    update compliance.obligations
    set
      organization_id = v_organization_id,
      market_code = v_market_code,
      title = v_title,
      obligation_type = coalesce(nullif(trim(p_payload->>'obligation_type'), ''), obligation_type),
      frequency = coalesce(nullif(trim(p_payload->>'frequency'), ''), frequency),
      due_date = v_due_date,
      notes = case when p_payload ? 'notes' then nullif(trim(p_payload->>'notes'), '') else notes end,
      updated_at = now()
    where tenant_id = p_tenant_id and id = v_obligation_id
    returning * into v_after;
  else
    v_event_type := 'obligation.created';

    insert into compliance.obligations (
      tenant_id, organization_id, market_code, title, obligation_type, frequency, due_date, notes, created_by_user_id
    )
    values (
      p_tenant_id,
      v_organization_id,
      v_market_code,
      v_title,
      coalesce(nullif(trim(p_payload->>'obligation_type'), ''), 'tax_return'),
      coalesce(nullif(trim(p_payload->>'frequency'), ''), 'monthly'),
      v_due_date,
      nullif(trim(coalesce(p_payload->>'notes', '')), ''),
      v_actor_id
    )
    returning * into v_after;
  end if;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, v_event_type, 'compliance.obligation', v_after.id,
    case when v_obligation_id is not null then to_jsonb(v_before) else null end, to_jsonb(v_after), jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, v_event_type, 'compliance.obligation', v_after.id, compliance.obligation_json(v_after));

  return jsonb_build_object('event_type', v_event_type, 'obligation', compliance.obligation_json(v_after), 'obligations', compliance.list_obligations_as_admin(p_tenant_id));
end;
$$;

create or replace function compliance.complete_obligation_as_current_user(p_tenant_id uuid, p_obligation_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, compliance, core, audit, auth, pg_temp
as $$
declare
  v_actor_id uuid;
  v_before compliance.obligations%rowtype;
  v_after compliance.obligations%rowtype;
begin
  if not core.user_has_permission(p_tenant_id, 'organizations.manage') then
    raise exception 'organizations.manage permission is required' using errcode = '42501';
  end if;

  select * into v_before from compliance.obligations where tenant_id = p_tenant_id and id = p_obligation_id for update;
  if not found then
    raise exception 'obligation not found' using errcode = 'P0002';
  end if;

  if v_before.status = 'cancelled' then
    raise exception 'cancelled obligations cannot be completed' using errcode = '42501';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;

  update compliance.obligations set status = 'completed', completed_at = now(), updated_at = now()
  where tenant_id = p_tenant_id and id = p_obligation_id
  returning * into v_after;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'obligation.completed', 'compliance.obligation', p_obligation_id, to_jsonb(v_before), to_jsonb(v_after), jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'obligation.completed', 'compliance.obligation', p_obligation_id, compliance.obligation_json(v_after));

  return jsonb_build_object('event_type', 'obligation.completed', 'obligation', compliance.obligation_json(v_after), 'obligations', compliance.list_obligations_as_admin(p_tenant_id));
end;
$$;

create or replace function compliance.cancel_obligation_as_current_user(p_tenant_id uuid, p_obligation_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, compliance, core, audit, auth, pg_temp
as $$
declare
  v_actor_id uuid;
  v_before compliance.obligations%rowtype;
  v_after compliance.obligations%rowtype;
begin
  if not core.user_has_permission(p_tenant_id, 'organizations.manage') then
    raise exception 'organizations.manage permission is required' using errcode = '42501';
  end if;

  select * into v_before from compliance.obligations where tenant_id = p_tenant_id and id = p_obligation_id for update;
  if not found then
    raise exception 'obligation not found' using errcode = 'P0002';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;

  update compliance.obligations set status = 'cancelled', updated_at = now()
  where tenant_id = p_tenant_id and id = p_obligation_id
  returning * into v_after;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'obligation.cancelled', 'compliance.obligation', p_obligation_id, to_jsonb(v_before), to_jsonb(v_after), jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'obligation.cancelled', 'compliance.obligation', p_obligation_id, compliance.obligation_json(v_after));

  return jsonb_build_object('event_type', 'obligation.cancelled', 'obligation', compliance.obligation_json(v_after), 'obligations', compliance.list_obligations_as_admin(p_tenant_id));
end;
$$;

create or replace function compliance.delete_obligation_as_current_user(p_tenant_id uuid, p_obligation_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, compliance, core, audit, auth, pg_temp
as $$
declare
  v_actor_id uuid;
  v_before compliance.obligations%rowtype;
begin
  if not core.user_has_permission(p_tenant_id, 'organizations.manage') then
    raise exception 'organizations.manage permission is required' using errcode = '42501';
  end if;

  select * into v_before from compliance.obligations where tenant_id = p_tenant_id and id = p_obligation_id for update;
  if not found then
    raise exception 'obligation not found' using errcode = 'P0002';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;

  delete from compliance.obligations where tenant_id = p_tenant_id and id = p_obligation_id;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'obligation.deleted', 'compliance.obligation', p_obligation_id, to_jsonb(v_before), null, jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'obligation.deleted', 'compliance.obligation', p_obligation_id, jsonb_build_object('id', p_obligation_id));

  return jsonb_build_object('event_type', 'obligation.deleted', 'obligations', compliance.list_obligations_as_admin(p_tenant_id));
end;
$$;

revoke execute on function compliance.obligation_json(compliance.obligations) from public, anon, authenticated;
revoke execute on function compliance.list_obligations_as_admin(uuid) from public, anon, authenticated;
revoke execute on function compliance.list_obligations_as_current_user(uuid) from public, anon, authenticated;
revoke execute on function compliance.upsert_obligation_as_current_user(uuid, jsonb) from public, anon, authenticated;
revoke execute on function compliance.complete_obligation_as_current_user(uuid, uuid) from public, anon, authenticated;
revoke execute on function compliance.cancel_obligation_as_current_user(uuid, uuid) from public, anon, authenticated;
revoke execute on function compliance.delete_obligation_as_current_user(uuid, uuid) from public, anon, authenticated;

grant execute on function compliance.obligation_json(compliance.obligations) to service_role;
grant execute on function compliance.list_obligations_as_admin(uuid) to service_role;
grant execute on function compliance.list_obligations_as_current_user(uuid) to service_role;
grant execute on function compliance.upsert_obligation_as_current_user(uuid, jsonb) to service_role;
grant execute on function compliance.complete_obligation_as_current_user(uuid, uuid) to service_role;
grant execute on function compliance.cancel_obligation_as_current_user(uuid, uuid) to service_role;
grant execute on function compliance.delete_obligation_as_current_user(uuid, uuid) to service_role;

create or replace function public.helvok_admin_list_obligations(p_tenant_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, compliance, pg_temp
as $$
  select compliance.list_obligations_as_admin(p_tenant_id)
$$;

create or replace function public.helvok_current_list_obligations(p_tenant_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, compliance, pg_temp
as $$
  select compliance.list_obligations_as_current_user(p_tenant_id)
$$;

create or replace function public.helvok_current_upsert_obligation(p_tenant_id uuid, p_payload jsonb)
returns jsonb
language sql
security definer
set search_path = pg_catalog, compliance, pg_temp
as $$
  select compliance.upsert_obligation_as_current_user(p_tenant_id, p_payload)
$$;

create or replace function public.helvok_current_complete_obligation(p_tenant_id uuid, p_obligation_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, compliance, pg_temp
as $$
  select compliance.complete_obligation_as_current_user(p_tenant_id, p_obligation_id)
$$;

create or replace function public.helvok_current_cancel_obligation(p_tenant_id uuid, p_obligation_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, compliance, pg_temp
as $$
  select compliance.cancel_obligation_as_current_user(p_tenant_id, p_obligation_id)
$$;

create or replace function public.helvok_current_delete_obligation(p_tenant_id uuid, p_obligation_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, compliance, pg_temp
as $$
  select compliance.delete_obligation_as_current_user(p_tenant_id, p_obligation_id)
$$;

revoke execute on function public.helvok_admin_list_obligations(uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_list_obligations(uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_upsert_obligation(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.helvok_current_complete_obligation(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_cancel_obligation(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_delete_obligation(uuid, uuid) from public, anon, authenticated;

grant execute on function public.helvok_admin_list_obligations(uuid) to service_role;
grant execute on function public.helvok_current_list_obligations(uuid) to authenticated;
grant execute on function public.helvok_current_upsert_obligation(uuid, jsonb) to authenticated;
grant execute on function public.helvok_current_complete_obligation(uuid, uuid) to authenticated;
grant execute on function public.helvok_current_cancel_obligation(uuid, uuid) to authenticated;
grant execute on function public.helvok_current_delete_obligation(uuid, uuid) to authenticated;

commit;
