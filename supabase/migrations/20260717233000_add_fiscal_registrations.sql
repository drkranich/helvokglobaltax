-- Helvok Tax fiscal registration foundation.
--
-- Helvok Tax itself never issues fiscal documents under its own CNPJ/tax id:
-- it is a multi-tenant platform. Every tenant's own legal entity
-- (core.organizations) is the one that needs a real tax registration
-- (CNPJ/EIN/VAT id, secondary/tertiary registration numbers, tax regime,
-- fiscal address) before any country adapter can leave "planned" status.
--
-- This table stays country-neutral on purpose: it stores generic
-- identifiers and lets each country adapter interpret/validate the format
-- (CNPJ mask for Brazil, EIN format for the US, VAT id format for Europe,
-- etc.) instead of hardcoding any single country's rules here.

begin;

create table core.fiscal_registrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  organization_id uuid not null,
  country_code text not null,
  legal_name text,
  tax_id text not null,
  tax_id_label text not null default 'tax_id',
  tax_regime text not null default 'standard',
  secondary_registration text,
  secondary_registration_label text,
  tertiary_registration text,
  tertiary_registration_label text,
  fiscal_address jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references core.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_fiscal_registrations_organization_fk
    foreign key (tenant_id, organization_id)
    references core.organizations (tenant_id, id)
    on delete cascade,
  constraint core_fiscal_registrations_country_chk
    check (country_code ~ '^[A-Z]{2}$'),
  constraint core_fiscal_registrations_tax_id_chk
    check (length(trim(tax_id)) > 0),
  constraint core_fiscal_registrations_tax_regime_chk
    check (tax_regime in (
      'simples_nacional',
      'lucro_presumido',
      'lucro_real',
      'mei',
      'standard',
      'flat_rate',
      'flow_through',
      'exempt',
      'other'
    )),
  constraint core_fiscal_registrations_status_chk
    check (status in ('draft', 'pending_review', 'active', 'suspended', 'archived')),
  constraint core_fiscal_registrations_fiscal_address_object_chk
    check (jsonb_typeof(fiscal_address) = 'object'),
  constraint core_fiscal_registrations_metadata_object_chk
    check (jsonb_typeof(metadata) = 'object')
);

create unique index core_fiscal_registrations_tenant_org_country_unique
  on core.fiscal_registrations (tenant_id, organization_id, country_code);
create index core_fiscal_registrations_tenant_status_idx
  on core.fiscal_registrations (tenant_id, status);
create index core_fiscal_registrations_country_idx
  on core.fiscal_registrations (country_code);
create index core_fiscal_registrations_metadata_gin_idx
  on core.fiscal_registrations using gin (metadata);

create trigger core_fiscal_registrations_set_updated_at
before update on core.fiscal_registrations
for each row execute function core.set_updated_at();

alter table core.fiscal_registrations enable row level security;
alter table core.fiscal_registrations force row level security;

create policy "fiscal registrations are private to RPCs"
on core.fiscal_registrations
for all
to anon, authenticated
using (false)
with check (false);

grant select, insert, update, delete on core.fiscal_registrations to service_role;

create or replace function core.fiscal_registration_json(p_reg core.fiscal_registrations)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select jsonb_build_object(
    'id', p_reg.id,
    'tenant_id', p_reg.tenant_id,
    'organization_id', p_reg.organization_id,
    'country_code', p_reg.country_code,
    'legal_name', p_reg.legal_name,
    'tax_id', p_reg.tax_id,
    'tax_id_label', p_reg.tax_id_label,
    'tax_regime', p_reg.tax_regime,
    'secondary_registration', p_reg.secondary_registration,
    'secondary_registration_label', p_reg.secondary_registration_label,
    'tertiary_registration', p_reg.tertiary_registration,
    'tertiary_registration_label', p_reg.tertiary_registration_label,
    'fiscal_address', p_reg.fiscal_address,
    'status', p_reg.status,
    'metadata', p_reg.metadata,
    'created_by_user_id', p_reg.created_by_user_id,
    'created_at', p_reg.created_at,
    'updated_at', p_reg.updated_at
  )
$$;

create or replace function core.list_fiscal_registrations_as_admin(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select coalesce(
    jsonb_agg(core.fiscal_registration_json(fr) order by fr.updated_at desc, fr.country_code asc),
    '[]'::jsonb
  )
  from core.fiscal_registrations as fr
  where fr.tenant_id = p_tenant_id
$$;

create or replace function core.list_fiscal_registrations_as_current_user(p_tenant_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, core, auth, pg_temp
as $$
begin
  if not core.user_has_permission(p_tenant_id, 'organizations.manage') then
    raise exception 'organizations.manage permission is required'
      using errcode = '42501';
  end if;

  return core.list_fiscal_registrations_as_admin(p_tenant_id);
end;
$$;

create or replace function core.validate_fiscal_registration_payload(payload jsonb)
returns void
language plpgsql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'payload must be a JSON object' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(payload->>'organization_id', '')), '') is null then
    raise exception 'organization_id is required' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(payload->>'country_code', '')), '') is null then
    raise exception 'country_code is required' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(payload->>'tax_id', '')), '') is null then
    raise exception 'tax_id is required' using errcode = '22023';
  end if;
