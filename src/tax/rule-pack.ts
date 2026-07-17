export type TaxMarket = {
  code: string;
  name: string;
  region: string;
  currency: string;
  indirectTaxName: string;
  standardRate: number;
  defaultDutyRate: number;
  eInvoiceStatus: string;
  sourceStatus: "official-seed" | "estimated-seed" | "manual-required";
  sourceUrl?: string;
  notes: string[];
  /**
   * Reduced VAT rate(s) for qualifying goods/services, as decimals (e.g. 0.06).
   * Optional: only populated where verified against an official/authoritative
   * source. Absence does not mean "no reduced rate exists", it means this
   * rule pack has not verified it yet.
   */
  reducedRates?: number[];
  /** Super-reduced rate below the EU 5% floor, where the country has one (e.g. France, Ireland, Italy, Spain). */
  superReducedRate?: number;
  /** "Parking rate" transitional category still used by some EU countries (e.g. Portugal, Ireland, Belgium). */
  parkingRate?: number;
  /** ISO date (YYYY-MM-DD) this specific rate snapshot was last verified against an official/authoritative source. */
  ratesVerifiedAt?: string;
};

export type BrazilStateTaxFamily = {
  code: "ICMS" | "ICMS_ST" | "DIFAL" | "FCP" | "FECP" | "ISS" | "IPI" | "PIS_COFINS";
  name: string;
  scope: "state" | "municipal" | "federal";
  status: "manual-required";
  requiredData: string[];
  notes: string[];
};

export type BrazilStateTaxProfile = {
  code: string;
  name: string;
  region: string;
  sefaz: string;
  nfeAuthority: string;
  nfceAuthority: string;
  nfseMode: "municipal" | "national-standard" | "hybrid";
  defaultCurrency: "BRL";
  sourceStatus: "manual-required";
  taxFamilies: BrazilStateTaxFamily[];
  operationalNotes: string[];
};

export const RULE_PACK_VERSION = "global-indirect-tax-seed-2026.07.17-eu14-official-rates";

const BRAZIL_STATE_FAMILIES: BrazilStateTaxFamily[] = [
  {
    code: "ICMS",
    name: "ICMS interno e interestadual",
    scope: "state",
    status: "manual-required",
    requiredData: ["UF origem", "UF destino", "NCM", "CFOP", "CST/CSOSN", "regime tributario", "tipo de cliente"],
    notes: ["Alíquota e base dependem da UF, produto, operação, benefício fiscal e vigência legal."],
  },
  {
    code: "ICMS_ST",
    name: "ICMS Substituição Tributária",
    scope: "state",
    status: "manual-required",
    requiredData: ["NCM/CEST", "MVA", "convênio/protocolo", "UF destino", "regime", "responsável tributário"],
    notes: ["Pode não aplicar a todos os produtos. Bebidas, cosméticos, autopeças e outros segmentos exigem tabela própria."],
  },
  {
    code: "DIFAL",
    name: "DIFAL",
    scope: "state",
    status: "manual-required",
    requiredData: ["UF origem", "UF destino", "consumidor final", "contribuinte ICMS", "alíquota interna destino"],
    notes: ["Regra relevante em operações interestaduais para consumidor final e deve considerar partilha vigente quando aplicável."],
  },
  {
    code: "FCP",
    name: "FCP / adicional estadual",
    scope: "state",
    status: "manual-required",
    requiredData: ["UF destino", "NCM", "categoria do produto", "base ICMS/DIFAL"],
    notes: ["Fundo de combate à pobreza/adicional pode existir por UF e por produto."],
  },
  {
    code: "ISS",
    name: "ISS municipal",
    scope: "municipal",
    status: "manual-required",
    requiredData: ["município", "código de serviço", "local da prestação", "tomador", "retenção"],
    notes: ["Serviços dependem de legislação municipal e NFS-e do município ou padrão nacional."],
  },
  {
    code: "IPI",
    name: "IPI",
    scope: "federal",
    status: "manual-required",
    requiredData: ["NCM/TIPI", "industrialização", "CNPJ fabricante/importador", "enquadramento legal"],
    notes: ["Federal, mas impacta custo e base em operações com mercadorias industrializadas."],
  },
  {
    code: "PIS_COFINS",
    name: "PIS/COFINS",
    scope: "federal",
    status: "manual-required",
    requiredData: ["regime cumulativo/não cumulativo", "CST", "produto/serviço", "receita tributável"],
    notes: ["Federal, mas precisa entrar na formação de preço para clientes brasileiros."],
  },
];

