-- Helvok Tax catalog foundation for multi-tenant products and services.

begin;

create table core.catalog_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  organization_id uuid,
  sku text not null,
  name text not null,
  description text,
  item_kind text not null default 'goods',
  category text not null default 'goods',
  tax_category text,
  ncm_code text,
  hs_code text,
  country_of_origin text,
  unit_code text not null default 'UN',
  currency_code text not null default 'BRL',
  unit_price numeric(18, 6) not null default 0,
  unit_cost numeric(18, 6) not null default 0,
  status text not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references core.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_catalog_items_organization_fk
    foreign key (tenant_id, organization_id)
    references core.organizations (tenant_id, id)
    on delete cascade,
  constraint core_catalog_items_sku_chk
    check (sku ~ '^[A-Za-z0-9][A-Za-z0-9_.:/-]{1,63}$'),
  constraint core_catalog_items_kind_chk
    check (item_kind in (
      'goods',
      'service',
      'digital_product',
      'saas',
      'subscription',
      'license',
      'kit',
      'bundle',
      'rental',
      'event',
      'tourism',
      'asset'
    )),
  constraint core_catalog_items_category_chk
    check (category ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint core_catalog_items_country_origin_chk
    check (country_of_origin is null or country_of_origin ~ '^[A-Z]{2}$'),
  constraint core_catalog_items_unit_code_chk
    check (unit_code ~ '^[A-Z0-9_]{1,16}$'),
  constraint core_catalog_items_currency_code_chk
    check (currency_code ~ '^[A-Z]{3}$'),
  constraint core_catalog_items_amounts_chk
    check (unit_price >= 0 and unit_cost >= 0),
  constraint core_catalog_items_status_chk
    check (status in ('draft', 'active', 'inactive', 'archived')),
  constraint core_catalog_items_metadata_object_chk
    check (jsonb_typeof(metadata) = 'object')
);

alter table core.catalog_items
  add constraint core_catalog_items_tenant_id_id_key unique (tenant_id, id);

create unique index core_catalog_items_tenant_sku_unique
  on core.catalog_items (tenant_id, lower(sku));
create index core_catalog_items_tenant_status_idx on core.catalog_items (tenant_id, status);
create index core_catalog_items_organization_idx on core.catalog_items (organization_id);
create index core_catalog_items_kind_category_idx on core.catalog_items (item_kind, category);
create index core_catalog_items_country_origin_idx on core.catalog_items (country_of_origin);
create index core_catalog_items_hs_ncm_idx on core.catalog_items (hs_code, ncm_code);
create index core_catalog_items_metadata_gin_idx on core.catalog_items using gin (metadata);

create trigger core_catalog_items_set_updated_at
before update on core.catalog_items
for each row execute function core.set_updated_at();

alter table core.catalog_items enable row level security;
alter table core.catalog_items force row level security;

create policy "catalog items are private to RPCs"
on core.catalog_items
for all
to anon, authenticated
using (false)
with check (false);

grant select, insert, update, delete on core.catalog_items to service_role;
grant select on core.catalog_items to authenticated;

insert into core.permissions (permission_key, resource, action, description)
values
  ('products.read', 'products', 'read', 'Read product and service catalog.')
on conflict (permission_key) do nothing;

insert into core.role_permissions (role_id, permission_id)
select r.id, p.id
from core.roles as r
join core.permissions as p
  on p.permission_key = 'products.read'
where r.role_key in ('admin', 'fiscal_manager', 'accountant', 'developer', 'auditor', 'viewer')
on conflict do nothing;

insert into core.role_permissions (role_id, permission_id)
select r.id, p.id
from core.roles as r
join core.permissions as p
  on p.permission_key = 'products.manage'
where r.role_key in ('admin', 'fiscal_manager', 'accountant')
on conflict do nothing;

