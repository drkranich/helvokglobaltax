-- Helvok Tax - Phase 1 database foundation
-- Core goal: tenant isolation, organization structure, RBAC seed, audit/outbox,
-- and safe public views. Fiscal logic remains outside the Core schema.

begin;

create extension if not exists pgcrypto with schema extensions;

create schema if not exists core;
create schema if not exists audit;

revoke all on schema core from public, anon, authenticated;
revoke all on schema audit from public, anon, authenticated;
grant usage on schema core to authenticated, service_role;
grant usage on schema audit to authenticated, service_role;

alter default privileges in schema core revoke all on tables from public, anon, authenticated;
alter default privileges in schema audit revoke all on tables from public, anon, authenticated;
alter default privileges in schema core revoke all on functions from public, anon, authenticated;
alter default privileges in schema audit revoke all on functions from public, anon, authenticated;
alter default privileges in schema core grant all on tables to service_role;
alter default privileges in schema audit grant all on tables to service_role;
alter default privileges in schema core grant execute on functions to service_role;
alter default privileges in schema audit grant execute on functions to service_role;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;

create or replace function core.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function core.set_updated_at() from public, anon, authenticated;
grant execute on function core.set_updated_at() to service_role;

create table core.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  legal_name text not null,
  display_name text,
  status text not null default 'trial',
  default_locale text not null default 'en-US',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_tenants_slug_format_chk
    check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  constraint core_tenants_status_chk
    check (status in ('trial', 'active', 'suspended', 'closed'))
);

create unique index core_tenants_slug_key on core.tenants (slug);
create index core_tenants_status_idx on core.tenants (status);
create index core_tenants_metadata_gin_idx on core.tenants using gin (metadata);

create trigger core_tenants_set_updated_at
before update on core.tenants
for each row execute function core.set_updated_at();

create table core.tenant_environments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  environment_type text not null,
  status text not null default 'active',
  is_default boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_tenant_environments_type_chk
    check (environment_type in ('sandbox', 'production', 'homologation')),
  constraint core_tenant_environments_status_chk
    check (status in ('active', 'paused', 'archived'))
);

alter table core.tenant_environments
  add constraint core_tenant_environments_tenant_id_id_key unique (tenant_id, id);

create unique index core_tenant_environments_tenant_type_key
  on core.tenant_environments (tenant_id, environment_type);
create unique index core_tenant_environments_one_default_per_tenant_idx
  on core.tenant_environments (tenant_id)
  where is_default;
create index core_tenant_environments_tenant_status_idx
  on core.tenant_environments (tenant_id, status);
create index core_tenant_environments_metadata_gin_idx
  on core.tenant_environments using gin (metadata);

create trigger core_tenant_environments_set_updated_at
before update on core.tenant_environments
for each row execute function core.set_updated_at();

create table core.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_users_email_lower_chk
    check (email = lower(email)),
  constraint core_users_status_chk
    check (status in ('invited', 'active', 'disabled', 'deleted'))
);

create unique index core_users_auth_user_id_key on core.users (auth_user_id);
create unique index core_users_email_key on core.users (email);
create index core_users_status_idx on core.users (status);
create index core_users_metadata_gin_idx on core.users using gin (metadata);

create trigger core_users_set_updated_at
before update on core.users
for each row execute function core.set_updated_at();

create table core.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references core.tenants (id) on delete cascade,
  role_key text not null,
  name text not null,
  description text,
  is_system boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_roles_key_format_chk
    check (role_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint core_roles_system_tenant_chk
    check ((is_system and tenant_id is null) or (not is_system)),
  constraint core_roles_status_chk
    check (status in ('active', 'archived'))
);

alter table core.roles
  add constraint core_roles_tenant_id_id_key unique (tenant_id, id);

create unique index core_roles_system_key_unique
  on core.roles (role_key)
  where tenant_id is null;
create unique index core_roles_tenant_key_unique
  on core.roles (tenant_id, role_key)
  where tenant_id is not null;
