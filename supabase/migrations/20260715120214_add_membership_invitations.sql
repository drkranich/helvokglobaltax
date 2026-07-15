-- Membership invitations.
--
-- Invitations are separate from memberships so a tenant manager can invite an
-- email before that person has a core.users row. The raw token never lives in
-- Postgres: the Worker generates it, stores only a hash, and returns the invite
-- URL once.

begin;

create table core.membership_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  invitee_email text not null,
  role_id uuid not null references core.roles (id),
  scope_type text not null default 'tenant',
  scope_id uuid,
  token_hash text not null,
  status text not null default 'pending',
  expires_at timestamptz not null,
  invited_by_user_id uuid not null references core.users (id) on delete restrict,
  accepted_by_user_id uuid references core.users (id) on delete set null,
  revoked_by_user_id uuid references core.users (id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  last_sent_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_membership_invitations_email_lower_chk
    check (invitee_email = lower(invitee_email)),
  constraint core_membership_invitations_email_format_chk
    check (invitee_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint core_membership_invitations_scope_type_chk
    check (scope_type in ('tenant', 'organization', 'establishment', 'environment')),
  constraint core_membership_invitations_scope_id_chk
    check ((scope_type = 'tenant' and scope_id is null) or (scope_type <> 'tenant' and scope_id is not null)),
  constraint core_membership_invitations_status_chk
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  constraint core_membership_invitations_token_hash_chk
    check (token_hash ~ '^[A-Za-z0-9_-]{43,128}$'),
  constraint core_membership_invitations_accepted_chk
    check ((status = 'accepted' and accepted_at is not null and accepted_by_user_id is not null) or status <> 'accepted'),
  constraint core_membership_invitations_revoked_chk
    check ((status = 'revoked' and revoked_at is not null and revoked_by_user_id is not null) or status <> 'revoked')
);

create unique index core_membership_invitations_token_hash_key
  on core.membership_invitations (token_hash);
create unique index core_membership_invitations_pending_unique
  on core.membership_invitations (
    tenant_id,
    invitee_email,
    role_id,
    scope_type,
    coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where status = 'pending';
create index core_membership_invitations_tenant_status_expires_idx
  on core.membership_invitations (tenant_id, status, expires_at);
create index core_membership_invitations_invitee_email_idx
  on core.membership_invitations (invitee_email);
create index core_membership_invitations_invited_by_user_id_idx
  on core.membership_invitations (invited_by_user_id);
create index core_membership_invitations_accepted_by_user_id_idx
  on core.membership_invitations (accepted_by_user_id);

create trigger core_membership_invitations_set_updated_at
before update on core.membership_invitations
for each row execute function core.set_updated_at();

create or replace function core.validate_membership_invitation_role_scope()
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
  where r.id = new.role_id
    and r.status = 'active';

  if not found then
    raise exception 'invitation role does not exist'
      using errcode = '23503';
  end if;

  if role_tenant_id is not null and role_tenant_id <> new.tenant_id then
    raise exception 'invitation role belongs to a different tenant'
      using errcode = '23514';
  end if;

  if new.scope_type = 'organization'
    and not exists (select 1 from core.organizations where tenant_id = new.tenant_id and id = new.scope_id)
  then
    raise exception 'organization scope not found'
      using errcode = '23503';
  end if;

  if new.scope_type = 'establishment'
    and not exists (select 1 from core.establishments where tenant_id = new.tenant_id and id = new.scope_id)
  then
    raise exception 'establishment scope not found'
      using errcode = '23503';
  end if;

  if new.scope_type = 'environment'
    and not exists (select 1 from core.tenant_environments where tenant_id = new.tenant_id and id = new.scope_id)
  then
    raise exception 'environment scope not found'
      using errcode = '23503';
  end if;

  return new;
end;
$$;

revoke execute on function core.validate_membership_invitation_role_scope() from public, anon, authenticated;
grant execute on function core.validate_membership_invitation_role_scope() to service_role;

create trigger core_membership_invitations_validate_role_scope
before insert or update of tenant_id, role_id, scope_type, scope_id on core.membership_invitations
for each row execute function core.validate_membership_invitation_role_scope();

alter table core.membership_invitations enable row level security;
alter table core.membership_invitations force row level security;

grant all on core.membership_invitations to service_role;

create or replace function core.membership_invitation_json(
  invitation core.membership_invitations,
  role_record core.roles
)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, core, pg_temp
as $$
  select jsonb_build_object(
    'id', invitation.id,
    'tenant_id', invitation.tenant_id,
    'email', invitation.invitee_email,
    'scope_type', invitation.scope_type,
    'scope_id', invitation.scope_id,
    'status', invitation.status,
    'expires_at', invitation.expires_at,
    'accepted_at', invitation.accepted_at,
    'revoked_at', invitation.revoked_at,
    'last_sent_at', invitation.last_sent_at,
    'created_at', invitation.created_at,
    'updated_at', invitation.updated_at,
    'role', jsonb_build_object(
      'id', role_record.id,
      'role_key', role_record.role_key,
      'name', role_record.name,
      'is_system', role_record.is_system
    )
  )
$$;

create or replace function core.write_membership_invitation_events(
  p_tenant_id uuid,
  p_actor_user_id uuid,
  p_event_type text,
  p_invitation core.membership_invitations,
  p_role core.roles
)
returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, pg_temp
as $$
begin
  insert into audit.audit_events (
    tenant_id,
    actor_type,
    actor_id,
    event_type,
    resource_type,
    resource_id,
    metadata,
    after_snapshot
  )
  values (
    p_tenant_id,
    'user',
    p_actor_user_id,
    p_event_type,
    'core.membership_invitation',
    p_invitation.id,
    jsonb_build_object(
      'source', 'membership_invitation_workflow',
      'role_key', p_role.role_key,
      'invitee_email', p_invitation.invitee_email,
      'status', p_invitation.status
    ),
    core.membership_invitation_json(p_invitation, p_role)
  );

  insert into audit.outbox_events (
    tenant_id,
    event_type,
    aggregate_type,
    aggregate_id,
    payload
  )
  values (
    p_tenant_id,
    p_event_type,
    'core.membership_invitation',
    p_invitation.id,
    jsonb_build_object(
      'tenant_id', p_tenant_id,
      'invitation_id', p_invitation.id,
      'email', p_invitation.invitee_email,
      'role_key', p_role.role_key,
      'scope_type', p_invitation.scope_type,
      'scope_id', p_invitation.scope_id,
      'status', p_invitation.status,
      'expires_at', p_invitation.expires_at
    )
  );
end;
$$;

create or replace function core.get_current_active_user()
returns core.users
language plpgsql
stable
security definer
set search_path = pg_catalog, core, auth, pg_temp
as $$
declare
  v_user core.users%rowtype;
begin
  select *
  into v_user
  from core.users
  where auth_user_id = (select auth.uid())
    and status = 'active'
  limit 1;

  if not found then
    raise exception 'authenticated core user is required'
      using errcode = '28000';
  end if;

  return v_user;
end;
$$;

create or replace function core.find_active_role_for_tenant(p_tenant_id uuid, p_role_key text)
returns core.roles
language plpgsql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
declare
  v_role core.roles%rowtype;
begin
  select *
  into v_role
  from core.roles
  where role_key = lower(p_role_key)
    and status = 'active'
    and (tenant_id is null or tenant_id = p_tenant_id)
  order by (tenant_id is null) asc
  limit 1;

  if not found then
    raise exception 'role not found for tenant'
      using errcode = '22023';
  end if;

  return v_role;
end;
$$;

create or replace function core.normalize_invitation_expires_at(raw_expires_at text)
returns timestamptz
language plpgsql
stable
security invoker
set search_path = pg_catalog, pg_temp
as $$
declare
  v_expires_at timestamptz := coalesce(nullif(raw_expires_at, '')::timestamptz, now() + interval '7 days');
begin
  if v_expires_at <= now() + interval '15 minutes' then
    raise exception 'invitation expiration must be at least 15 minutes in the future'
      using errcode = '22023';
  end if;

  if v_expires_at > now() + interval '30 days' then
    raise exception 'invitation expiration cannot be more than 30 days in the future'
      using errcode = '22023';
  end if;

  return v_expires_at;
end;
$$;

revoke execute on function core.membership_invitation_json(core.membership_invitations, core.roles) from public, anon;
revoke execute on function core.write_membership_invitation_events(uuid, uuid, text, core.membership_invitations, core.roles) from public, anon, authenticated;
revoke execute on function core.get_current_active_user() from public, anon;
revoke execute on function core.find_active_role_for_tenant(uuid, text) from public, anon;
revoke execute on function core.normalize_invitation_expires_at(text) from public, anon;
grant execute on function core.membership_invitation_json(core.membership_invitations, core.roles) to authenticated, service_role;
grant execute on function core.write_membership_invitation_events(uuid, uuid, text, core.membership_invitations, core.roles) to service_role;
grant execute on function core.get_current_active_user() to authenticated, service_role;
grant execute on function core.find_active_role_for_tenant(uuid, text) to authenticated, service_role;
grant execute on function core.normalize_invitation_expires_at(text) to authenticated, service_role;

create or replace function core.create_membership_invitation_as_current_user(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_tenant_id uuid := nullif(payload->>'tenant_id', '')::uuid;
  v_email text := lower(nullif(trim(coalesce(payload->>'email', '')), ''));
  v_role_key text := lower(coalesce(nullif(trim(coalesce(payload->>'role_key', '')), ''), 'viewer'));
  v_scope_type text := lower(coalesce(nullif(trim(coalesce(payload->>'scope_type', '')), ''), 'tenant'));
  v_scope_id uuid := nullif(payload->>'scope_id', '')::uuid;
  v_token_hash text := nullif(trim(coalesce(payload->>'token_hash', '')), '');
  v_expires_at timestamptz := core.normalize_invitation_expires_at(payload->>'expires_at');
  v_actor core.users%rowtype;
  v_role core.roles%rowtype;
  v_invitation core.membership_invitations%rowtype;
  v_event_type text := 'invitation.created';
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'payload must be a JSON object'
      using errcode = '22023';
  end if;

  v_actor := core.get_current_active_user();

  if v_tenant_id is null then
    raise exception 'tenant_id is required'
      using errcode = '22023';
  end if;

  if not core.user_has_permission(v_tenant_id, 'members.manage') then
    raise exception 'members.manage permission is required'
      using errcode = '42501';
  end if;

  if v_email is null or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'email must be valid'
      using errcode = '22023';
  end if;

  if v_token_hash is null or v_token_hash !~ '^[A-Za-z0-9_-]{43,128}$' then
    raise exception 'token_hash must be a base64url SHA token hash'
      using errcode = '22023';
  end if;

  if v_scope_type not in ('tenant', 'organization', 'establishment', 'environment') then
    raise exception 'invalid invitation scope_type'
      using errcode = '22023';
  end if;

  if v_scope_type = 'tenant' and v_scope_id is not null then
    raise exception 'tenant scoped invitation must not include scope_id'
      using errcode = '22023';
  end if;

  if v_scope_type <> 'tenant' and v_scope_id is null then
    raise exception 'non-tenant scoped invitation requires scope_id'
      using errcode = '22023';
  end if;

  v_role := core.find_active_role_for_tenant(v_tenant_id, v_role_key);

  if v_role.role_key = 'owner' and not core.current_user_is_tenant_owner(v_tenant_id) then
    raise exception 'only an owner can invite owner memberships'
      using errcode = '42501';
  end if;

  select *
  into v_invitation
  from core.membership_invitations
  where tenant_id = v_tenant_id
    and invitee_email = v_email
    and role_id = v_role.id
    and scope_type = v_scope_type
    and coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = coalesce(v_scope_id, '00000000-0000-0000-0000-000000000000'::uuid)
    and status = 'pending'
  limit 1;

  if found then
    update core.membership_invitations
    set token_hash = v_token_hash,
        expires_at = v_expires_at,
        invited_by_user_id = v_actor.id,
        last_sent_at = now(),
        metadata = metadata || jsonb_build_object('resent_at', now())
    where id = v_invitation.id
    returning * into v_invitation;

    v_event_type := 'invitation.resent';
  else
    insert into core.membership_invitations (
      tenant_id,
      invitee_email,
      role_id,
      scope_type,
      scope_id,
      token_hash,
      expires_at,
      invited_by_user_id,
      metadata
    )
    values (
      v_tenant_id,
      v_email,
      v_role.id,
      v_scope_type,
      v_scope_id,
      v_token_hash,
      v_expires_at,
      v_actor.id,
      jsonb_build_object('source', 'helvok_current_create_membership_invitation')
    )
    returning * into v_invitation;
  end if;

  perform core.write_membership_invitation_events(v_tenant_id, v_actor.id, v_event_type, v_invitation, v_role);

  return jsonb_build_object(
    'event_type', v_event_type,
    'invitation', core.membership_invitation_json(v_invitation, v_role),
    'access', core.get_tenant_access(v_tenant_id)
  );
end;
$$;

create or replace function core.rotate_membership_invitation_as_current_user(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_invitation_id uuid := nullif(payload->>'invitation_id', '')::uuid;
  v_token_hash text := nullif(trim(coalesce(payload->>'token_hash', '')), '');
  v_expires_at timestamptz := core.normalize_invitation_expires_at(payload->>'expires_at');
  v_actor core.users%rowtype;
  v_invitation core.membership_invitations%rowtype;
  v_role core.roles%rowtype;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'payload must be a JSON object'
      using errcode = '22023';
  end if;

  v_actor := core.get_current_active_user();

  if v_invitation_id is null then
    raise exception 'invitation_id is required'
      using errcode = '22023';
  end if;

  if v_token_hash is null or v_token_hash !~ '^[A-Za-z0-9_-]{43,128}$' then
    raise exception 'token_hash must be a base64url SHA token hash'
      using errcode = '22023';
  end if;

  select *
  into v_invitation
  from core.membership_invitations
  where id = v_invitation_id
    and status = 'pending'
  limit 1;

  if not found then
    raise exception 'pending invitation not found'
      using errcode = '22023';
  end if;

  if not core.user_has_permission(v_invitation.tenant_id, 'members.manage') then
    raise exception 'members.manage permission is required'
      using errcode = '42501';
  end if;

  select * into v_role from core.roles where id = v_invitation.role_id;

  if v_role.role_key = 'owner' and not core.current_user_is_tenant_owner(v_invitation.tenant_id) then
    raise exception 'only an owner can resend owner invitations'
      using errcode = '42501';
  end if;

  update core.membership_invitations
  set token_hash = v_token_hash,
      expires_at = v_expires_at,
      invited_by_user_id = v_actor.id,
      last_sent_at = now(),
      metadata = metadata || jsonb_build_object('resent_at', now())
  where id = v_invitation.id
  returning * into v_invitation;

  perform core.write_membership_invitation_events(v_invitation.tenant_id, v_actor.id, 'invitation.resent', v_invitation, v_role);

  return jsonb_build_object(
    'event_type', 'invitation.resent',
    'invitation', core.membership_invitation_json(v_invitation, v_role),
    'access', core.get_tenant_access(v_invitation.tenant_id)
  );
end;
$$;

create or replace function core.revoke_membership_invitation_as_current_user(p_invitation_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_actor core.users%rowtype;
  v_invitation core.membership_invitations%rowtype;
  v_role core.roles%rowtype;
begin
  v_actor := core.get_current_active_user();

  select *
  into v_invitation
  from core.membership_invitations
  where id = p_invitation_id
    and status = 'pending'
  limit 1;

  if not found then
    raise exception 'pending invitation not found'
      using errcode = '22023';
  end if;

  if not core.user_has_permission(v_invitation.tenant_id, 'members.manage') then
    raise exception 'members.manage permission is required'
      using errcode = '42501';
  end if;

  select * into v_role from core.roles where id = v_invitation.role_id;

  if v_role.role_key = 'owner' and not core.current_user_is_tenant_owner(v_invitation.tenant_id) then
    raise exception 'only an owner can revoke owner invitations'
      using errcode = '42501';
  end if;

  update core.membership_invitations
  set status = 'revoked',
      revoked_at = now(),
      revoked_by_user_id = v_actor.id
  where id = v_invitation.id
  returning * into v_invitation;

  perform core.write_membership_invitation_events(v_invitation.tenant_id, v_actor.id, 'invitation.revoked', v_invitation, v_role);

  return jsonb_build_object(
    'event_type', 'invitation.revoked',
    'invitation', core.membership_invitation_json(v_invitation, v_role),
    'access', core.get_tenant_access(v_invitation.tenant_id)
  );
end;
$$;

create or replace function core.accept_membership_invitation_as_current_user(p_token_hash text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_actor core.users%rowtype;
  v_invitation core.membership_invitations%rowtype;
  v_role core.roles%rowtype;
  v_membership core.memberships%rowtype;
  v_existing core.memberships%rowtype;
  v_membership_event_type text;
begin
  v_actor := core.get_current_active_user();

  if p_token_hash is null or p_token_hash !~ '^[A-Za-z0-9_-]{43,128}$' then
    raise exception 'invalid invitation token'
      using errcode = '22023';
  end if;

  select *
  into v_invitation
  from core.membership_invitations
  where token_hash = p_token_hash
    and status = 'pending'
  limit 1;

  if not found then
    raise exception 'invitation not found or already used'
      using errcode = '22023';
  end if;

  select * into v_role from core.roles where id = v_invitation.role_id and status = 'active';

  if not found then
    raise exception 'invitation role is not active'
      using errcode = '22023';
  end if;

  if v_invitation.expires_at <= now() then
    update core.membership_invitations
    set status = 'expired'
    where id = v_invitation.id
    returning * into v_invitation;

    perform core.write_membership_invitation_events(
      v_invitation.tenant_id,
      v_actor.id,
      'invitation.expired',
      v_invitation,
      v_role
    );

    raise exception 'invitation expired'
      using errcode = '22023';
  end if;

  if v_invitation.invitee_email <> v_actor.email then
    raise exception 'invitation belongs to another email'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from core.tenants
    where id = v_invitation.tenant_id
      and status in ('trial', 'active')
  ) then
    raise exception 'tenant not found or inactive'
      using errcode = '22023';
  end if;

  select *
  into v_existing
  from core.memberships
  where tenant_id = v_invitation.tenant_id
    and user_id = v_actor.id
    and role_id = v_invitation.role_id
    and scope_type = v_invitation.scope_type
    and coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = coalesce(v_invitation.scope_id, '00000000-0000-0000-0000-000000000000'::uuid)
  limit 1;

  if found then
    update core.memberships
    set status = 'active',
        invited_email = v_invitation.invitee_email,
        invited_by_user_id = v_invitation.invited_by_user_id
    where id = v_existing.id
    returning * into v_membership;

    v_membership_event_type := 'membership.updated';
  else
    insert into core.memberships (
      tenant_id,
      user_id,
      role_id,
      scope_type,
      scope_id,
      status,
      invited_email,
      invited_by_user_id
    )
    values (
      v_invitation.tenant_id,
      v_actor.id,
      v_invitation.role_id,
      v_invitation.scope_type,
      v_invitation.scope_id,
      'active',
      v_invitation.invitee_email,
      v_invitation.invited_by_user_id
    )
    returning * into v_membership;

    v_membership_event_type := 'membership.created';
  end if;

  update core.membership_invitations
  set status = 'accepted',
      accepted_at = now(),
      accepted_by_user_id = v_actor.id
  where id = v_invitation.id
  returning * into v_invitation;

  insert into audit.audit_events (
    tenant_id,
    actor_type,
    actor_id,
    event_type,
    resource_type,
    resource_id,
    metadata,
    after_snapshot
  )
  values (
    v_invitation.tenant_id,
    'user',
    v_actor.id,
    v_membership_event_type,
    'core.membership',
    v_membership.id,
    jsonb_build_object(
      'source', 'helvok_current_accept_membership_invitation',
      'invitation_id', v_invitation.id,
      'role_key', v_role.role_key,
      'user_email', v_actor.email
    ),
    to_jsonb(v_membership)
  );

  insert into audit.outbox_events (
    tenant_id,
    event_type,
    aggregate_type,
    aggregate_id,
    payload
  )
  values (
    v_invitation.tenant_id,
    v_membership_event_type,
    'core.membership',
    v_membership.id,
    jsonb_build_object(
      'tenant_id', v_invitation.tenant_id,
      'membership_id', v_membership.id,
      'invitation_id', v_invitation.id,
      'user_id', v_actor.id,
      'user_email', v_actor.email,
      'role_key', v_role.role_key,
      'scope_type', v_membership.scope_type,
      'scope_id', v_membership.scope_id,
      'status', v_membership.status
    )
  );

  perform core.write_membership_invitation_events(
    v_invitation.tenant_id,
    v_actor.id,
    'invitation.accepted',
    v_invitation,
    v_role
  );

  return jsonb_build_object(
    'event_type', 'invitation.accepted',
    'membership_event_type', v_membership_event_type,
    'invitation', core.membership_invitation_json(v_invitation, v_role),
    'membership', jsonb_build_object(
      'id', v_membership.id,
      'tenant_id', v_membership.tenant_id,
      'scope_type', v_membership.scope_type,
      'scope_id', v_membership.scope_id,
      'status', v_membership.status,
      'invited_email', v_membership.invited_email,
      'created_at', v_membership.created_at,
      'updated_at', v_membership.updated_at,
      'user', jsonb_build_object(
        'id', v_actor.id,
        'email', v_actor.email,
        'full_name', v_actor.full_name,
        'status', v_actor.status
      ),
      'role', jsonb_build_object(
        'id', v_role.id,
        'role_key', v_role.role_key,
        'name', v_role.name,
        'is_system', v_role.is_system
      )
    )
  );
end;
$$;

revoke execute on function core.create_membership_invitation_as_current_user(jsonb) from public, anon;
revoke execute on function core.rotate_membership_invitation_as_current_user(jsonb) from public, anon;
revoke execute on function core.revoke_membership_invitation_as_current_user(uuid) from public, anon;
revoke execute on function core.accept_membership_invitation_as_current_user(text) from public, anon;
grant execute on function core.create_membership_invitation_as_current_user(jsonb) to authenticated, service_role;
grant execute on function core.rotate_membership_invitation_as_current_user(jsonb) to authenticated, service_role;
grant execute on function core.revoke_membership_invitation_as_current_user(uuid) to authenticated, service_role;
grant execute on function core.accept_membership_invitation_as_current_user(text) to authenticated, service_role;

create or replace function core.get_tenant_access(p_tenant_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_actor_user_id uuid;
  v_access jsonb;
begin
  select u.id
  into v_actor_user_id
  from core.users as u
  where u.auth_user_id = (select auth.uid())
    and u.status = 'active'
  limit 1;

  if v_actor_user_id is null then
    raise exception 'authenticated core user is required'
      using errcode = '28000';
  end if;

  if not core.user_has_permission(p_tenant_id, 'members.manage') then
    raise exception 'members.manage permission is required'
      using errcode = '42501';
  end if;

  select jsonb_build_object(
    'tenant', jsonb_build_object(
      'id', t.id,
      'slug', t.slug,
      'legal_name', t.legal_name,
      'display_name', t.display_name,
      'status', t.status,
      'default_locale', t.default_locale
    ),
    'actor', jsonb_build_object(
      'user_id', v_actor_user_id,
      'is_owner', core.current_user_is_tenant_owner(p_tenant_id),
      'can_manage_members', true
    ),
    'memberships', coalesce(members.memberships, '[]'::jsonb),
    'roles', coalesce(roles.roles, '[]'::jsonb),
    'invitations', coalesce(invitations.invitations, '[]'::jsonb),
    'audit_events', coalesce(events.audit_events, '[]'::jsonb),
    'counts', jsonb_build_object(
      'memberships', coalesce(members.membership_count, 0),
      'active_memberships', coalesce(members.active_membership_count, 0),
      'roles', coalesce(roles.role_count, 0),
      'invitations', coalesce(invitations.invitation_count, 0),
      'pending_invitations', coalesce(invitations.pending_invitation_count, 0),
      'audit_events', coalesce(events.audit_event_count, 0)
    ),
    'generated_at', now()
  )
  into v_access
  from core.tenants as t
  left join lateral (
    select
      count(*)::integer as membership_count,
      count(*) filter (where m.status = 'active')::integer as active_membership_count,
      jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'status', m.status,
          'scope_type', m.scope_type,
          'scope_id', m.scope_id,
          'invited_email', m.invited_email,
          'created_at', m.created_at,
          'updated_at', m.updated_at,
          'user', jsonb_build_object(
            'id', u.id,
            'email', u.email,
            'full_name', u.full_name,
            'status', u.status
          ),
          'role', jsonb_build_object(
            'id', r.id,
            'role_key', r.role_key,
            'name', r.name,
            'description', r.description,
            'is_system', r.is_system,
            'status', r.status
          ),
          'permission_count', coalesce(perms.permission_count, 0)
        )
        order by
          case when r.role_key = 'owner' then 0 else 1 end,
          m.created_at asc
      ) as memberships
    from core.memberships as m
    join core.users as u on u.id = m.user_id
    join core.roles as r on r.id = m.role_id
    left join lateral (
      select count(*)::integer as permission_count
      from core.role_permissions as rp
      where rp.role_id = r.id
    ) as perms on true
    where m.tenant_id = t.id
  ) as members on true
  left join lateral (
    select
      count(*)::integer as role_count,
      jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'role_key', r.role_key,
          'name', r.name,
          'description', r.description,
          'is_system', r.is_system,
          'status', r.status,
          'permission_count', coalesce(perms.permission_count, 0),
          'permissions', coalesce(perms.permissions, '[]'::jsonb)
        )
        order by
          case r.role_key
            when 'owner' then 0
            when 'admin' then 1
            when 'fiscal_manager' then 2
            when 'accountant' then 3
            when 'developer' then 4
            when 'auditor' then 5
            when 'viewer' then 6
            else 7
          end,
          r.role_key
      ) as roles
    from core.roles as r
    left join lateral (
      select
        count(*)::integer as permission_count,
        jsonb_agg(
          jsonb_build_object(
            'permission_key', p.permission_key,
            'resource', p.resource,
            'action', p.action
          )
          order by p.permission_key
        ) as permissions
      from core.role_permissions as rp
      join core.permissions as p on p.id = rp.permission_id
      where rp.role_id = r.id
    ) as perms on true
    where r.status = 'active'
      and (r.tenant_id is null or r.tenant_id = t.id)
  ) as roles on true
  left join lateral (
    select
      count(*)::integer as invitation_count,
      count(*) filter (where i.status = 'pending')::integer as pending_invitation_count,
      jsonb_agg(
        core.membership_invitation_json(i, r)
        order by
          case i.status
            when 'pending' then 0
            when 'accepted' then 1
            when 'expired' then 2
            else 3
          end,
          i.expires_at asc
      ) as invitations
    from core.membership_invitations as i
    join core.roles as r on r.id = i.role_id
    where i.tenant_id = t.id
  ) as invitations on true
  left join lateral (
    select
      count(*)::integer as audit_event_count,
      jsonb_agg(
        jsonb_build_object(
          'id', ae.id,
          'event_type', ae.event_type,
          'resource_type', ae.resource_type,
          'resource_id', ae.resource_id,
          'actor_type', ae.actor_type,
          'actor_id', ae.actor_id,
          'created_at', ae.created_at,
          'metadata', ae.metadata
        )
        order by ae.created_at desc
      ) as audit_events
    from (
      select *
      from audit.audit_events
      where tenant_id = t.id
        and event_type in (
          'membership.created',
          'membership.updated',
          'membership.revoked',
          'invitation.created',
          'invitation.resent',
          'invitation.revoked',
          'invitation.accepted',
          'invitation.expired'
        )
      order by created_at desc
      limit 20
    ) as ae
  ) as events on true
  where t.id = p_tenant_id
    and t.status in ('trial', 'active');

  if v_access is null then
    raise exception 'tenant not found or inactive'
      using errcode = '22023';
  end if;

  return v_access;
end;
$$;

create or replace function public.helvok_current_create_membership_invitation(payload jsonb)
returns jsonb
language sql
volatile
security invoker
set search_path = pg_catalog, core, public, pg_temp
as $$
  select core.create_membership_invitation_as_current_user(payload)
$$;

create or replace function public.helvok_current_rotate_membership_invitation(payload jsonb)
returns jsonb
language sql
volatile
security invoker
set search_path = pg_catalog, core, public, pg_temp
as $$
  select core.rotate_membership_invitation_as_current_user(payload)
$$;

create or replace function public.helvok_current_revoke_membership_invitation(p_invitation_id uuid)
returns jsonb
language sql
volatile
security invoker
set search_path = pg_catalog, core, public, pg_temp
as $$
  select core.revoke_membership_invitation_as_current_user(p_invitation_id)
$$;

create or replace function public.helvok_current_accept_membership_invitation(p_token_hash text)
returns jsonb
language sql
volatile
security invoker
set search_path = pg_catalog, core, public, pg_temp
as $$
  select core.accept_membership_invitation_as_current_user(p_token_hash)
$$;

revoke all on function public.helvok_current_create_membership_invitation(jsonb) from public, anon;
revoke all on function public.helvok_current_rotate_membership_invitation(jsonb) from public, anon;
revoke all on function public.helvok_current_revoke_membership_invitation(uuid) from public, anon;
revoke all on function public.helvok_current_accept_membership_invitation(text) from public, anon;
grant execute on function public.helvok_current_create_membership_invitation(jsonb) to authenticated, service_role;
grant execute on function public.helvok_current_rotate_membership_invitation(jsonb) to authenticated, service_role;
grant execute on function public.helvok_current_revoke_membership_invitation(uuid) to authenticated, service_role;
grant execute on function public.helvok_current_accept_membership_invitation(text) to authenticated, service_role;

comment on table core.membership_invitations is
  'Time-bound membership invitations. Raw invite tokens are generated by the Worker and only token_hash is persisted.';
comment on function public.helvok_current_create_membership_invitation(jsonb) is
  'Authenticated tenant manager invitation creation guarded by members.manage.';
comment on function public.helvok_current_rotate_membership_invitation(jsonb) is
  'Authenticated invitation resend/link rotation guarded by members.manage.';
comment on function public.helvok_current_revoke_membership_invitation(uuid) is
  'Authenticated invitation revocation guarded by members.manage.';
comment on function public.helvok_current_accept_membership_invitation(text) is
  'Authenticated invitation acceptance by token hash and matching email.';

commit;
