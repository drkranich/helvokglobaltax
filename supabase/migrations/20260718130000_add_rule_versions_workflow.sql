-- Rules panel foundation: versioned tax rule proposals with a review
-- workflow (draft -> in_review -> approved/rejected -> published), matching
-- the roadmap item "Painel de regras (publicar/versionar regra tributária
-- com workflow de revisão)".
--
-- This does NOT replace the code-level seed rule pack in
-- src/tax/rule-pack.ts (which remains the actual engine input for the tax
-- simulator). This table stores tenant-authored proposals/overrides that a
-- reviewer can approve and publish; wiring a published rule_version into the
-- live simulation engine is a separate, later step and is out of scope here.
--
-- Reuses the existing 'rules.create' / 'rules.review' / 'rules.publish'
-- permissions already seeded and granted to roles in the initial foundation
-- migration (fiscal_manager gets all three; developer/admin/owner get all
-- three via their broad grants) instead of inventing new permission keys.

begin;

create schema if not exists rules;

create table rules.rule_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  market_code text not null,
  title text not null,
  description text,
  payload jsonb not null default '{}'::jsonb,
  version integer not null,
  status text not null default 'draft',
  submitted_by_user_id uuid references core.users (id) on delete set null,
  reviewed_by_user_id uuid references core.users (id) on delete set null,
  review_notes text,
  published_at timestamptz,
  created_by_user_id uuid references core.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rules_versions_status_chk
    check (status in ('draft', 'in_review', 'approved', 'rejected', 'published', 'archived')),
  constraint rules_versions_title_chk
    check (length(trim(title)) > 0),
  constraint rules_versions_market_code_chk
    check (length(trim(market_code)) > 0),
  constraint rules_versions_payload_object_chk
    check (jsonb_typeof(payload) = 'object'),
  constraint rules_versions_version_positive_chk
    check (version > 0)
);

alter table rules.rule_versions
  add constraint rules_versions_tenant_id_id_key unique (tenant_id, id);

create unique index rules_versions_tenant_market_version_unique
  on rules.rule_versions (tenant_id, market_code, version);
create index rules_versions_tenant_status_idx on rules.rule_versions (tenant_id, status);
create index rules_versions_tenant_market_idx on rules.rule_versions (tenant_id, market_code);

create trigger rules_versions_set_updated_at
before update on rules.rule_versions
for each row execute function core.set_updated_at();

alter table rules.rule_versions enable row level security;
alter table rules.rule_versions force row level security;

create policy "rule versions are private to RPCs"
on rules.rule_versions
for all
to anon, authenticated
using (false)
with check (false);

grant select, insert, update, delete on rules.rule_versions to service_role;

-- JSON projection + RPCs ------------------------------------------------------------

create or replace function rules.rule_version_json(p_rule rules.rule_versions)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, rules, pg_temp
as $$
  select jsonb_build_object(
    'id', p_rule.id,
    'tenant_id', p_rule.tenant_id,
    'market_code', p_rule.market_code,
    'title', p_rule.title,
    'description', p_rule.description,
    'payload', p_rule.payload,
    'version', p_rule.version,
    'status', p_rule.status,
    'review_notes', p_rule.review_notes,
    'published_at', p_rule.published_at,
    'created_at', p_rule.created_at,
    'updated_at', p_rule.updated_at
  )
$$;

