import { getMarket } from "../../../tax/rule-pack";
import { ACCOUNTANT_REVIEW_REQUIREMENT, GOVERNMENT_ENROLLMENT_REQUIREMENT, simpleCountryAdapter } from "./common";
import type { AdapterManifest } from "../types";

const MIDDLE_EAST_COUNTRIES = [
  { code: "AE", key: "uae", document: "TAX_INVOICE", authority: "Federal Tax Authority (FTA)", tax: "VAT" },
  { code: "SA", key: "saudi_arabia", document: "ZATCA_EINVOICE", authority: "ZATCA (Fatoora)", tax: "VAT" },
  { code: "QA", key: "qatar", document: "TAX_INVOICE", authority: "General Tax Authority (GTA)", tax: "VAT" },
] as const;

function middleEastCountryAdapter(country: (typeof MIDDLE_EAST_COUNTRIES)[number]): AdapterManifest {
  const market = getMarket(country.code);
  const countryName = market?.name ?? country.code;

  return simpleCountryAdapter({
    adapterKey: `adapters/${country.key}/${country.tax.toLowerCase()}`,
    countryCode: country.code,
    region: "middle_east",
    authorityLevel: "national",
    authorityName: country.authority,
    documentFamilies: [country.document],
    taxFamilies: [country.tax],
    requirements: [
      GOVERNMENT_ENROLLMENT_REQUIREMENT(`Registro de VAT junto à ${country.authority} em ${countryName}`),
      {
        key: "me_local_einvoicing_system",
        label: `Integração com o sistema local de e-invoicing: ${country.document}`,
        category: "software_credential",
        required_for_production: true,
      },
      ACCOUNTANT_REVIEW_REQUIREMENT,
    ],
    officialSources: market?.sourceUrl ? [market.sourceUrl] : [],
    notes:
      `Sistema local: ${country.document}, autoridade ${country.authority}. Qatar ainda não confirma VAT geral em produção ` +
      "(seed manual-required); nenhum conector governamental real foi implementado ainda.",
  });
}

export const MIDDLE_EAST_ADAPTER_MANIFESTS: AdapterManifest[] = MIDDLE_EAST_COUNTRIES.map(middleEastCountryAdapter);