create index core_roles_tenant_status_idx on core.roles (tenant_id, status);

create trigger core_roles_set_updated_at
before update on core.roles
for each row execute function core.set_updated_at();

create table core.permissions (
  id uuid primary key default gen_random_uuid(),
  permission_key text not null,
  resource text not null,
  action text not null,
  description text,
  created_at timestamptz not null default now(),
  constraint core_permissions_key_format_chk
    check (permission_key ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$')
);

create unique index core_permissions_permission_key_unique
  on core.permissions (permission_key);
create unique index core_permissions_resource_action_unique
  on core.permissions (resource, action);

create table core.role_permissions (
  role_id uuid not null references core.roles (id) on delete cascade,
  permission_id uuid not null references core.permissions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create index core_role_permissions_permission_id_idx
  on core.role_permissions (permission_id);

create table core.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  user_id uuid not null references core.users (id) on delete cascade,
  role_id uuid not null references core.roles (id),
  scope_type text not null default 'tenant',
  scope_id uuid,
  status text not null default 'active',
  invited_email text,
  invited_by_user_id uuid references core.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_memberships_scope_type_chk
    check (scope_type in ('tenant', 'organization', 'establishment', 'environment')),
  constraint core_memberships_scope_id_chk
    check ((scope_type = 'tenant' and scope_id is null) or (scope_type <> 'tenant' and scope_id is not null)),
  constraint core_memberships_status_chk
    check (status in ('invited', 'active', 'disabled', 'revoked'))
);

create unique index core_memberships_scope_unique
  on core.memberships (
    tenant_id,
    user_id,
    role_id,
    scope_type,
    coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
create index core_memberships_tenant_status_idx on core.memberships (tenant_id, status);
create index core_memberships_user_status_idx on core.memberships (user_id, status);
create index core_memberships_role_id_idx on core.memberships (role_id);
create index core_memberships_invited_by_user_id_idx on core.memberships (invited_by_user_id);

create trigger core_memberships_set_updated_at
before update on core.memberships
for each row execute function core.set_updated_at();

create or replace function core.validate_membership_role_scope()
returns trigger
language plpgsql
security invoker
set search_path = core, pg_temp
as $$
declare
  role_tenant_id uuid;
begin
  select r.tenant_id
  into role_tenant_id
  from core.roles as r
  where r.id = new.role_id;

  if not found then
    raise exception 'membership role does not exist'
      using errcode = '23503';
  end if;

  if role_tenant_id is not null and role_tenant_id <> new.tenant_id then
    raise exception 'membership role belongs to a different tenant'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function core.validate_membership_role_scope() from public, anon, authenticated;
grant execute on function core.validate_membership_role_scope() to service_role;

create trigger core_memberships_validate_role_scope
before insert or update of tenant_id, role_id on core.memberships
for each row execute function core.validate_membership_role_scope();

create or replace function core.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = core, auth, pg_temp
as $$
  select u.id
  from core.users as u
  where u.auth_user_id = (select auth.uid())
    and u.status = 'active'
  limit 1
$$;

create or replace function core.has_tenant_membership(check_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = core, auth, pg_temp
as $$
  select exists (
    select 1
    from core.memberships as m
    join core.users as u on u.id = m.user_id
    where m.tenant_id = check_tenant_id
      and m.status = 'active'
      and u.status = 'active'
      and u.auth_user_id = (select auth.uid())
  )
$$;

revoke execute on function core.current_user_id() from public, anon;
revoke execute on function core.has_tenant_membership(uuid) from public, anon;
grant execute on function core.current_user_id() to authenticated, service_role;
grant execute on function core.has_tenant_membership(uuid) to authenticated, service_role;

create table core.organizations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  organization_type text not null,
  legal_name text not null,
  trade_name text,
  country_of_registration text not null,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_organizations_type_chk
    check (organization_type in (
      'company',
      'branch',
      'holding',
      'subsidiary',
      'representation',
      'international_company',
      'economic_group'
    )),
  constraint core_organizations_country_chk
    check (country_of_registration ~ '^[A-Z]{2}$'),
  constraint core_organizations_status_chk
    check (status in ('active', 'inactive', 'suspended', 'archived'))
);

alter table core.organizations
  add constraint core_organizations_tenant_id_id_key unique (tenant_id, id);

create index core_organizations_tenant_status_idx on core.organizations (tenant_id, status);
create index core_organizations_country_idx on core.organizations (country_of_registration);
create index core_organizations_metadata_gin_idx on core.organizations using gin (metadata);

create trigger core_organizations_set_updated_at
before update on core.organizations
for each row execute function core.set_updated_at();

create table core.organization_relationships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  parent_organization_id uuid not null,
  child_organization_id uuid not null,
  relationship_type text not null,
  valid_from date not null default current_date,
  valid_to date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_org_relationships_parent_fk
    foreign key (tenant_id, parent_organization_id)
    references core.organizations (tenant_id, id)
    on delete cascade,
  constraint core_org_relationships_child_fk
    foreign key (tenant_id, child_organization_id)
    references core.organizations (tenant_id, id)
    on delete cascade,
  constraint core_org_relationships_not_self_chk
    check (parent_organization_id <> child_organization_id),
  constraint core_org_relationships_type_chk
    check (relationship_type in (
      'headquarters',
      'branch',
      'holding',
      'subsidiary',
      'economic_group',
      'representation'
    )),
  constraint core_org_relationships_valid_window_chk
    check (valid_to is null or valid_to >= valid_from)
);

create unique index core_org_relationships_unique_active_idx
  on core.organization_relationships (
    tenant_id,
    parent_organization_id,
    child_organization_id,
    relationship_type
  )
  where valid_to is null;
create index core_org_relationships_parent_idx
  on core.organization_relationships (parent_organization_id);
create index core_org_relationships_child_idx
  on core.organization_relationships (child_organization_id);
create index core_org_relationships_tenant_idx
  on core.organization_relationships (tenant_id);
create index core_org_relationships_metadata_gin_idx
  on core.organization_relationships using gin (metadata);

create or replace function core.prevent_organization_relationship_cycle()
returns trigger
language plpgsql
security invoker
set search_path = core, pg_temp
as $$
begin
  if exists (
    with recursive ancestors(parent_organization_id) as (
      select r.parent_organization_id
      from core.organization_relationships as r
      where r.tenant_id = new.tenant_id
        and r.child_organization_id = new.parent_organization_id
        and r.id is distinct from new.id
      union
      select r.parent_organization_id
      from core.organization_relationships as r
      join ancestors as a
        on a.parent_organization_id = r.child_organization_id
      where r.tenant_id = new.tenant_id
        and r.id is distinct from new.id
    )
    select 1
    from ancestors
    where parent_organization_id = new.child_organization_id
  ) then
    raise exception 'organization relationship would create a cycle'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function core.prevent_organization_relationship_cycle() from public, anon, authenticated;
grant execute on function core.prevent_organization_relationship_cycle() to service_role;

create trigger core_org_relationships_prevent_cycle
before insert or update on core.organization_relationships
for each row execute function core.prevent_organization_relationship_cycle();

create trigger core_org_relationships_set_updated_at
before update on core.organization_relationships
for each row execute function core.set_updated_at();

create table core.establishments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  organization_id uuid not null,
  name text not null,
  country_code text not null,
  jurisdiction_path text[] not null default array[]::text[],
  address jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_establishments_organization_fk
    foreign key (tenant_id, organization_id)
    references core.organizations (tenant_id, id)
    on delete cascade,
  constraint core_establishments_country_chk
    check (country_code ~ '^[A-Z]{2}$'),
  constraint core_establishments_status_chk
    check (status in ('active', 'inactive', 'suspended', 'archived'))
);

