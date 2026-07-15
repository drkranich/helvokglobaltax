-- Global fiscal document pipeline foundation.
-- The core is country-neutral; each country adapter owns document semantics,
-- signatures, transports, and authority-specific payloads.

begin;

create table core.fiscal_authorities (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  authority_code text not null,
  name text not null,
  authority_level text not null default 'national',
  jurisdiction_path text[] not null default array[]::text[],
  adapter_key text not null,
  environment_capabilities jsonb not null default '{}'::jsonb,
  status text not null default 'planned',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_fiscal_authorities_country_chk
    check (country_code ~ '^[A-Z]{2}$'),
  constraint core_fiscal_authorities_code_chk
    check (authority_code ~ '^[A-Z0-9_.:-]{2,64}$'),
  constraint core_fiscal_authorities_level_chk
    check (authority_level in ('national', 'federal', 'state', 'province', 'county', 'city', 'municipal', 'regional', 'supranational')),
  constraint core_fiscal_authorities_adapter_chk
    check (adapter_key ~ '^[a-z][a-z0-9_/.-]{1,96}$'),
  constraint core_fiscal_authorities_status_chk
    check (status in ('planned', 'sandbox', 'active', 'deprecated', 'offline')),
  constraint core_fiscal_authorities_capabilities_object_chk
    check (jsonb_typeof(environment_capabilities) = 'object'),
  constraint core_fiscal_authorities_metadata_object_chk
    check (jsonb_typeof(metadata) = 'object')
);

create unique index core_fiscal_authorities_country_code_unique
  on core.fiscal_authorities (country_code, authority_code);
create index core_fiscal_authorities_adapter_idx on core.fiscal_authorities (adapter_key);
create index core_fiscal_authorities_status_idx on core.fiscal_authorities (status);
create index core_fiscal_authorities_jurisdiction_gin_idx
  on core.fiscal_authorities using gin (jurisdiction_path);

create trigger core_fiscal_authorities_set_updated_at
before update on core.fiscal_authorities
for each row execute function core.set_updated_at();

create table core.fiscal_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  organization_id uuid,
  establishment_id uuid,
  environment_id uuid,
  authority_id uuid references core.fiscal_authorities (id) on delete restrict,
  country_code text not null,
  jurisdiction_path text[] not null default array[]::text[],
  document_type text not null,
  adapter_key text not null,
  operation_type text not null default 'sale',
  document_number text,
  document_series text,
  access_key text,
  external_id text,
  external_protocol text,
  status text not null default 'draft',
  lifecycle_stage text not null default 'draft',
  currency_code text not null default 'BRL',
  total_amount numeric(18, 6) not null default 0,
  tax_amount numeric(18, 6) not null default 0,
  issued_at timestamptz,
  authorized_at timestamptz,
  cancelled_at timestamptz,
  rejected_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  calculation_snapshot jsonb not null default '{}'::jsonb,
  authority_response jsonb not null default '{}'::jsonb,
  storage_refs jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references core.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_fiscal_documents_organization_fk
    foreign key (tenant_id, organization_id)
    references core.organizations (tenant_id, id)
    on delete restrict,
  constraint core_fiscal_documents_establishment_fk
    foreign key (tenant_id, establishment_id)
    references core.establishments (tenant_id, id)
    on delete restrict,
  constraint core_fiscal_documents_environment_fk
    foreign key (tenant_id, environment_id)
    references core.tenant_environments (tenant_id, id)
    on delete restrict,
  constraint core_fiscal_documents_country_chk
    check (country_code ~ '^[A-Z]{2}$'),
  constraint core_fiscal_documents_type_chk
    check (document_type ~ '^[A-Z][A-Z0-9_.:-]{1,64}$'),
  constraint core_fiscal_documents_adapter_chk
    check (adapter_key ~ '^[a-z][a-z0-9_/.-]{1,96}$'),
  constraint core_fiscal_documents_currency_chk
    check (currency_code ~ '^[A-Z]{3}$'),
  constraint core_fiscal_documents_amounts_chk
    check (total_amount >= 0 and tax_amount >= 0),
  constraint core_fiscal_documents_status_chk
    check (status in ('draft', 'validated', 'queued', 'signing', 'signed', 'sending', 'authorized', 'rejected', 'cancelled', 'voided', 'failed', 'archived')),
  constraint core_fiscal_documents_stage_chk
    check (lifecycle_stage in ('draft', 'validation', 'queued', 'signature', 'transmission', 'authorization', 'rejection', 'cancellation', 'storage', 'closed')),
  constraint core_fiscal_documents_json_objects_chk
    check (
      jsonb_typeof(payload) = 'object'
      and jsonb_typeof(calculation_snapshot) = 'object'
      and jsonb_typeof(authority_response) = 'object'
      and jsonb_typeof(storage_refs) = 'object'
      and jsonb_typeof(metadata) = 'object'
    )
);

