import { getMarket, RULE_PACK_VERSION, type TaxMarket } from "./rule-pack";

export type TaxSimulationItemInput = {
  description?: string;
  category?: string;
  quantity?: number | string;
  unit_price?: number | string;
  unit_cost?: number | string;
  discount?: number | string;
};

export type TaxSimulationInput = {
  origin_country?: string;
  destination_country?: string;
  destination_region?: string;
  currency?: string;
  operation_type?: string;
  customer_type?: string;
  incoterm?: string;
  channel?: string;
  vat_registered?: boolean;
  hs_code?: string;
  ncm?: string;
  items?: TaxSimulationItemInput[];
  freight?: number | string;
  insurance?: number | string;
  packaging_cost?: number | string;
  preparation_cost?: number | string;
  export_clearance_cost?: number | string;
  compliance_cost?: number | string;
  storage_cost?: number | string;
  local_delivery_cost?: number | string;
  marketing_cost?: number | string;
  other_costs?: number | string;
  payment_fee_rate?: number | string;
  marketplace_fee_rate?: number | string;
  margin_target_rate?: number | string;
  import_duty_rate?: number | string;
  destination_tax_rate?: number | string;
  excise_rate?: number | string;
};

export type TaxSimulationLine = {
  code: string;
  label: string;
  family: string;
  rate: number;
  base_amount: number;
  amount: number;
  payer: "seller" | "buyer" | "marketplace" | "unknown";
  source_status: TaxMarket["sourceStatus"];
};

export type TaxSimulationValueStage = {
  key: string;
  label: string;
  amount: number;
  share: number;
  status: "calculated" | "needs-data" | "not-applicable";
  notes: string[];
};

export type TaxSimulationResult = {
  status: "estimate";
  rule_pack_version: string;
  generated_at: string;
  market: TaxMarket;
  input_snapshot: {
    origin_country: string;
    destination_country: string;
    destination_region: string | null;
    operation_type: string;
    customer_type: string;
    incoterm: string;
    channel: string;
    currency: string;
    hs_code: string | null;
    ncm: string | null;
  };
  totals: {
    commercial_subtotal: number;
    item_cost: number;
    freight: number;
    insurance: number;
    origin_preparation: number;
    export_clearance: number;
    compliance_cost: number;
    storage_distribution: number;
    marketing_cost: number;
    other_costs: number;
    customs_value: number;
    import_duty: number;
    excise_tax: number;
    destination_indirect_tax: number;
    payment_fee: number;
    marketplace_fee: number;
    seller_cash_collected: number;
    seller_cash_out: number;
    seller_gross_margin: number;
    seller_gross_margin_rate: number;
    customer_total: number;
    suggested_commercial_price: number;
    suggested_unit_price: number;
    suggested_customer_total: number;
  };
  tax_lines: TaxSimulationLine[];
  value_chain: TaxSimulationValueStage[];
  document_checklist: string[];
  warnings: string[];
  next_required_data: string[];
};

const DEFAULT_ORIGIN = "BR";
const DEFAULT_DESTINATION = "GB";
const DEFAULT_OPERATION = "export_goods";
const DEFAULT_CUSTOMER_TYPE = "b2c";
const DEFAULT_INCOTERM = "DDP";
const DEFAULT_CHANNEL = "ecommerce";

export class TaxSimulationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
  }
}

