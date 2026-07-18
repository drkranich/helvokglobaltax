-- Commerce foundation: parties (customers/suppliers/marketplaces) and
-- commercial operations (orders). This is the first table set in a new
-- `commerce` schema, matching docs/architecture/03-relational-model.md
-- (`commerce.parties`, `commerce.commercial_operations`).
--
-- Scope note: line items are stored as a jsonb array directly on
-- commercial_operations (not a separate operation_items table yet) to keep
-- this first cut real and shippable. A normalized operation_items table is
-- a reasonable follow-up if per-line reporting/joins are needed later; it
-- does not change the API shape seen by the frontend, only the storage.
--
-- Reuses the existing 'operations.create'/'operations.read' permissions
-- already seeded and granted to roles in the initial foundation migration
-- (admin, fiscal_manager, developer get create+read; accountant, support,
-- auditor, viewer get read-only) instead of inventing a new permission.

begin;

create schema if not exists commerce;

create table commerce.parties (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  party_type text not null default 'customer',
  name text not null,
  country_code text,
  tax_id text,
  email text,
  phone text,
  address jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references core.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commerce_parties_type_chk
    check (party_type in ('customer', 'supplier', 'marketplace', 'intermediary', 'authority')),
  constraint commerce_parties_status_chk
    check (status in ('active', 'archived')),
  constraint commerce_parties_name_chk
    check (length(trim(name)) > 0),
  constraint commerce_parties_address_object_chk
    check (jsonb_typeof(address) = 'object'),
  constraint commerce_parties_metadata_object_chk
    check (jsonb_typeof(metadata) = 'object')
);

alter table commerce.parties
  add constraint commerce_parties_tenant_id_id_key unique (tenant_id, id);

create index commerce_parties_tenant_status_idx on commerce.parties (tenant_id, status);
create index commerce_parties_tenant_type_idx on commerce.parties (tenant_id, party_type);
create index commerce_parties_metadata_gin_idx on commerce.parties using gin (metadata);

create trigger commerce_parties_set_updated_at
before update on commerce.parties
for each row execute function core.set_updated_at();

alter table commerce.parties enable row level security;
alter table commerce.parties force row level security;

create policy "commerce parties are private to RPCs"
on commerce.parties
for all
to anon, authenticated
using (false)
with check (false);

grant select, insert, update, delete on commerce.parties to service_role;

create table commerce.commercial_operations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  organization_id uuid not null,
  party_id uuid,
  operation_type text not null default 'sale',
  operation_direction text not null default 'outbound',
  origin_country text,
  destination_country text,
  currency_code text not null default 'BRL',
  operation_date timestamptz not null default now(),
  status text not null default 'draft',
  external_reference text,
  idempotency_key text,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric(18, 2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references core.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commerce_operations_organization_fk
    foreign key (tenant_id, organization_id)
    references core.organizations (tenant_id, id)
    on delete cascade,
  constraint commerce_operations_party_fk
    foreign key (tenant_id, party_id)
    references commerce.parties (tenant_id, id)
    on delete set null,
  constraint commerce_operations_type_chk
    check (operation_type in ('sale', 'purchase', 'transfer', 'return')),
  constraint commerce_operations_direction_chk
    check (operation_direction in ('inbound', 'outbound')),
  constraint commerce_operations_status_chk
    check (status in ('draft', 'confirmed', 'cancelled')),
  constraint commerce_operations_currency_chk
    check (currency_code ~ '^[A-Z]{3}$'),
  constraint commerce_operations_total_amount_chk
    check (total_amount >= 0),
  constraint commerce_operations_items_array_chk
    check (jsonb_typeof(items) = 'array'),
  constraint commerce_operations_metadata_object_chk
    check (jsonb_typeof(metadata) = 'object')
);

alter table commerce.commercial_operations
  add constraint commerce_operations_tenant_id_id_key unique (tenant_id, id);

create unique index commerce_operations_idempotency_unique
  on commerce.commercial_operations (tenant_id, idempotency_key)
  where idempotency_key is not null;
