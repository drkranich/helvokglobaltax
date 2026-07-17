begin;

create or replace function core.update_fiscal_document_as_current_user(p_tenant_id uuid, p_document_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_before core.fiscal_documents%rowtype;
  v_after core.fiscal_documents%rowtype;
  v_actor_id uuid;
begin
  if not core.user_has_permission(p_tenant_id, 'documents.issue') then
    raise exception 'documents.issue permission is required' using errcode = '42501';
  end if;

  select * into v_before
  from core.fiscal_documents
  where tenant_id = p_tenant_id and id = p_document_id
  for update;

  if not found then
    raise exception 'fiscal document not found' using errcode = 'P0002';
  end if;

  if v_before.status not in ('draft', 'rejected', 'failed') then
    raise exception 'only draft, rejected, or failed fiscal documents can be edited' using errcode = '42501';
  end if;

  select id into v_actor_id
  from core.users
  where auth_user_id = (select auth.uid())
  limit 1;

  update core.fiscal_documents
  set
    operation_type = coalesce(nullif(trim(p_payload->>'operation_type'), ''), operation_type),
    document_number = case when p_payload ? 'document_number' then nullif(trim(p_payload->>'document_number'), '') else document_number end,
    document_series = case when p_payload ? 'document_series' then nullif(trim(p_payload->>'document_series'), '') else document_series end,
    currency_code = upper(coalesce(nullif(trim(p_payload->>'currency_code'), ''), currency_code)),
    total_amount = coalesce(nullif(p_payload->>'total_amount', '')::numeric, total_amount),
    tax_amount = coalesce(nullif(p_payload->>'tax_amount', '')::numeric, tax_amount),
    payload = case when p_payload ? 'payload' and jsonb_typeof(p_payload->'payload') = 'object' then p_payload->'payload' else core.fiscal_documents.payload end,
    calculation_snapshot = case when p_payload ? 'calculation_snapshot' and jsonb_typeof(p_payload->'calculation_snapshot') = 'object' then p_payload->'calculation_snapshot' else calculation_snapshot end,
    metadata = metadata || jsonb_build_object('edited_at', now(), 'edited_by_user_id', v_actor_id),
    updated_at = now()
  where tenant_id = p_tenant_id and id = p_document_id
  returning * into v_after;

  insert into core.fiscal_document_events (tenant_id, fiscal_document_id, event_type, actor_type, actor_id, from_status, to_status, payload)
  values (p_tenant_id, p_document_id, 'fiscal_document.updated', 'user', v_actor_id, v_before.status, v_after.status, core.fiscal_document_json(v_after));

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'fiscal_document.updated', 'core.fiscal_document', p_document_id, to_jsonb(v_before), to_jsonb(v_after), jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'fiscal_document.updated', 'core.fiscal_document', p_document_id, core.fiscal_document_json(v_after));

  return jsonb_build_object('event_type', 'fiscal_document.updated', 'document', core.fiscal_document_json(v_after), 'documents', core.list_fiscal_documents_as_admin(p_tenant_id));
end;
$$;

create or replace function core.archive_fiscal_document_as_current_user(p_tenant_id uuid, p_document_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_before core.fiscal_documents%rowtype;
  v_after core.fiscal_documents%rowtype;
  v_actor_id uuid;
begin
  if not core.user_has_permission(p_tenant_id, 'documents.issue') then
    raise exception 'documents.issue permission is required' using errcode = '42501';
  end if;

  select * into v_before
  from core.fiscal_documents
  where tenant_id = p_tenant_id and id = p_document_id
  for update;

  if not found then
    raise exception 'fiscal document not found' using errcode = 'P0002';
  end if;

  if v_before.status in ('authorized', 'cancelled', 'voided') then
    raise exception 'authorized, cancelled, or voided fiscal documents cannot be archived from the dashboard' using errcode = '42501';
  end if;

  select id into v_actor_id
  from core.users
  where auth_user_id = (select auth.uid())
  limit 1;

  update core.fiscal_documents
  set
    status = 'archived',
    lifecycle_stage = 'closed',
    metadata = metadata || jsonb_build_object('archived_at', now(), 'archived_by_user_id', v_actor_id),
    updated_at = now()
  where tenant_id = p_tenant_id and id = p_document_id
  returning * into v_after;

  insert into core.fiscal_document_events (tenant_id, fiscal_document_id, event_type, actor_type, actor_id, from_status, to_status, payload)
  values (p_tenant_id, p_document_id, 'fiscal_document.archived', 'user', v_actor_id, v_before.status, v_after.status, core.fiscal_document_json(v_after));

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'fiscal_document.archived', 'core.fiscal_document', p_document_id, to_jsonb(v_before), to_jsonb(v_after), jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'fiscal_document.archived', 'core.fiscal_document', p_document_id, core.fiscal_document_json(v_after));

  return jsonb_build_object('event_type', 'fiscal_document.archived', 'document', core.fiscal_document_json(v_after), 'documents', core.list_fiscal_documents_as_admin(p_tenant_id));