export function simulateTax(input: TaxSimulationInput): TaxSimulationResult {
  const originCountry = normalizeCountry(input.origin_country, DEFAULT_ORIGIN);
  const destinationCountry = normalizeCountry(input.destination_country, DEFAULT_DESTINATION);
  const market = getMarket(destinationCountry);

  if (!market) {
    throw new TaxSimulationError("País de destino não suportado pelo pacote de regras atual.", "unsupported_market");
  }

  const operationType = normalizeText(input.operation_type, DEFAULT_OPERATION);
  const customerType = normalizeText(input.customer_type, DEFAULT_CUSTOMER_TYPE);
  const incoterm = normalizeText(input.incoterm, DEFAULT_INCOTERM).toUpperCase();
  const channel = normalizeText(input.channel, DEFAULT_CHANNEL);
  const items = normalizeItems(input.items);
  const itemCost = roundMoney(items.reduce((sum, item) => sum + item.totalCost, 0));
  const commercialSubtotal = roundMoney(items.reduce((sum, item) => sum + item.netAmount, 0));
  const totalQuantity = Math.max(1, items.reduce((sum, item) => sum + item.quantity, 0));
  const freight = money(input.freight);
  const insurance = money(input.insurance);
  const packagingCost = money(input.packaging_cost);
  const preparationCost = money(input.preparation_cost);
  const exportClearanceCost = money(input.export_clearance_cost);
  const complianceCost = money(input.compliance_cost);
  const storageCost = money(input.storage_cost);
  const localDeliveryCost = money(input.local_delivery_cost);
  const marketingCost = money(input.marketing_cost);
  const otherCosts = money(input.other_costs);
  const isGoods = operationType.includes("goods") || operationType.includes("marketplace");
  const isCrossBorder = originCountry !== destinationCountry;
  const paymentFeeRate = rate(input.payment_fee_rate, 0.029);
  const marketplaceFeeRate = rate(input.marketplace_fee_rate, channel.includes("market") ? 0.12 : 0);
  const marginTargetRate = rate(input.margin_target_rate, 0.35, 0.9);
  const importDutyRate = isGoods && isCrossBorder ? rate(input.import_duty_rate, market.defaultDutyRate, 1.5) : 0;
  const destinationTaxRate = rate(input.destination_tax_rate, market.standardRate, 1);
  const exciseRate = rate(input.excise_rate, 0, 1.5);
  const customsValue = isGoods && isCrossBorder ? roundMoney(commercialSubtotal + freight + insurance) : 0;
  const importDuty = roundMoney(customsValue * importDutyRate);
  const exciseBase = roundMoney(customsValue + importDuty);
  const exciseTax = roundMoney(exciseBase * exciseRate);
  const destinationTaxBase = roundMoney(
    (isGoods ? customsValue + importDuty + exciseTax : commercialSubtotal) +
      packagingCost +
      preparationCost +
      exportClearanceCost +
      complianceCost +
      storageCost +
      localDeliveryCost +
      otherCosts,
  );
  const destinationTax = roundMoney(destinationTaxBase * destinationTaxRate);
  const commercialCharge = roundMoney(
    commercialSubtotal +
      packagingCost +
      preparationCost +
      exportClearanceCost +
      complianceCost +
      freight +
      insurance +
      storageCost +
      localDeliveryCost +
      marketingCost +
      otherCosts,
  );
  const sellerPaysImport = incoterm === "DDP" || (!isGoods && customerType === "b2c");
  const sellerCashCollected = roundMoney(commercialCharge + (sellerPaysImport ? importDuty + exciseTax + destinationTax : 0));
  const paymentFee = roundMoney(sellerCashCollected * paymentFeeRate);
  const marketplaceFee = roundMoney(commercialSubtotal * marketplaceFeeRate);
  const sellerCashOut = roundMoney(
    itemCost +
      packagingCost +
      preparationCost +
      exportClearanceCost +
      complianceCost +
      freight +
      insurance +
      storageCost +
      localDeliveryCost +
      marketingCost +
      otherCosts +
      paymentFee +
      marketplaceFee +
      (sellerPaysImport ? importDuty + exciseTax + destinationTax : 0),
  );
  const customerTotal = roundMoney(commercialCharge + importDuty + exciseTax + destinationTax);
  const sellerGrossMargin = roundMoney(sellerCashCollected - sellerCashOut);
  const sellerGrossMarginRate = sellerCashCollected > 0 ? roundRate(sellerGrossMargin / sellerCashCollected) : 0;
  const suggestedCommercialPrice = calculateSuggestedCommercialPrice({
    fixedCost:
      itemCost +
      packagingCost +
      preparationCost +
      exportClearanceCost +
      complianceCost +
      freight +
      insurance +
      storageCost +
      localDeliveryCost +
      marketingCost +
      otherCosts,
    paymentFeeRate,
    marketplaceFeeRate,
    marginTargetRate,
  });
  const suggestedTaxBase = roundMoney(
    suggestedCommercialPrice +
      (isGoods && isCrossBorder ? freight + insurance : 0) +
      exportClearanceCost +
      complianceCost +
      storageCost +
      localDeliveryCost,
  );
  const suggestedDuty = roundMoney((isGoods && isCrossBorder ? suggestedCommercialPrice + freight + insurance : 0) * importDutyRate);
  const suggestedExcise = roundMoney((suggestedTaxBase + suggestedDuty) * exciseRate);
  const suggestedDestinationTax = roundMoney((suggestedTaxBase + suggestedDuty + suggestedExcise) * destinationTaxRate);
  const warnings = buildWarnings({
    input,
    market,
    operationType,
    customerType,
    incoterm,
    isGoods,
    isCrossBorder,
    destinationTaxRate,
    marginTargetRate,
    paymentFeeRate,
    marketplaceFeeRate,
  });
  const nextRequiredData = buildRequiredData({
    input,
    market,
    operationType,
    customerType,
    isGoods,
    isCrossBorder,
  });

  return {
    status: "estimate",
    rule_pack_version: RULE_PACK_VERSION,
    generated_at: new Date().toISOString(),
    market,
    input_snapshot: {
      origin_country: originCountry,
      destination_country: destinationCountry,
      destination_region: cleanOptional(input.destination_region),
      operation_type: operationType,
      customer_type: customerType,
      incoterm,
      channel,
      currency: normalizeText(input.currency, market.currency).toUpperCase(),
      hs_code: cleanOptional(input.hs_code),
      ncm: cleanOptional(input.ncm),
    },
    totals: {
      commercial_subtotal: commercialSubtotal,
      item_cost: itemCost,
      freight,
      insurance,
      origin_preparation: roundMoney(packagingCost + preparationCost),
      export_clearance: exportClearanceCost,
      compliance_cost: complianceCost,
      storage_distribution: roundMoney(storageCost + localDeliveryCost),
      marketing_cost: marketingCost,
      other_costs: otherCosts,
      customs_value: customsValue,
      import_duty: importDuty,
      excise_tax: exciseTax,
      destination_indirect_tax: destinationTax,
      payment_fee: paymentFee,
      marketplace_fee: marketplaceFee,
      seller_cash_collected: sellerCashCollected,
      seller_cash_out: sellerCashOut,
      seller_gross_margin: sellerGrossMargin,
      seller_gross_margin_rate: sellerGrossMarginRate,
      customer_total: customerTotal,
      suggested_commercial_price: suggestedCommercialPrice,
      suggested_unit_price: roundMoney(suggestedCommercialPrice / totalQuantity),
      suggested_customer_total: roundMoney(suggestedCommercialPrice + suggestedDuty + suggestedExcise + suggestedDestinationTax),
    },
    tax_lines: [
      buildLine("import_duty", "Tarifa de importação", "customs_duty", importDutyRate, customsValue, importDuty, sellerPaysImport ? "seller" : "buyer", market),
      buildLine("excise", "Imposto especial / excise", "excise", exciseRate, exciseBase, exciseTax, sellerPaysImport ? "seller" : "buyer", market),
      buildLine(
        "destination_indirect_tax",
        market.indirectTaxName,
        "indirect_tax",
        destinationTaxRate,
        destinationTaxBase,
        destinationTax,
        sellerPaysImport ? "seller" : "buyer",
        market,
      ),
      buildLine("payment_fee", "Taxa de pagamento", "commercial_fee", paymentFeeRate, sellerCashCollected, paymentFee, "seller", market),
      buildLine("marketplace_fee", "Comissao marketplace/canal", "commercial_fee", marketplaceFeeRate, commercialSubtotal, marketplaceFee, channel.includes("market") ? "marketplace" : "seller", market),
    ],
    value_chain: buildValueChain({
      commercialSubtotal,
      itemCost,
      packagingCost,
      preparationCost,
      exportClearanceCost,
      complianceCost,
      freight,
      insurance,
      importDuty,
      exciseTax,
      destinationTax,
      storageCost,
      localDeliveryCost,
      marketingCost,
      marketplaceFee,
      customerTotal,
      isCrossBorder,
    }),
    document_checklist: buildDocumentChecklist({
      input,
      originCountry,
      destinationCountry,
      operationType,
      isGoods,
      isCrossBorder,
    }),
    warnings,
    next_required_data: nextRequiredData,
  };
}

