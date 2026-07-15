begin;

create or replace function public.helvok_current_session()
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public, core, audit, pg_temp
as $$
  with current_profile as (
    select
      u.id,
      u.auth_user_id,
      u.email,
      u.full_name,
      u.status,
      u.metadata,
      u.created_at,
      u.updated_at
    from core.users as u
    where u.auth_user_id = (select auth.uid())
      and u.status = 'active'
    limit 1
  ),
  current_tenants as (
    select *
    from public.current_user_tenants
  ),
  current_organizations as (
    select
      o.id,
      o.tenant_id,
      o.organization_type,
      o.legal_name,
      o.trade_name,
      o.country_of_registration,
      o.status,
      o.metadata,
      o.created_at,
      o.updated_at,
      coalesce(est.establishments, '[]'::jsonb) as establishments
    from core.organizations as o
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'name', e.name,
          'country_code', e.country_code,
          'jurisdiction_path', e.jurisdiction_path,
          'status', e.status,
          'created_at', e.created_at
        )
        order by e.created_at asc
      ) as establishments
      from core.establishments as e
      where e.tenant_id = o.tenant_id
        and e.organization_id = o.id
    ) as est on true
    where exists (
      select 1
      from current_tenants as t
      where t.id = o.tenant_id
    )
  )
  select jsonb_build_object(
    'authenticated', (select auth.uid()) is not null,
    'generated_at', now(),
    'user', (
      select jsonb_build_object(
        'id', p.id,
        'auth_user_id', p.auth_user_id,
        'email', p.email,
        'full_name', p.full_name,
        'status', p.status,
        'metadata', p.metadata,
        'created_at', p.created_at,
        'updated_at', p.updated_at
      )
      from current_profile as p
    ),
    'tenants', coalesce(
      (
        select jsonb_agg(to_jsonb(t) order by t.display_name nulls last, t.slug)
        from current_tenants as t
      ),
      '[]'::jsonb
    ),
    'permissions', coalesce(
      (
        select jsonb_agg(to_jsonb(p) order by p.permission_key)
        from public.current_user_permissions as p
      ),
      '[]'::jsonb
    ),
    'organizations', coalesce(
      (
        select jsonb_agg(to_jsonb(o) order by o.created_at)
        from current_organizations as o
      ),
      '[]'::jsonb
    ),
    'counts', jsonb_build_object(
      'tenants', (select count(*) from current_tenants),
      'organizations', (select count(*) from current_organizations),
      'permissions', (select count(*) from public.current_user_permissions),
      'audit_events', (
        select count(*)
        from audit.audit_events as ae
        where exists (
          select 1
          from current_tenants as t
          where t.id = ae.tenant_id
        )
      )
    )
  );
$$;

create or replace function public.helvok_register_current_user()
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, public, auth, pg_temp
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_email text := lower(nullif(auth.jwt()->>'email', ''));
  v_full_name text := nullif(trim(coalesce(auth.jwt()->'user_metadata'->>'full_name', auth.jwt()->>'email', '')), '');
  v_user core.users%rowtype;
begin
  if v_auth_user_id is null then
    raise exception 'authenticated user is required'
      using errcode = '28000';
  end if;

  if v_email is null then
    raise exception 'authenticated email is required'
      using errcode = '22023';
  end if;

  insert into core.users (
    auth_user_id,
    email,
    full_name,
    status,
    metadata
  )
  values (
    v_auth_user_id,
    v_email,
    v_full_name,
    'active',
    jsonb_build_object('source', 'helvok_register_current_user')
  )
  on conflict (auth_user_id) do update
    set email = excluded.email,
        full_name = coalesce(core.users.full_name, excluded.full_name),
        status = case
          when core.users.status = 'deleted' then core.users.status
          else 'active'
        end,
        updated_at = now()
  returning * into v_user;

  return public.helvok_current_session();
end;
$$;

revoke all on function public.helvok_current_session() from public, anon;
revoke all on function public.helvok_register_current_user() from public, anon;
grant execute on function public.helvok_current_session() to authenticated, service_role;
grant execute on function public.helvok_register_current_user() to authenticated, service_role;

comment on function public.helvok_current_session() is
  'Authenticated RLS-safe session summary for the Helvok Tax Worker and frontend.';
comment on function public.helvok_register_current_user() is
  'Authenticated self-registration into core.users without granting tenant memberships.';

commit;