alter table core.establishments
  add constraint core_establishments_tenant_id_id_key unique (tenant_id, id);

create index core_establishments_tenant_status_idx on core.establishments (tenant_id, status);
create index core_establishments_organization_id_idx on core.establishments (organization_id);
create index core_establishments_country_idx on core.establishments (country_code);
create index core_establishments_jurisdiction_path_gin_idx
  on core.establishments using gin (jurisdiction_path);
create index core_establishments_address_gin_idx on core.establishments using gin (address);
create index core_establishments_metadata_gin_idx on core.establishments using gin (metadata);

create trigger core_establishments_set_updated_at
before update on core.establishments
for each row execute function core.set_updated_at();

create table core.fiscal_identities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  organization_id uuid,
  establishment_id uuid,
  country_code text not null,
  identifier_type text not null,
  identifier_value_encrypted text,
  identifier_value_hash text,
  valid_from date not null default current_date,
  valid_to date,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_fiscal_identities_org_fk
    foreign key (tenant_id, organization_id)
    references core.organizations (tenant_id, id)
    on delete cascade,
  constraint core_fiscal_identities_establishment_fk
    foreign key (tenant_id, establishment_id)
    references core.establishments (tenant_id, id)
    on delete cascade,
  constraint core_fiscal_identities_owner_chk
    check (organization_id is not null or establishment_id is not null),
  constraint core_fiscal_identities_secret_material_chk
    check (identifier_value_encrypted is not null or identifier_value_hash is not null),
  constraint core_fiscal_identities_country_chk
    check (country_code ~ '^[A-Z]{2}$'),
  constraint core_fiscal_identities_identifier_type_chk
    check (identifier_type ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint core_fiscal_identities_valid_window_chk
    check (valid_to is null or valid_to >= valid_from),
  constraint core_fiscal_identities_status_chk
    check (status in ('active', 'inactive', 'expired', 'revoked'))
);

