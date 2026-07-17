import { defineAdapterManifest } from "../types";
import type { AdapterManifest, AdapterJurisdictionUnit } from "../types";

export const US_PRIORITY_STATES: AdapterJurisdictionUnit[] = [
  { code: "FL", name: "Florida" },
  { code: "TX", name: "Texas" },
  { code: "CA", name: "California" },
  { code: "NY", name: "New York" },
  { code: "DE", name: "Delaware" },
  { code: "NV", name: "Nevada" },
  { code: "WY", name: "Wyoming" },
  { code: "IL", name: "Illinois" },
  { code: "PA", name: "Pennsylvania" },
  { code: "NJ", name: "New Jersey" },
];

function usaSalesTax(): AdapterManifest {
  return defineAdapterManifest({
    adapter_key: "adapters/usa/sales-tax",
    country_code: "US",
    region: "usa",
    authority_level: "state",
    authority_name: "State, county, and city sales tax authorities",
    document_families: ["SALES_TAX_REPORT", "SALES_RECEIPT"],
    tax_families: ["SALES_TAX", "USE_TAX"],
    supported_jurisdictions: US_PRIORITY_STATES,
    supported_capabilities: ["manifest", "validateOperation"],
    requirements: [
      {
        key: "us_nexus_determination",
        label: "Determinação de nexus físico e econômico por estado antes de cobrar sales tax",
        category: "legal_registration",
        required_for_production: true,
      },
      {
        key: "us_state_sales_tax_permit",
        label: "Registro de sales tax permit no(s) estado(s) com nexus",
        category: "government_enrollment",
        required_for_production: true,
      },
      {
        key: "us_marketplace_facilitator_review",
        label: "Confirmar se o canal é marketplace facilitator (imposto recolhido pelo marketplace, não pelo seller)",
        category: "legal_registration",
        required_for_production: true,
      },
      {
        key: "us_reseller_exemption_certificate",
        label: "Reseller/exemption certificate arquivado quando o comprador for revendedor ou isento",
        category: "legal_registration",
        required_for_production: false,
      },
      {
        key: "us_rate_engine_credential",
        label: "Credencial de motor de alíquotas (state/county/city/special district) atualizado por vigência",
        category: "software_credential",
        required_for_production: true,
      },
      {
        key: "us_accountant_review",
        label: "Revisão de nexus, produto tributável e alíquota composta por contador/revisor local",
        category: "accountant_review",
        required_for_production: true,
      },
    ],
    sandbox_support: false,
    production_support: false,
    status: "planned",
    official_sources: ["https://www.taxadmin.org/state-tax-agencies"],
    notes:
      "Não existe VAT federal nos EUA. Sales tax depende de nexus físico/econômico, estado, county, city e special tax district, " +
      "além de marketplace facilitator laws que podem transferir a obrigação para o canal. Nenhuma alíquota real ou transmissão " +
      "a autoridade está implementada; esta é apenas a descrição de jurisdições prioritárias e requisitos.",
  });
}

export const USA_ADAPTER_MANIFESTS: AdapterManifest[] = [usaSalesTax()];