end;
$$;

create or replace function core.upsert_fiscal_registration_as_current_user(p_tenant_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_organization_id uuid;
  v_country_code text;
  v_actor_id uuid;
  v_before core.fiscal_registrations%rowtype;
  v_after core.fiscal_registrations%rowtype;
  v_event_type text;
begin
  if not core.user_has_permission(p_tenant_id, 'organizations.manage') then
    raise exception 'organizations.manage permission is required' using errcode = '42501';
  end if;

  perform core.validate_fiscal_registration_payload(p_payload);

  v_organization_id := (p_payload->>'organization_id')::uuid;
  v_country_code := upper(trim(p_payload->>'country_code'));

  if not exists (
    select 1 from core.organizations
    where tenant_id = p_tenant_id and id = v_organization_id
  ) then
    raise exception 'organization not found for this tenant' using errcode = 'P0002';
  end if;

  select id into v_actor_id
  from core.users
  where auth_user_id = (select auth.uid())
  limit 1;

  select * into v_before
  from core.fiscal_registrations
  where tenant_id = p_tenant_id
    and organization_id = v_organization_id
    and country_code = v_country_code
  for update;

  if found then
    v_event_type := 'fiscal_registration.updated';

    update core.fiscal_registrations
    set
      legal_name = nullif(trim(coalesce(p_payload->>'legal_name', legal_name)), ''),
      tax_id = coalesce(nullif(trim(p_payload->>'tax_id'), ''), tax_id),
      tax_id_label = coalesce(nullif(trim(p_payload->>'tax_id_label'), ''), tax_id_label),
      tax_regime = coalesce(nullif(trim(p_payload->>'tax_regime'), ''), tax_regime),
      secondary_registration = case when p_payload ? 'secondary_registration'
        then nullif(trim(p_payload->>'secondary_registration'), '') else secondary_registration end,
      secondary_registration_label = case when p_payload ? 'secondary_registration_label'
        then nullif(trim(p_payload->>'secondary_registration_label'), '') else secondary_registration_label end,
      tertiary_registration = case when p_payload ? 'tertiary_registration'
        then nullif(trim(p_payload->>'tertiary_registration'), '') else tertiary_registration end,
      tertiary_registration_label = case when p_payload ? 'tertiary_registration_label'
        then nullif(trim(p_payload->>'tertiary_registration_label'), '') else tertiary_registration_label end,
      fiscal_address = case when p_payload ? 'fiscal_address' and jsonb_typeof(p_payload->'fiscal_address') = 'object'
        then p_payload->'fiscal_address' else fiscal_address end,
      status = coalesce(nullif(trim(p_payload->>'status'), ''), status),
      metadata = metadata || jsonb_build_object('last_edited_by_user_id', v_actor_id, 'last_edited_at', now()),
      updated_at = now()
    where tenant_id = p_tenant_id
      and organization_id = v_organization_id
      and country_code = v_country_code
    returning * into v_after;
  else
    v_event_type := 'fiscal_registration.created';

    insert into core.fiscal_registrations (
      tenant_id, organization_id, country_code, legal_name, tax_id, tax_id_label,
      tax_regime, secondary_registration, secondary_registration_label,
      tertiary_registration, tertiary_registration_label, fiscal_address,
      status, metadata, created_by_user_id
    )
    values (
      p_tenant_id,
      v_organization_id,
      v_country_code,
      nullif(trim(coalesce(p_payload->>'legal_name', '')), ''),
      trim(p_payload->>'tax_id'),
      coalesce(nullif(trim(p_payload->>'tax_id_label'), ''), 'tax_id'),
      coalesce(nullif(trim(p_payload->>'tax_regime'), ''), 'standard'),
      nullif(trim(coalesce(p_payload->>'secondary_registration', '')), ''),
      nullif(trim(coalesce(p_payload->>'secondary_registration_label', '')), ''),
      nullif(trim(coalesce(p_payload->>'tertiary_registration', '')), ''),
      nullif(trim(coalesce(p_payload->>'tertiary_registration_label', '')), ''),
      case when jsonb_typeof(coalesce(p_payload->'fiscal_address', '{}'::jsonb)) = 'object'
        then coalesce(p_payload->'fiscal_address', '{}'::jsonb) else '{}'::jsonb end,
      coalesce(nullif(trim(p_payload->>'status'), ''), 'draft'),
      jsonb_build_object('created_by_user_id', v_actor_id),
      v_actor_id
    )
    returning * into v_after;
  end if;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (
    p_tenant_id, 'user', v_actor_id, v_event_type, 'core.fiscal_registration', v_after.id,
    case when found then to_jsonb(v_before) else null end, to_jsonb(v_after),
    jsonb_build_object('source', 'dashboard')
  );

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, v_event_type, 'core.fiscal_registration', v_after.id, core.fiscal_registration_json(v_after));

  return jsonb_build_object(
    'event_type', v_event_type,
    'registration', core.fiscal_registration_json(v_after),
    'registrations', core.list_fiscal_registrations_as_admin(p_tenant_id)
  );