create unique index core_fiscal_identities_active_hash_unique_idx
  on core.fiscal_identities (tenant_id, country_code, identifier_type, identifier_value_hash)
  where status = 'active'
    and valid_to is null
    and identifier_value_hash is not null;
create index core_fiscal_identities_tenant_status_idx on core.fiscal_identities (tenant_id, status);
create index core_fiscal_identities_organization_id_idx on core.fiscal_identities (organization_id);
create index core_fiscal_identities_establishment_id_idx on core.fiscal_identities (establishment_id);
create index core_fiscal_identities_country_type_idx
  on core.fiscal_identities (country_code, identifier_type);
create index core_fiscal_identities_metadata_gin_idx
  on core.fiscal_identities using gin (metadata);

create trigger core_fiscal_identities_set_updated_at
before update on core.fiscal_identities
for each row execute function core.set_updated_at();

create or replace function core.validate_fiscal_identity_scope()
returns trigger
language plpgsql
security invoker
set search_path = core, pg_temp
as $$
begin
  if new.organization_id is not null
    and new.establishment_id is not null
    and not exists (
      select 1
      from core.establishments as e
      where e.tenant_id = new.tenant_id
        and e.id = new.establishment_id
        and e.organization_id = new.organization_id
    )
  then
    raise exception 'fiscal identity establishment belongs to a different organization'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function core.validate_fiscal_identity_scope() from public, anon, authenticated;
grant execute on function core.validate_fiscal_identity_scope() to service_role;

create trigger core_fiscal_identities_validate_scope
before insert or update of tenant_id, organization_id, establishment_id on core.fiscal_identities
for each row execute function core.validate_fiscal_identity_scope();

create table core.certificates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  environment_id uuid not null,
  organization_id uuid not null,
  establishment_id uuid,
  country_code text not null,
  certificate_type text not null,
  storage_ref text not null,
  fingerprint text,
  valid_from timestamptz not null,
  valid_to timestamptz not null,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_certificates_environment_fk
    foreign key (tenant_id, environment_id)
    references core.tenant_environments (tenant_id, id)
    on delete cascade,
  constraint core_certificates_organization_fk
    foreign key (tenant_id, organization_id)
    references core.organizations (tenant_id, id)
    on delete cascade,
  constraint core_certificates_establishment_fk
    foreign key (tenant_id, establishment_id)
    references core.establishments (tenant_id, id)
    on delete set null,
  constraint core_certificates_country_chk
    check (country_code ~ '^[A-Z]{2}$'),
  constraint core_certificates_type_chk
    check (certificate_type ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint core_certificates_valid_window_chk
    check (valid_to > valid_from),
  constraint core_certificates_status_chk
    check (status in ('active', 'expiring', 'expired', 'revoked', 'archived'))
);

