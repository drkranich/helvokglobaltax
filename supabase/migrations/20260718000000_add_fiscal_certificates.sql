-- Secure storage for tenant-uploaded digital certificates (A1 .pfx files
-- and their passphrases). Every byte is encrypted with AES-256-GCM by the
-- Worker (src/fiscal/certificate-crypto.ts) using a key that lives only as
-- a Cloudflare secret (HELVOK_CERT_ENCRYPTION_KEY) -- this table never
-- receives plaintext certificate material, and no RPC below ever returns
-- the encrypted payload/password back out; only status metadata is
-- readable through the API.

begin;

alter table core.fiscal_registrations
  add constraint core_fiscal_registrations_tenant_id_id_key unique (tenant_id, id);

create table core.fiscal_certificates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references core.tenants (id) on delete cascade,
  fiscal_registration_id uuid not null,
  certificate_type text not null default 'a1',
  file_name text not null,
  encrypted_payload text not null,
  payload_iv text not null,
  encrypted_password text not null,
  password_iv text not null,
  key_version text not null default 'v1',
  issued_to text,
  issuer text,
  valid_from date,
  valid_until date,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references core.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint core_fiscal_certificates_registration_fk
    foreign key (tenant_id, fiscal_registration_id)
    references core.fiscal_registrations (tenant_id, id)
    on delete cascade,
  constraint core_fiscal_certificates_type_chk
    check (certificate_type in ('a1', 'a3', 'other')),
  constraint core_fiscal_certificates_status_chk
    check (status in ('active', 'expired', 'revoked', 'replaced')),
  constraint core_fiscal_certificates_file_name_chk
    check (length(trim(file_name)) > 0),
  constraint core_fiscal_certificates_metadata_object_chk
    check (jsonb_typeof(metadata) = 'object')
);

create index core_fiscal_certificates_tenant_status_idx
  on core.fiscal_certificates (tenant_id, status);
create index core_fiscal_certificates_registration_idx
  on core.fiscal_certificates (fiscal_registration_id);
create index core_fiscal_certificates_valid_until_idx
  on core.fiscal_certificates (valid_until);

create trigger core_fiscal_certificates_set_updated_at
before update on core.fiscal_certificates
for each row execute function core.set_updated_at();

alter table core.fiscal_certificates enable row level security;
alter table core.fiscal_certificates force row level security;

create policy "fiscal certificates are private to RPCs"
on core.fiscal_certificates
for all
to anon, authenticated
using (false)
with check (false);

grant select, insert, update, delete on core.fiscal_certificates to service_role;

-- Metadata-only projection: encrypted_payload/payload_iv/encrypted_password/
-- password_iv are intentionally excluded from every JSON representation
-- returned by these functions.
create or replace function core.fiscal_certificate_status_json(p_cert core.fiscal_certificates)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select jsonb_build_object(
    'id', p_cert.id,
    'tenant_id', p_cert.tenant_id,
    'fiscal_registration_id', p_cert.fiscal_registration_id,
    'certificate_type', p_cert.certificate_type,
    'file_name', p_cert.file_name,
    'key_version', p_cert.key_version,
    'issued_to', p_cert.issued_to,
    'issuer', p_cert.issuer,
    'valid_from', p_cert.valid_from,
    'valid_until', p_cert.valid_until,
    'status', p_cert.status,
    'metadata', p_cert.metadata,
    'created_by_user_id', p_cert.created_by_user_id,
    'created_at', p_cert.created_at,
    'updated_at', p_cert.updated_at
  )
$$;