alter table core.fiscal_documents
  add constraint core_fiscal_documents_tenant_id_id_key unique (tenant_id, id);

create index core_fiscal_documents_tenant_status_idx on core.fiscal_documents (tenant_id, status, updated_at desc);
create index core_fiscal_documents_country_type_idx on core.fiscal_documents (country_code, document_type);
create index core_fiscal_documents_authority_idx on core.fiscal_documents (authority_id);
create index core_fiscal_documents_access_key_idx on core.fiscal_documents (access_key);
create index core_fiscal_documents_jurisdiction_gin_idx on core.fiscal_documents using gin (jurisdiction_path);
create index core_fiscal_documents_payload_gin_idx on core.fiscal_documents using gin (payload);

create trigger core_fiscal_documents_set_updated_at
before update on core.fiscal_documents
for each row execute function core.set_updated_at();

create table core.fiscal_document_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  fiscal_document_id uuid not null,
  event_type text not null,
  actor_type text not null default 'system',
  actor_id uuid,
  from_status text,
  to_status text,
  authority_protocol text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint core_fiscal_document_events_document_fk
    foreign key (tenant_id, fiscal_document_id)
    references core.fiscal_documents (tenant_id, id)
    on delete cascade,
  constraint core_fiscal_document_events_event_type_chk
    check (event_type ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  constraint core_fiscal_document_events_actor_type_chk
    check (actor_type in ('user', 'api_key', 'system', 'adapter', 'integration', 'ai')),
  constraint core_fiscal_document_events_payload_object_chk
    check (jsonb_typeof(payload) = 'object')
);

create index core_fiscal_document_events_document_created_idx
  on core.fiscal_document_events (tenant_id, fiscal_document_id, created_at desc);
create index core_fiscal_document_events_type_idx on core.fiscal_document_events (event_type);

alter table core.fiscal_authorities enable row level security;
alter table core.fiscal_authorities force row level security;
alter table core.fiscal_documents enable row level security;
alter table core.fiscal_documents force row level security;
alter table core.fiscal_document_events enable row level security;
alter table core.fiscal_document_events force row level security;

create policy "fiscal authorities are read through RPCs"
on core.fiscal_authorities for all
to anon, authenticated
using (false)
with check (false);

create policy "fiscal documents are private to RPCs"
on core.fiscal_documents for all
to anon, authenticated
using (false)
with check (false);

create policy "fiscal document events are private to RPCs"
on core.fiscal_document_events for all
to anon, authenticated
using (false)
with check (false);

grant select on core.fiscal_authorities to authenticated;
grant select, insert, update, delete on core.fiscal_authorities to service_role;
grant select on core.fiscal_documents to authenticated;
grant select, insert, update, delete on core.fiscal_documents to service_role;
grant select on core.fiscal_document_events to authenticated;
grant select, insert, update, delete on core.fiscal_document_events to service_role;