end;
$$;

create or replace function core.delete_fiscal_document_as_current_user(p_tenant_id uuid, p_document_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_before core.fiscal_documents%rowtype;
  v_actor_id uuid;
begin
  if not core.user_has_permission(p_tenant_id, 'documents.issue') then
    raise exception 'documents.issue permission is required' using errcode = '42501';
  end if;

  select * into v_before
  from core.fiscal_documents
  where tenant_id = p_tenant_id and id = p_document_id
  for update;

  if not found then
    raise exception 'fiscal document not found' using errcode = 'P0002';
  end if;

  if v_before.status not in ('draft', 'archived', 'rejected', 'failed') then
    raise exception 'only draft, archived, rejected, or failed fiscal documents can be deleted' using errcode = '42501';
  end if;

  select id into v_actor_id
  from core.users
  where auth_user_id = (select auth.uid())
  limit 1;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'fiscal_document.deleted', 'core.fiscal_document', p_document_id, to_jsonb(v_before), jsonb_build_object('source', 'dashboard'));

  delete from core.fiscal_documents
  where tenant_id = p_tenant_id and id = p_document_id;

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'fiscal_document.deleted', 'core.fiscal_document', p_document_id, core.fiscal_document_json(v_before));

  return jsonb_build_object('event_type', 'fiscal_document.deleted', 'documents', core.list_fiscal_documents_as_admin(p_tenant_id));
end;
$$;

create or replace function public.helvok_current_update_fiscal_document(p_tenant_id uuid, p_document_id uuid, payload jsonb)
returns jsonb
language sql
volatile
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.update_fiscal_document_as_current_user(p_tenant_id, p_document_id, payload)
$$;

create or replace function public.helvok_current_archive_fiscal_document(p_tenant_id uuid, p_document_id uuid)
returns jsonb
language sql
volatile
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.archive_fiscal_document_as_current_user(p_tenant_id, p_document_id)
$$;

create or replace function public.helvok_current_delete_fiscal_document(p_tenant_id uuid, p_document_id uuid)
returns jsonb
language sql
volatile
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.delete_fiscal_document_as_current_user(p_tenant_id, p_document_id)
$$;

revoke execute on function core.update_fiscal_document_as_current_user(uuid, uuid, jsonb) from public, anon;
revoke execute on function core.archive_fiscal_document_as_current_user(uuid, uuid) from public, anon;
revoke execute on function core.delete_fiscal_document_as_current_user(uuid, uuid) from public, anon;
revoke all on function public.helvok_current_update_fiscal_document(uuid, uuid, jsonb) from public, anon;
revoke all on function public.helvok_current_archive_fiscal_document(uuid, uuid) from public, anon;
revoke all on function public.helvok_current_delete_fiscal_document(uuid, uuid) from public, anon;

grant execute on function core.update_fiscal_document_as_current_user(uuid, uuid, jsonb) to authenticated, service_role;
grant execute on function core.archive_fiscal_document_as_current_user(uuid, uuid) to authenticated, service_role;
grant execute on function core.delete_fiscal_document_as_current_user(uuid, uuid) to authenticated, service_role;
grant execute on function public.helvok_current_update_fiscal_document(uuid, uuid, jsonb) to authenticated, service_role;
grant execute on function public.helvok_current_archive_fiscal_document(uuid, uuid) to authenticated, service_role;
grant execute on function public.helvok_current_delete_fiscal_document(uuid, uuid) to authenticated, service_role;

commit;
