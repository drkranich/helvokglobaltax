-- Add composite indexes matching composite foreign keys.
-- Postgres does not create FK indexes automatically, and these are needed for
-- fast joins, deletes, and constraint checks on tenant-scoped relationships.

begin;

create index if not exists audit_events_tenant_environment_id_idx
  on audit.audit_events (tenant_id, environment_id);

create index if not exists outbox_events_tenant_environment_id_idx
  on audit.outbox_events (tenant_id, environment_id);

create index if not exists core_certificates_tenant_environment_id_idx
  on core.certificates (tenant_id, environment_id);

create index if not exists core_certificates_tenant_organization_id_idx
  on core.certificates (tenant_id, organization_id);

create index if not exists core_certificates_tenant_establishment_id_idx
  on core.certificates (tenant_id, establishment_id);

create index if not exists core_establishments_tenant_organization_id_idx
  on core.establishments (tenant_id, organization_id);

create index if not exists core_fiscal_identities_tenant_organization_id_idx
  on core.fiscal_identities (tenant_id, organization_id);

create index if not exists core_fiscal_identities_tenant_establishment_id_idx
  on core.fiscal_identities (tenant_id, establishment_id);

create index if not exists core_org_relationships_tenant_child_id_idx
  on core.organization_relationships (tenant_id, child_organization_id);

commit;
