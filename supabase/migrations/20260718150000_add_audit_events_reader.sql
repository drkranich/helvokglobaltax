-- Logs panel foundation: a dedicated reader over the append-only
-- audit.audit_events table, matching the roadmap item "Logs separados de
-- auditoria (hoje só tem o feed de auditoria)". Until now the frontend
-- "Auditoria" view only showed a local, in-browser, non-persistent feed
-- (addFeed()); every RPC in this project has been writing real rows into
-- audit.audit_events since the very first migration, but nothing ever read
-- them back. This migration adds that read path.
--
-- Reuses the existing 'audit.read' permission already seeded and granted to
-- roles in the initial foundation migration instead of inventing a new
-- permission key. Note RLS already lets any tenant member SELECT from
-- audit.audit_events directly (see the initial foundation migration); this
-- RPC adds a stricter, explicit 'audit.read' permission gate on top plus a
-- shaped/paginated JSON response, consistent with every other panel here.

begin;

create or replace function audit.event_json(p_event audit.audit_events)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, audit, pg_temp
as $$
  select jsonb_build_object(
    'id', p_event.id,
    'tenant_id', p_event.tenant_id,
    'actor_type', p_event.actor_type,
    'actor_id', p_event.actor_id,
    'event_type', p_event.event_type,
    'resource_type', p_event.resource_type,
    'resource_id', p_event.resource_id,
    'correlation_id', p_event.correlation_id,
    'metadata', p_event.metadata,
    'created_at', p_event.created_at
  )
$$;

create or replace function audit.list_events_as_admin(p_tenant_id uuid, p_limit integer default 100)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, audit, pg_temp
as $$
  select coalesce(jsonb_agg(audit.event_json(e)), '[]'::jsonb)
  from (
    select *
    from audit.audit_events
    where tenant_id = p_tenant_id
    order by created_at desc
    limit greatest(1, least(coalesce(p_limit, 100), 500))
  ) as e
$$;

create or replace function audit.list_events_as_current_user(p_tenant_id uuid, p_limit integer default 100)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, audit, core, pg_temp
as $$
begin
  if not core.user_has_permission(p_tenant_id, 'audit.read') then
    raise exception 'audit.read permission is required' using errcode = '42501';
  end if;

  return audit.list_events_as_admin(p_tenant_id, p_limit);
end;
$$;

revoke execute on function audit.event_json(audit.audit_events) from public, anon, authenticated;
revoke execute on function audit.list_events_as_admin(uuid, integer) from public, anon, authenticated;
revoke execute on function audit.list_events_as_current_user(uuid, integer) from public, anon, authenticated;

grant execute on function audit.event_json(audit.audit_events) to service_role;
grant execute on function audit.list_events_as_admin(uuid, integer) to service_role;
grant execute on function audit.list_events_as_current_user(uuid, integer) to service_role;

create or replace function public.helvok_admin_list_audit_events(p_tenant_id uuid, p_limit integer default 100)
returns jsonb
language sql
security definer
set search_path = pg_catalog, audit, pg_temp
as $$
  select audit.list_events_as_admin(p_tenant_id, p_limit)
$$;

create or replace function public.helvok_current_list_audit_events(p_tenant_id uuid, p_limit integer default 100)
returns jsonb
language sql
security definer
set search_path = pg_catalog, audit, pg_temp
as $$
  select audit.list_events_as_current_user(p_tenant_id, p_limit)
$$;

revoke execute on function public.helvok_admin_list_audit_events(uuid, integer) from public, anon, authenticated;
revoke execute on function public.helvok_current_list_audit_events(uuid, integer) from public, anon, authenticated;

grant execute on function public.helvok_admin_list_audit_events(uuid, integer) to service_role;
grant execute on function public.helvok_current_list_audit_events(uuid, integer) to authenticated;

commit;