create index core_certificates_tenant_status_idx on core.certificates (tenant_id, status);
create index core_certificates_environment_id_idx on core.certificates (environment_id);
create index core_certificates_organization_id_idx on core.certificates (organization_id);
create index core_certificates_establishment_id_idx on core.certificates (establishment_id);
create index core_certificates_valid_to_idx on core.certificates (valid_to);
create index core_certificates_metadata_gin_idx on core.certificates using gin (metadata);

create trigger core_certificates_set_updated_at
before update on core.certificates
for each row execute function core.set_updated_at();

create or replace function core.validate_certificate_scope()
returns trigger
language plpgsql
security invoker
set search_path = core, pg_temp
as $$
begin
  if new.establishment_id is not null
    and not exists (
      select 1
      from core.establishments as e
      where e.tenant_id = new.tenant_id
        and e.id = new.establishment_id
        and e.organization_id = new.organization_id
    )
  then
    raise exception 'certificate establishment belongs to a different organization'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function core.validate_certificate_scope() from public, anon, authenticated;
grant execute on function core.validate_certificate_scope() to service_role;

create trigger core_certificates_validate_scope
before insert or update of tenant_id, organization_id, establishment_id on core.certificates
for each row execute function core.validate_certificate_scope();

create table audit.audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references core.tenants (id) on delete restrict,
  environment_id uuid,
  actor_type text not null,
  actor_id uuid,
  event_type text not null,
  resource_type text not null,
  resource_id uuid,
  correlation_id text,
  causation_id text,
  request_id text,
  ip_address inet,
  user_agent text,
  before_snapshot jsonb,
  after_snapshot jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_events_environment_fk
    foreign key (tenant_id, environment_id)
    references core.tenant_environments (tenant_id, id)
    on delete restrict,
  constraint audit_events_environment_requires_tenant_chk
    check (environment_id is null or tenant_id is not null),
  constraint audit_events_actor_type_chk
    check (actor_type in ('user', 'api_key', 'system', 'adapter', 'integration', 'ai')),
  constraint audit_events_event_type_chk
    check (event_type ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$')
);

create index audit_events_tenant_event_created_idx
  on audit.audit_events (tenant_id, event_type, created_at desc);
create index audit_events_environment_id_idx on audit.audit_events (environment_id);
create index audit_events_resource_idx on audit.audit_events (resource_type, resource_id);
create index audit_events_correlation_id_idx on audit.audit_events (correlation_id);
create index audit_events_metadata_gin_idx on audit.audit_events using gin (metadata);

create table audit.outbox_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references core.tenants (id) on delete cascade,
  environment_id uuid,
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  available_at timestamptz not null default now(),
  published_at timestamptz,
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint outbox_events_environment_fk
    foreign key (tenant_id, environment_id)
    references core.tenant_environments (tenant_id, id)
    on delete cascade,
  constraint outbox_events_environment_requires_tenant_chk
    check (environment_id is null or tenant_id is not null),
  constraint outbox_events_status_chk
    check (status in ('pending', 'processing', 'published', 'failed', 'cancelled')),
  constraint outbox_events_attempt_count_chk
    check (attempt_count >= 0),
  constraint outbox_events_event_type_chk
    check (event_type ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$')
);

create index outbox_events_status_available_idx
  on audit.outbox_events (status, available_at);
create index outbox_events_tenant_status_idx
  on audit.outbox_events (tenant_id, status);
