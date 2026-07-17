import { defineAdapterManifest } from "../types";
import type { AdapterManifest, AdapterRegion, AdapterRequirement } from "../types";

export const GOVERNMENT_ENROLLMENT_REQUIREMENT = (label: string): AdapterRequirement => ({
  key: "government_enrollment",
  label,
  category: "government_enrollment",
  required_for_production: true,
});

export const TAX_REPRESENTATIVE_REQUIREMENT: AdapterRequirement = {
  key: "tax_representative",
  label: "Representante fiscal ou entidade legal registrada na jurisdição de destino",
  category: "tax_representative",
  required_for_production: true,
};

export const ACCOUNTANT_REVIEW_REQUIREMENT: AdapterRequirement = {
  key: "accountant_review",
  label: "Revisão de regra tributária por contador/revisor local antes da emissão real",
  category: "accountant_review",
  required_for_production: true,
};

export const SOFTWARE_CREDENTIAL_REQUIREMENT = (label: string): AdapterRequirement => ({
  key: "software_credential",
  label,
  category: "software_credential",
  required_for_production: true,
});

export const NOT_YET_CONNECTED_NOTE =
  "Escopo Fase 0: descrição de capacidades e requisitos apenas. Nenhum conector governamental real foi implementado; nenhum documento é transmitido a uma autoridade de verdade por este adaptador ainda.";

interface SimpleCountryAdapterInput {
  adapterKey: string;
  countryCode: string;
  region: AdapterRegion;
  authorityLevel: AdapterManifest["authority_level"];
  authorityName: string;
  documentFamilies: string[];
  taxFamilies: string[];
  capabilities?: AdapterManifest["supported_capabilities"];
  requirements: AdapterRequirement[];
  officialSources?: string[];
  notes?: string;
}

export function simpleCountryAdapter(input: SimpleCountryAdapterInput): AdapterManifest {
  return defineAdapterManifest({
    adapter_key: input.adapterKey,
    country_code: input.countryCode,
    region: input.region,
    authority_level: input.authorityLevel,
    authority_name: input.authorityName,
    document_families: input.documentFamilies,
    tax_families: input.taxFamilies,
    supported_jurisdictions: [{ code: input.countryCode, name: input.authorityName }],
    supported_capabilities: input.capabilities ?? ["manifest"],
    requirements: input.requirements,
    sandbox_support: false,
    production_support: false,
    status: "planned",
    official_sources: input.officialSources ?? [],
    notes: input.notes ?? NOT_YET_CONNECTED_NOTE,
  });
}
