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
};

export const RULE_PACK_VERSION = "global-indirect-tax-seed-2026.07.15";

export const EXPORT_MARKETS: TaxMarket[] = [
  {
    code: "BR",
    name: "Brasil",
    region: "America Latina",
    currency: "BRL",
    indirectTaxName: "ICMS/IPI/PIS/COFINS/ISS",
    standardRate: 0,
    defaultDutyRate: 0,
    eInvoiceStatus: "NF-e, NFC-e, NFS-e por adaptador Brasil",
    sourceStatus: "manual-required",
    notes: ["Calculo domestico exige NCM, CFOP, CST/CSOSN, UF origem/destino, regime e municipio."],
  },
  {
    code: "US",
    name: "Estados Unidos",
    region: "America do Norte",
    currency: "USD",
    indirectTaxName: "Sales Tax",
    standardRate: 0,
    defaultDutyRate: 0.05,
    eInvoiceStatus: "state/local sales tax, nexus e marketplace facilitator",
    sourceStatus: "manual-required",
    notes: ["Nao existe VAT federal. Sales tax depende de estado, cidade, county, produto e nexus."],
  },
  {
    code: "CA",
    name: "Canada",
    region: "America do Norte",
    currency: "CAD",
    indirectTaxName: "GST/HST/PST/QST",
    standardRate: 0.05,
    defaultDutyRate: 0.06,
    eInvoiceStatus: "GST/HST por place-of-supply",
    sourceStatus: "official-seed",
    sourceUrl: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate.html",
    notes: ["GST/HST varia por provincia/territorio; substitua a aliquota pelo destino real."],
  },
  {
    code: "MX",
    name: "Mexico",
    region: "America Latina",
    currency: "MXN",
    indirectTaxName: "IVA",
    standardRate: 0.16,
    defaultDutyRate: 0.08,
    eInvoiceStatus: "CFDI por adaptador Mexico",
    sourceStatus: "estimated-seed",
    notes: ["Pode haver taxa reduzida/fronteira, IEPS e regras CFDI por produto."],
  },
  { code: "AR", name: "Argentina", region: "America Latina", currency: "ARS", indirectTaxName: "IVA", standardRate: 0.21, defaultDutyRate: 0.12, eInvoiceStatus: "Factura electronica", sourceStatus: "estimated-seed", notes: ["Pode envolver percepciones/retenciones e impostos provinciais."] },
  { code: "CL", name: "Chile", region: "America Latina", currency: "CLP", indirectTaxName: "IVA", standardRate: 0.19, defaultDutyRate: 0.06, eInvoiceStatus: "DTE", sourceStatus: "estimated-seed", notes: ["Classificacao aduaneira e tratados podem alterar duty."] },
  { code: "CO", name: "Colombia", region: "America Latina", currency: "COP", indirectTaxName: "IVA", standardRate: 0.19, defaultDutyRate: 0.1, eInvoiceStatus: "Factura electronica DIAN", sourceStatus: "estimated-seed", notes: ["Pode haver retenciones e regimes especiais."] },
  { code: "PE", name: "Peru", region: "America Latina", currency: "PEN", indirectTaxName: "IGV", standardRate: 0.18, defaultDutyRate: 0.06, eInvoiceStatus: "Comprobante electronico SUNAT", sourceStatus: "estimated-seed", notes: ["Duty depende de partida arancelaria."] },
  { code: "UY", name: "Uruguai", region: "America Latina", currency: "UYU", indirectTaxName: "IVA", standardRate: 0.22, defaultDutyRate: 0.08, eInvoiceStatus: "CFE", sourceStatus: "estimated-seed", notes: ["Pode haver aliquota minima/reduzida por produto."] },
  { code: "PY", name: "Paraguai", region: "America Latina", currency: "PYG", indirectTaxName: "IVA", standardRate: 0.1, defaultDutyRate: 0.08, eInvoiceStatus: "SIFEN", sourceStatus: "estimated-seed", notes: ["Requer confirmacao por regime/produto."] },
  { code: "EC", name: "Equador", region: "America Latina", currency: "USD", indirectTaxName: "IVA", standardRate: 0.15, defaultDutyRate: 0.1, eInvoiceStatus: "Comprobantes electronicos SRI", sourceStatus: "estimated-seed", notes: ["Aliquota e ICE podem variar por produto."] },
  { code: "PT", name: "Portugal", region: "Europa", currency: "EUR", indirectTaxName: "IVA", standardRate: 0.23, defaultDutyRate: 0.04, eInvoiceStatus: "SAF-T/PT e faturacao certificada", sourceStatus: "estimated-seed", notes: ["Madeira/Acores e taxas reduzidas exigem regra propria."] },
  { code: "ES", name: "Espanha", region: "Europa", currency: "EUR", indirectTaxName: "IVA", standardRate: 0.21, defaultDutyRate: 0.04, eInvoiceStatus: "Factura electronica / SII", sourceStatus: "estimated-seed", notes: ["Canarias/Ceuta/Melilla usam regimes proprios."] },
  { code: "FR", name: "Franca", region: "Europa", currency: "EUR", indirectTaxName: "TVA", standardRate: 0.2, defaultDutyRate: 0.04, eInvoiceStatus: "e-invoicing France", sourceStatus: "estimated-seed", notes: ["Reduzidas e DOM exigem regra especifica."] },
  { code: "DE", name: "Alemanha", region: "Europa", currency: "EUR", indirectTaxName: "USt/VAT", standardRate: 0.19, defaultDutyRate: 0.04, eInvoiceStatus: "eRechnung / XRechnung", sourceStatus: "estimated-seed", notes: ["B2B intra-EU pode usar reverse charge."] },
  { code: "IT", name: "Italia", region: "Europa", currency: "EUR", indirectTaxName: "IVA", standardRate: 0.22, defaultDutyRate: 0.04, eInvoiceStatus: "FatturaPA / SDI", sourceStatus: "estimated-seed", notes: ["Split payment e aliquotas reduzidas podem aplicar."] },
  { code: "NL", name: "Holanda", region: "Europa", currency: "EUR", indirectTaxName: "BTW", standardRate: 0.21, defaultDutyRate: 0.04, eInvoiceStatus: "Peppol/eInvoice", sourceStatus: "estimated-seed", notes: ["OSS/IOSS para B2C cross-border pode aplicar."] },
  { code: "BE", name: "Belgica", region: "Europa", currency: "EUR", indirectTaxName: "BTW/TVA", standardRate: 0.21, defaultDutyRate: 0.04, eInvoiceStatus: "B2B e-invoicing planned", sourceStatus: "estimated-seed", notes: ["Requer regra linguistica e categoria fiscal."] },
  { code: "CH", name: "Suica", region: "Europa", currency: "CHF", indirectTaxName: "MWST/TVA/IVA", standardRate: 0.081, defaultDutyRate: 0.04, eInvoiceStatus: "VAT e customs", sourceStatus: "estimated-seed", notes: ["Duty pode ser por peso/unidade, nao so ad valorem."] },
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
    notes: ["Taxas reduced/zero/exempt dependem do item; import VAT pode aplicar."],
  },
  { code: "IE", name: "Irlanda", region: "Europa", currency: "EUR", indirectTaxName: "VAT", standardRate: 0.23, defaultDutyRate: 0.04, eInvoiceStatus: "VAT / Peppol readiness", sourceStatus: "estimated-seed", notes: ["B2B intra-EU pode usar reverse charge."] },
  { code: "PL", name: "Polonia", region: "Europa", currency: "PLN", indirectTaxName: "VAT", standardRate: 0.23, defaultDutyRate: 0.04, eInvoiceStatus: "KSeF", sourceStatus: "estimated-seed", notes: ["KSeF e JPK exigem adaptador."] },
  { code: "SE", name: "Suecia", region: "Europa", currency: "SEK", indirectTaxName: "MOMS", standardRate: 0.25, defaultDutyRate: 0.04, eInvoiceStatus: "Peppol", sourceStatus: "estimated-seed", notes: ["Taxas reduzidas para alimentos/livros/transporte."] },
  { code: "NO", name: "Noruega", region: "Europa", currency: "NOK", indirectTaxName: "MVA", standardRate: 0.25, defaultDutyRate: 0.04, eInvoiceStatus: "EHF/Peppol", sourceStatus: "estimated-seed", notes: ["VOEC pode aplicar a e-commerce B2C."] },
  { code: "DK", name: "Dinamarca", region: "Europa", currency: "DKK", indirectTaxName: "MOMS", standardRate: 0.25, defaultDutyRate: 0.04, eInvoiceStatus: "NemHandel/Peppol", sourceStatus: "estimated-seed", notes: ["Poucas taxas reduzidas; confirmar produto."] },
  { code: "FI", name: "Finlandia", region: "Europa", currency: "EUR", indirectTaxName: "ALV", standardRate: 0.255, defaultDutyRate: 0.04, eInvoiceStatus: "Peppol", sourceStatus: "estimated-seed", notes: ["Standard seed deve ser confirmado por vigencia."] },
  { code: "AT", name: "Austria", region: "Europa", currency: "EUR", indirectTaxName: "USt", standardRate: 0.2, defaultDutyRate: 0.04, eInvoiceStatus: "e-Rechnung.gv.at", sourceStatus: "estimated-seed", notes: ["Taxas reduzidas para categorias especificas."] },
  { code: "CZ", name: "Tchequia", region: "Europa", currency: "CZK", indirectTaxName: "DPH", standardRate: 0.21, defaultDutyRate: 0.04, eInvoiceStatus: "VAT reporting", sourceStatus: "estimated-seed", notes: ["Requer validacao de aliquota reduzida."] },
  { code: "HU", name: "Hungria", region: "Europa", currency: "HUF", indirectTaxName: "AFA", standardRate: 0.27, defaultDutyRate: 0.04, eInvoiceStatus: "Online Szamla", sourceStatus: "estimated-seed", notes: ["Uma das maiores aliquotas padrao de VAT; confirmar categoria."] },
  { code: "RO", name: "Romenia", region: "Europa", currency: "RON", indirectTaxName: "TVA", standardRate: 0.19, defaultDutyRate: 0.04, eInvoiceStatus: "RO e-Factura", sourceStatus: "estimated-seed", notes: ["e-Factura exige adaptador local."] },
  { code: "GR", name: "Grecia", region: "Europa", currency: "EUR", indirectTaxName: "FPA", standardRate: 0.24, defaultDutyRate: 0.04, eInvoiceStatus: "myDATA", sourceStatus: "estimated-seed", notes: ["Ilhas podem ter tratamento especifico."] },
  { code: "TR", name: "Turquia", region: "Europa/Asia", currency: "TRY", indirectTaxName: "KDV", standardRate: 0.2, defaultDutyRate: 0.06, eInvoiceStatus: "e-Fatura/e-Arsiv", sourceStatus: "estimated-seed", notes: ["KDV e customs variam por produto/regime."] },
  { code: "CN", name: "China", region: "Asia", currency: "CNY", indirectTaxName: "VAT", standardRate: 0.13, defaultDutyRate: 0.08, eInvoiceStatus: "fapiao", sourceStatus: "estimated-seed", notes: ["Fapiao e import duty exigem classificacao HS."] },
  {
    code: "JP",
    name: "Japao",
    region: "Asia",
    currency: "JPY",
    indirectTaxName: "Consumption Tax",
    standardRate: 0.1,
    defaultDutyRate: 0.04,
    eInvoiceStatus: "Qualified Invoice System",
    sourceStatus: "official-seed",
    sourceUrl: "https://www.nta.go.jp/english/taxes/consumption_tax/index.htm",
    notes: ["Ha taxa reduzida de consumo para certas categorias; confirmar produto."],
  },
  { code: "KR", name: "Coreia do Sul", region: "Asia", currency: "KRW", indirectTaxName: "VAT", standardRate: 0.1, defaultDutyRate: 0.06, eInvoiceStatus: "e-Tax invoice", sourceStatus: "estimated-seed", notes: ["B2B e digital services exigem regra local."] },
  {
    code: "SG",
    name: "Singapura",
    region: "Asia",
    currency: "SGD",
    indirectTaxName: "GST",
    standardRate: 0.09,
    defaultDutyRate: 0,
    eInvoiceStatus: "InvoiceNow / Peppol",
    sourceStatus: "official-seed",
    sourceUrl: "https://www.iras.gov.sg/taxes/goods-services-tax-(gst)/basics-of-gst/current-gst-rates",
    notes: ["GST zero-rated/exempt pode aplicar conforme supply."],
  },
  { code: "IN", name: "India", region: "Asia", currency: "INR", indirectTaxName: "GST", standardRate: 0.18, defaultDutyRate: 0.1, eInvoiceStatus: "GST e-Invoice / IRP", sourceStatus: "estimated-seed", notes: ["GST tem slabs; importacao pode envolver BCD e IGST."] },
  { code: "TH", name: "Tailandia", region: "Asia", currency: "THB", indirectTaxName: "VAT", standardRate: 0.07, defaultDutyRate: 0.08, eInvoiceStatus: "e-Tax invoice", sourceStatus: "estimated-seed", notes: ["Duty e VAT por item."] },
  { code: "MY", name: "Malasia", region: "Asia", currency: "MYR", indirectTaxName: "SST", standardRate: 0.08, defaultDutyRate: 0.06, eInvoiceStatus: "LHDN e-Invoice", sourceStatus: "estimated-seed", notes: ["SST nao e VAT; pode variar por bem/servico."] },
  { code: "ID", name: "Indonesia", region: "Asia", currency: "IDR", indirectTaxName: "PPN", standardRate: 0.11, defaultDutyRate: 0.08, eInvoiceStatus: "e-Faktur", sourceStatus: "estimated-seed", notes: ["PPN e import duty exigem classificacao local."] },
  { code: "HK", name: "Hong Kong", region: "Asia", currency: "HKD", indirectTaxName: "No VAT/GST", standardRate: 0, defaultDutyRate: 0, eInvoiceStatus: "commercial invoice/customs", sourceStatus: "estimated-seed", notes: ["Sem VAT/GST geral; ainda pode haver duty/excise para itens especificos."] },
  { code: "AU", name: "Australia", region: "Oceania", currency: "AUD", indirectTaxName: "GST", standardRate: 0.1, defaultDutyRate: 0.05, eInvoiceStatus: "Peppol eInvoicing", sourceStatus: "estimated-seed", notes: ["GST e import duty dependem de low value goods e tipo de supply."] },
  { code: "NZ", name: "Nova Zelandia", region: "Oceania", currency: "NZD", indirectTaxName: "GST", standardRate: 0.15, defaultDutyRate: 0.05, eInvoiceStatus: "eInvoicing", sourceStatus: "estimated-seed", notes: ["GST de low value imported goods pode aplicar."] },
  { code: "AE", name: "Emirados Arabes", region: "Oriente Medio", currency: "AED", indirectTaxName: "VAT", standardRate: 0.05, defaultDutyRate: 0.05, eInvoiceStatus: "FTA VAT / e-invoicing rollout", sourceStatus: "estimated-seed", notes: ["VAT e customs duty comuns; zonas francas podem alterar tratamento."] },
  { code: "SA", name: "Arabia Saudita", region: "Oriente Medio", currency: "SAR", indirectTaxName: "VAT", standardRate: 0.15, defaultDutyRate: 0.05, eInvoiceStatus: "ZATCA Fatoora", sourceStatus: "estimated-seed", notes: ["E-invoicing ZATCA exige adaptador proprio."] },
  { code: "QA", name: "Qatar", region: "Oriente Medio", currency: "QAR", indirectTaxName: "VAT planned/limited", standardRate: 0, defaultDutyRate: 0.05, eInvoiceStatus: "customs/commercial invoice", sourceStatus: "manual-required", notes: ["VAT geral deve ser confirmado antes de calculo real."] },
  { code: "IL", name: "Israel", region: "Oriente Medio", currency: "ILS", indirectTaxName: "VAT", standardRate: 0.18, defaultDutyRate: 0.06, eInvoiceStatus: "allocation number/e-invoicing", sourceStatus: "estimated-seed", notes: ["Aliquota padrao deve ser confirmada por vigencia."] },
  { code: "ZA", name: "Africa do Sul", region: "Africa", currency: "ZAR", indirectTaxName: "VAT", standardRate: 0.15, defaultDutyRate: 0.08, eInvoiceStatus: "VAT/customs", sourceStatus: "estimated-seed", notes: ["Import VAT e customs duty exigem HS code."] },
  { code: "EG", name: "Egito", region: "Africa", currency: "EGP", indirectTaxName: "VAT", standardRate: 0.14, defaultDutyRate: 0.1, eInvoiceStatus: "ETA eInvoice", sourceStatus: "estimated-seed", notes: ["Pode haver schedule tax e customs por produto."] },
  { code: "MA", name: "Marrocos", region: "Africa", currency: "MAD", indirectTaxName: "TVA", standardRate: 0.2, defaultDutyRate: 0.1, eInvoiceStatus: "VAT/customs", sourceStatus: "estimated-seed", notes: ["Taxas reduzidas e duty por HS code."] },
];

export function getMarket(countryCode: string): TaxMarket | undefined {
  const normalized = countryCode.trim().toUpperCase();
  return EXPORT_MARKETS.find((market) => market.code === normalized);
}