create or replace function rules.list_rule_versions_as_admin(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, rules, pg_temp
as $$
  select coalesce(jsonb_agg(rules.rule_version_json(r) order by r.market_code asc, r.version desc), '[]'::jsonb)
  from rules.rule_versions as r
  where r.tenant_id = p_tenant_id
$$;

create or replace function rules.list_rule_versions_as_current_user(p_tenant_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, rules, core, pg_temp
as $$
begin
  if not (
    core.user_has_permission(p_tenant_id, 'rules.create')
    or core.user_has_permission(p_tenant_id, 'rules.review')
    or core.user_has_permission(p_tenant_id, 'rules.publish')
  ) then
    raise exception 'rules.create, rules.review or rules.publish permission is required' using errcode = '42501';
  end if;

  return rules.list_rule_versions_as_admin(p_tenant_id);
end;
$$;

create or replace function rules.create_rule_version_as_current_user(p_tenant_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, rules, core, audit, auth, pg_temp
as $$
declare
  v_actor_id uuid;
  v_title text;
  v_market_code text;
  v_next_version integer;
  v_after rules.rule_versions%rowtype;
begin
  if not core.user_has_permission(p_tenant_id, 'rules.create') then
    raise exception 'rules.create permission is required' using errcode = '42501';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'payload must be a JSON object' using errcode = '22023';
  end if;

  v_title := nullif(trim(coalesce(p_payload->>'title', '')), '');
  if v_title is null then
    raise exception 'title is required' using errcode = '22023';
  end if;

  v_market_code := nullif(upper(trim(coalesce(p_payload->>'market_code', ''))), '');
  if v_market_code is null then
    raise exception 'market_code is required' using errcode = '22023';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;

  select coalesce(max(version), 0) + 1 into v_next_version
  from rules.rule_versions
  where tenant_id = p_tenant_id and market_code = v_market_code;

  insert into rules.rule_versions (
    tenant_id, market_code, title, description, payload, version, status, created_by_user_id
  )
  values (
    p_tenant_id,
    v_market_code,
    v_title,
    nullif(trim(coalesce(p_payload->>'description', '')), ''),
    case when jsonb_typeof(coalesce(p_payload->'payload', '{}'::jsonb)) = 'object' then coalesce(p_payload->'payload', '{}'::jsonb) else '{}'::jsonb end,
    v_next_version,
    'draft',
    v_actor_id
  )
  returning * into v_after;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'rule_version.created', 'rules.rule_version', v_after.id, null, to_jsonb(v_after), jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'rule_version.created', 'rules.rule_version', v_after.id, rules.rule_version_json(v_after));

  return jsonb_build_object('event_type', 'rule_version.created', 'rule_version', rules.rule_version_json(v_after), 'rule_versions', rules.list_rule_versions_as_admin(p_tenant_id));
end;
$$;

create or replace function rules.submit_rule_version_as_current_user(p_tenant_id uuid, p_rule_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, rules, core, audit, auth, pg_temp
as $$
declare
  v_actor_id uuid;
  v_before rules.rule_versions%rowtype;
  v_after rules.rule_versions%rowtype;
begin
  if not core.user_has_permission(p_tenant_id, 'rules.create') then
    raise exception 'rules.create permission is required' using errcode = '42501';
  end if;

  select * into v_before from rules.rule_versions where tenant_id = p_tenant_id and id = p_rule_id for update;
  if not found then
    raise exception 'rule version not found' using errcode = 'P0002';
  end if;

  if v_before.status not in ('draft', 'rejected') then
    raise exception 'only draft or rejected rule versions can be submitted for review' using errcode = '42501';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;

  update rules.rule_versions
  set status = 'in_review', submitted_by_user_id = v_actor_id, review_notes = null, updated_at = now()
  where tenant_id = p_tenant_id and id = p_rule_id
  returning * into v_after;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'rule_version.submitted', 'rules.rule_version', p_rule_id, to_jsonb(v_before), to_jsonb(v_after), jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'rule_version.submitted', 'rules.rule_version', p_rule_id, rules.rule_version_json(v_after));

  return jsonb_build_object('event_type', 'rule_version.submitted', 'rule_version', rules.rule_version_json(v_after), 'rule_versions', rules.list_rule_versions_as_admin(p_tenant_id));
end;
$$;

create or replace function rules.review_rule_version_as_current_user(p_tenant_id uuid, p_rule_id uuid, p_decision text, p_notes text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, rules, core, audit, auth, pg_temp
as $$
declare
  v_actor_id uuid;
  v_before rules.rule_versions%rowtype;
  v_after rules.rule_versions%rowtype;
  v_status text;
begin
  if not core.user_has_permission(p_tenant_id, 'rules.review') then
    raise exception 'rules.review permission is required' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'decision must be approved or rejected' using errcode = '22023';
  end if;

  select * into v_before from rules.rule_versions where tenant_id = p_tenant_id and id = p_rule_id for update;
  if not found then
    raise exception 'rule version not found' using errcode = 'P0002';
  end if;

  if v_before.status <> 'in_review' then
    raise exception 'only rule versions in review can be reviewed' using errcode = '42501';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;
  v_status := p_decision;

  update rules.rule_versions
  set status = v_status, reviewed_by_user_id = v_actor_id, review_notes = nullif(trim(coalesce(p_notes, '')), ''), updated_at = now()
  where tenant_id = p_tenant_id and id = p_rule_id
  returning * into v_after;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'rule_version.' || v_status, 'rules.rule_version', p_rule_id, to_jsonb(v_before), to_jsonb(v_after), jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'rule_version.' || v_status, 'rules.rule_version', p_rule_id, rules.rule_version_json(v_after));

  return jsonb_build_object('event_type', 'rule_version.' || v_status, 'rule_version', rules.rule_version_json(v_after), 'rule_versions', rules.list_rule_versions_as_admin(p_tenant_id));
end;
$$;

create or replace function rules.publish_rule_version_as_current_user(p_tenant_id uuid, p_rule_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, rules, core, audit, auth, pg_temp
as $$
declare
  v_actor_id uuid;
  v_before rules.rule_versions%rowtype;
  v_after rules.rule_versions%rowtype;
begin
  if not core.user_has_permission(p_tenant_id, 'rules.publish') then
    raise exception 'rules.publish permission is required' using errcode = '42501';
  end if;

  select * into v_before from rules.rule_versions where tenant_id = p_tenant_id and id = p_rule_id for update;
  if not found then
    raise exception 'rule version not found' using errcode = 'P0002';
  end if;

  if v_before.status <> 'approved' then
    raise exception 'only approved rule versions can be published' using errcode = '42501';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;

  -- Archive any previously published version for the same market so only one
  -- published version per (tenant, market_code) is active at a time.
  update rules.rule_versions
  set status = 'archived', updated_at = now()
  where tenant_id = p_tenant_id and market_code = v_before.market_code and status = 'published';

  update rules.rule_versions
  set status = 'published', published_at = now(), updated_at = now()
  where tenant_id = p_tenant_id and id = p_rule_id
  returning * into v_after;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'rule_version.published', 'rules.rule_version', p_rule_id, to_jsonb(v_before), to_jsonb(v_after), jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'rule_version.published', 'rules.rule_version', p_rule_id, rules.rule_version_json(v_after));

  return jsonb_build_object('event_type', 'rule_version.published', 'rule_version', rules.rule_version_json(v_after), 'rule_versions', rules.list_rule_versions_as_admin(p_tenant_id));
end;
$$;

create or replace function rules.delete_rule_version_as_current_user(p_tenant_id uuid, p_rule_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, rules, core, audit, auth, pg_temp
as $$
declare
  v_actor_id uuid;
  v_before rules.rule_versions%rowtype;
begin
  if not core.user_has_permission(p_tenant_id, 'rules.create') then
    raise exception 'rules.create permission is required' using errcode = '42501';
  end if;

  select * into v_before from rules.rule_versions where tenant_id = p_tenant_id and id = p_rule_id for update;
  if not found then
    raise exception 'rule version not found' using errcode = 'P0002';
  end if;

  if v_before.status = 'published' then
    raise exception 'published rule versions cannot be deleted' using errcode = '42501';
  end if;

  select id into v_actor_id from core.users where auth_user_id = (select auth.uid()) limit 1;

  delete from rules.rule_versions where tenant_id = p_tenant_id and id = p_rule_id;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'rule_version.deleted', 'rules.rule_version', p_rule_id, to_jsonb(v_before), null, jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'rule_version.deleted', 'rules.rule_version', p_rule_id, jsonb_build_object('id', p_rule_id));

  return jsonb_build_object('event_type', 'rule_version.deleted', 'rule_versions', rules.list_rule_versions_as_admin(p_tenant_id));
end;
$$;

revoke execute on function rules.rule_version_json(rules.rule_versions) from public, anon, authenticated;
revoke execute on function rules.list_rule_versions_as_admin(uuid) from public, anon, authenticated;
revoke execute on function rules.list_rule_versions_as_current_user(uuid) from public, anon, authenticated;
revoke execute on function rules.create_rule_version_as_current_user(uuid, jsonb) from public, anon, authenticated;
revoke execute on function rules.submit_rule_version_as_current_user(uuid, uuid) from public, anon, authenticated;
revoke execute on function rules.review_rule_version_as_current_user(uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function rules.publish_rule_version_as_current_user(uuid, uuid) from public, anon, authenticated;
revoke execute on function rules.delete_rule_version_as_current_user(uuid, uuid) from public, anon, authenticated;

grant execute on function rules.rule_version_json(rules.rule_versions) to service_role;
grant execute on function rules.list_rule_versions_as_admin(uuid) to service_role;
grant execute on function rules.list_rule_versions_as_current_user(uuid) to service_role;
grant execute on function rules.create_rule_version_as_current_user(uuid, jsonb) to service_role;
grant execute on function rules.submit_rule_version_as_current_user(uuid, uuid) to service_role;
grant execute on function rules.review_rule_version_as_current_user(uuid, uuid, text, text) to service_role;
grant execute on function rules.publish_rule_version_as_current_user(uuid, uuid) to service_role;
grant execute on function rules.delete_rule_version_as_current_user(uuid, uuid) to service_role;

create or replace function public.helvok_admin_list_rule_versions(p_tenant_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, rules, pg_temp
as $$
  select rules.list_rule_versions_as_admin(p_tenant_id)
$$;

create or replace function public.helvok_current_list_rule_versions(p_tenant_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, rules, pg_temp
as $$
  select rules.list_rule_versions_as_current_user(p_tenant_id)
$$;

create or replace function public.helvok_current_create_rule_version(p_tenant_id uuid, p_payload jsonb)
returns jsonb
language sql
security definer
set search_path = pg_catalog, rules, pg_temp
as $$
  select rules.create_rule_version_as_current_user(p_tenant_id, p_payload)
$$;

create or replace function public.helvok_current_submit_rule_version(p_tenant_id uuid, p_rule_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, rules, pg_temp
as $$
  select rules.submit_rule_version_as_current_user(p_tenant_id, p_rule_id)
$$;

create or replace function public.helvok_current_review_rule_version(p_tenant_id uuid, p_rule_id uuid, p_decision text, p_notes text)
returns jsonb
language sql
security definer
set search_path = pg_catalog, rules, pg_temp
as $$
  select rules.review_rule_version_as_current_user(p_tenant_id, p_rule_id, p_decision, p_notes)
$$;

create or replace function public.helvok_current_publish_rule_version(p_tenant_id uuid, p_rule_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, rules, pg_temp
as $$
  select rules.publish_rule_version_as_current_user(p_tenant_id, p_rule_id)
$$;

create or replace function public.helvok_current_delete_rule_version(p_tenant_id uuid, p_rule_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, rules, pg_temp
as $$
  select rules.delete_rule_version_as_current_user(p_tenant_id, p_rule_id)
$$;

revoke execute on function public.helvok_admin_list_rule_versions(uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_list_rule_versions(uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_create_rule_version(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.helvok_current_submit_rule_version(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_review_rule_version(uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.helvok_current_publish_rule_version(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_delete_rule_version(uuid, uuid) from public, anon, authenticated;

grant execute on function public.helvok_admin_list_rule_versions(uuid) to service_role;
grant execute on function public.helvok_current_list_rule_versions(uuid) to authenticated;
grant execute on function public.helvok_current_create_rule_version(uuid, jsonb) to authenticated;
grant execute on function public.helvok_current_submit_rule_version(uuid, uuid) to authenticated;
grant execute on function public.helvok_current_review_rule_version(uuid, uuid, text, text) to authenticated;
grant execute on function public.helvok_current_publish_rule_version(uuid, uuid) to authenticated;
grant execute on function public.helvok_current_delete_rule_version(uuid, uuid) to authenticated;

commit;