create or replace function core.list_fiscal_certificates_as_admin(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select coalesce(
    jsonb_agg(core.fiscal_certificate_status_json(fc) order by fc.updated_at desc),
    '[]'::jsonb
  )
  from core.fiscal_certificates as fc
  where fc.tenant_id = p_tenant_id
$$;

create or replace function core.list_fiscal_certificates_as_current_user(p_tenant_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, core, auth, pg_temp
as $$
begin
  if not core.user_has_permission(p_tenant_id, 'organizations.manage') then
    raise exception 'organizations.manage permission is required'
      using errcode = '42501';
  end if;

  return core.list_fiscal_certificates_as_admin(p_tenant_id);
end;
$$;

create or replace function core.upload_fiscal_certificate_as_current_user(p_tenant_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_registration_id uuid;
  v_actor_id uuid;
  v_cert core.fiscal_certificates%rowtype;
begin
  if not core.user_has_permission(p_tenant_id, 'organizations.manage') then
    raise exception 'organizations.manage permission is required' using errcode = '42501';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'payload must be a JSON object' using errcode = '22023';
  end if;

  v_registration_id := nullif(p_payload->>'fiscal_registration_id', '')::uuid;
  if v_registration_id is null then
    raise exception 'fiscal_registration_id is required' using errcode = '22023';
  end if;

  if not exists (
    select 1 from core.fiscal_registrations
    where tenant_id = p_tenant_id and id = v_registration_id
  ) then
    raise exception 'fiscal registration not found for this tenant' using errcode = 'P0002';
  end if;

  if nullif(trim(coalesce(p_payload->>'file_name', '')), '') is null then
    raise exception 'file_name is required' using errcode = '22023';
  end if;

  if nullif(trim(coalesce(p_payload->>'encrypted_payload', '')), '') is null
    or nullif(trim(coalesce(p_payload->>'payload_iv', '')), '') is null
    or nullif(trim(coalesce(p_payload->>'encrypted_password', '')), '') is null
    or nullif(trim(coalesce(p_payload->>'password_iv', '')), '') is null then
    raise exception 'encrypted_payload, payload_iv, encrypted_password, and password_iv are required (encryption happens before this call)' using errcode = '22023';
  end if;

  select id into v_actor_id
  from core.users
  where auth_user_id = (select auth.uid())
  limit 1;

  -- Any previous certificate for the same registration is superseded, not
  -- silently overwritten: we keep its row but mark it 'replaced' for audit.
  update core.fiscal_certificates
  set status = 'replaced', updated_at = now()
  where tenant_id = p_tenant_id
    and fiscal_registration_id = v_registration_id
    and status = 'active';

  insert into core.fiscal_certificates (
    tenant_id, fiscal_registration_id, certificate_type, file_name,
    encrypted_payload, payload_iv, encrypted_password, password_iv, key_version,
    issued_to, issuer, valid_from, valid_until, status, created_by_user_id
  )
  values (
    p_tenant_id,
    v_registration_id,
    coalesce(nullif(trim(p_payload->>'certificate_type'), ''), 'a1'),
    trim(p_payload->>'file_name'),
    p_payload->>'encrypted_payload',
    p_payload->>'payload_iv',
    p_payload->>'encrypted_password',
    p_payload->>'password_iv',
    coalesce(nullif(trim(p_payload->>'key_version'), ''), 'v1'),
    nullif(trim(coalesce(p_payload->>'issued_to', '')), ''),
    nullif(trim(coalesce(p_payload->>'issuer', '')), ''),
    nullif(p_payload->>'valid_from', '')::date,
    nullif(p_payload->>'valid_until', '')::date,
    'active',
    v_actor_id
  )
  returning * into v_cert;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, after_snapshot, metadata)
  values (
    p_tenant_id, 'user', v_actor_id, 'fiscal_certificate.uploaded', 'core.fiscal_certificate', v_cert.id,
    core.fiscal_certificate_status_json(v_cert),
    jsonb_build_object('source', 'dashboard')
  );

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'fiscal_certificate.uploaded', 'core.fiscal_certificate', v_cert.id, core.fiscal_certificate_status_json(v_cert));

  return jsonb_build_object(
    'event_type', 'fiscal_certificate.uploaded',
    'certificate', core.fiscal_certificate_status_json(v_cert),
    'certificates', core.list_fiscal_certificates_as_admin(p_tenant_id)
  );
end;
$$;

create or replace function core.revoke_fiscal_certificate_as_current_user(p_tenant_id uuid, p_certificate_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_before core.fiscal_certificates%rowtype;
  v_after core.fiscal_certificates%rowtype;
  v_actor_id uuid;
begin
  if not core.user_has_permission(p_tenant_id, 'organizations.manage') then
    raise exception 'organizations.manage permission is required' using errcode = '42501';
  end if;

  select * into v_before
  from core.fiscal_certificates
  where tenant_id = p_tenant_id and id = p_certificate_id
  for update;

  if not found then
    raise exception 'fiscal certificate not found' using errcode = 'P0002';
  end if;

  select id into v_actor_id
  from core.users
  where auth_user_id = (select auth.uid())
  limit 1;

  update core.fiscal_certificates
  set status = 'revoked', updated_at = now()
  where tenant_id = p_tenant_id and id = p_certificate_id
  returning * into v_after;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, after_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'fiscal_certificate.revoked', 'core.fiscal_certificate', p_certificate_id, core.fiscal_certificate_status_json(v_before), core.fiscal_certificate_status_json(v_after), jsonb_build_object('source', 'dashboard'));

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'fiscal_certificate.revoked', 'core.fiscal_certificate', p_certificate_id, core.fiscal_certificate_status_json(v_after));

  return jsonb_build_object('event_type', 'fiscal_certificate.revoked', 'certificate', core.fiscal_certificate_status_json(v_after), 'certificates', core.list_fiscal_certificates_as_admin(p_tenant_id));
end;
$$;