create or replace function core.catalog_item_json(p_item core.catalog_items)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select jsonb_build_object(
    'id', p_item.id,
    'tenant_id', p_item.tenant_id,
    'organization_id', p_item.organization_id,
    'sku', p_item.sku,
    'name', p_item.name,
    'description', p_item.description,
    'item_kind', p_item.item_kind,
    'category', p_item.category,
    'tax_category', p_item.tax_category,
    'ncm_code', p_item.ncm_code,
    'hs_code', p_item.hs_code,
    'country_of_origin', p_item.country_of_origin,
    'unit_code', p_item.unit_code,
    'currency_code', p_item.currency_code,
    'unit_price', p_item.unit_price,
    'unit_cost', p_item.unit_cost,
    'status', p_item.status,
    'metadata', p_item.metadata,
    'created_by_user_id', p_item.created_by_user_id,
    'created_at', p_item.created_at,
    'updated_at', p_item.updated_at
  )
$$;

create or replace function core.list_catalog_items_as_admin(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select coalesce(
    jsonb_agg(core.catalog_item_json(ci) order by ci.updated_at desc, ci.name asc),
    '[]'::jsonb
  )
  from core.catalog_items as ci
  where ci.tenant_id = p_tenant_id
$$;

create or replace function core.list_catalog_items_as_current_user(p_tenant_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, core, auth, pg_temp
as $$
begin
  if not (
    core.user_has_permission(p_tenant_id, 'products.read')
    or core.user_has_permission(p_tenant_id, 'products.manage')
  ) then
    raise exception 'products.read permission is required'
      using errcode = '42501';
  end if;

  return core.list_catalog_items_as_admin(p_tenant_id);
end;
$$;

create or replace function core.validate_catalog_item_payload(payload jsonb)
returns void
language plpgsql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'payload must be a JSON object'
      using errcode = '22023';
  end if;

  if nullif(trim(coalesce(payload->>'tenant_id', '')), '') is null then
    raise exception 'tenant_id is required'
      using errcode = '22023';
  end if;

  if nullif(trim(coalesce(payload->>'sku', '')), '') is null then
    raise exception 'sku is required'
      using errcode = '22023';
  end if;

  if nullif(trim(coalesce(payload->>'name', '')), '') is null then
    raise exception 'name is required'
      using errcode = '22023';
  end if;

  if coalesce(payload->'metadata', '{}'::jsonb) is null
    or jsonb_typeof(coalesce(payload->'metadata', '{}'::jsonb)) <> 'object' then
    raise exception 'metadata must be a JSON object'
      using errcode = '22023';
  end if;
end;
$$;

create or replace function core.upsert_catalog_item(
  payload jsonb,
  p_actor_type text,
  p_actor_id uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, pg_temp
as $$
declare
  v_tenant_id uuid;
  v_item_id uuid := nullif(payload->>'id', '')::uuid;
  v_organization_id uuid := nullif(payload->>'organization_id', '')::uuid;
  v_sku text := upper(trim(coalesce(payload->>'sku', '')));
  v_name text := nullif(trim(coalesce(payload->>'name', '')), '');
  v_description text := nullif(trim(coalesce(payload->>'description', '')), '');
  v_item_kind text := lower(coalesce(nullif(trim(payload->>'item_kind'), ''), 'goods'));
  v_category text := lower(coalesce(nullif(trim(payload->>'category'), ''), 'goods'));
  v_tax_category text := nullif(lower(trim(coalesce(payload->>'tax_category', ''))), '');
  v_ncm_code text := nullif(upper(trim(coalesce(payload->>'ncm_code', ''))), '');
  v_hs_code text := nullif(upper(trim(coalesce(payload->>'hs_code', ''))), '');
  v_country_of_origin text := nullif(upper(trim(coalesce(payload->>'country_of_origin', ''))), '');
  v_unit_code text := upper(coalesce(nullif(trim(payload->>'unit_code'), ''), 'UN'));
  v_currency_code text := upper(coalesce(nullif(trim(payload->>'currency_code'), ''), 'BRL'));
  v_unit_price numeric(18, 6) := coalesce(nullif(payload->>'unit_price', '')::numeric, 0);
  v_unit_cost numeric(18, 6) := coalesce(nullif(payload->>'unit_cost', '')::numeric, 0);
  v_status text := lower(coalesce(nullif(trim(payload->>'status'), ''), 'draft'));
  v_metadata jsonb := coalesce(payload->'metadata', '{}'::jsonb);
  v_before core.catalog_items%rowtype;
  v_item core.catalog_items%rowtype;
  v_event_type text := 'product.created';
begin
  perform core.validate_catalog_item_payload(payload);
  v_tenant_id := (payload->>'tenant_id')::uuid;

  if not exists (select 1 from core.tenants where id = v_tenant_id and status in ('trial', 'active')) then
    raise exception 'tenant not found or inactive'
      using errcode = '22023';
  end if;

  if v_organization_id is not null and not exists (
    select 1 from core.organizations
    where tenant_id = v_tenant_id and id = v_organization_id and status = 'active'
  ) then
    raise exception 'organization not found for tenant'
      using errcode = '22023';
  end if;

  if v_item_id is not null then
    select *
    into v_before
    from core.catalog_items
    where id = v_item_id and tenant_id = v_tenant_id
    limit 1;

    if not found then
      raise exception 'catalog item not found'
        using errcode = '22023';
    end if;
  end if;

  if v_item_id is null then
    insert into core.catalog_items (
      tenant_id,
      organization_id,
      sku,
      name,
      description,
      item_kind,
      category,
      tax_category,
      ncm_code,
      hs_code,
      country_of_origin,
      unit_code,
      currency_code,
      unit_price,
      unit_cost,
      status,
      metadata,
      created_by_user_id
    )
    values (
      v_tenant_id,
      v_organization_id,
      v_sku,
      v_name,
      v_description,
      v_item_kind,
      v_category,
      v_tax_category,
      v_ncm_code,
      v_hs_code,
      v_country_of_origin,
      v_unit_code,
      v_currency_code,
      v_unit_price,
      v_unit_cost,
      v_status,
      v_metadata,
      case when p_actor_type = 'user' then p_actor_id else null end
    )
    on conflict (tenant_id, lower(sku)) do update
    set organization_id = excluded.organization_id,
        name = excluded.name,
        description = excluded.description,
        item_kind = excluded.item_kind,
        category = excluded.category,
        tax_category = excluded.tax_category,
        ncm_code = excluded.ncm_code,
        hs_code = excluded.hs_code,
        country_of_origin = excluded.country_of_origin,
        unit_code = excluded.unit_code,
        currency_code = excluded.currency_code,
        unit_price = excluded.unit_price,
        unit_cost = excluded.unit_cost,
        status = excluded.status,
        metadata = excluded.metadata
    returning * into v_item;

    if v_item.created_at <> v_item.updated_at then
      v_event_type := 'product.updated';
    end if;
  else
    update core.catalog_items
    set organization_id = v_organization_id,
        sku = v_sku,
        name = v_name,
        description = v_description,
        item_kind = v_item_kind,
        category = v_category,
        tax_category = v_tax_category,
        ncm_code = v_ncm_code,
        hs_code = v_hs_code,
        country_of_origin = v_country_of_origin,
        unit_code = v_unit_code,
        currency_code = v_currency_code,
        unit_price = v_unit_price,
        unit_cost = v_unit_cost,
        status = v_status,
        metadata = v_metadata
    where id = v_item_id and tenant_id = v_tenant_id
    returning * into v_item;

    v_event_type := 'product.updated';
  end if;

  insert into audit.audit_events (
    tenant_id,
    actor_type,
    actor_id,
    event_type,
    resource_type,
    resource_id,
    before_snapshot,
    after_snapshot,
    metadata
  )
  values (
    v_tenant_id,
    p_actor_type,
    p_actor_id,
    v_event_type,
    'core.catalog_item',
    v_item.id,
    case when v_event_type = 'product.updated' and v_before.id is not null then to_jsonb(v_before) else null end,
    to_jsonb(v_item),
    jsonb_build_object('source', 'catalog_item_upsert')
  );

  insert into audit.outbox_events (
    tenant_id,
    event_type,
    aggregate_type,
    aggregate_id,
    payload
  )
  values (
    v_tenant_id,
    v_event_type,
    'core.catalog_item',
    v_item.id,
    core.catalog_item_json(v_item)
  );

  return jsonb_build_object(
    'event_type', v_event_type,
    'item', core.catalog_item_json(v_item),
    'items', core.list_catalog_items_as_admin(v_tenant_id)
  );
end;
$$;

create or replace function core.upsert_catalog_item_as_admin(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, pg_temp
as $$
begin
  return core.upsert_catalog_item(payload, 'system', null);
end;
$$;

create or replace function core.upsert_catalog_item_as_current_user(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_actor core.users%rowtype;
  v_tenant_id uuid;
begin
  perform core.validate_catalog_item_payload(payload);
  v_tenant_id := (payload->>'tenant_id')::uuid;
  v_actor := core.get_current_active_user();

  if not core.user_has_permission(v_tenant_id, 'products.manage') then
    raise exception 'products.manage permission is required'
      using errcode = '42501';
  end if;

  return core.upsert_catalog_item(payload, 'user', v_actor.id);
end;
$$;

create or replace function public.helvok_admin_list_catalog_items(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.list_catalog_items_as_admin(p_tenant_id)
$$;

create or replace function public.helvok_admin_upsert_catalog_item(payload jsonb)
returns jsonb
language sql
volatile
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.upsert_catalog_item_as_admin(payload)
$$;

create or replace function public.helvok_current_list_catalog_items(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.list_catalog_items_as_current_user(p_tenant_id)
$$;

create or replace function public.helvok_current_upsert_catalog_item(payload jsonb)
returns jsonb
language sql
volatile
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.upsert_catalog_item_as_current_user(payload)
$$;

revoke execute on function core.catalog_item_json(core.catalog_items) from public, anon;
revoke execute on function core.list_catalog_items_as_admin(uuid) from public, anon, authenticated;
revoke execute on function core.list_catalog_items_as_current_user(uuid) from public, anon;
revoke execute on function core.validate_catalog_item_payload(jsonb) from public, anon, authenticated;
revoke execute on function core.upsert_catalog_item(jsonb, text, uuid) from public, anon, authenticated;
revoke execute on function core.upsert_catalog_item_as_admin(jsonb) from public, anon, authenticated;
revoke execute on function core.upsert_catalog_item_as_current_user(jsonb) from public, anon;
revoke all on function public.helvok_admin_list_catalog_items(uuid) from public, anon, authenticated;
revoke all on function public.helvok_admin_upsert_catalog_item(jsonb) from public, anon, authenticated;
revoke all on function public.helvok_current_list_catalog_items(uuid) from public, anon;
revoke all on function public.helvok_current_upsert_catalog_item(jsonb) from public, anon;

grant execute on function core.catalog_item_json(core.catalog_items) to authenticated, service_role;
grant execute on function core.list_catalog_items_as_admin(uuid) to service_role;
grant execute on function core.list_catalog_items_as_current_user(uuid) to authenticated, service_role;
grant execute on function core.upsert_catalog_item_as_admin(jsonb) to service_role;
grant execute on function core.upsert_catalog_item_as_current_user(jsonb) to authenticated, service_role;
grant execute on function public.helvok_admin_list_catalog_items(uuid) to service_role;
grant execute on function public.helvok_admin_upsert_catalog_item(jsonb) to service_role;
grant execute on function public.helvok_current_list_catalog_items(uuid) to authenticated, service_role;
grant execute on function public.helvok_current_upsert_catalog_item(jsonb) to authenticated, service_role;

comment on table core.catalog_items is
  'Tenant-scoped product and service catalog used by simulations, operations, integrations, and fiscal document preparation.';
comment on function public.helvok_current_list_catalog_items(uuid) is
  'Authenticated tenant catalog listing guarded by products.read or products.manage.';
comment on function public.helvok_current_upsert_catalog_item(jsonb) is
  'Authenticated catalog upsert guarded by products.manage.';

commit;
