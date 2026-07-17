import { defineAdapterManifest } from "../types";
import type { AdapterManifest, AdapterJurisdictionUnit } from "../types";

export const CANADA_PROVINCES: AdapterJurisdictionUnit[] = [
  { code: "ON", name: "Ontario" },
  { code: "QC", name: "Quebec" },
  { code: "BC", name: "British Columbia" },
  { code: "AB", name: "Alberta" },
  { code: "MB", name: "Manitoba" },
  { code: "SK", name: "Saskatchewan" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "PE", name: "Prince Edward Island" },
];

function canadaGstHstPst(): AdapterManifest {
  return defineAdapterManifest({
    adapter_key: "adapters/canada/gst-hst-pst-qst",
    country_code: "CA",
    region: "canada",
    authority_level: "province",
    authority_name: "Canada Revenue Agency (GST/HST) e autoridades provinciais (PST/QST)",
    document_families: ["SALES_TAX_REPORT", "SALES_RECEIPT"],
    tax_families: ["GST", "HST", "PST", "QST"],
    supported_jurisdictions: CANADA_PROVINCES,
    supported_capabilities: ["manifest", "validateOperation"],
    requirements: [
      {
        key: "ca_business_number",
        label: "Business Number (BN) registrado na CRA com conta GST/HST",
        category: "government_enrollment",
        required_for_production: true,
      },
      {
        key: "ca_provincial_sales_tax_registration",
        label: "Registro de PST/QST nas províncias aplicáveis (BC, SK, MB, QC)",
        category: "government_enrollment",
        required_for_production: true,
      },
      {
        key: "ca_place_of_supply_rules",
        label: "Regras de place-of-supply aplicadas por província de destino",
        category: "legal_registration",
        required_for_production: true,
      },
      {
        key: "ca_accountant_review",
        label: "Revisão de alíquota GST/HST/PST/QST por contador/revisor local",
        category: "accountant_review",
        required_for_production: true,
      },
    ],
    sandbox_support: false,
    production_support: false,
    status: "planned",
    official_sources: [
      "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate.html",
    ],
    notes:
      "GST/HST/PST/QST variam por província e por place-of-supply. Nenhuma alíquota real ou transmissão a autoridade está " +
      "implementada; esta é apenas a descrição de províncias/territórios prioritários e requisitos.",
  });
}

export const CANADA_ADAPTER_MANIFESTS: AdapterManifest[] = [canadaGstHstPst()];