create or replace function core.delete_fiscal_certificate_as_current_user(p_tenant_id uuid, p_certificate_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, core, audit, auth, pg_temp
as $$
declare
  v_before core.fiscal_certificates%rowtype;
  v_actor_id uuid;
begin
  if not core.user_has_permission(p_tenant_id, 'organizations.manage') then
    raise exception 'organizations.manage permission is required' using errcode = '42501';
  end if;

  select * into v_before
  from core.fiscal_certificates
  where tenant_id = p_tenant_id and id = p_certificate_id
  for update;

  if not found then
    raise exception 'fiscal certificate not found' using errcode = 'P0002';
  end if;

  if v_before.status not in ('revoked', 'expired', 'replaced') then
    raise exception 'only revoked, expired, or replaced certificates can be deleted -- revoke an active certificate first' using errcode = '42501';
  end if;

  select id into v_actor_id
  from core.users
  where auth_user_id = (select auth.uid())
  limit 1;

  insert into audit.audit_events (tenant_id, actor_type, actor_id, event_type, resource_type, resource_id, before_snapshot, metadata)
  values (p_tenant_id, 'user', v_actor_id, 'fiscal_certificate.deleted', 'core.fiscal_certificate', p_certificate_id, core.fiscal_certificate_status_json(v_before), jsonb_build_object('source', 'dashboard'));

  delete from core.fiscal_certificates
  where tenant_id = p_tenant_id and id = p_certificate_id;

  insert into audit.outbox_events (tenant_id, event_type, aggregate_type, aggregate_id, payload)
  values (p_tenant_id, 'fiscal_certificate.deleted', 'core.fiscal_certificate', p_certificate_id, core.fiscal_certificate_status_json(v_before));

  return jsonb_build_object('event_type', 'fiscal_certificate.deleted', 'certificates', core.list_fiscal_certificates_as_admin(p_tenant_id));
end;
$$;

revoke execute on function core.fiscal_certificate_status_json(core.fiscal_certificates) from public, anon, authenticated;
revoke execute on function core.list_fiscal_certificates_as_admin(uuid) from public, anon, authenticated;
revoke execute on function core.list_fiscal_certificates_as_current_user(uuid) from public, anon, authenticated;
revoke execute on function core.upload_fiscal_certificate_as_current_user(uuid, jsonb) from public, anon, authenticated;
revoke execute on function core.revoke_fiscal_certificate_as_current_user(uuid, uuid) from public, anon, authenticated;
revoke execute on function core.delete_fiscal_certificate_as_current_user(uuid, uuid) from public, anon, authenticated;

grant execute on function core.fiscal_certificate_status_json(core.fiscal_certificates) to service_role;
grant execute on function core.list_fiscal_certificates_as_admin(uuid) to service_role;
grant execute on function core.list_fiscal_certificates_as_current_user(uuid) to service_role;
grant execute on function core.upload_fiscal_certificate_as_current_user(uuid, jsonb) to service_role;
grant execute on function core.revoke_fiscal_certificate_as_current_user(uuid, uuid) to service_role;
grant execute on function core.delete_fiscal_certificate_as_current_user(uuid, uuid) to service_role;

create or replace function public.helvok_admin_list_fiscal_certificates(p_tenant_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.list_fiscal_certificates_as_admin(p_tenant_id)
$$;

create or replace function public.helvok_current_list_fiscal_certificates(p_tenant_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.list_fiscal_certificates_as_current_user(p_tenant_id)
$$;

create or replace function public.helvok_current_upload_fiscal_certificate(p_tenant_id uuid, p_payload jsonb)
returns jsonb
language sql
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.upload_fiscal_certificate_as_current_user(p_tenant_id, p_payload)
$$;

create or replace function public.helvok_current_revoke_fiscal_certificate(p_tenant_id uuid, p_certificate_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.revoke_fiscal_certificate_as_current_user(p_tenant_id, p_certificate_id)
$$;

create or replace function public.helvok_current_delete_fiscal_certificate(p_tenant_id uuid, p_certificate_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.delete_fiscal_certificate_as_current_user(p_tenant_id, p_certificate_id)
$$;

revoke execute on function public.helvok_admin_list_fiscal_certificates(uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_list_fiscal_certificates(uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_upload_fiscal_certificate(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.helvok_current_revoke_fiscal_certificate(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.helvok_current_delete_fiscal_certificate(uuid, uuid) from public, anon, authenticated;

grant execute on function public.helvok_admin_list_fiscal_certificates(uuid) to service_role;
grant execute on function public.helvok_current_list_fiscal_certificates(uuid) to authenticated;
grant execute on function public.helvok_current_upload_fiscal_certificate(uuid, jsonb) to authenticated;
grant execute on function public.helvok_current_revoke_fiscal_certificate(uuid, uuid) to authenticated;
grant execute on function public.helvok_current_delete_fiscal_certificate(uuid, uuid) to authenticated;

commit;
