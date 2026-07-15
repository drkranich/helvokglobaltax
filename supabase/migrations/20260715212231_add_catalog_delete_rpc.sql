begin;

create or replace function core.delete_catalog_item(
  p_tenant_id uuid,
  p_item_id uuid,
  p_actor_type text,
  p_actor_id uuid default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, pg_temp
as $$
declare
  v_item core.catalog_items%rowtype;
begin
  if p_tenant_id is null or p_item_id is null then
    raise exception 'tenant_id and item_id are required'
      using errcode = '22023';
  end if;

  delete from core.catalog_items
  where tenant_id = p_tenant_id
    and id = p_item_id
  returning * into v_item;

  if v_item.id is null then
    raise exception 'catalog item not found'
      using errcode = 'P0002';
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
    p_tenant_id,
    p_actor_type,
    p_actor_id,
    'product.deleted',
    'core.catalog_item',
    v_item.id,
    to_jsonb(v_item),
    null,
    jsonb_build_object('source', 'catalog_item_delete')
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
    'product.deleted',
    'core.catalog_item',
    v_item.id,
    core.catalog_item_json(v_item)
  );

  return jsonb_build_object(
    'event_type', 'product.deleted',
    'item', core.catalog_item_json(v_item),
    'items', core.list_catalog_items_as_admin(p_tenant_id)
  );
end;
$$;

create or replace function core.delete_catalog_item_as_admin(p_tenant_id uuid, p_item_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, pg_temp
as $$
begin
  return core.delete_catalog_item(p_tenant_id, p_item_id, 'system', null);
end;
$$;

create or replace function core.delete_catalog_item_as_current_user(p_tenant_id uuid, p_item_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_actor core.users%rowtype;
begin
  v_actor := core.get_current_active_user();

  if not core.user_has_permission(p_tenant_id, 'products.manage') then
    raise exception 'products.manage permission is required'
      using errcode = '42501';
  end if;

  return core.delete_catalog_item(p_tenant_id, p_item_id, 'user', v_actor.id);
end;
$$;

create or replace function public.helvok_admin_delete_catalog_item(p_tenant_id uuid, p_item_id uuid)
returns jsonb
language sql
volatile
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.delete_catalog_item_as_admin(p_tenant_id, p_item_id)
$$;

create or replace function public.helvok_current_delete_catalog_item(p_tenant_id uuid, p_item_id uuid)
returns jsonb
language sql
volatile
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.delete_catalog_item_as_current_user(p_tenant_id, p_item_id)
$$;

revoke execute on function core.delete_catalog_item(uuid, uuid, text, uuid) from public, anon, authenticated;
revoke execute on function core.delete_catalog_item_as_admin(uuid, uuid) from public, anon, authenticated;
revoke execute on function core.delete_catalog_item_as_current_user(uuid, uuid) from public, anon;
revoke all on function public.helvok_admin_delete_catalog_item(uuid, uuid) from public, anon, authenticated;
revoke all on function public.helvok_current_delete_catalog_item(uuid, uuid) from public, anon;

grant execute on function core.delete_catalog_item_as_admin(uuid, uuid) to service_role;
grant execute on function core.delete_catalog_item_as_current_user(uuid, uuid) to authenticated, service_role;
grant execute on function public.helvok_admin_delete_catalog_item(uuid, uuid) to service_role;
grant execute on function public.helvok_current_delete_catalog_item(uuid, uuid) to authenticated, service_role;

comment on function public.helvok_current_delete_catalog_item(uuid, uuid) is
  'Authenticated hard delete for tenant catalog items guarded by products.manage and audit outbox events.';

commit;