create index commerce_operations_tenant_status_idx on commerce.commercial_operations (tenant_id, status);
create index commerce_operations_tenant_party_idx on commerce.commercial_operations (tenant_id, party_id);
create index commerce_operations_metadata_gin_idx on commerce.commercial_operations using gin (metadata);

create trigger commerce_operations_set_updated_at
before update on commerce.commercial_operations
for each row execute function core.set_updated_at();

alter table commerce.commercial_operations enable row level security;
alter table commerce.commercial_operations force row level security;

create policy "commercial operations are private to RPCs"
on commerce.commercial_operations
for all
to anon, authenticated
using (false)
with check (false);

grant select, insert, update, delete on commerce.commercial_operations to service_role;

-- Parties: JSON projection + RPCs -------------------------------------------------

create or replace function commerce.party_json(p_party commerce.parties)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, commerce, pg_temp
as $$
  select jsonb_build_object(
    'id', p_party.id,
    'tenant_id', p_party.tenant_id,
    'party_type', p_party.party_type,
    'name', p_party.name,
    'country_code', p_party.country_code,
    'tax_id', p_party.tax_id,
    'email', p_party.email,
    'phone', p_party.phone,
    'address', p_party.address,
    'status', p_party.status,
    'metadata', p_party.metadata,
    'created_at', p_party.created_at,
    'updated_at', p_party.updated_at
  )
$$;