const BRAZIL_STATES = [
  ["AC", "Acre", "Norte"],
  ["AL", "Alagoas", "Nordeste"],
  ["AP", "Amapá", "Norte"],
  ["AM", "Amazonas", "Norte"],
  ["BA", "Bahia", "Nordeste"],
  ["CE", "Ceará", "Nordeste"],
  ["DF", "Distrito Federal", "Centro-Oeste"],
  ["ES", "Espírito Santo", "Sudeste"],
  ["GO", "Goiás", "Centro-Oeste"],
  ["MA", "Maranhão", "Nordeste"],
  ["MT", "Mato Grosso", "Centro-Oeste"],
  ["MS", "Mato Grosso do Sul", "Centro-Oeste"],
  ["MG", "Minas Gerais", "Sudeste"],
  ["PA", "Pará", "Norte"],
  ["PB", "Paraíba", "Nordeste"],
  ["PR", "Paraná", "Sul"],
  ["PE", "Pernambuco", "Nordeste"],
  ["PI", "Piauí", "Nordeste"],
  ["RJ", "Rio de Janeiro", "Sudeste"],
  ["RN", "Rio Grande do Norte", "Nordeste"],
  ["RS", "Rio Grande do Sul", "Sul"],
  ["RO", "Rondônia", "Norte"],
  ["RR", "Roraima", "Norte"],
  ["SC", "Santa Catarina", "Sul"],
  ["SP", "São Paulo", "Sudeste"],
  ["SE", "Sergipe", "Nordeste"],
  ["TO", "Tocantins", "Norte"],
] as const;

export const BRAZIL_STATE_TAX_PROFILES: BrazilStateTaxProfile[] = BRAZIL_STATES.map(([code, name, region]) => ({
  code,
  name,
  region,
  sefaz: `SEFAZ ${code}`,
  nfeAuthority: `SEFAZ ${code} / Ambiente Nacional NF-e`,
  nfceAuthority: `SEFAZ ${code} / NFC-e`,
  nfseMode: "hybrid",
  defaultCurrency: "BRL",
  sourceStatus: "manual-required",
  taxFamilies: BRAZIL_STATE_FAMILIES,
  operationalNotes: [
    "Usar UF origem/destino, NCM, CFOP, CST/CSOSN e regime antes de transformar estimativa em emissão.",
    "Alíquotas internas, benefícios, MVA, FCP e regras de ST devem ser versionados por vigência.",
    "Serviços exigem município e código de serviço; NFS-e não pode ser deduzida só pela UF.",
  ],
}));

export function getBrazilStateTaxProfile(stateCode: string | null | undefined): BrazilStateTaxProfile | undefined {
  const normalized = typeof stateCode === "string" ? stateCode.trim().toUpperCase() : "";
  return BRAZIL_STATE_TAX_PROFILES.find((profile) => profile.code === normalized);
}