insert into core.fiscal_authorities (
  country_code,
  authority_code,
  name,
  authority_level,
  jurisdiction_path,
  adapter_key,
  environment_capabilities,
  status,
  metadata
)
values
  ('BR', 'BR-SEFAZ-NFE', 'SEFAZ NF-e nacional por UF', 'state', array['BR'], 'adapters/brazil/nfe', '{"sandbox": true, "production": false, "documents": ["NFE"]}'::jsonb, 'planned', '{"first_adapter": true}'::jsonb),
  ('BR', 'BR-MUNICIPAL-NFSE', 'Autoridades municipais NFS-e', 'municipal', array['BR'], 'adapters/brazil/nfse', '{"sandbox": true, "production": false, "documents": ["NFSE"]}'::jsonb, 'planned', '{"provider_required": true}'::jsonb),
  ('PT', 'PT-AT-EINVOICE', 'Autoridade Tributária e Aduaneira', 'national', array['PT'], 'adapters/portugal/einvoice', '{"sandbox": false, "production": false, "documents": ["EINVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('DE', 'DE-PEPPOL', 'Germany Peppol/eInvoice routing', 'national', array['DE'], 'adapters/germany/einvoice', '{"sandbox": false, "production": false, "documents": ["EINVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('US', 'US-SALES-TAX', 'United States sales tax authorities', 'state', array['US'], 'adapters/usa/sales-tax', '{"sandbox": false, "production": false, "documents": ["SALES_TAX_REPORT"]}'::jsonb, 'planned', '{}'::jsonb)
on conflict (country_code, authority_code) do update
set name = excluded.name,
    authority_level = excluded.authority_level,
    jurisdiction_path = excluded.jurisdiction_path,
    adapter_key = excluded.adapter_key,
    environment_capabilities = excluded.environment_capabilities,
    status = excluded.status,
    metadata = excluded.metadata;

create or replace function core.fiscal_authority_json(p_authority core.fiscal_authorities)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select jsonb_build_object(
    'id', p_authority.id,
    'country_code', p_authority.country_code,
    'authority_code', p_authority.authority_code,
    'name', p_authority.name,
    'authority_level', p_authority.authority_level,
    'jurisdiction_path', p_authority.jurisdiction_path,
    'adapter_key', p_authority.adapter_key,
    'environment_capabilities', p_authority.environment_capabilities,
    'status', p_authority.status,
    'metadata', p_authority.metadata,
    'created_at', p_authority.created_at,
    'updated_at', p_authority.updated_at
  )
$$;

create or replace function core.fiscal_document_json(p_document core.fiscal_documents)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select jsonb_build_object(
    'id', p_document.id,
    'tenant_id', p_document.tenant_id,
    'organization_id', p_document.organization_id,
    'establishment_id', p_document.establishment_id,
    'environment_id', p_document.environment_id,
    'authority_id', p_document.authority_id,
    'country_code', p_document.country_code,
    'jurisdiction_path', p_document.jurisdiction_path,
    'document_type', p_document.document_type,
    'adapter_key', p_document.adapter_key,
    'operation_type', p_document.operation_type,
    'document_number', p_document.document_number,
    'document_series', p_document.document_series,
    'access_key', p_document.access_key,
    'external_id', p_document.external_id,
    'external_protocol', p_document.external_protocol,
    'status', p_document.status,
    'lifecycle_stage', p_document.lifecycle_stage,
    'currency_code', p_document.currency_code,
    'total_amount', p_document.total_amount,
    'tax_amount', p_document.tax_amount,
    'issued_at', p_document.issued_at,
    'authorized_at', p_document.authorized_at,
    'cancelled_at', p_document.cancelled_at,
    'rejected_at', p_document.rejected_at,
    'payload', p_document.payload,
    'calculation_snapshot', p_document.calculation_snapshot,
    'authority_response', p_document.authority_response,
    'storage_refs', p_document.storage_refs,
    'metadata', p_document.metadata,
    'created_by_user_id', p_document.created_by_user_id,
    'created_at', p_document.created_at,
    'updated_at', p_document.updated_at
  )
$$;

create or replace function core.list_fiscal_authorities_as_admin()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select coalesce(jsonb_agg(core.fiscal_authority_json(fa) order by fa.country_code, fa.authority_code), '[]'::jsonb)
  from core.fiscal_authorities as fa
$$;

create or replace function core.list_fiscal_documents_as_admin(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select coalesce(jsonb_agg(core.fiscal_document_json(fd) order by fd.updated_at desc), '[]'::jsonb)
  from core.fiscal_documents as fd
  where fd.tenant_id = p_tenant_id
$$;

create or replace function core.list_fiscal_documents_as_current_user(p_tenant_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, core, auth, pg_temp
as $$
begin
  if not core.user_has_permission(p_tenant_id, 'documents.read') then
    raise exception 'documents.read permission is required'
      using errcode = '42501';
  end if;

  return core.list_fiscal_documents_as_admin(p_tenant_id);
end;
$$;

create or replace function core.create_fiscal_document_as_actor(payload jsonb, p_actor_type text, p_actor_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, pg_temp
as $$
declare
  v_tenant_id uuid := nullif(payload->>'tenant_id', '')::uuid;
  v_authority_id uuid := nullif(payload->>'authority_id', '')::uuid;
  v_country_code text := upper(coalesce(nullif(trim(payload->>'country_code'), ''), 'BR'));
  v_document_type text := upper(coalesce(nullif(trim(payload->>'document_type'), ''), 'NFE'));
  v_adapter_key text := coalesce(nullif(trim(payload->>'adapter_key'), ''), 'adapters/brazil/nfe');
  v_currency_code text := upper(coalesce(nullif(trim(payload->>'currency_code'), ''), 'BRL'));
  v_payload jsonb := coalesce(payload->'payload', '{}'::jsonb);
  v_calculation_snapshot jsonb := coalesce(payload->'calculation_snapshot', '{}'::jsonb);
  v_metadata jsonb := coalesce(payload->'metadata', '{}'::jsonb);
  v_document core.fiscal_documents%rowtype;
begin
  if v_tenant_id is null then
    raise exception 'tenant_id is required'
      using errcode = '22023';
  end if;

  if jsonb_typeof(v_payload) <> 'object'
    or jsonb_typeof(v_calculation_snapshot) <> 'object'
    or jsonb_typeof(v_metadata) <> 'object' then
    raise exception 'payload, calculation_snapshot, and metadata must be JSON objects'
      using errcode = '22023';
  end if;

  if v_authority_id is null then
    select id into v_authority_id
    from core.fiscal_authorities
    where country_code = v_country_code
      and (environment_capabilities->'documents') ? v_document_type
    order by created_at asc
    limit 1;
  end if;

  insert into core.fiscal_documents (
    tenant_id,
    organization_id,
    establishment_id,
    environment_id,
    authority_id,
    country_code,
    jurisdiction_path,
    document_type,
    adapter_key,
    operation_type,
    currency_code,
    total_amount,
    tax_amount,
    payload,
    calculation_snapshot,
    metadata,
    created_by_user_id
  )
  values (
    v_tenant_id,
    nullif(payload->>'organization_id', '')::uuid,
    nullif(payload->>'establishment_id', '')::uuid,
    nullif(payload->>'environment_id', '')::uuid,
    v_authority_id,
    v_country_code,
    case when payload ? 'jurisdiction_path' and jsonb_typeof(payload->'jurisdiction_path') = 'array'
      then array(select jsonb_array_elements_text(payload->'jurisdiction_path'))
      else array[v_country_code]
    end,
    v_document_type,
    v_adapter_key,
    coalesce(nullif(trim(payload->>'operation_type'), ''), 'sale'),
    v_currency_code,
    coalesce(nullif(payload->>'total_amount', '')::numeric, 0),
    coalesce(nullif(payload->>'tax_amount', '')::numeric, 0),
    v_payload,
    v_calculation_snapshot,
    v_metadata,
    case when p_actor_type = 'user' then p_actor_id else null end
  )
  returning * into v_document;

  insert into core.fiscal_document_events (
    tenant_id,
    fiscal_document_id,
    event_type,
    actor_type,
    actor_id,
    to_status,
    payload
  )
  values (
    v_document.tenant_id,
    v_document.id,
    'fiscal_document.created',
    p_actor_type,
    p_actor_id,
    v_document.status,
    core.fiscal_document_json(v_document)
  );

  insert into audit.audit_events (
    tenant_id,
    actor_type,
    actor_id,
    event_type,
    resource_type,
    resource_id,
    after_snapshot,
    metadata
  )
  values (
    v_document.tenant_id,
    p_actor_type,
    p_actor_id,
    'fiscal_document.created',
    'core.fiscal_document',
    v_document.id,
    to_jsonb(v_document),
    jsonb_build_object('source', 'global_fiscal_document_pipeline')
  );

  insert into audit.outbox_events (
    tenant_id,
    event_type,
    aggregate_type,
    aggregate_id,
    payload
  )
  values (
    v_document.tenant_id,
    'fiscal_document.created',
    'core.fiscal_document',
    v_document.id,
    core.fiscal_document_json(v_document)
  );

  return jsonb_build_object(
    'event_type', 'fiscal_document.created',
    'document', core.fiscal_document_json(v_document),
    'documents', core.list_fiscal_documents_as_admin(v_document.tenant_id)
  );
end;
$$;

create or replace function core.create_fiscal_document_as_admin(payload jsonb)
returns jsonb
language sql
volatile
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.create_fiscal_document_as_actor(payload, 'system', null)
$$;

create or replace function core.create_fiscal_document_as_current_user(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, auth, pg_temp
as $$
declare
  v_tenant_id uuid := nullif(payload->>'tenant_id', '')::uuid;
  v_actor core.users%rowtype;
begin
  if v_tenant_id is null then
    raise exception 'tenant_id is required'
      using errcode = '22023';
  end if;

  if not core.user_has_permission(v_tenant_id, 'documents.issue') then
    raise exception 'documents.issue permission is required'
      using errcode = '42501';
  end if;

  v_actor := core.get_current_active_user();
  return core.create_fiscal_document_as_actor(payload, 'user', v_actor.id);
end;
$$;

create or replace function public.helvok_admin_list_fiscal_authorities()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.list_fiscal_authorities_as_admin()
$$;

create or replace function public.helvok_admin_list_fiscal_documents(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.list_fiscal_documents_as_admin(p_tenant_id)
$$;

create or replace function public.helvok_admin_create_fiscal_document(payload jsonb)
returns jsonb
language sql
volatile
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.create_fiscal_document_as_admin(payload)
$$;

create or replace function public.helvok_current_list_fiscal_documents(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.list_fiscal_documents_as_current_user(p_tenant_id)
$$;

create or replace function public.helvok_current_create_fiscal_document(payload jsonb)
returns jsonb
language sql
volatile
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.create_fiscal_document_as_current_user(payload)
$$;

revoke all on function public.helvok_admin_list_fiscal_authorities() from public, anon, authenticated;
revoke all on function public.helvok_admin_list_fiscal_documents(uuid) from public, anon, authenticated;
revoke all on function public.helvok_admin_create_fiscal_document(jsonb) from public, anon, authenticated;
revoke all on function public.helvok_current_list_fiscal_documents(uuid) from public, anon;
revoke all on function public.helvok_current_create_fiscal_document(jsonb) from public, anon;

grant execute on function public.helvok_admin_list_fiscal_authorities() to service_role;
grant execute on function public.helvok_admin_list_fiscal_documents(uuid) to service_role;
grant execute on function public.helvok_admin_create_fiscal_document(jsonb) to service_role;
grant execute on function public.helvok_current_list_fiscal_documents(uuid) to authenticated, service_role;
grant execute on function public.helvok_current_create_fiscal_document(jsonb) to authenticated, service_role;

comment on table core.fiscal_authorities is
  'Country-neutral registry of tax authorities and adapter entry points.';
comment on table core.fiscal_documents is
  'Global fiscal document lifecycle table. Country-specific meaning belongs to adapters.';
comment on table core.fiscal_document_events is
  'Immutable fiscal document lifecycle events before queues/workflows and government transport.';

commit;
