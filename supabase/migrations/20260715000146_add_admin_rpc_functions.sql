-- Administrative RPC boundary for Cloudflare Workers.
--
-- These functions are intentionally exposed through the public Data API schema,
-- but EXECUTE is granted only to service_role. The Worker owns public HTTP
-- authentication and calls these RPCs with the Supabase service role secret.

begin;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

create or replace function public.helvok_admin_list_tenants()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, audit, pg_temp
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', t.id,
        'slug', t.slug,
        'legal_name', t.legal_name,
        'display_name', t.display_name,
        'status', t.status,
        'default_locale', t.default_locale,
        'metadata', t.metadata,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'environments', coalesce(e.environments, '[]'::jsonb)
      )
      order by t.created_at desc
    ),
    '[]'::jsonb
  )
  from core.tenants as t
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', te.id,
        'environment_type', te.environment_type,
        'status', te.status,
        'is_default', te.is_default,
        'created_at', te.created_at
      )
      order by te.environment_type
    ) as environments
    from core.tenant_environments as te
    where te.tenant_id = t.id
  ) as e on true;
$$;

create or replace function public.helvok_admin_create_tenant(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, pg_temp
as $$
declare
  v_slug text := lower(trim(coalesce(payload->>'slug', '')));
  v_legal_name text := nullif(trim(coalesce(payload->>'legal_name', '')), '');
  v_display_name text := nullif(trim(coalesce(payload->>'display_name', '')), '');
  v_default_locale text := coalesce(nullif(trim(coalesce(payload->>'default_locale', '')), ''), 'en-US');
  v_metadata jsonb := coalesce(payload->'metadata', '{}'::jsonb);
  v_tenant core.tenants%rowtype;
  v_environments jsonb;
begin
  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$' then
    raise exception 'invalid tenant slug'
      using errcode = '22023';
  end if;

  if v_legal_name is null then
    raise exception 'legal_name is required'
      using errcode = '22023';
  end if;

  if jsonb_typeof(v_metadata) <> 'object' then
    raise exception 'metadata must be a JSON object'
      using errcode = '22023';
  end if;

  insert into core.tenants (
    slug,
    legal_name,
    display_name,
    status,
    default_locale,
    metadata
  )
  values (
    v_slug,
    v_legal_name,
    v_display_name,
    coalesce(nullif(payload->>'status', ''), 'trial'),
    v_default_locale,
    v_metadata
  )
  returning * into v_tenant;

  insert into core.tenant_environments (
    tenant_id,
    environment_type,
    status,
    is_default
  )
  values
    (v_tenant.id, 'sandbox', 'active', true),
    (v_tenant.id, 'production', 'active', false);

  select jsonb_agg(
    jsonb_build_object(
      'id', te.id,
      'environment_type', te.environment_type,
      'status', te.status,
      'is_default', te.is_default,
      'created_at', te.created_at
    )
    order by te.environment_type
  )
  into v_environments
  from core.tenant_environments as te
  where te.tenant_id = v_tenant.id;

  insert into audit.audit_events (
    tenant_id,
    actor_type,
    event_type,
    resource_type,
    resource_id,
    metadata,
    after_snapshot
  )
  values (
    v_tenant.id,
    'system',
    'tenant.created',
    'core.tenant',
    v_tenant.id,
    jsonb_build_object('source', 'helvok_admin_create_tenant'),
    to_jsonb(v_tenant)
  );

  insert into audit.outbox_events (
    tenant_id,
    event_type,
    aggregate_type,
    aggregate_id,
    payload
  )
  values (
    v_tenant.id,
    'tenant.created',
    'core.tenant',
    v_tenant.id,
    jsonb_build_object(
      'tenant_id', v_tenant.id,
      'slug', v_tenant.slug,
      'legal_name', v_tenant.legal_name
    )
  );

  return jsonb_build_object(
    'tenant', jsonb_build_object(
      'id', v_tenant.id,
      'slug', v_tenant.slug,
      'legal_name', v_tenant.legal_name,
      'display_name', v_tenant.display_name,
      'status', v_tenant.status,
      'default_locale', v_tenant.default_locale,
      'metadata', v_tenant.metadata,
      'created_at', v_tenant.created_at,
      'updated_at', v_tenant.updated_at
    ),
    'environments', coalesce(v_environments, '[]'::jsonb)
  );
end;
$$;

create or replace function public.helvok_admin_list_organizations(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, audit, pg_temp
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'tenant_id', o.tenant_id,
        'organization_type', o.organization_type,
        'legal_name', o.legal_name,
        'trade_name', o.trade_name,
        'country_of_registration', o.country_of_registration,
        'status', o.status,
        'metadata', o.metadata,
        'created_at', o.created_at,
        'updated_at', o.updated_at,
        'establishments', coalesce(e.establishments, '[]'::jsonb)
      )
      order by o.created_at desc
    ),
    '[]'::jsonb
  )
  from core.organizations as o
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', est.id,
        'name', est.name,
        'country_code', est.country_code,
        'jurisdiction_path', est.jurisdiction_path,
        'status', est.status,
        'created_at', est.created_at
      )
      order by est.created_at asc
    ) as establishments
    from core.establishments as est
    where est.tenant_id = o.tenant_id
      and est.organization_id = o.id
  ) as e on true
  where o.tenant_id = p_tenant_id;
$$;

