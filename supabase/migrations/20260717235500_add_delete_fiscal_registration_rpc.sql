-- Adds hard delete for fiscal registrations, mirroring the fiscal document
-- delete guard: only draft or archived registrations may be deleted.
-- Active/pending_review/suspended registrations represent a real
-- CNPJ/EIN/VAT id relationship a tenant has with a tax authority and must
-- be archived (not hard-deleted) from the dashboard.

begin;

create or replace function core.delete_fiscal_registration_as_current_user(p_tenant_id uuid, p_registration_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_before core.fiscal_registrations%rowtype;
  v_actor_id uuid;
begin
  if not core.user_has_permission(p_tenant_id, 'organizations.manage') then
    raise exception 'organizations.manage permission is required' using errcode = '42501';
  end if;

  select * into v_before
  from core.fiscal_registrations
  where tenant_id = p_tenant_id and id = p_registration_id
  for update;

  if not found then
    raise exception 'fiscal registration not found' using errcode = 'P0002';
  end if;

  if v_before.status not in ('draft', 'archived') then
    raise exception 'only draft or archived fiscal registrations can be deleted' using errcode = '42501';
  end if;

  select id into v_actor_id
  from core.users
  where auth_user_id = (select auth.uid())
  limit 1;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'fiscal_registration.deleted', 'core.fiscal_registration', p_registration_id, to_jsonb(v_before), jsonb_build_object('source', 'dashboard'));

  delete from core.fiscal_registrations
  where tenant_id = p_tenant_id and id = p_registration_id;

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'fiscal_registration.deleted', 'core.fiscal_registration', p_registration_id, core.fiscal_registration_json(v_before));

  return jsonb_build_object('event_type', 'fiscal_registration.deleted', 'registrations', core.list_fiscal_registrations_as_admin(p_tenant_id));
end;
$$;

revoke execute on function core.delete_fiscal_registration_as_current_user(uuid, uuid) from public, anon, authenticated;
grant execute on function core.delete_fiscal_registration_as_current_user(uuid, uuid) to service_role;

create or replace function public.helvok_current_delete_fiscal_registration(p_tenant_id uuid, p_registration_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.delete_fiscal_registration_as_current_user(p_tenant_id, p_registration_id)
$$;

revoke execute on function public.helvok_current_delete_fiscal_registration(uuid, uuid) from public, anon, authenticated;
grant execute on function public.helvok_current_delete_fiscal_registration(uuid, uuid) to authenticated;

commit;
