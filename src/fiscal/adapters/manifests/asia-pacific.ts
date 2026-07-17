import { getMarket } from "../../../tax/rule-pack";
import { ACCOUNTANT_REVIEW_REQUIREMENT, GOVERNMENT_ENROLLMENT_REQUIREMENT, simpleCountryAdapter } from "./common";
import type { AdapterManifest } from "../types";

const ASIA_PACIFIC_COUNTRIES = [
  { code: "JP", key: "japan", document: "QUALIFIED_INVOICE", authority: "National Tax Agency (NTA)", tax: "JCT" },
  { code: "SG", key: "singapore", document: "TAX_INVOICE", authority: "IRAS", tax: "GST" },
  { code: "IN", key: "india", document: "GST_EINVOICE", authority: "GSTN / IRP", tax: "GST" },
  { code: "CN", key: "china", document: "FAPIAO", authority: "State Taxation Administration", tax: "VAT" },
  { code: "KR", key: "south_korea", document: "E_TAX_INVOICE", authority: "National Tax Service (NTS)", tax: "VAT" },
  { code: "AU", key: "australia", document: "TAX_INVOICE", authority: "Australian Taxation Office (ATO)", tax: "GST" },
  { code: "NZ", key: "new_zealand", document: "TAX_INVOICE", authority: "Inland Revenue (IR)", tax: "GST" },
] as const;

function asiaPacificCountryAdapter(country: (typeof ASIA_PACIFIC_COUNTRIES)[number]): AdapterManifest {
  const market = getMarket(country.code);
  const countryName = market?.name ?? country.code;

  return simpleCountryAdapter({
    adapterKey: `adapters/${country.key}/${country.tax.toLowerCase()}`,
    countryCode: country.code,
    region: "asia_pacific",
    authorityLevel: "national",
    authorityName: country.authority,
    documentFamilies: [country.document],
    taxFamilies: [country.tax],
    requirements: [
      GOVERNMENT_ENROLLMENT_REQUIREMENT(`Registro/credenciamento junto à ${country.authority} em ${countryName}`),
      {
        key: "apac_local_invoicing_system",
        label: `Integração com o sistema local de emissão: ${country.document}`,
        category: "software_credential",
        required_for_production: true,
      },
      ACCOUNTANT_REVIEW_REQUIREMENT,
    ],
    officialSources: market?.sourceUrl ? [market.sourceUrl] : [],
    notes:
      `Sistema local: ${country.document}, autoridade ${country.authority}, tributo ${country.tax}. Nenhum conector governamental ` +
      "real foi implementado ainda; apenas a descrição do adaptador e seus requisitos.",
  });
}

export const ASIA_PACIFIC_ADAPTER_MANIFESTS: AdapterManifest[] = ASIA_PACIFIC_COUNTRIES.map(asiaPacificCountryAdapter);