function normalizeCountry(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  return value.trim().slice(0, 2).toUpperCase();
}

function normalizeText(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  return value.trim();
}

function cleanOptional(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}

function money(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(",", ".")) : fallback;
  return roundMoney(Number.isFinite(parsed) ? Math.max(0, parsed) : fallback);
}

function rate(value: unknown, fallback: number, max = 1): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(",", ".")) : fallback;
  if (!Number.isFinite(parsed)) {
    return roundRate(fallback);
  }
  const normalized = parsed > 1 ? parsed / 100 : parsed;
  return roundRate(Math.min(Math.max(normalized, 0), max));
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundRate(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

function normalizeItems(items: TaxSimulationItemInput[] | undefined): Array<{
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discount: number;
  netAmount: number;
  totalCost: number;
}> {
  const source = Array.isArray(items) && items.length > 0 ? items : [{ description: "Produto exportado", category: "goods", quantity: 1, unit_price: 100, unit_cost: 55 }];
  return source.map((item, index) => {
    const quantity = Math.max(0.0001, money(item.quantity, 1));
    const unitPrice = money(item.unit_price, 100);
    const unitCost = money(item.unit_cost, 0);
    const discount = money(item.discount);
    return {
      description: normalizeText(item.description, `Item ${index + 1}`),
      category: normalizeText(item.category, "goods"),
      quantity,
      unitPrice,
      unitCost,
      discount,
      netAmount: roundMoney(Math.max(0, quantity * unitPrice - discount)),
      totalCost: roundMoney(quantity * unitCost),
    };
  });
}

function buildLine(
  code: string,
  label: string,
  family: string,
  lineRate: number,
  baseAmount: number,
  amount: number,
  payer: TaxSimulationLine["payer"],
  market: TaxMarket,
): TaxSimulationLine {
  return {
    code,
    label,
    family,
    rate: lineRate,
    base_amount: baseAmount,
    amount,
    payer,
    source_status: market.sourceStatus,
  };
}

function calculateSuggestedCommercialPrice(input: {
  fixedCost: number;
  paymentFeeRate: number;
  marketplaceFeeRate: number;
  marginTargetRate: number;
}): number {
  const denominator = Math.max(0.05, 1 - input.marginTargetRate - input.paymentFeeRate - input.marketplaceFeeRate);
  return roundMoney(input.fixedCost / denominator);
}

function buildValueChain(input: {
  commercialSubtotal: number;
  itemCost: number;
  packagingCost: number;
  preparationCost: number;
  exportClearanceCost: number;
  complianceCost: number;
  freight: number;
  insurance: number;
  importDuty: number;
  exciseTax: number;
  destinationTax: number;
  storageCost: number;
  localDeliveryCost: number;
  marketingCost: number;
  marketplaceFee: number;
  customerTotal: number;
  isCrossBorder: boolean;
}): TaxSimulationValueStage[] {
  const denominator = Math.max(input.customerTotal, 1);
  return [
    stage("production_origin", "Produção e origem", input.itemCost, denominator, "calculated", ["Custo unitário informado nos itens."]),
    stage("preparation_origin", "Preparação no país de origem", input.packagingCost + input.preparationCost, denominator, "calculated", ["Embalagem, rotulagem, lote e preparação comercial."]),
    stage("export_origin", "Exportação e documentos de origem", input.exportClearanceCost + input.complianceCost, denominator, input.isCrossBorder ? "calculated" : "not-applicable", ["DU-E, invoice, certificados e custos de compliance quando aplicável."]),
    stage("international_transport", "Transporte internacional", input.freight + input.insurance, denominator, input.isCrossBorder ? "calculated" : "not-applicable", ["Frete e seguro entram na base aduaneira conforme incoterm e país."]),
    stage("destination_import", "Importação no destino", input.importDuty + input.exciseTax + input.destinationTax, denominator, input.isCrossBorder ? "calculated" : "needs-data", ["Tarifa, excise e imposto indireto do destino."]),
    stage("storage_distribution", "Armazenagem e distribuição", input.storageCost + input.localDeliveryCost, denominator, "calculated", ["Armazém fiscal/comum, last mile e distribuição local."]),
    stage("market_channel", "Canal, pagamento e marketing", input.marketingCost + input.marketplaceFee, denominator, "calculated", ["Marketplace, e-commerce, promocao e custo comercial."]),
    stage("market_price", "Preço final estimado ao cliente", input.customerTotal, denominator, "calculated", ["Total econômico incluindo custos, tarifas e impostos calculados."]),
  ];
}

function stage(
  key: string,
  label: string,
  amount: number,
  denominator: number,
  status: TaxSimulationValueStage["status"],
  notes: string[],
): TaxSimulationValueStage {
  return {
    key,
    label,
    amount: roundMoney(amount),
    share: roundRate(amount / denominator),
    status,
    notes,
  };
}

function buildDocumentChecklist(input: {
  input: TaxSimulationInput;
  originCountry: string;
  destinationCountry: string;
  operationType: string;
  isGoods: boolean;
  isCrossBorder: boolean;
}): string[] {
  if (!input.isGoods) {
    return ["Contrato/ordem de serviço", "Invoice comercial", "Comprovante de residência fiscal quando aplicável"];
  }

  const docs = [
    "Commercial invoice",
    "Packing list",
    "Classificacao fiscal HS/NCM",
    "Comprovante de seguro quando houver",
  ];
  if (input.isCrossBorder) {
    docs.push("Documento de transporte internacional", "Declaração de exportação/importação", "Certificado de origem quando aplicável");
  }
  if (input.originCountry === "BR") {
    docs.push("NF-e de exportacao", "DU-E / Siscomex", "Documentacao MAPA/ANVISA quando o produto exigir");
  }
  const itemText = JSON.stringify(input.input.items ?? "").toLowerCase();
  if (input.originCountry === "BR" && (itemText.includes("cachaca") || itemText.includes("cacha") || itemText.includes("alcohol") || itemText.includes("bebida"))) {
    docs.push("Registro MAPA do estabelecimento/produto", "Análise laboratorial/lote", "Rótulo adequado ao país destino");
  }
  if (input.destinationCountry !== "BR") {
    docs.push("Cadastro/importer of record ou parceiro fiscal no destino quando aplicável");
  }
  if (input.operationType.includes("marketplace")) {
    docs.push("Contrato marketplace facilitator e comprovante de coleta tributária do canal");
  }
  return Array.from(new Set(docs));
}

function buildWarnings(input: {
  input: TaxSimulationInput;
  market: TaxMarket;
  operationType: string;
  customerType: string;
  incoterm: string;
  isGoods: boolean;
  isCrossBorder: boolean;
  destinationTaxRate: number;
  marginTargetRate: number;
  paymentFeeRate: number;
  marketplaceFeeRate: number;
}): string[] {
  const warnings = [
    `Simulação estimativa com pacote de regras ${RULE_PACK_VERSION}; não substitui regra fiscal homologada ou consulta oficial.`,
  ];
  if (input.market.sourceStatus !== "official-seed") {
    warnings.push(`Mercado ${input.market.code} usa alíquota seed/estimada; valide fonte legal antes de emitir documento fiscal.`);
  }
  if (input.isGoods && input.isCrossBorder && !cleanOptional(input.input.hs_code) && !cleanOptional(input.input.ncm)) {
    warnings.push("Tarifa de importação depende de HS/NCM; foi usada alíquota padrão do mercado.");
  }
  if (input.market.code === "BR" && input.operationType.includes("domestic")) {
    warnings.push("Brasil doméstico exige UF, município, NCM, CFOP, CST/CSOSN, regime e benefícios fiscais.");
  }
  if (input.market.code === "US") {
    warnings.push("Estados Unidos exige estado/county/cidade, nexus, economic nexus e regras de marketplace facilitator.");
  }
  if (input.market.code === "CA") {
    warnings.push("Canadá exige província/território para separar GST, HST, PST e QST.");
  }
  if (input.market.region === "Europa" && input.customerType === "b2c") {
    warnings.push("B2C Europa pode exigir OSS/IOSS, importador fiscal, limiares e regras de marketplace.");
  }
  if (input.incoterm !== "DDP" && input.isCrossBorder) {
    warnings.push("Incoterm não-DDP: tarifa/imposto podem ser pagos pelo comprador no desembaraço, embora apareçam no custo total do cliente.");
  }
  if (input.destinationTaxRate === 0 && input.market.standardRate > 0) {
    warnings.push("Alíquota de imposto indireto zerada por override; confirme se o produto é zero-rated/exempt/reverse charge.");
  }
  if (input.marginTargetRate + input.paymentFeeRate + input.marketplaceFeeRate >= 0.88) {
    warnings.push("Meta de margem somada a fees está muito alta; preço sugerido pode ficar artificialmente elevado.");
  }
  return warnings;
}

function buildRequiredData(input: {
  input: TaxSimulationInput;
  market: TaxMarket;
  operationType: string;
  customerType: string;
  isGoods: boolean;
  isCrossBorder: boolean;
}): string[] {
  const required = new Set<string>();
  if (input.isGoods) {
    required.add("HS code ou NCM");
    required.add("categoria fiscal do produto");
  }
  if (input.market.code === "BR") {
    required.add("UF origem/destino");
    required.add("CFOP/CST/CSOSN/regime");
  }
  if (input.market.code === "US") {
    required.add("estado, county, cidade e zip code");
    required.add("nexus/economic nexus");
  }
  if (input.market.code === "CA") {
    required.add("província/território");
  }
  if (input.market.region === "Europa" && input.customerType === "b2c") {
    required.add("OSS/IOSS ou importador fiscal");
    required.add("país de consumo e VAT ID quando houver");
  }
  if (input.isCrossBorder) {
    required.add("incoterm validado no contrato");
    required.add("frete e seguro reais");
  }
  if (input.operationType.includes("marketplace")) {
    required.add("quem coleta imposto: seller ou marketplace facilitator");
  }
  return Array.from(required);
}