create or replace function public.helvok_admin_create_organization(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, pg_temp
as $$
declare
  v_tenant_id uuid := nullif(payload->>'tenant_id', '')::uuid;
  v_organization_type text := coalesce(nullif(trim(coalesce(payload->>'organization_type', '')), ''), 'company');
  v_legal_name text := nullif(trim(coalesce(payload->>'legal_name', '')), '');
  v_trade_name text := nullif(trim(coalesce(payload->>'trade_name', '')), '');
  v_country text := upper(trim(coalesce(payload->>'country_of_registration', '')));
  v_metadata jsonb := coalesce(payload->'metadata', '{}'::jsonb);
  v_create_establishment boolean := coalesce((payload->>'create_default_establishment')::boolean, true);
  v_establishment_name text := nullif(trim(coalesce(payload->>'establishment_name', '')), '');
  v_organization core.organizations%rowtype;
  v_establishment core.establishments%rowtype;
begin
  if v_tenant_id is null then
    raise exception 'tenant_id is required'
      using errcode = '22023';
  end if;

  if not exists (select 1 from core.tenants where id = v_tenant_id) then
    raise exception 'tenant not found'
      using errcode = '22023';
  end if;

  if v_legal_name is null then
    raise exception 'legal_name is required'
      using errcode = '22023';
  end if;

  if v_country !~ '^[A-Z]{2}$' then
    raise exception 'country_of_registration must be ISO 3166-1 alpha-2'
      using errcode = '22023';
  end if;

  if jsonb_typeof(v_metadata) <> 'object' then
    raise exception 'metadata must be a JSON object'
      using errcode = '22023';
  end if;

  insert into core.organizations (
    tenant_id,
    organization_type,
    legal_name,
    trade_name,
    country_of_registration,
    status,
    metadata
  )
  values (
    v_tenant_id,
    v_organization_type,
    v_legal_name,
    v_trade_name,
    v_country,
    coalesce(nullif(payload->>'status', ''), 'active'),
    v_metadata
  )
  returning * into v_organization;

  if v_create_establishment then
    insert into core.establishments (
      tenant_id,
      organization_id,
      name,
      country_code,
      jurisdiction_path,
      status
    )
    values (
      v_tenant_id,
      v_organization.id,
      coalesce(v_establishment_name, v_trade_name, v_legal_name),
      v_country,
      array[v_country],
      'active'
    )
    returning * into v_establishment;
  end if;

  insert into audit.audit_events (
    tenant_id,
    actor_type,
    event_type,
    resource_type,
    resource_id,
    metadata,
    after_snapshot
  )
  values (
    v_tenant_id,
    'system',
    'organization.created',
    'core.organization',
    v_organization.id,
    jsonb_build_object('source', 'helvok_admin_create_organization'),
    to_jsonb(v_organization)
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
    'organization.created',
    'core.organization',
    v_organization.id,
    jsonb_build_object(
      'tenant_id', v_tenant_id,
      'organization_id', v_organization.id,
      'legal_name', v_organization.legal_name,
      'country_of_registration', v_organization.country_of_registration
    )
  );

  return jsonb_build_object(
    'organization', jsonb_build_object(
      'id', v_organization.id,
      'tenant_id', v_organization.tenant_id,
      'organization_type', v_organization.organization_type,
      'legal_name', v_organization.legal_name,
      'trade_name', v_organization.trade_name,
      'country_of_registration', v_organization.country_of_registration,
      'status', v_organization.status,
      'metadata', v_organization.metadata,
      'created_at', v_organization.created_at,
      'updated_at', v_organization.updated_at
    ),
    'establishment', case
      when v_establishment.id is null then null
      else jsonb_build_object(
        'id', v_establishment.id,
        'tenant_id', v_establishment.tenant_id,
        'organization_id', v_establishment.organization_id,
        'name', v_establishment.name,
        'country_code', v_establishment.country_code,
        'jurisdiction_path', v_establishment.jurisdiction_path,
        'status', v_establishment.status,
        'created_at', v_establishment.created_at,
        'updated_at', v_establishment.updated_at
      )
    end
  );
end;
$$;

revoke all on function public.helvok_admin_list_tenants() from public, anon, authenticated;
revoke all on function public.helvok_admin_create_tenant(jsonb) from public, anon, authenticated;
revoke all on function public.helvok_admin_list_organizations(uuid) from public, anon, authenticated;
revoke all on function public.helvok_admin_create_organization(jsonb) from public, anon, authenticated;

grant execute on function public.helvok_admin_list_tenants() to service_role;
grant execute on function public.helvok_admin_create_tenant(jsonb) to service_role;
grant execute on function public.helvok_admin_list_organizations(uuid) to service_role;
grant execute on function public.helvok_admin_create_organization(jsonb) to service_role;

comment on function public.helvok_admin_list_tenants() is
  'Service-role RPC used by the Cloudflare Worker admin API to list tenants.';
comment on function public.helvok_admin_create_tenant(jsonb) is
  'Service-role RPC used by the Cloudflare Worker admin API to create a tenant with sandbox and production environments.';
comment on function public.helvok_admin_list_organizations(uuid) is
  'Service-role RPC used by the Cloudflare Worker admin API to list tenant organizations.';
comment on function public.helvok_admin_create_organization(jsonb) is
  'Service-role RPC used by the Cloudflare Worker admin API to create an organization and optional default establishment.';

commit;
