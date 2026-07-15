-- Administrative membership RPC boundary.
--
-- These functions are exposed through the public Data API schema only so the
-- Cloudflare Worker can call them with the Supabase service role. Browser users
-- must never receive direct EXECUTE permission for these functions.

begin;

create or replace function public.helvok_admin_list_memberships(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, audit, public, pg_temp
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'tenant_id', m.tenant_id,
        'scope_type', m.scope_type,
        'scope_id', m.scope_id,
        'status', m.status,
        'invited_email', m.invited_email,
        'created_at', m.created_at,
        'updated_at', m.updated_at,
        'user', jsonb_build_object(
          'id', u.id,
          'auth_user_id', u.auth_user_id,
          'email', u.email,
          'full_name', u.full_name,
          'status', u.status
        ),
        'role', jsonb_build_object(
          'id', r.id,
          'role_key', r.role_key,
          'name', r.name,
          'is_system', r.is_system,
          'status', r.status
        ),
        'permissions', coalesce(perms.permissions, '[]'::jsonb)
      )
      order by m.created_at desc
    ),
    '[]'::jsonb
  )
  from core.memberships as m
  join core.users as u on u.id = m.user_id
  join core.roles as r on r.id = m.role_id
  left join lateral (
    select jsonb_agg(
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
  where m.tenant_id = p_tenant_id;
$$;

create or replace function public.helvok_admin_upsert_membership(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, public, pg_temp
as $$
declare
  v_tenant_id uuid := nullif(payload->>'tenant_id', '')::uuid;
  v_user_id uuid := nullif(payload->>'user_id', '')::uuid;
  v_auth_user_id uuid := nullif(payload->>'auth_user_id', '')::uuid;
  v_email text := lower(nullif(trim(coalesce(payload->>'email', '')), ''));
  v_role_key text := lower(coalesce(nullif(trim(coalesce(payload->>'role_key', '')), ''), 'owner'));
  v_scope_type text := lower(coalesce(nullif(trim(coalesce(payload->>'scope_type', '')), ''), 'tenant'));
  v_scope_id uuid := nullif(payload->>'scope_id', '')::uuid;
  v_status text := lower(coalesce(nullif(trim(coalesce(payload->>'status', '')), ''), 'active'));
  v_user core.users%rowtype;
  v_role core.roles%rowtype;
  v_existing core.memberships%rowtype;
  v_membership core.memberships%rowtype;
  v_event_type text;
begin
  if jsonb_typeof(payload) <> 'object' then
    raise exception 'payload must be a JSON object'
      using errcode = '22023';
  end if;

  if v_tenant_id is null then
    raise exception 'tenant_id is required'
      using errcode = '22023';
  end if;

  if not exists (select 1 from core.tenants where id = v_tenant_id) then
    raise exception 'tenant not found'
      using errcode = '22023';
  end if;

  if v_user_id is null and v_auth_user_id is null and v_email is null then
    raise exception 'user_id, auth_user_id, or email is required'
      using errcode = '22023';
  end if;

  if v_status not in ('invited', 'active', 'disabled', 'revoked') then
    raise exception 'invalid membership status'
      using errcode = '22023';
  end if;

  if v_scope_type not in ('tenant', 'organization', 'establishment', 'environment') then
    raise exception 'invalid membership scope_type'
      using errcode = '22023';
  end if;

  if v_scope_type = 'tenant' and v_scope_id is not null then
    raise exception 'tenant scoped membership must not include scope_id'
      using errcode = '22023';
  end if;

  if v_scope_type <> 'tenant' and v_scope_id is null then
    raise exception 'non-tenant scoped membership requires scope_id'
      using errcode = '22023';
  end if;

  if v_scope_type = 'organization'
    and not exists (
      select 1
      from core.organizations
      where tenant_id = v_tenant_id
        and id = v_scope_id
    )
  then
    raise exception 'organization scope not found'
      using errcode = '22023';
  end if;

  if v_scope_type = 'establishment'
    and not exists (
      select 1
      from core.establishments
      where tenant_id = v_tenant_id
        and id = v_scope_id
    )
  then
    raise exception 'establishment scope not found'
      using errcode = '22023';
  end if;

  if v_scope_type = 'environment'
    and not exists (
      select 1
      from core.tenant_environments
      where tenant_id = v_tenant_id
        and id = v_scope_id
    )
  then
    raise exception 'environment scope not found'
      using errcode = '22023';
  end if;

  if v_user_id is not null then
    select *
    into v_user
    from core.users
    where id = v_user_id;
  elsif v_auth_user_id is not null then
    select *
    into v_user
    from core.users
    where auth_user_id = v_auth_user_id;
  else
    select *
    into v_user
    from core.users
    where email = v_email;
  end if;

  if not found then
    raise exception 'user not found; sign in and sync before assigning a membership'
      using errcode = '22023';
  end if;

  select *
  into v_role
  from core.roles
  where role_key = v_role_key
    and status = 'active'
    and (tenant_id is null or tenant_id = v_tenant_id)
  order by (tenant_id is null) asc
  limit 1;

  if not found then
    raise exception 'role not found for tenant'
      using errcode = '22023';
  end if;

  select *
  into v_existing
  from core.memberships
  where tenant_id = v_tenant_id
    and user_id = v_user.id
    and role_id = v_role.id
    and scope_type = v_scope_type
    and coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = coalesce(v_scope_id, '00000000-0000-0000-0000-000000000000'::uuid)
  limit 1;

  if found then
    update core.memberships
    set status = v_status,
        invited_email = coalesce(v_email, v_user.email),
        updated_at = now()
    where id = v_existing.id
    returning * into v_membership;

    v_event_type := 'membership.updated';
  else
    insert into core.memberships (
      tenant_id,
      user_id,
      role_id,
      scope_type,
      scope_id,
      status,
      invited_email
    )
    values (
      v_tenant_id,
      v_user.id,
      v_role.id,
      v_scope_type,
      v_scope_id,
      v_status,
      coalesce(v_email, v_user.email)
    )
    returning * into v_membership;

    v_event_type := 'membership.created';
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
    v_event_type,
    'core.membership',
    v_membership.id,
    jsonb_build_object(
      'source', 'helvok_admin_upsert_membership',
      'role_key', v_role.role_key,
      'user_email', v_user.email
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
    v_tenant_id,
    v_event_type,
    'core.membership',
    v_membership.id,
    jsonb_build_object(
      'tenant_id', v_tenant_id,
      'membership_id', v_membership.id,
      'user_id', v_user.id,
      'user_email', v_user.email,
      'role_key', v_role.role_key,
      'scope_type', v_membership.scope_type,
      'scope_id', v_membership.scope_id,
      'status', v_membership.status
    )
  );

  return jsonb_build_object(
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
        'id', v_user.id,
        'auth_user_id', v_user.auth_user_id,
        'email', v_user.email,
        'full_name', v_user.full_name,
        'status', v_user.status
      ),
      'role', jsonb_build_object(
        'id', v_role.id,
        'role_key', v_role.role_key,
        'name', v_role.name,
        'is_system', v_role.is_system
      )
    ),
    'event_type', v_event_type
  );
end;
$$;

revoke all on function public.helvok_admin_list_memberships(uuid) from public, anon, authenticated;
revoke all on function public.helvok_admin_upsert_membership(jsonb) from public, anon, authenticated;

grant execute on function public.helvok_admin_list_memberships(uuid) to service_role;
grant execute on function public.helvok_admin_upsert_membership(jsonb) to service_role;

comment on function public.helvok_admin_list_memberships(uuid) is
  'Service-role RPC used by the Cloudflare Worker admin API to list tenant memberships.';
comment on function public.helvok_admin_upsert_membership(jsonb) is
  'Service-role RPC used by the Cloudflare Worker admin API to grant or update tenant memberships.';

commit;