create index outbox_events_environment_id_idx on audit.outbox_events (environment_id);
create index outbox_events_aggregate_idx
  on audit.outbox_events (aggregate_type, aggregate_id);
create index outbox_events_payload_gin_idx on audit.outbox_events using gin (payload);

create trigger outbox_events_set_updated_at
before update on audit.outbox_events
for each row execute function core.set_updated_at();

create or replace function audit.prevent_audit_event_mutation()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, audit
as $$
begin
  raise exception 'audit events are append-only'
    using errcode = '25006';
end;
$$;

revoke execute on function audit.prevent_audit_event_mutation() from public, anon, authenticated;
grant execute on function audit.prevent_audit_event_mutation() to service_role;

create trigger audit_events_prevent_update
before update on audit.audit_events
for each row execute function audit.prevent_audit_event_mutation();

create trigger audit_events_prevent_delete
before delete on audit.audit_events
for each row execute function audit.prevent_audit_event_mutation();

alter table core.tenants enable row level security;
alter table core.tenants force row level security;
alter table core.tenant_environments enable row level security;
alter table core.tenant_environments force row level security;
alter table core.users enable row level security;
alter table core.users force row level security;
alter table core.roles enable row level security;
alter table core.roles force row level security;
alter table core.permissions enable row level security;
alter table core.permissions force row level security;
alter table core.role_permissions enable row level security;
alter table core.role_permissions force row level security;
alter table core.memberships enable row level security;
alter table core.memberships force row level security;
alter table core.organizations enable row level security;
alter table core.organizations force row level security;
alter table core.organization_relationships enable row level security;
alter table core.organization_relationships force row level security;
alter table core.establishments enable row level security;
alter table core.establishments force row level security;
alter table core.fiscal_identities enable row level security;
alter table core.fiscal_identities force row level security;
alter table core.certificates enable row level security;
alter table core.certificates force row level security;
alter table audit.audit_events enable row level security;
alter table audit.audit_events force row level security;
alter table audit.outbox_events enable row level security;
alter table audit.outbox_events force row level security;

create policy "members can read their tenants"
on core.tenants for select
to authenticated
using ((select core.has_tenant_membership(id)));

create policy "members can read tenant environments"
on core.tenant_environments for select
to authenticated
using ((select core.has_tenant_membership(tenant_id)));

create policy "users can read their own profile"
on core.users for select
to authenticated
using (id = (select core.current_user_id()));

create policy "members can read system or tenant roles"
on core.roles for select
to authenticated
using (tenant_id is null or (select core.has_tenant_membership(tenant_id)));

create policy "authenticated users can read permission catalog"
on core.permissions for select
to authenticated
using (true);

create policy "authenticated users can read role permission catalog"
on core.role_permissions for select
to authenticated
using (true);

create policy "users can read their own memberships"
on core.memberships for select
to authenticated
using (user_id = (select core.current_user_id()));

create policy "members can read tenant organizations"
on core.organizations for select
to authenticated
using ((select core.has_tenant_membership(tenant_id)));

create policy "members can read tenant organization relationships"
on core.organization_relationships for select
to authenticated
using ((select core.has_tenant_membership(tenant_id)));

create policy "members can read tenant establishments"
on core.establishments for select
to authenticated
using ((select core.has_tenant_membership(tenant_id)));

create policy "members can read tenant fiscal identities"
on core.fiscal_identities for select
to authenticated
using ((select core.has_tenant_membership(tenant_id)));

create policy "members can read tenant certificate metadata"
on core.certificates for select
to authenticated
using ((select core.has_tenant_membership(tenant_id)));

create policy "members can read tenant audit events"
on audit.audit_events for select
to authenticated
using (tenant_id is not null and (select core.has_tenant_membership(tenant_id)));

grant select on
  core.tenants,
  core.tenant_environments,
  core.users,
  core.roles,
  core.permissions,
  core.role_permissions,
  core.memberships,
  core.organizations,
  core.organization_relationships,
  core.establishments,
  core.fiscal_identities,
  core.certificates,
  audit.audit_events
