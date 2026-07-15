begin;

drop function if exists public.helvok_register_current_user();

create or replace function public.helvok_admin_sync_user(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, pg_temp
as $$
declare
  v_auth_user_id uuid := nullif(payload->>'auth_user_id', '')::uuid;
  v_email text := lower(nullif(trim(coalesce(payload->>'email', '')), ''));
  v_full_name text := nullif(trim(coalesce(payload->>'full_name', '')), '');
  v_metadata jsonb := coalesce(payload->'metadata', '{}'::jsonb);
  v_user core.users%rowtype;
begin
  if v_auth_user_id is null then
    raise exception 'auth_user_id is required'
      using errcode = '22023';
  end if;

  if v_email is null then
    raise exception 'email is required'
      using errcode = '22023';
  end if;

  if jsonb_typeof(v_metadata) <> 'object' then
    raise exception 'metadata must be a JSON object'
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
    v_metadata || jsonb_build_object('source', 'helvok_admin_sync_user')
  )
  on conflict (auth_user_id) do update
    set email = excluded.email,
        full_name = coalesce(core.users.full_name, excluded.full_name),
        status = case
          when core.users.status = 'deleted' then core.users.status
          else 'active'
        end,
        metadata = core.users.metadata || excluded.metadata,
        updated_at = now()
  returning * into v_user;

  return jsonb_build_object(
    'user', jsonb_build_object(
      'id', v_user.id,
      'auth_user_id', v_user.auth_user_id,
      'email', v_user.email,
      'full_name', v_user.full_name,
      'status', v_user.status,
      'metadata', v_user.metadata,
      'created_at', v_user.created_at,
      'updated_at', v_user.updated_at
    )
  );
end;
$$;

revoke all on function public.helvok_admin_sync_user(jsonb) from public, anon, authenticated;
grant execute on function public.helvok_admin_sync_user(jsonb) to service_role;

comment on function public.helvok_admin_sync_user(jsonb) is
  'Service-role RPC used by the Cloudflare Worker to sync a Supabase Auth user into core.users.';

commit;
