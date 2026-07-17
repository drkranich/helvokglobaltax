import { getMarket } from "../../../tax/rule-pack";
import { ACCOUNTANT_REVIEW_REQUIREMENT, GOVERNMENT_ENROLLMENT_REQUIREMENT, simpleCountryAdapter } from "./common";
import type { AdapterManifest } from "../types";

const LATAM_COUNTRIES = [
  { code: "MX", key: "mexico", document: "CFDI", authority: "SAT (Servicio de Administración Tributaria)" },
  { code: "CL", key: "chile", document: "DTE", authority: "SII (Servicio de Impuestos Internos)" },
  { code: "AR", key: "argentina", document: "FACTURA_ELECTRONICA", authority: "AFIP/ARCA" },
  { code: "CO", key: "colombia", document: "FACTURA_ELECTRONICA_DIAN", authority: "DIAN" },
  { code: "PE", key: "peru", document: "COMPROBANTE_ELECTRONICO", authority: "SUNAT" },
  { code: "UY", key: "uruguay", document: "CFE", authority: "DGI" },
  { code: "PY", key: "paraguay", document: "SIFEN", authority: "SET (Subsecretaría de Estado de Tributación)" },
  { code: "EC", key: "ecuador", document: "COMPROBANTE_ELECTRONICO", authority: "SRI" },
] as const;

function latamCountryAdapter(country: (typeof LATAM_COUNTRIES)[number]): AdapterManifest {
  const market = getMarket(country.code);
  const countryName = market?.name ?? country.code;

  return simpleCountryAdapter({
    adapterKey: `adapters/${country.key}/${country.document.toLowerCase().replace(/_/g, "-")}`,
    countryCode: country.code,
    region: "latam",
    authorityLevel: "national",
    authorityName: country.authority,
    documentFamilies: [country.document],
    taxFamilies: ["IVA_OR_LOCAL_EQUIVALENT"],
    requirements: [
      GOVERNMENT_ENROLLMENT_REQUIREMENT(`Credenciamento junto à ${country.authority} para emissão de ${country.document}`),
      {
        key: "latam_local_certificate",
        label: `Certificado digital/CSD/CAF local exigido por ${country.authority}`,
        category: "digital_certificate",
        required_for_production: true,
      },
      ACCOUNTANT_REVIEW_REQUIREMENT,
    ],
    officialSources: market?.sourceUrl ? [market.sourceUrl] : [],
    notes:
      `Documento eletrônico local: ${country.document}, autoridade ${country.authority}. Nenhum conector governamental real, ` +
      "certificado ou assinatura foi implementado ainda; apenas a descrição do adaptador e seus requisitos.",
  });
}

export const LATAM_ADAPTER_MANIFESTS: AdapterManifest[] = LATAM_COUNTRIES.map(latamCountryAdapter);