export const EXPORT_MARKETS: TaxMarket[] = [
  {
    code: "BR",
    name: "Brasil",
    region: "América Latina",
    currency: "BRL",
    indirectTaxName: "ICMS/IPI/PIS/COFINS/ISS",
    standardRate: 0,
    defaultDutyRate: 0,
    eInvoiceStatus: "NF-e, NFC-e, NFS-e por adaptador Brasil",
    sourceStatus: "manual-required",
    notes: ["Calculo doméstico exige NCM, CFOP, CST/CSOSN, UF origem/destino, regime e município."],
  },
  {
    code: "US",
    name: "Estados Unidos",
    region: "América do Norte",
    currency: "USD",
    indirectTaxName: "Sales Tax",
    standardRate: 0,
    defaultDutyRate: 0.05,
    eInvoiceStatus: "state/local sales tax, nexus e marketplace facilitator",
    sourceStatus: "manual-required",
    notes: ["Não existe VAT federal. Sales tax depende de estado, cidade, county, produto e nexus."],
  },
  {
    code: "CA",
    name: "Canadá",
    region: "América do Norte",
    currency: "CAD",
    indirectTaxName: "GST/HST/PST/QST",
    standardRate: 0.05,
    defaultDutyRate: 0.06,
    eInvoiceStatus: "GST/HST por place-of-supply",
    sourceStatus: "official-seed",
    sourceUrl: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate.html",
    notes: ["GST/HST varia por província/território; substitua a alíquota pelo destino real."],
  },
  {
    code: "MX",
    name: "México",
    region: "América Latina",
    currency: "MXN",
    indirectTaxName: "IVA",
    standardRate: 0.16,
    defaultDutyRate: 0.08,
    eInvoiceStatus: "CFDI por adaptador México",
    sourceStatus: "estimated-seed",
    notes: ["Pode haver taxa reduzida/fronteira, IEPS e regras CFDI por produto."],
  },
  { code: "AR", name: "Argentina", region: "América Latina", currency: "ARS", indirectTaxName: "IVA", standardRate: 0.21, defaultDutyRate: 0.12, eInvoiceStatus: "Factura electrónica", sourceStatus: "estimated-seed", notes: ["Pode envolver percepciones/retenciones e impostos provinciais."] },
  { code: "CL", name: "Chile", region: "América Latina", currency: "CLP", indirectTaxName: "IVA", standardRate: 0.19, defaultDutyRate: 0.06, eInvoiceStatus: "DTE", sourceStatus: "estimated-seed", notes: ["Classificação aduaneira e tratados podem alterar duty."] },
  { code: "CO", name: "Colômbia", region: "América Latina", currency: "COP", indirectTaxName: "IVA", standardRate: 0.19, defaultDutyRate: 0.1, eInvoiceStatus: "Factura electrónica DIAN", sourceStatus: "estimated-seed", notes: ["Pode haver retenciones e regimes especiais."] },
  { code: "PE", name: "Peru", region: "América Latina", currency: "PEN", indirectTaxName: "IGV", standardRate: 0.18, defaultDutyRate: 0.06, eInvoiceStatus: "Comprobante electrónico SUNAT", sourceStatus: "estimated-seed", notes: ["Duty depende de partida arancelaria."] },
  { code: "UY", name: "Uruguai", region: "América Latina", currency: "UYU", indirectTaxName: "IVA", standardRate: 0.22, defaultDutyRate: 0.08, eInvoiceStatus: "CFE", sourceStatus: "estimated-seed", notes: ["Pode haver alíquota mínima/reduzida por produto."] },
  { code: "PY", name: "Paraguai", region: "América Latina", currency: "PYG", indirectTaxName: "IVA", standardRate: 0.1, defaultDutyRate: 0.08, eInvoiceStatus: "SIFEN", sourceStatus: "estimated-seed", notes: ["Requer confirmação por regime/produto."] },
  { code: "EC", name: "Equador", region: "América Latina", currency: "USD", indirectTaxName: "IVA", standardRate: 0.15, defaultDutyRate: 0.1, eInvoiceStatus: "Comprobantes electrónicos SRI", sourceStatus: "estimated-seed", notes: ["Alíquota e ICE podem variar por produto."] },
  { code: "AG", name: "Antígua e Barbuda", region: "Caribe", currency: "XCD", indirectTaxName: "ABST", standardRate: 0.15, defaultDutyRate: 0.05, eInvoiceStatus: "commercial invoice/customs", sourceStatus: "estimated-seed", notes: ["CARICOM/CARIFORUM; livre comércio depende de origem preferencial, HS code e acordo aplicável."] },
  { code: "BS", name: "Bahamas", region: "Caribe", currency: "BSD", indirectTaxName: "VAT", standardRate: 0.1, defaultDutyRate: 0.05, eInvoiceStatus: "VAT/customs", sourceStatus: "estimated-seed", notes: ["CARIFORUM EPA; Bahamas não integra a união aduaneira CARICOM. Validar regra de origem."] },
  { code: "BB", name: "Barbados", region: "Caribe", currency: "BBD", indirectTaxName: "VAT", standardRate: 0.175, defaultDutyRate: 0.05, eInvoiceStatus: "VAT/customs", sourceStatus: "estimated-seed", notes: ["CARICOM/CARIFORUM; confirmar origem preferencial e categoria do produto."] },
  { code: "DM", name: "Dominica", region: "Caribe", currency: "XCD", indirectTaxName: "VAT", standardRate: 0.15, defaultDutyRate: 0.05, eInvoiceStatus: "VAT/customs", sourceStatus: "estimated-seed", notes: ["CARICOM/CARIFORUM; confirmar certificado de origem e tratamento preferencial."] },
  { code: "DO", name: "República Dominicana", region: "Caribe", currency: "DOP", indirectTaxName: "ITBIS", standardRate: 0.18, defaultDutyRate: 0.06, eInvoiceStatus: "e-CF / DGII", sourceStatus: "estimated-seed", notes: ["CARIFORUM EPA e acordos regionais; validar regra de origem, canal e produto."] },
  { code: "GD", name: "Granada", region: "Caribe", currency: "XCD", indirectTaxName: "VAT", standardRate: 0.15, defaultDutyRate: 0.05, eInvoiceStatus: "VAT/customs", sourceStatus: "estimated-seed", notes: ["CARICOM/CARIFORUM; confirmar origem preferencial e classificação aduaneira."] },
  { code: "GY", name: "Guiana", region: "Caribe", currency: "GYD", indirectTaxName: "VAT", standardRate: 0.14, defaultDutyRate: 0.06, eInvoiceStatus: "VAT/customs", sourceStatus: "estimated-seed", notes: ["CARICOM/CARIFORUM; validar regra de origem e licença quando aplicável."] },
  { code: "HT", name: "Haiti", region: "Caribe", currency: "HTG", indirectTaxName: "TCA", standardRate: 0.1, defaultDutyRate: 0.06, eInvoiceStatus: "customs/commercial invoice", sourceStatus: "manual-required", notes: ["CARICOM/CARIFORUM; aplicação de preferências exige validação específica antes de cotar."] },
  { code: "JM", name: "Jamaica", region: "Caribe", currency: "JMD", indirectTaxName: "GCT", standardRate: 0.15, defaultDutyRate: 0.06, eInvoiceStatus: "GCT/customs", sourceStatus: "estimated-seed", notes: ["CARICOM/CARIFORUM; confirmar certificado de origem e item tributável."] },
  { code: "MS", name: "Montserrat", region: "Caribe", currency: "XCD", indirectTaxName: "Customs/consumption tax", standardRate: 0.15, defaultDutyRate: 0.05, eInvoiceStatus: "customs/commercial invoice", sourceStatus: "manual-required", notes: ["Membro CARICOM; preferências dependem de origem e regras locais do território."] },
  { code: "LC", name: "Santa Lúcia", region: "Caribe", currency: "XCD", indirectTaxName: "VAT", standardRate: 0.125, defaultDutyRate: 0.05, eInvoiceStatus: "VAT/customs", sourceStatus: "estimated-seed", notes: ["CARICOM/CARIFORUM; confirmar origem preferencial e categoria fiscal."] },
  { code: "KN", name: "São Cristóvão e Névis", region: "Caribe", currency: "XCD", indirectTaxName: "VAT", standardRate: 0.17, defaultDutyRate: 0.05, eInvoiceStatus: "VAT/customs", sourceStatus: "estimated-seed", notes: ["CARICOM/CARIFORUM; validar regra de origem e duty por HS code."] },
  { code: "VC", name: "São Vicente e Granadinas", region: "Caribe", currency: "XCD", indirectTaxName: "VAT", standardRate: 0.16, defaultDutyRate: 0.05, eInvoiceStatus: "VAT/customs", sourceStatus: "estimated-seed", notes: ["CARICOM/CARIFORUM; confirmar origem preferencial e exigências de importação."] },
  { code: "SR", name: "Suriname", region: "Caribe", currency: "SRD", indirectTaxName: "VAT", standardRate: 0.1, defaultDutyRate: 0.06, eInvoiceStatus: "VAT/customs", sourceStatus: "estimated-seed", notes: ["CARICOM/CARIFORUM; validar classificação, origem e tratamento preferencial."] },
  { code: "TT", name: "Trinidad e Tobago", region: "Caribe", currency: "TTD", indirectTaxName: "VAT", standardRate: 0.125, defaultDutyRate: 0.06, eInvoiceStatus: "VAT/customs", sourceStatus: "estimated-seed", notes: ["CARICOM/CARIFORUM; confirmar origem preferencial, licença e duty por produto."] },
  {
    code: "PT",
    name: "Portugal",
    region: "Europa",
    currency: "EUR",
    indirectTaxName: "IVA",
    standardRate: 0.23,
    defaultDutyRate: 0.04,
    eInvoiceStatus: "SAF-T/PT e faturacao certificada",
    sourceStatus: "official-seed",
    sourceUrl: "https://taxfoundation.org/data/all/eu/value-added-tax-vat-rates-europe/",
    reducedRates: [0.06, 0.13],
    parkingRate: 0.13,
    ratesVerifiedAt: "2026-01-26",
    notes: ["Alíquota padrão 23%, reduzidas 6%/13%, parking rate 13% (TEDB/Tax Foundation, jan/2026). Madeira/Açores usam alíquotas regionais próprias e não estão cobertas por este seed."],
  },
  {
    code: "ES",
    name: "Espanha",
    region: "Europa",
    currency: "EUR",
    indirectTaxName: "IVA",
    standardRate: 0.21,
    defaultDutyRate: 0.04,
    eInvoiceStatus: "Factura electronica / SII",
    sourceStatus: "official-seed",
    sourceUrl: "https://taxfoundation.org/data/all/eu/value-added-tax-vat-rates-europe/",
    reducedRates: [0.1],
    superReducedRate: 0.04,
    ratesVerifiedAt: "2026-01-26",
    notes: ["Alíquota padrão 21%, reduzida 10%, super-reduzida 4% (TEDB/Tax Foundation, jan/2026). Canárias/Ceuta/Melilla usam regimes próprios (IGIC/IPSI) e não estão cobertos por este seed."],
  },
  {
    code: "FR",
    name: "França",
    region: "Europa",
    currency: "EUR",
    indirectTaxName: "TVA",
    standardRate: 0.2,
    defaultDutyRate: 0.04,
    eInvoiceStatus: "e-invoicing France",
    sourceStatus: "official-seed",
    sourceUrl: "https://taxfoundation.org/data/all/eu/value-added-tax-vat-rates-europe/",
    reducedRates: [0.055, 0.1],
    superReducedRate: 0.021,
    ratesVerifiedAt: "2026-01-26",
    notes: ["Alíquota padrão 20%, reduzidas 5,5%/10%, super-reduzida 2,1% (TEDB/Tax Foundation, jan/2026). DOM (Guadalupe, Martinica, Reunião etc.) usam alíquotas próprias e não estão cobertos por este seed."],
  },
  {
    code: "DE",
    name: "Alemanha",
    region: "Europa",
    currency: "EUR",
    indirectTaxName: "USt/VAT",
    standardRate: 0.19,
    defaultDutyRate: 0.04,
    eInvoiceStatus: "eRechnung / XRechnung",
    sourceStatus: "official-seed",
    sourceUrl: "https://taxfoundation.org/data/all/eu/value-added-tax-vat-rates-europe/",
    reducedRates: [0.07],
    ratesVerifiedAt: "2026-01-26",
    notes: ["Alíquota padrão 19%, reduzida 7% (TEDB/Tax Foundation, jan/2026). Desde 2026, alimentação em restaurante migrou da alíquota padrão para a reduzida de 7%. B2B intra-EU pode usar reverse charge."],
  },
  {
    code: "IT",
    name: "Itália",
    region: "Europa",
    currency: "EUR",
    indirectTaxName: "IVA",
    standardRate: 0.22,
    defaultDutyRate: 0.04,
    eInvoiceStatus: "FatturaPA / SDI",
    sourceStatus: "official-seed",
    sourceUrl: "https://taxfoundation.org/data/all/eu/value-added-tax-vat-rates-europe/",
    reducedRates: [0.05, 0.1],
    superReducedRate: 0.04,
    ratesVerifiedAt: "2026-01-26",
    notes: ["Alíquota padrão 22%, reduzidas 5%/10%, super-reduzida 4% (TEDB/Tax Foundation, jan/2026). Split payment (para órgãos públicos) e SDI (faturação eletrônica) exigem regra própria."],
  },
  {
    code: "NL",
    name: "Holanda",
    region: "Europa",
    currency: "EUR",
    indirectTaxName: "BTW",
    standardRate: 0.21,
    defaultDutyRate: 0.04,
    eInvoiceStatus: "Peppol/eInvoice",
    sourceStatus: "official-seed",
    sourceUrl: "https://taxfoundation.org/data/all/eu/value-added-tax-vat-rates-europe/",
    reducedRates: [0.09],
    ratesVerifiedAt: "2026-01-26",
    notes: ["Alíquota padrão 21%, reduzida 9% (TEDB/Tax Foundation, jan/2026). Serviços de hospedagem migraram da reduzida (9%) para a padrão (21%) recentemente. OSS/IOSS para B2C cross-border pode aplicar."],
  },
  {
    code: "BE",
    name: "Bélgica",
    region: "Europa",
    currency: "EUR",
    indirectTaxName: "BTW/TVA",
    standardRate: 0.21,
    defaultDutyRate: 0.04,
    eInvoiceStatus: "B2B e-invoicing planejado",
    sourceStatus: "official-seed",
    sourceUrl: "https://taxfoundation.org/data/all/eu/value-added-tax-vat-rates-europe/",
    reducedRates: [0.06, 0.12],
    parkingRate: 0.12,
    ratesVerifiedAt: "2026-01-26",
    notes: ["Alíquota padrão 21%, reduzidas 6%/12%, parking rate 12% (TEDB/Tax Foundation, jan/2026). Requer regra linguística (NL/FR/DE) para o documento fiscal."],
  },
  {
    code: "CH",
    name: "Suíça",
    region: "Europa",
    currency: "CHF",
    indirectTaxName: "MWST/TVA/IVA",
    standardRate: 0.081,
    defaultDutyRate: 0.04,
    eInvoiceStatus: "VAT e customs",
    sourceStatus: "official-seed",
    sourceUrl: "https://www.estv.admin.ch/en/vat-rates-switzerland",
    reducedRates: [0.026, 0.038],
    ratesVerifiedAt: "2026-01-26",
    notes: ["Alíquota padrão 8,1%, reduzida 2,6% (bens essenciais), especial 3,8% (hospedagem) — vigentes desde 01/01/2024 (ESTV/Tax Foundation). Não é membro da UE; duty pode ser por peso/unidade, não só ad valorem. Há proposta de alta para 8,5% em discussão no parlamento, sem vigência confirmada."],
  },
  {
    code: "GB",
    name: "Reino Unido",
    region: "Europa",
    currency: "GBP",
    indirectTaxName: "VAT",
    standardRate: 0.2,
    defaultDutyRate: 0.04,
    eInvoiceStatus: "VAT + MTD",
    sourceStatus: "official-seed",
    sourceUrl: "https://www.gov.uk/vat-rates",
    reducedRates: [0.05],
    ratesVerifiedAt: "2026-01-26",
    notes: ["Alíquota padrão 20%, reduzida 5% (energia doméstica etc.), zero-rated para itens como alimentos básicos e livros. Threshold de registro VAT: £90.000/ano (gov.uk). Import VAT pode aplicar."],
  },
  {
    code: "IE",
    name: "Irlanda",
    region: "Europa",
    currency: "EUR",
    indirectTaxName: "VAT",
    standardRate: 0.23,
    defaultDutyRate: 0.04,
    eInvoiceStatus: "VAT / Peppol readiness",
    sourceStatus: "official-seed",
    sourceUrl: "https://taxfoundation.org/data/all/eu/value-added-tax-vat-rates-europe/",
    reducedRates: [0.09, 0.135],
    superReducedRate: 0.048,
    parkingRate: 0.135,
    ratesVerifiedAt: "2026-01-26",
    notes: ["Alíquota padrão 23%, reduzidas 9%/13,5%, super-reduzida 4,8%, parking rate 13,5% (TEDB/Tax Foundation, jan/2026). B2B intra-EU pode usar reverse charge."],
  },
  {
    code: "PL",
    name: "Polônia",
    region: "Europa",
    currency: "PLN",
    indirectTaxName: "VAT",
    standardRate: 0.23,
    defaultDutyRate: 0.04,
    eInvoiceStatus: "KSeF",
    sourceStatus: "official-seed",
    sourceUrl: "https://taxfoundation.org/data/all/eu/value-added-tax-vat-rates-europe/",
    reducedRates: [0.05, 0.08],
    ratesVerifiedAt: "2026-01-26",
    notes: ["Alíquota padrão 23%, reduzidas 5%/8% (TEDB/Tax Foundation, jan/2026). KSeF (faturação eletrônica nacional) e JPK exigem adaptador próprio."],
  },
  {
    code: "SE",
    name: "Suécia",
    region: "Europa",
    currency: "SEK",
    indirectTaxName: "MOMS",
    standardRate: 0.25,
    defaultDutyRate: 0.04,
    eInvoiceStatus: "Peppol",
    sourceStatus: "official-seed",
    sourceUrl: "https://taxfoundation.org/data/all/eu/value-added-tax-vat-rates-europe/",
    reducedRates: [0.06, 0.12],
    ratesVerifiedAt: "2026-01-26",
    notes: ["Alíquota padrão 25%, reduzidas 6%/12% (alimentos, livros, transporte) (TEDB/Tax Foundation, jan/2026)."],
  },
  { code: "NO", name: "Noruega", region: "Europa", currency: "NOK", indirectTaxName: "MVA", standardRate: 0.25, defaultDutyRate: 0.04, eInvoiceStatus: "EHF/Peppol", sourceStatus: "estimated-seed", notes: ["VOEC pode aplicar a e-commerce B2C."] },
  { code: "DK", name: "Dinamarca", region: "Europa", currency: "DKK", indirectTaxName: "MOMS", standardRate: 0.25, defaultDutyRate: 0.04, eInvoiceStatus: "NemHandel/Peppol", sourceStatus: "estimated-seed", notes: ["Poucas taxas reduzidas; confirmar produto."] },
  { code: "FI", name: "Finlândia", region: "Europa", currency: "EUR", indirectTaxName: "ALV", standardRate: 0.255, defaultDutyRate: 0.04, eInvoiceStatus: "Peppol", sourceStatus: "estimated-seed", notes: ["Standard seed deve ser confirmado por vigência."] },
  { code: "AT", name: "Áustria", region: "Europa", currency: "EUR", indirectTaxName: "USt", standardRate: 0.2, defaultDutyRate: 0.04, eInvoiceStatus: "e-Rechnung.gv.at", sourceStatus: "estimated-seed", notes: ["Taxas reduzidas para categorias específicas."] },
  { code: "CZ", name: "Tchéquia", region: "Europa", currency: "CZK", indirectTaxName: "DPH", standardRate: 0.21, defaultDutyRate: 0.04, eInvoiceStatus: "VAT reporting", sourceStatus: "estimated-seed", notes: ["Requer validação de alíquota reduzida."] },
  { code: "HU", name: "Hungria", region: "Europa", currency: "HUF", indirectTaxName: "AFA", standardRate: 0.27, defaultDutyRate: 0.04, eInvoiceStatus: "Online Szamla", sourceStatus: "estimated-seed", notes: ["Uma das maiores alíquotas padrão de VAT; confirmar categoria."] },
  {
    code: "RO",
    name: "Romênia",
    region: "Europa",
    currency: "RON",
    indirectTaxName: "TVA",
    standardRate: 0.21,
    defaultDutyRate: 0.04,
    eInvoiceStatus: "RO e-Factura",
    sourceStatus: "official-seed",
    sourceUrl: "https://taxfoundation.org/data/all/eu/value-added-tax-vat-rates-europe/",
    reducedRates: [0.11],
    ratesVerifiedAt: "2026-01-26",
    notes: [
      "CORREÇÃO: alíquota padrão subiu de 19% para 21% em agosto/2025, e as antigas reduzidas de 5%/9% foram consolidadas em uma única de 11% (TEDB/Tax Foundation, jan/2026). O seed anterior deste rule pack ainda estava com 19% desatualizado.",
      "RO e-Factura (faturação eletrônica nacional) exige adaptador local.",
    ],
  },
  {
    code: "GR",
    name: "Grécia",
    region: "Europa",
    currency: "EUR",
    indirectTaxName: "FPA",
    standardRate: 0.24,
    defaultDutyRate: 0.04,
    eInvoiceStatus: "myDATA",
    sourceStatus: "official-seed",
    sourceUrl: "https://taxfoundation.org/data/all/eu/value-added-tax-vat-rates-europe/",
    reducedRates: [0.06, 0.13],
    ratesVerifiedAt: "2026-01-26",
    notes: ["Alíquota padrão 24%, reduzidas 6%/13% (TEDB/Tax Foundation, jan/2026). Ilhas do Egeu têm redução de 30% sobre todas as alíquotas, ampliada recentemente para mais ilhas — não está modelada neste seed ainda."],
  },
  { code: "TR", name: "Turquia", region: "Europa/Ásia", currency: "TRY", indirectTaxName: "KDV", standardRate: 0.2, defaultDutyRate: 0.06, eInvoiceStatus: "e-Fatura/e-Arsiv", sourceStatus: "estimated-seed", notes: ["KDV e customs variam por produto/regime."] },
  { code: "CN", name: "China", region: "Ásia", currency: "CNY", indirectTaxName: "VAT", standardRate: 0.13, defaultDutyRate: 0.08, eInvoiceStatus: "fapiao", sourceStatus: "estimated-seed", notes: ["Fapiao e import duty exigem classificação HS."] },
  {
    code: "JP",
    name: "Japão",
    region: "Ásia",
    currency: "JPY",
    indirectTaxName: "Consumption Tax",
    standardRate: 0.1,
    defaultDutyRate: 0.04,
    eInvoiceStatus: "Qualified Invoice System",
    sourceStatus: "official-seed",
    sourceUrl: "https://www.nta.go.jp/english/taxes/consumption_tax/index.htm",
    notes: ["Ha taxa reduzida de consumo para certas categorias; confirmar produto."],
  },
  { code: "KR", name: "Coreia do Sul", region: "Ásia", currency: "KRW", indirectTaxName: "VAT", standardRate: 0.1, defaultDutyRate: 0.06, eInvoiceStatus: "e-Tax invoice", sourceStatus: "estimated-seed", notes: ["B2B e digital services exigem regra local."] },
  {
    code: "SG",
    name: "Singapura",
    region: "Ásia",
    currency: "SGD",
    indirectTaxName: "GST",
    standardRate: 0.09,
    defaultDutyRate: 0,
    eInvoiceStatus: "InvoiceNow / Peppol",
    sourceStatus: "official-seed",
    sourceUrl: "https://www.iras.gov.sg/taxes/goods-services-tax-(gst)/basics-of-gst/current-gst-rates",
    notes: ["GST zero-rated/exempt pode aplicar conforme supply."],
  },
  { code: "IN", name: "Índia", region: "Ásia", currency: "INR", indirectTaxName: "GST", standardRate: 0.18, defaultDutyRate: 0.1, eInvoiceStatus: "GST e-Invoice / IRP", sourceStatus: "estimated-seed", notes: ["GST tem slabs; importação pode envolver BCD e IGST."] },
  { code: "TH", name: "Tailândia", region: "Ásia", currency: "THB", indirectTaxName: "VAT", standardRate: 0.07, defaultDutyRate: 0.08, eInvoiceStatus: "e-Tax invoice", sourceStatus: "estimated-seed", notes: ["Duty e VAT por item."] },
  { code: "MY", name: "Malásia", region: "Ásia", currency: "MYR", indirectTaxName: "SST", standardRate: 0.08, defaultDutyRate: 0.06, eInvoiceStatus: "LHDN e-Invoice", sourceStatus: "estimated-seed", notes: ["SST não é VAT; pode variar por bem/serviço."] },
  { code: "ID", name: "Indonésia", region: "Ásia", currency: "IDR", indirectTaxName: "PPN", standardRate: 0.11, defaultDutyRate: 0.08, eInvoiceStatus: "e-Faktur", sourceStatus: "estimated-seed", notes: ["PPN e import duty exigem classificação local."] },
  { code: "HK", name: "Hong Kong", region: "Ásia", currency: "HKD", indirectTaxName: "No VAT/GST", standardRate: 0, defaultDutyRate: 0, eInvoiceStatus: "commercial invoice/customs", sourceStatus: "estimated-seed", notes: ["Sem VAT/GST geral; ainda pode haver duty/excise para itens específicos."] },
  { code: "AU", name: "Austrália", region: "Oceania", currency: "AUD", indirectTaxName: "GST", standardRate: 0.1, defaultDutyRate: 0.05, eInvoiceStatus: "Peppol eInvoicing", sourceStatus: "estimated-seed", notes: ["GST e import duty dependem de low value goods e tipo de supply."] },
  { code: "NZ", name: "Nova Zelândia", region: "Oceania", currency: "NZD", indirectTaxName: "GST", standardRate: 0.15, defaultDutyRate: 0.05, eInvoiceStatus: "eInvoicing", sourceStatus: "estimated-seed", notes: ["GST de low value imported goods pode aplicar."] },
  { code: "AE", name: "Emirados Árabes", region: "Oriente Médio", currency: "AED", indirectTaxName: "VAT", standardRate: 0.05, defaultDutyRate: 0.05, eInvoiceStatus: "FTA VAT / e-invoicing rollout", sourceStatus: "estimated-seed", notes: ["VAT e customs duty comuns; zonas francas podem alterar tratamento."] },
  { code: "SA", name: "Arábia Saudita", region: "Oriente Médio", currency: "SAR", indirectTaxName: "VAT", standardRate: 0.15, defaultDutyRate: 0.05, eInvoiceStatus: "ZATCA Fatoora", sourceStatus: "estimated-seed", notes: ["E-invoicing ZATCA exige adaptador próprio."] },
  { code: "QA", name: "Qatar", region: "Oriente Médio", currency: "QAR", indirectTaxName: "VAT planejado/limited", standardRate: 0, defaultDutyRate: 0.05, eInvoiceStatus: "customs/commercial invoice", sourceStatus: "manual-required", notes: ["VAT geral deve ser confirmado antes de cálculo real."] },
  { code: "IL", name: "Israel", region: "Oriente Médio", currency: "ILS", indirectTaxName: "VAT", standardRate: 0.18, defaultDutyRate: 0.06, eInvoiceStatus: "allocation number/e-invoicing", sourceStatus: "estimated-seed", notes: ["Alíquota padrão deve ser confirmada por vigência."] },
  { code: "ZA", name: "África do Sul", region: "África", currency: "ZAR", indirectTaxName: "VAT", standardRate: 0.15, defaultDutyRate: 0.08, eInvoiceStatus: "VAT/customs", sourceStatus: "estimated-seed", notes: ["Import VAT e customs duty exigem HS code."] },
  { code: "EG", name: "Egito", region: "África", currency: "EGP", indirectTaxName: "VAT", standardRate: 0.14, defaultDutyRate: 0.1, eInvoiceStatus: "ETA eInvoice", sourceStatus: "estimated-seed", notes: ["Pode haver schedule tax e customs por produto."] },
  { code: "MA", name: "Marrocos", region: "África", currency: "MAD", indirectTaxName: "TVA", standardRate: 0.2, defaultDutyRate: 0.1, eInvoiceStatus: "VAT/customs", sourceStatus: "estimated-seed", notes: ["Taxas reduzidas e duty por HS code."] },
];

export function getMarket(countryCode: string): TaxMarket | undefined {
  const normalized = countryCode.trim().toUpperCase();
  return EXPORT_MARKETS.find((market) => market.code === normalized);
}
