-- Authenticated tenant access management.
--
-- Public wrappers remain SECURITY INVOKER for the Data API. Privileged reads and
-- writes live in the private core schema and always check auth.uid() plus the
-- members.manage permission before returning tenant-wide membership data.

begin;

create or replace function core.user_has_permission(check_tenant_id uuid, check_permission_key text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, core, auth, pg_temp
as $$
  select exists (
    select 1
    from core.memberships as m
    join core.users as u on u.id = m.user_id
    join core.roles as r on r.id = m.role_id
    join core.role_permissions as rp on rp.role_id = r.id
    join core.permissions as p on p.id = rp.permission_id
    join core.tenants as t on t.id = m.tenant_id
    where m.tenant_id = check_tenant_id
      and m.status = 'active'
      and u.status = 'active'
      and r.status = 'active'
      and t.status in ('trial', 'active')
      and u.auth_user_id = (select auth.uid())
      and p.permission_key = check_permission_key
  )
$$;

create or replace function core.current_user_is_tenant_owner(check_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, core, auth, pg_temp
as $$
  select exists (
    select 1
    from core.memberships as m
    join core.users as u on u.id = m.user_id
    join core.roles as r on r.id = m.role_id
    join core.tenants as t on t.id = m.tenant_id
    where m.tenant_id = check_tenant_id
      and m.status = 'active'
      and u.status = 'active'
      and r.status = 'active'
      and r.role_key = 'owner'
      and t.status in ('trial', 'active')
      and u.auth_user_id = (select auth.uid())
  )
$$;

revoke execute on function core.user_has_permission(uuid, text) from public, anon;
revoke execute on function core.current_user_is_tenant_owner(uuid) from public, anon;
grant execute on function core.user_has_permission(uuid, text) to authenticated, service_role;
grant execute on function core.current_user_is_tenant_owner(uuid) to authenticated, service_role;

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
    'audit_events', coalesce(events.audit_events, '[]'::jsonb),
    'counts', jsonb_build_object(
      'memberships', coalesce(members.membership_count, 0),
      'active_memberships', coalesce(members.active_membership_count, 0),
      'roles', coalesce(roles.role_count, 0),
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
        and event_type in ('membership.created', 'membership.updated', 'membership.revoked')
      order by created_at desc
      limit 16
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

create or replace function core.upsert_membership_as_current_user(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_tenant_id uuid := nullif(payload->>'tenant_id', '')::uuid;
  v_user_id uuid := nullif(payload->>'user_id', '')::uuid;
  v_auth_user_id uuid := nullif(payload->>'auth_user_id', '')::uuid;
  v_email text := lower(nullif(trim(coalesce(payload->>'email', '')), ''));
  v_role_key text := lower(coalesce(nullif(trim(coalesce(payload->>'role_key', '')), ''), 'viewer'));
  v_scope_type text := lower(coalesce(nullif(trim(coalesce(payload->>'scope_type', '')), ''), 'tenant'));
  v_scope_id uuid := nullif(payload->>'scope_id', '')::uuid;
  v_status text := lower(coalesce(nullif(trim(coalesce(payload->>'status', '')), ''), 'active'));
  v_actor_user_id uuid;
  v_actor_is_owner boolean;
  v_user core.users%rowtype;
  v_role core.roles%rowtype;
  v_existing core.memberships%rowtype;
  v_membership core.memberships%rowtype;
  v_event_type text;
  v_other_active_owner_count integer;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'payload must be a JSON object'
      using errcode = '22023';
  end if;

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

  if v_tenant_id is null then
    raise exception 'tenant_id is required'
      using errcode = '22023';
  end if;

  if not core.user_has_permission(v_tenant_id, 'members.manage') then
    raise exception 'members.manage permission is required'
      using errcode = '42501';
  end if;

  v_actor_is_owner := core.current_user_is_tenant_owner(v_tenant_id);

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
    and not exists (select 1 from core.organizations where tenant_id = v_tenant_id and id = v_scope_id)
  then
    raise exception 'organization scope not found'
      using errcode = '22023';
  end if;

  if v_scope_type = 'establishment'
    and not exists (select 1 from core.establishments where tenant_id = v_tenant_id and id = v_scope_id)
  then
    raise exception 'establishment scope not found'
      using errcode = '22023';
  end if;

  if v_scope_type = 'environment'
    and not exists (select 1 from core.tenant_environments where tenant_id = v_tenant_id and id = v_scope_id)
  then
    raise exception 'environment scope not found'
      using errcode = '22023';
  end if;

  if v_user_id is not null then
    select * into v_user from core.users where id = v_user_id;
  elsif v_auth_user_id is not null then
    select * into v_user from core.users where auth_user_id = v_auth_user_id;
  else
    select * into v_user from core.users where email = v_email;
  end if;

  if not found then
    raise exception 'user not found; ask the user to sign in once before assigning a membership'
      using errcode = '22023';
  end if;

  if v_user.status <> 'active' then
    raise exception 'target user is not active'
      using errcode = '22023';
  end if;

  if v_user.id = v_actor_user_id and v_status in ('disabled', 'revoked') then
    raise exception 'you cannot disable or revoke your own membership'
      using errcode = '42501';
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

  if v_role.role_key = 'owner' and not v_actor_is_owner then
    raise exception 'only an owner can grant or modify owner memberships'
      using errcode = '42501';
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

  if found and v_role.role_key = 'owner' and v_existing.status = 'active' and v_status in ('disabled', 'revoked') then
    select count(*)::integer
    into v_other_active_owner_count
    from core.memberships as m
    join core.roles as r on r.id = m.role_id
    where m.tenant_id = v_tenant_id
      and m.status = 'active'
      and r.role_key = 'owner'
      and m.id <> v_existing.id;

    if v_other_active_owner_count = 0 then
      raise exception 'at least one active owner must remain in the tenant'
        using errcode = '42501';
    end if;
  end if;

  if found then
    update core.memberships
    set status = v_status,
        invited_email = coalesce(v_email, v_user.email),
        updated_at = now()
    where id = v_existing.id
    returning * into v_membership;

    v_event_type := case when v_status = 'revoked' then 'membership.revoked' else 'membership.updated' end;
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
      v_tenant_id,
      v_user.id,
      v_role.id,
      v_scope_type,
      v_scope_id,
      v_status,
      coalesce(v_email, v_user.email),
      v_actor_user_id
    )
    returning * into v_membership;

    v_event_type := 'membership.created';
  end if;

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
    v_tenant_id,
    'user',
    v_actor_user_id,
    v_event_type,
    'core.membership',
    v_membership.id,
    jsonb_build_object(
      'source', 'helvok_current_upsert_membership',
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
    'event_type', v_event_type,
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
    'access', core.get_tenant_access(v_tenant_id)
  );
end;
$$;

revoke execute on function core.get_tenant_access(uuid) from public, anon;
revoke execute on function core.upsert_membership_as_current_user(jsonb) from public, anon;
grant execute on function core.get_tenant_access(uuid) to authenticated, service_role;
grant execute on function core.upsert_membership_as_current_user(jsonb) to authenticated, service_role;

create or replace function public.helvok_current_tenant_access(p_tenant_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, core, public, pg_temp
as $$
  select core.get_tenant_access(p_tenant_id)
$$;

create or replace function public.helvok_current_upsert_membership(payload jsonb)
returns jsonb
language sql
volatile
security invoker
set search_path = pg_catalog, core, public, pg_temp
as $$
  select core.upsert_membership_as_current_user(payload)
$$;

revoke all on function public.helvok_current_tenant_access(uuid) from public, anon;
revoke all on function public.helvok_current_upsert_membership(jsonb) from public, anon;
grant execute on function public.helvok_current_tenant_access(uuid) to authenticated, service_role;
grant execute on function public.helvok_current_upsert_membership(jsonb) to authenticated, service_role;

comment on function public.helvok_current_tenant_access(uuid) is
  'Authenticated tenant access workbench summary for users with members.manage.';
comment on function public.helvok_current_upsert_membership(jsonb) is
  'Authenticated membership grant/update workflow guarded by members.manage.';

commit;