to authenticated;

grant all on
  core.tenants,
  core.tenant_environments,
  core.users,
  core.roles,
  core.permissions,
  core.role_permissions,
  core.memberships,
  core.organizations,
  core.organization_relationships,
  core.establishments,
  core.fiscal_identities,
  core.certificates,
  audit.audit_events,
  audit.outbox_events
to service_role;

create or replace view public.current_user_tenants
with (security_invoker = true)
as
select
  t.id,
  t.slug,
  t.legal_name,
  t.display_name,
  t.status,
  m.role_id,
  r.role_key,
  m.scope_type,
  m.scope_id
from core.tenants as t
join core.memberships as m on m.tenant_id = t.id
join core.users as u on u.id = m.user_id
join core.roles as r on r.id = m.role_id
where u.auth_user_id = (select auth.uid())
  and u.status = 'active'
  and m.status = 'active'
  and t.status in ('trial', 'active');

create or replace view public.current_user_permissions
with (security_invoker = true)
as
select distinct
  m.tenant_id,
  r.role_key,
  p.permission_key,
  p.resource,
  p.action,
  m.scope_type,
  m.scope_id
from core.memberships as m
join core.users as u on u.id = m.user_id
join core.roles as r on r.id = m.role_id
join core.role_permissions as rp on rp.role_id = r.id
join core.permissions as p on p.id = rp.permission_id
join core.tenants as t on t.id = m.tenant_id
where u.auth_user_id = (select auth.uid())
  and u.status = 'active'
  and m.status = 'active'
  and r.status = 'active'
  and t.status in ('trial', 'active');

grant select on public.current_user_tenants to authenticated;
grant select on public.current_user_permissions to authenticated;
revoke all on public.current_user_tenants from anon;
revoke all on public.current_user_permissions from anon;

insert into core.permissions (permission_key, resource, action, description)
values
  ('tenant.manage', 'tenant', 'manage', 'Manage tenant settings and lifecycle.'),
  ('members.manage', 'members', 'manage', 'Invite, update, and revoke tenant members.'),
  ('organizations.manage', 'organizations', 'manage', 'Manage organizations, establishments, and fiscal identities.'),
  ('products.manage', 'products', 'manage', 'Manage product and service catalog.'),
  ('operations.create', 'operations', 'create', 'Create commercial operations.'),
  ('operations.read', 'operations', 'read', 'Read commercial operations.'),
  ('tax.calculate', 'tax', 'calculate', 'Run tax calculations and simulations.'),
  ('rules.create', 'rules', 'create', 'Create tax rule drafts.'),
  ('rules.review', 'rules', 'review', 'Review tax rules.'),
  ('rules.publish', 'rules', 'publish', 'Publish approved tax rules.'),
  ('documents.issue', 'documents', 'issue', 'Queue fiscal document issuance.'),
  ('documents.cancel', 'documents', 'cancel', 'Cancel fiscal documents when supported.'),
  ('documents.read', 'documents', 'read', 'Read fiscal documents and statuses.'),
  ('integrations.manage', 'integrations', 'manage', 'Manage integrations and connector credentials.'),
  ('api_keys.manage', 'api_keys', 'manage', 'Manage API credentials.'),
  ('webhooks.manage', 'webhooks', 'manage', 'Manage webhook endpoints.'),
  ('audit.read', 'audit', 'read', 'Read audit timelines and evidence metadata.'),
  ('settings.manage', 'settings', 'manage', 'Manage tenant environment settings.')
on conflict (permission_key) do nothing;

insert into core.roles (role_key, name, description, is_system)
values
  ('owner', 'Owner', 'Full tenant ownership and administrative authority.', true),
  ('admin', 'Admin', 'Administrative access except ownership transfer.', true),
  ('fiscal_manager', 'Fiscal Manager', 'Fiscal operations, rules, and documents.', true),
  ('accountant', 'Accountant', 'Accounting and compliance access.', true),
  ('developer', 'Developer', 'API, SDK, integrations, and webhook access.', true),
  ('support', 'Support', 'Operational support and diagnostics access.', true),
  ('auditor', 'Auditor', 'Read-only audit and evidence access.', true),
  ('viewer', 'Viewer', 'Read-only operational visibility.', true)