end;
$$;

create or replace function core.archive_fiscal_registration_as_current_user(p_tenant_id uuid, p_registration_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_actor_id uuid;
  v_before core.fiscal_registrations%rowtype;
  v_after core.fiscal_registrations%rowtype;
begin
  if not core.user_has_permission(p_tenant_id, 'organizations.manage') then
    raise exception 'organizations.manage permission is required' using errcode = '42501';
  end if;

  select * into v_before
  from core.fiscal_registrations
  where tenant_id = p_tenant_id and id = p_registration_id
  for update;

  if not found then
    raise exception 'fiscal registration not found' using errcode = 'P0002';
  end if;

  if v_before.status = 'active' then
    raise exception 'active fiscal registrations must be suspended before archiving' using errcode = '42501';
  end if;

  select id into v_actor_id
  from core.users
  where auth_user_id = (select auth.uid())
  limit 1;

  update core.fiscal_registrations
  set status = 'archived', updated_at = now(),
    metadata = metadata || jsonb_build_object('archived_by_user_id', v_actor_id, 'archived_at', now())
  where tenant_id = p_tenant_id and id = p_registration_id
  returning * into v_after;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'fiscal_registration.archived', 'core.fiscal_registration', p_registration_id, to_jsonb(v_before), to_jsonb(v_after), jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'fiscal_registration.archived', 'core.fiscal_registration', p_registration_id, core.fiscal_registration_json(v_after));

  return jsonb_build_object('event_type', 'fiscal_registration.archived', 'registration', core.fiscal_registration_json(v_after), 'registrations', core.list_fiscal_registrations_as_admin(p_tenant_id));
end;
$$;

revoke execute on function core.fiscal_registration_json(core.fiscal_registrations) from public, anon, authenticated;
revoke execute on function core.list_fiscal_registrations_as_admin(uuid) from public, anon, authenticated;
revoke execute on function core.list_fiscal_registrations_as_current_user(uuid) from public, anon, authenticated;
revoke execute on function core.validate_fiscal_registration_payload(jsonb) from public, anon, authenticated;
revoke execute on function core.upsert_fiscal_registration_as_current_user(uuid, jsonb) from public, anon, authenticated;
revoke execute on function core.archive_fiscal_registration_as_current_user(uuid, uuid) from public, anon, authenticated;

grant execute on function core.fiscal_registration_json(core.fiscal_registrations) to service_role;
grant execute on function core.list_fiscal_registrations_as_admin(uuid) to service_role;
grant execute on function core.list_fiscal_registrations_as_current_user(uuid) to service_role;
grant execute on function core.validate_fiscal_registration_payload(jsonb) to service_role;
grant execute on function core.upsert_fiscal_registration_as_current_user(uuid, jsonb) to service_role;
grant execute on function core.archive_fiscal_registration_as_current_user(uuid, uuid) to service_role;

create or replace function public.helvok_admin_list_fiscal_registrations(p_tenant_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.list_fiscal_registrations_as_admin(p_tenant_id)
$$;

create or replace function public.helvok_current_list_fiscal_registrations(p_tenant_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.list_fiscal_registrations_as_current_user(p_tenant_id)
$$;

create or replace function public.helvok_current_upsert_fiscal_registration(p_tenant_id uuid, p_payload jsonb)
returns jsonb
language sql
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.upsert_fiscal_registration_as_current_user(p_tenant_id, p_payload)
$$;

create or replace function public.helvok_current_archive_fiscal_registration(p_tenant_id uuid, p_registration_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.archive_fiscal_registration_as_current_user(p_tenant_id, p_registration_id)
$$;

revoke execute on function public.helvok_admin_list_fiscal_registrations(uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_list_fiscal_registrations(uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_upsert_fiscal_registration(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.helvok_current_archive_fiscal_registration(uuid, uuid) from public, anon, authenticated;

grant execute on function public.helvok_admin_list_fiscal_registrations(uuid) to service_role;
grant execute on function public.helvok_current_list_fiscal_registrations(uuid) to authenticated;
grant execute on function public.helvok_current_upsert_fiscal_registration(uuid, jsonb) to authenticated;
grant execute on function public.helvok_current_archive_fiscal_registration(uuid, uuid) to authenticated;

commit;
