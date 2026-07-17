-- Expands the fiscal authority registry to match the country/adapter
-- coverage described in docs/architecture/06-country-plugin-strategy.md and
-- the src/fiscal/adapters registry, and adds a rejections panel RPC.
--
-- Every row below is inserted with status = 'planned': no certificate,
-- government enrollment, or live transport exists yet for any of them.
-- Moving a row to 'sandbox' or 'active' is a deliberate follow-up once a
-- real adapter is connected to a real authority.

begin;

insert into core.fiscal_authorities (
  country_code,
  authority_code,
  name,
  authority_level,
  jurisdiction_path,
  adapter_key,
  environment_capabilities,
  status,
  metadata
)
values
  -- Brazil: remaining document families beyond NF-e/NFS-e.
  ('BR', 'BR-SEFAZ-NFCE', 'SEFAZ NFC-e nacional por UF', 'state', array['BR'], 'adapters/brazil/nfce', '{"sandbox": false, "production": false, "documents": ["NFCE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('BR', 'BR-SEFAZ-CTE', 'SEFAZ CT-e nacional por UF', 'state', array['BR'], 'adapters/brazil/cte', '{"sandbox": false, "production": false, "documents": ["CTE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('BR', 'BR-SEFAZ-MDFE', 'SEFAZ MDF-e nacional por UF', 'state', array['BR'], 'adapters/brazil/mdfe', '{"sandbox": false, "production": false, "documents": ["MDFE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('BR', 'BR-SAT-CFE', 'SAT/CF-e (legado, por UF)', 'state', array['BR'], 'adapters/brazil/cfe-sat', '{"sandbox": false, "production": false, "documents": ["CFE"]}'::jsonb, 'planned', '{"legacy": true}'::jsonb),

  -- Canada
  ('CA', 'CA-CRA-GST-HST-PST-QST', 'Canada Revenue Agency (GST/HST) e autoridades provinciais (PST/QST)', 'province', array['CA'], 'adapters/canada/gst-hst-pst-qst', '{"sandbox": false, "production": false, "documents": ["SALES_TAX_REPORT"]}'::jsonb, 'planned', '{}'::jsonb),

  -- Europe (Portugal and Germany already seeded in a prior migration)
  ('ES', 'ES-AEAT-VAT', 'Agencia Estatal de Administración Tributaria', 'national', array['ES'], 'adapters/spain/vat', '{"sandbox": false, "production": false, "documents": ["VAT_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('FR', 'FR-DGFIP-VAT', 'Direction générale des Finances publiques', 'national', array['FR'], 'adapters/france/vat', '{"sandbox": false, "production": false, "documents": ["VAT_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('IT', 'IT-AGENZIA-VAT', 'Agenzia delle Entrate', 'national', array['IT'], 'adapters/italy/vat', '{"sandbox": false, "production": false, "documents": ["VAT_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('NL', 'NL-BELASTINGDIENST-VAT', 'Belastingdienst', 'national', array['NL'], 'adapters/netherlands/vat', '{"sandbox": false, "production": false, "documents": ["VAT_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('BE', 'BE-SPF-FINANCES-VAT', 'SPF Finances / FOD Financiën', 'national', array['BE'], 'adapters/belgium/vat', '{"sandbox": false, "production": false, "documents": ["VAT_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('IE', 'IE-REVENUE-VAT', 'Office of the Revenue Commissioners', 'national', array['IE'], 'adapters/ireland/vat', '{"sandbox": false, "production": false, "documents": ["VAT_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('CH', 'CH-ESTV-VAT', 'Eidgenössische Steuerverwaltung (ESTV)', 'national', array['CH'], 'adapters/switzerland/vat', '{"sandbox": false, "production": false, "documents": ["VAT_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('GB', 'GB-HMRC-VAT', 'HM Revenue and Customs', 'national', array['GB'], 'adapters/uk/vat', '{"sandbox": false, "production": false, "documents": ["VAT_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('PL', 'PL-KAS-VAT', 'Krajowa Administracja Skarbowa (KSeF)', 'national', array['PL'], 'adapters/poland/vat', '{"sandbox": false, "production": false, "documents": ["VAT_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('SE', 'SE-SKATTEVERKET-VAT', 'Skatteverket', 'national', array['SE'], 'adapters/sweden/vat', '{"sandbox": false, "production": false, "documents": ["VAT_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('GR', 'GR-AADE-VAT', 'Independent Authority for Public Revenue (AADE / myDATA)', 'national', array['GR'], 'adapters/greece/vat', '{"sandbox": false, "production": false, "documents": ["VAT_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('RO', 'RO-ANAF-VAT', 'Agenția Națională de Administrare Fiscală (RO e-Factura)', 'national', array['RO'], 'adapters/romania/vat', '{"sandbox": false, "production": false, "documents": ["VAT_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),

  -- Latin America
  ('MX', 'MX-SAT-CFDI', 'Servicio de Administración Tributaria (SAT)', 'national', array['MX'], 'adapters/mexico/cfdi', '{"sandbox": false, "production": false, "documents": ["CFDI"]}'::jsonb, 'planned', '{}'::jsonb),
  ('CL', 'CL-SII-DTE', 'Servicio de Impuestos Internos (SII)', 'national', array['CL'], 'adapters/chile/dte', '{"sandbox": false, "production": false, "documents": ["DTE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('AR', 'AR-AFIP-FACTURA', 'AFIP/ARCA', 'national', array['AR'], 'adapters/argentina/factura-electronica', '{"sandbox": false, "production": false, "documents": ["FACTURA_ELECTRONICA"]}'::jsonb, 'planned', '{}'::jsonb),
  ('CO', 'CO-DIAN-FACTURA', 'DIAN', 'national', array['CO'], 'adapters/colombia/factura-electronica-dian', '{"sandbox": false, "production": false, "documents": ["FACTURA_ELECTRONICA_DIAN"]}'::jsonb, 'planned', '{}'::jsonb),
  ('PE', 'PE-SUNAT-COMPROBANTE', 'SUNAT', 'national', array['PE'], 'adapters/peru/comprobante-electronico', '{"sandbox": false, "production": false, "documents": ["COMPROBANTE_ELECTRONICO"]}'::jsonb, 'planned', '{}'::jsonb),
  ('UY', 'UY-DGI-CFE', 'Dirección General Impositiva (DGI)', 'national', array['UY'], 'adapters/uruguay/cfe', '{"sandbox": false, "production": false, "documents": ["CFE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('PY', 'PY-SET-SIFEN', 'Subsecretaría de Estado de Tributación (SET)', 'national', array['PY'], 'adapters/paraguay/sifen', '{"sandbox": false, "production": false, "documents": ["SIFEN"]}'::jsonb, 'planned', '{}'::jsonb),
  ('EC', 'EC-SRI-COMPROBANTE', 'Servicio de Rentas Internas (SRI)', 'national', array['EC'], 'adapters/ecuador/comprobante-electronico', '{"sandbox": false, "production": false, "documents": ["COMPROBANTE_ELECTRONICO"]}'::jsonb, 'planned', '{}'::jsonb),

  -- Asia-Pacific
  ('JP', 'JP-NTA-JCT', 'National Tax Agency (NTA)', 'national', array['JP'], 'adapters/japan/jct', '{"sandbox": false, "production": false, "documents": ["QUALIFIED_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('SG', 'SG-IRAS-GST', 'Inland Revenue Authority of Singapore (IRAS)', 'national', array['SG'], 'adapters/singapore/gst', '{"sandbox": false, "production": false, "documents": ["TAX_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('IN', 'IN-GSTN-GST', 'GSTN / Invoice Registration Portal (IRP)', 'national', array['IN'], 'adapters/india/gst', '{"sandbox": false, "production": false, "documents": ["GST_EINVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('CN', 'CN-STA-FAPIAO', 'State Taxation Administration', 'national', array['CN'], 'adapters/china/vat', '{"sandbox": false, "production": false, "documents": ["FAPIAO"]}'::jsonb, 'planned', '{}'::jsonb),
  ('KR', 'KR-NTS-VAT', 'National Tax Service (NTS)', 'national', array['KR'], 'adapters/south_korea/vat', '{"sandbox": false, "production": false, "documents": ["E_TAX_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('AU', 'AU-ATO-GST', 'Australian Taxation Office (ATO)', 'national', array['AU'], 'adapters/australia/gst', '{"sandbox": false, "production": false, "documents": ["TAX_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('NZ', 'NZ-IR-GST', 'Inland Revenue (IR)', 'national', array['NZ'], 'adapters/new_zealand/gst', '{"sandbox": false, "production": false, "documents": ["TAX_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),

  -- Middle East
  ('AE', 'AE-FTA-VAT', 'Federal Tax Authority (FTA)', 'national', array['AE'], 'adapters/uae/vat', '{"sandbox": false, "production": false, "documents": ["TAX_INVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('SA', 'SA-ZATCA-VAT', 'ZATCA (Fatoora)', 'national', array['SA'], 'adapters/saudi_arabia/vat', '{"sandbox": false, "production": false, "documents": ["ZATCA_EINVOICE"]}'::jsonb, 'planned', '{}'::jsonb),
  ('QA', 'QA-GTA-VAT', 'General Tax Authority (GTA)', 'national', array['QA'], 'adapters/qatar/vat', '{"sandbox": false, "production": false, "documents": ["TAX_INVOICE"]}'::jsonb, 'planned', '{"vat_status": "not_yet_confirmed_general"}'::jsonb)
on conflict (country_code, authority_code) do update
set name = excluded.name,
    authority_level = excluded.authority_level,
    jurisdiction_path = excluded.jurisdiction_path,
    adapter_key = excluded.adapter_key,
    environment_capabilities = excluded.environment_capabilities,
    metadata = excluded.metadata;

-- Rejections panel: surfaces rejected/failed fiscal documents with their
-- most recent lifecycle event so a reviewer can see why an authority (or
-- internal validation) refused the document.
create or replace function core.list_fiscal_document_rejections_as_admin(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select coalesce(
    jsonb_agg(
      core.fiscal_document_json(fd) || jsonb_build_object('last_event', last_event.event_json)
      order by fd.updated_at desc
    ),
    '[]'::jsonb
  )
  from core.fiscal_documents as fd
  left join lateral (
    select jsonb_build_object(
      'event_type', fe.event_type,
      'from_status', fe.from_status,
      'to_status', fe.to_status,
      'authority_protocol', fe.authority_protocol,
      'payload', fe.payload,
      'created_at', fe.created_at
    ) as event_json
    from core.fiscal_document_events as fe
    where fe.tenant_id = fd.tenant_id and fe.fiscal_document_id = fd.id
    order by fe.created_at desc
    limit 1
  ) as last_event on true
  where fd.tenant_id = p_tenant_id
    and fd.status in ('rejected', 'failed')
$$;

create or replace function core.list_fiscal_document_rejections_as_current_user(p_tenant_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, core, auth, pg_temp
as $$
begin
  if not core.user_has_permission(p_tenant_id, 'documents.read') then
    raise exception 'documents.read permission is required'
      using errcode = '42501';
  end if;

  return core.list_fiscal_document_rejections_as_admin(p_tenant_id);
end;
$$;

create or replace function public.helvok_admin_list_fiscal_rejections(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.list_fiscal_document_rejections_as_admin(p_tenant_id)
$$;

create or replace function public.helvok_current_list_fiscal_rejections(p_tenant_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, core, pg_temp
as $$
  select core.list_fiscal_document_rejections_as_current_user(p_tenant_id)
$$;

revoke all on function public.helvok_admin_list_fiscal_rejections(uuid) from public, anon, authenticated;
revoke all on function public.helvok_current_list_fiscal_rejections(uuid) from public, anon;

grant execute on function public.helvok_admin_list_fiscal_rejections(uuid) to service_role;
grant execute on function public.helvok_current_list_fiscal_rejections(uuid) to authenticated, service_role;

comment on function core.list_fiscal_document_rejections_as_admin(uuid) is
  'Lists rejected/failed fiscal documents with their most recent lifecycle event, for the rejections review panel.';

commit;