on conflict do nothing;

insert into core.role_permissions (role_id, permission_id)
select r.id, p.id
from core.roles as r
cross join core.permissions as p
where r.role_key = 'owner'
on conflict do nothing;

insert into core.role_permissions (role_id, permission_id)
select r.id, p.id
from core.roles as r
join core.permissions as p
  on p.permission_key in (
    'tenant.manage',
    'members.manage',
    'organizations.manage',
    'products.manage',
    'operations.create',
    'operations.read',
    'tax.calculate',
    'documents.issue',
    'documents.cancel',
    'documents.read',
    'integrations.manage',
    'api_keys.manage',
    'webhooks.manage',
    'audit.read',
    'settings.manage'
  )
where r.role_key = 'admin'
on conflict do nothing;

insert into core.role_permissions (role_id, permission_id)
select r.id, p.id
from core.roles as r
join core.permissions as p
  on p.permission_key in (
    'organizations.manage',
    'products.manage',
    'operations.create',
    'operations.read',
    'tax.calculate',
    'rules.create',
    'rules.review',
    'rules.publish',
    'documents.issue',
    'documents.cancel',
    'documents.read',
    'audit.read'
  )
where r.role_key = 'fiscal_manager'
on conflict do nothing;

insert into core.role_permissions (role_id, permission_id)
select r.id, p.id
from core.roles as r
join core.permissions as p
  on p.permission_key in (
    'organizations.manage',
    'operations.read',
    'tax.calculate',
    'documents.read',
    'audit.read'
  )
where r.role_key = 'accountant'
on conflict do nothing;

insert into core.role_permissions (role_id, permission_id)
select r.id, p.id
from core.roles as r
join core.permissions as p
  on p.permission_key in (
    'operations.create',
    'operations.read',
    'tax.calculate',
    'documents.read',
    'integrations.manage',
    'api_keys.manage',
    'webhooks.manage'
  )
where r.role_key = 'developer'
on conflict do nothing;

insert into core.role_permissions (role_id, permission_id)
select r.id, p.id
from core.roles as r
join core.permissions as p
  on p.permission_key in (
    'operations.read',
    'documents.read',
    'audit.read'
  )
where r.role_key = 'support'
on conflict do nothing;

insert into core.role_permissions (role_id, permission_id)
select r.id, p.id
from core.roles as r
join core.permissions as p
  on p.permission_key in (
    'operations.read',
    'documents.read',
    'audit.read'
  )
where r.role_key = 'auditor'
on conflict do nothing;

insert into core.role_permissions (role_id, permission_id)
select r.id, p.id
from core.roles as r
join core.permissions as p
  on p.permission_key in (
    'operations.read',
    'documents.read'
  )
where r.role_key = 'viewer'
on conflict do nothing;

comment on schema core is 'Helvok Tax private core schema: tenants, users, RBAC, organizations, establishments, fiscal identities, certificates.';
comment on schema audit is 'Helvok Tax private audit schema: append-only audit events and reliable outbox events.';
comment on table core.tenants is 'Tenant root. Every operational row belongs to a tenant unless explicitly global.';
comment on table core.tenant_environments is 'Tenant environment boundary for sandbox, homologation, and production credentials/configuration.';
comment on table core.fiscal_identities is 'Fiscal identifiers by country/type. Store encrypted value and searchable hash, never plaintext.';
comment on table core.certificates is 'Certificate metadata and storage references only; certificate bytes must stay encrypted in secure storage.';
comment on table audit.audit_events is 'Append-only audit log for sensitive actions, decisions, and compliance evidence.';
comment on table audit.outbox_events is 'Reliable event outbox for asynchronous delivery to queues, workflows, and webhooks.';

commit;
