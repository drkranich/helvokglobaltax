-- Settings panel foundation: read/update general tenant settings, matching
-- the roadmap item "Painel de configurações gerais do tenant".
--
-- No new table: core.tenants already has display_name, default_locale and a
-- catch-all metadata jsonb column (from the very first migration). This adds
-- the read/update RPCs over those existing columns instead of inventing new
-- storage. A curated subset of metadata keys (default_currency,
-- support_email, default_timezone) is merged (not replaced) on update so
-- other code that may rely on metadata keeps working untouched.
--
-- Reuses the existing 'settings.manage' permission ("Manage tenant
-- environment settings") already seeded and granted to owner/admin in the
-- initial foundation migration instead of inventing a new permission key.

begin;

create or replace function core.tenant_settings_json(p_tenant core.tenants)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select jsonb_build_object(
    'id', p_tenant.id,
    'slug', p_tenant.slug,
    'legal_name', p_tenant.legal_name,
    'display_name', p_tenant.display_name,
    'status', p_tenant.status,
    'default_locale', p_tenant.default_locale,
    'default_currency', p_tenant.metadata->>'default_currency',
    'support_email', p_tenant.metadata->>'support_email',
    'default_timezone', p_tenant.metadata->>'default_timezone',
    'updated_at', p_tenant.updated_at
  )
$$;

create or replace function core.get_tenant_settings_as_current_user(p_tenant_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
declare
  v_tenant core.tenants%rowtype;
begin
  if not core.has_tenant_membership(p_tenant_id) then
    raise exception 'tenant membership is required' using errcode = '42501';
  end if;

  select * into v_tenant from core.tenants where id = p_tenant_id;
  if not found then
    raise exception 'tenant not found' using errcode = 'P0002';
  end if;

  return core.tenant_settings_json(v_tenant);
end;
$$;

create or replace function core.update_tenant_settings_as_current_user(p_tenant_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_actor_id uuid;
  v_before core.tenants%rowtype;
  v_after core.tenants%rowtype;
  v_metadata jsonb;
begin
  if not core.user_has_permission(p_tenant_id, 'settings.manage') then
    raise exception 'settings.manage permission is required' using errcode = '42501';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'payload must be a JSON object' using errcode = '22023';
  end if;

  select * into v_before from core.tenants where id = p_tenant_id for update;
  if not found then
    raise exception 'tenant not found' using errcode = 'P0002';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;

  v_metadata := v_before.metadata;
  if p_payload ? 'default_currency' then
    v_metadata := jsonb_set(v_metadata, '{default_currency}', to_jsonb(nullif(trim(p_payload->>'default_currency'), '')));
  end if;
  if p_payload ? 'support_email' then
    v_metadata := jsonb_set(v_metadata, '{support_email}', to_jsonb(nullif(trim(p_payload->>'support_email'), '')));
  end if;
  if p_payload ? 'default_timezone' then
    v_metadata := jsonb_set(v_metadata, '{default_timezone}', to_jsonb(nullif(trim(p_payload->>'default_timezone'), '')));
  end if;

  update core.tenants
  set
    display_name = case when p_payload ? 'display_name' then nullif(trim(p_payload->>'display_name'), '') else display_name end,
    default_locale = coalesce(nullif(trim(p_payload->>'default_locale'), ''), default_locale),
    metadata = v_metadata,
    updated_at = now()
  where id = p_tenant_id
  returning * into v_after;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'tenant_settings.updated', 'core.tenant', p_tenant_id, to_jsonb(v_before), to_jsonb(v_after), jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'tenant_settings.updated', 'core.tenant', p_tenant_id, core.tenant_settings_json(v_after));

  return jsonb_build_object('event_type', 'tenant_settings.updated', 'settings', core.tenant_settings_json(v_after));
end;
$$;

revoke execute on function core.tenant_settings_json(core.tenants) from public, anon, authenticated;
revoke execute on function core.get_tenant_settings_as_current_user(uuid) from public, anon, authenticated;
revoke execute on function core.update_tenant_settings_as_current_user(uuid, jsonb) from public, anon, authenticated;

grant execute on function core.tenant_settings_json(core.tenants) to service_role;
grant execute on function core.get_tenant_settings_as_current_user(uuid) to service_role;
grant execute on function core.update_tenant_settings_as_current_user(uuid, jsonb) to service_role;

create or replace function public.helvok_current_get_tenant_settings(p_tenant_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.get_tenant_settings_as_current_user(p_tenant_id)
$$;

create or replace function public.helvok_current_update_tenant_settings(p_tenant_id uuid, p_payload jsonb)
returns jsonb
language sql
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.update_tenant_settings_as_current_user(p_tenant_id, p_payload)
$$;

revoke execute on function public.helvok_current_get_tenant_settings(uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_update_tenant_settings(uuid, jsonb) from public, anon, authenticated;

grant execute on function public.helvok_current_get_tenant_settings(uuid) to authenticated;
grant execute on function public.helvok_current_update_tenant_settings(uuid, jsonb) to authenticated;

commit;
