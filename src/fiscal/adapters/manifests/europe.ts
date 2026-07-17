import { getMarket } from "../../../tax/rule-pack";
import { ACCOUNTANT_REVIEW_REQUIREMENT, GOVERNMENT_ENROLLMENT_REQUIREMENT, simpleCountryAdapter } from "./common";
import type { AdapterManifest } from "../types";

// "Europa não é um adaptador único. Cada país possui módulo próprio."
// docs/architecture/06-country-plugin-strategy.md
const EUROPE_PRIORITY_COUNTRIES = [
  { code: "PT", key: "portugal" },
  { code: "ES", key: "spain" },
  { code: "FR", key: "france" },
  { code: "DE", key: "germany" },
  { code: "IT", key: "italy" },
  { code: "NL", key: "netherlands" },
  { code: "BE", key: "belgium" },
  { code: "IE", key: "ireland" },
  { code: "CH", key: "switzerland" },
  { code: "GB", key: "uk" },
  { code: "PL", key: "poland" },
  { code: "SE", key: "sweden" },
  { code: "GR", key: "greece" },
  { code: "RO", key: "romania" },
] as const;

// Portugal and Germany already have a seeded adapter_key in
// core.fiscal_authorities (adapters/portugal/einvoice, adapters/germany/einvoice);
// keep those exact keys so this registry and the DB seed refer to the same adapter.
const ADAPTER_KEY_OVERRIDES: Record<string, string> = {
  PT: "adapters/portugal/einvoice",
  DE: "adapters/germany/einvoice",
};

function europeCountryAdapter(code: string, key: string): AdapterManifest {
  const market = getMarket(code);
  const countryName = market?.name ?? code;
  const eInvoiceStatus = market?.eInvoiceStatus ?? "e-invoicing local a confirmar";

  return simpleCountryAdapter({
    adapterKey: ADAPTER_KEY_OVERRIDES[code] ?? `adapters/${key}/vat`,
    countryCode: code,
    region: "europe",
    authorityLevel: code === "CH" ? "national" : "national",
    authorityName: `Autoridade tributária de ${countryName}`,
    documentFamilies: ["VAT_INVOICE", "EINVOICE"],
    taxFamilies: ["VAT", "OSS", "IOSS", "EORI", "INTRASTAT"],
    requirements: [
      GOVERNMENT_ENROLLMENT_REQUIREMENT(`Registro de VAT/IVA local em ${countryName}, obrigatório quando o tenant ultrapassa o threshold OSS/IOSS de EUR 10.000/ano em vendas B2C cross-border na UE (regra única da UE desde julho/2021) ou vende localmente a partir de um estabelecimento no país`),
      {
        key: "eu_oss_ioss_threshold",
        label: "Threshold único da UE de EUR 10.000/ano em vendas B2C cross-border para decidir entre VAT local vs OSS/IOSS",
        category: "government_enrollment",
        required_for_production: true,
      },
      {
        key: "eu_eori_registration",
        label: "Número EORI para operações de importação/exportação com a UE",
        category: "government_enrollment",
        required_for_production: false,
      },
      {
        key: "eu_einvoicing_format",
        label: `Formato de e-invoicing/SAF-T local: ${eInvoiceStatus}`,
        category: "software_credential",
        required_for_production: true,
      },
      ACCOUNTANT_REVIEW_REQUIREMENT,
    ],
    officialSources: market?.sourceUrl ? [market.sourceUrl] : [],
    notes:
      `Cada país da Europa é um módulo próprio (não existe adaptador único de "VAT europeu"). Formato local declarado: ${eInvoiceStatus}. ` +
      (market?.ratesVerifiedAt
        ? `Alíquota padrão${market.reducedRates?.length ? " e reduzida(s)" : ""} verificada em fonte oficial/autoritativa em ${market.ratesVerifiedAt}. `
        : "Alíquota ainda não verificada em fonte oficial para este país. ") +
      "Transmissão real à autoridade e assinatura de documento seguem não implementadas: dependem do tenant ter registro fiscal local/OSS e credencial de e-invoicing do país, exatamente como o Brasil depende de CNPJ e credenciamento SEFAZ.",
  });
}

export const EUROPE_ADAPTER_MANIFESTS: AdapterManifest[] = EUROPE_PRIORITY_COUNTRIES.map((country) =>
  europeCountryAdapter(country.code, country.key),
);