create or replace function commerce.list_parties_as_admin(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, commerce, pg_temp
as $$
  select coalesce(jsonb_agg(commerce.party_json(p) order by p.updated_at desc), '[]'::jsonb)
  from commerce.parties as p
  where p.tenant_id = p_tenant_id
$$;

create or replace function commerce.list_parties_as_current_user(p_tenant_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, commerce, core, pg_temp
as $$
begin
  if not core.user_has_permission(p_tenant_id, 'operations.read') then
    raise exception 'operations.read permission is required' using errcode = '42501';
  end if;

  return commerce.list_parties_as_admin(p_tenant_id);
end;
$$;

create or replace function commerce.upsert_party_as_current_user(p_tenant_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, commerce, core, audit, auth, pg_temp
as $$
declare
  v_party_id uuid;
  v_actor_id uuid;
  v_before commerce.parties%rowtype;
  v_after commerce.parties%rowtype;
  v_event_type text;
  v_name text;
begin
  if not core.user_has_permission(p_tenant_id, 'operations.create') then
    raise exception 'operations.create permission is required' using errcode = '42501';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'payload must be a JSON object' using errcode = '22023';
  end if;

  v_name := nullif(trim(coalesce(p_payload->>'name', '')), '');
  if v_name is null then
    raise exception 'name is required' using errcode = '22023';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;
  v_party_id := nullif(p_payload->>'id', '')::uuid;

  if v_party_id is not null then
    select * into v_before from commerce.parties where tenant_id = p_tenant_id and id = v_party_id for update;
    if not found then
      raise exception 'party not found' using errcode = 'P0002';
    end if;

    v_event_type := 'party.updated';

    update commerce.parties
    set
      party_type = coalesce(nullif(trim(p_payload->>'party_type'), ''), party_type),
      name = v_name,
      country_code = case when p_payload ? 'country_code' then nullif(trim(p_payload->>'country_code'), '') else country_code end,
      tax_id = case when p_payload ? 'tax_id' then nullif(trim(p_payload->>'tax_id'), '') else tax_id end,
      email = case when p_payload ? 'email' then nullif(trim(p_payload->>'email'), '') else email end,
      phone = case when p_payload ? 'phone' then nullif(trim(p_payload->>'phone'), '') else phone end,
      address = case when p_payload ? 'address' and jsonb_typeof(p_payload->'address') = 'object' then p_payload->'address' else address end,
      status = coalesce(nullif(trim(p_payload->>'status'), ''), status),
      updated_at = now()
    where tenant_id = p_tenant_id and id = v_party_id
    returning * into v_after;
  else
    v_event_type := 'party.created';

    insert into commerce.parties (tenant_id, party_type, name, country_code, tax_id, email, phone, address, created_by_user_id)
    values (
      p_tenant_id,
      coalesce(nullif(trim(p_payload->>'party_type'), ''), 'customer'),
      v_name,
      nullif(trim(coalesce(p_payload->>'country_code', '')), ''),
      nullif(trim(coalesce(p_payload->>'tax_id', '')), ''),
      nullif(trim(coalesce(p_payload->>'email', '')), ''),
      nullif(trim(coalesce(p_payload->>'phone', '')), ''),
      case when jsonb_typeof(coalesce(p_payload->'address', '{}'::jsonb)) = 'object' then coalesce(p_payload->'address', '{}'::jsonb) else '{}'::jsonb end,
      v_actor_id
    )
    returning * into v_after;
  end if;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, v_event_type, 'commerce.party', v_after.id,
    case when v_party_id is not null then to_jsonb(v_before) else null end, to_jsonb(v_after), jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, v_event_type, 'commerce.party', v_after.id, commerce.party_json(v_after));

  return jsonb_build_object('event_type', v_event_type, 'party', commerce.party_json(v_after), 'parties', commerce.list_parties_as_admin(p_tenant_id));
end;
$$;

create or replace function commerce.archive_party_as_current_user(p_tenant_id uuid, p_party_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, commerce, core, audit, auth, pg_temp
as $$
declare
  v_actor_id uuid;
  v_before commerce.parties%rowtype;
  v_after commerce.parties%rowtype;
begin
  if not core.user_has_permission(p_tenant_id, 'operations.create') then
    raise exception 'operations.create permission is required' using errcode = '42501';
  end if;

  select * into v_before from commerce.parties where tenant_id = p_tenant_id and id = p_party_id for update;
  if not found then
    raise exception 'party not found' using errcode = 'P0002';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;

  update commerce.parties set status = 'archived', updated_at = now()
  where tenant_id = p_tenant_id and id = p_party_id
  returning * into v_after;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'party.archived', 'commerce.party', p_party_id, to_jsonb(v_before), to_jsonb(v_after), jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'party.archived', 'commerce.party', p_party_id, commerce.party_json(v_after));

  return jsonb_build_object('event_type', 'party.archived', 'party', commerce.party_json(v_after), 'parties', commerce.list_parties_as_admin(p_tenant_id));
end;
$$;

create or replace function commerce.delete_party_as_current_user(p_tenant_id uuid, p_party_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, commerce, core, audit, auth, pg_temp
as $$
declare
  v_actor_id uuid;
  v_before commerce.parties%rowtype;
begin
  if not core.user_has_permission(p_tenant_id, 'operations.create') then
    raise exception 'operations.create permission is required' using errcode = '42501';
  end if;

  select * into v_before from commerce.parties where tenant_id = p_tenant_id and id = p_party_id for update;
  if not found then
    raise exception 'party not found' using errcode = 'P0002';
  end if;

  if v_before.status not in ('active', 'archived') then
    raise exception 'party cannot be deleted in its current status' using errcode = '42501';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;

  delete from commerce.parties where tenant_id = p_tenant_id and id = p_party_id;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'party.deleted', 'commerce.party', p_party_id, to_jsonb(v_before), null, jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'party.deleted', 'commerce.party', p_party_id, jsonb_build_object('id', p_party_id));

  return jsonb_build_object('event_type', 'party.deleted', 'parties', commerce.list_parties_as_admin(p_tenant_id));
end;
$$;

-- Commercial operations (orders): JSON projection + RPCs ---------------------------

create or replace function commerce.operation_json(p_op commerce.commercial_operations)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, commerce, pg_temp
as $$
  select jsonb_build_object(
    'id', p_op.id,
    'tenant_id', p_op.tenant_id,
    'organization_id', p_op.organization_id,
    'party_id', p_op.party_id,
    'operation_type', p_op.operation_type,
    'operation_direction', p_op.operation_direction,
    'origin_country', p_op.origin_country,
    'destination_country', p_op.destination_country,
    'currency_code', p_op.currency_code,
    'operation_date', p_op.operation_date,
    'status', p_op.status,
    'external_reference', p_op.external_reference,
    'items', p_op.items,
    'total_amount', p_op.total_amount,
    'metadata', p_op.metadata,
    'created_at', p_op.created_at,
    'updated_at', p_op.updated_at
  )
$$;

create or replace function commerce.list_operations_as_admin(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, commerce, pg_temp
as $$
  select coalesce(jsonb_agg(commerce.operation_json(o) order by o.updated_at desc), '[]'::jsonb)
  from commerce.commercial_operations as o
  where o.tenant_id = p_tenant_id
$$;

create or replace function commerce.list_operations_as_current_user(p_tenant_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, commerce, core, pg_temp
as $$
begin
  if not core.user_has_permission(p_tenant_id, 'operations.read') then
    raise exception 'operations.read permission is required' using errcode = '42501';
  end if;

  return commerce.list_operations_as_admin(p_tenant_id);
end;
$$;

create or replace function commerce.compute_items_total(p_items jsonb)
returns numeric
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
  select coalesce(sum(
    (coalesce((item->>'quantity')::numeric, 0) * coalesce((item->>'unit_amount')::numeric, 0))
    - coalesce((item->>'discount_amount')::numeric, 0)
  ), 0)
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item
$$;

create or replace function commerce.create_operation_as_current_user(p_tenant_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, commerce, core, audit, auth, pg_temp
as $$
declare
  v_organization_id uuid;
  v_party_id uuid;
  v_items jsonb;
  v_actor_id uuid;
  v_after commerce.commercial_operations%rowtype;
begin
  if not core.user_has_permission(p_tenant_id, 'operations.create') then
    raise exception 'operations.create permission is required' using errcode = '42501';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'payload must be a JSON object' using errcode = '22023';
  end if;

  v_organization_id := nullif(p_payload->>'organization_id', '')::uuid;
  if v_organization_id is null then
    raise exception 'organization_id is required' using errcode = '22023';
  end if;

  if not exists (select 1 from core.organizations where tenant_id = p_tenant_id and id = v_organization_id) then
    raise exception 'organization not found for this tenant' using errcode = 'P0002';
  end if;

  v_party_id := nullif(p_payload->>'party_id', '')::uuid;
  if v_party_id is not null and not exists (select 1 from commerce.parties where tenant_id = p_tenant_id and id = v_party_id) then
    raise exception 'party not found for this tenant' using errcode = 'P0002';
  end if;

  v_items := case when jsonb_typeof(coalesce(p_payload->'items', '[]'::jsonb)) = 'array' then coalesce(p_payload->'items', '[]'::jsonb) else '[]'::jsonb end;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;

  insert into commerce.commercial_operations (
    tenant_id, organization_id, party_id, operation_type, operation_direction,
    origin_country, destination_country, currency_code, status, external_reference,
    idempotency_key, items, total_amount, created_by_user_id
  )
  values (
    p_tenant_id,
    v_organization_id,
    v_party_id,
    coalesce(nullif(trim(p_payload->>'operation_type'), ''), 'sale'),
    coalesce(nullif(trim(p_payload->>'operation_direction'), ''), 'outbound'),
    nullif(trim(coalesce(p_payload->>'origin_country', '')), ''),
    nullif(trim(coalesce(p_payload->>'destination_country', '')), ''),
    coalesce(nullif(trim(p_payload->>'currency_code'), ''), 'BRL'),
    coalesce(nullif(trim(p_payload->>'status'), ''), 'draft'),
    nullif(trim(coalesce(p_payload->>'external_reference', '')), ''),
    nullif(trim(coalesce(p_payload->>'idempotency_key', '')), ''),
    v_items,
    commerce.compute_items_total(v_items),
    v_actor_id
  )
  returning * into v_after;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'commercial_operation.created', 'commerce.commercial_operation', v_after.id, null, to_jsonb(v_after), jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'commercial_operation.created', 'commerce.commercial_operation', v_after.id, commerce.operation_json(v_after));

  return jsonb_build_object('event_type', 'commercial_operation.created', 'operation', commerce.operation_json(v_after), 'operations', commerce.list_operations_as_admin(p_tenant_id));
end;
$$;

create or replace function commerce.update_operation_status_as_current_user(p_tenant_id uuid, p_operation_id uuid, p_status text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, commerce, core, audit, auth, pg_temp
as $$
declare
  v_actor_id uuid;
  v_before commerce.commercial_operations%rowtype;
  v_after commerce.commercial_operations%rowtype;
begin
  if not core.user_has_permission(p_tenant_id, 'operations.create') then
    raise exception 'operations.create permission is required' using errcode = '42501';
  end if;

  if p_status not in ('draft', 'confirmed', 'cancelled') then
    raise exception 'invalid status' using errcode = '22023';
  end if;

  select * into v_before from commerce.commercial_operations where tenant_id = p_tenant_id and id = p_operation_id for update;
  if not found then
    raise exception 'commercial operation not found' using errcode = 'P0002';
  end if;

  if v_before.status = 'cancelled' then
    raise exception 'cancelled operations cannot change status' using errcode = '42501';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;

  update commerce.commercial_operations set status = p_status, updated_at = now()
  where tenant_id = p_tenant_id and id = p_operation_id
  returning * into v_after;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'commercial_operation.status_changed', 'commerce.commercial_operation', p_operation_id, to_jsonb(v_before), to_jsonb(v_after), jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'commercial_operation.status_changed', 'commerce.commercial_operation', p_operation_id, commerce.operation_json(v_after));

  return jsonb_build_object('event_type', 'commercial_operation.status_changed', 'operation', commerce.operation_json(v_after), 'operations', commerce.list_operations_as_admin(p_tenant_id));
end;
$$;

create or replace function commerce.delete_operation_as_current_user(p_tenant_id uuid, p_operation_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, commerce, core, audit, auth, pg_temp
as $$
declare
  v_actor_id uuid;
  v_before commerce.commercial_operations%rowtype;
begin
  if not core.user_has_permission(p_tenant_id, 'operations.create') then
    raise exception 'operations.create permission is required' using errcode = '42501';
  end if;

  select * into v_before from commerce.commercial_operations where tenant_id = p_tenant_id and id = p_operation_id for update;
  if not found then
    raise exception 'commercial operation not found' using errcode = 'P0002';
  end if;

  if v_before.status = 'confirmed' then
    raise exception 'confirmed operations must be cancelled before deletion' using errcode = '42501';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;

  delete from commerce.commercial_operations where tenant_id = p_tenant_id and id = p_operation_id;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'commercial_operation.deleted', 'commerce.commercial_operation', p_operation_id, to_jsonb(v_before), null, jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'commercial_operation.deleted', 'commerce.commercial_operation', p_operation_id, jsonb_build_object('id', p_operation_id));

  return jsonb_build_object('event_type', 'commercial_operation.deleted', 'operations', commerce.list_operations_as_admin(p_tenant_id));
end;
$$;

revoke execute on function commerce.party_json(commerce.parties) from public, anon, authenticated;
revoke execute on function commerce.list_parties_as_admin(uuid) from public, anon, authenticated;
revoke execute on function commerce.list_parties_as_current_user(uuid) from public, anon, authenticated;
revoke execute on function commerce.upsert_party_as_current_user(uuid, jsonb) from public, anon, authenticated;
revoke execute on function commerce.archive_party_as_current_user(uuid, uuid) from public, anon, authenticated;
revoke execute on function commerce.delete_party_as_current_user(uuid, uuid) from public, anon, authenticated;
revoke execute on function commerce.operation_json(commerce.commercial_operations) from public, anon, authenticated;
revoke execute on function commerce.list_operations_as_admin(uuid) from public, anon, authenticated;
revoke execute on function commerce.list_operations_as_current_user(uuid) from public, anon, authenticated;
revoke execute on function commerce.compute_items_total(jsonb) from public, anon, authenticated;
revoke execute on function commerce.create_operation_as_current_user(uuid, jsonb) from public, anon, authenticated;
revoke execute on function commerce.update_operation_status_as_current_user(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function commerce.delete_operation_as_current_user(uuid, uuid) from public, anon, authenticated;

grant execute on function commerce.party_json(commerce.parties) to service_role;
grant execute on function commerce.list_parties_as_admin(uuid) to service_role;
grant execute on function commerce.list_parties_as_current_user(uuid) to service_role;
grant execute on function commerce.upsert_party_as_current_user(uuid, jsonb) to service_role;
grant execute on function commerce.archive_party_as_current_user(uuid, uuid) to service_role;
grant execute on function commerce.delete_party_as_current_user(uuid, uuid) to service_role;
grant execute on function commerce.operation_json(commerce.commercial_operations) to service_role;
grant execute on function commerce.list_operations_as_admin(uuid) to service_role;
grant execute on function commerce.list_operations_as_current_user(uuid) to service_role;
grant execute on function commerce.compute_items_total(jsonb) to service_role;
grant execute on function commerce.create_operation_as_current_user(uuid, jsonb) to service_role;
grant execute on function commerce.update_operation_status_as_current_user(uuid, uuid, text) to service_role;
grant execute on function commerce.delete_operation_as_current_user(uuid, uuid) to service_role;

create or replace function public.helvok_admin_list_parties(p_tenant_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commerce, pg_temp
as $$
  select commerce.list_parties_as_admin(p_tenant_id)
$$;

create or replace function public.helvok_current_list_parties(p_tenant_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commerce, pg_temp
as $$
  select commerce.list_parties_as_current_user(p_tenant_id)
$$;

create or replace function public.helvok_current_upsert_party(p_tenant_id uuid, p_payload jsonb)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commerce, pg_temp
as $$
  select commerce.upsert_party_as_current_user(p_tenant_id, p_payload)
$$;

create or replace function public.helvok_current_archive_party(p_tenant_id uuid, p_party_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commerce, pg_temp
as $$
  select commerce.archive_party_as_current_user(p_tenant_id, p_party_id)
$$;

create or replace function public.helvok_current_delete_party(p_tenant_id uuid, p_party_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commerce, pg_temp
as $$
  select commerce.delete_party_as_current_user(p_tenant_id, p_party_id)
$$;

create or replace function public.helvok_admin_list_operations(p_tenant_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commerce, pg_temp
as $$
  select commerce.list_operations_as_admin(p_tenant_id)
$$;

create or replace function public.helvok_current_list_operations(p_tenant_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commerce, pg_temp
as $$
  select commerce.list_operations_as_current_user(p_tenant_id)
$$;

create or replace function public.helvok_current_create_operation(p_tenant_id uuid, p_payload jsonb)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commerce, pg_temp
as $$
  select commerce.create_operation_as_current_user(p_tenant_id, p_payload)
$$;

create or replace function public.helvok_current_update_operation_status(p_tenant_id uuid, p_operation_id uuid, p_status text)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commerce, pg_temp
as $$
  select commerce.update_operation_status_as_current_user(p_tenant_id, p_operation_id, p_status)
$$;

create or replace function public.helvok_current_delete_operation(p_tenant_id uuid, p_operation_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commerce, pg_temp
as $$
  select commerce.delete_operation_as_current_user(p_tenant_id, p_operation_id)
$$;

revoke execute on function public.helvok_admin_list_parties(uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_list_parties(uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_upsert_party(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.helvok_current_archive_party(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_delete_party(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.helvok_admin_list_operations(uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_list_operations(uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_create_operation(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.helvok_current_update_operation_status(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.helvok_current_delete_operation(uuid, uuid) from public, anon, authenticated;

grant execute on function public.helvok_admin_list_parties(uuid) to service_role;
grant execute on function public.helvok_current_list_parties(uuid) to authenticated;
grant execute on function public.helvok_current_upsert_party(uuid, jsonb) to authenticated;
grant execute on function public.helvok_current_archive_party(uuid, uuid) to authenticated;
grant execute on function public.helvok_current_delete_party(uuid, uuid) to authenticated;
grant execute on function public.helvok_admin_list_operations(uuid) to service_role;
grant execute on function public.helvok_current_list_operations(uuid) to authenticated;
grant execute on function public.helvok_current_create_operation(uuid, jsonb) to authenticated;
grant execute on function public.helvok_current_update_operation_status(uuid, uuid, text) to authenticated;
grant execute on function public.helvok_current_delete_operation(uuid, uuid) to authenticated;

commit;
