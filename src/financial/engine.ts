export type FinancialPlanningInput = {
  currency?: string;
  period_months?: number | string;
  volume_units?: number | string;
  unit_price?: number | string;
  unit_cost?: number | string;
  fixed_costs?: number | string;
  variable_costs?: number | string;
  logistics_costs?: number | string;
  tax_costs?: number | string;
  channel_costs?: number | string;
  acquisition_costs?: number | string;
  investment_initial?: number | string;
  working_capital?: number | string;
  discount_rate?: number | string;
  target_margin_rate?: number | string;
  planned_amount?: number | string;
  actual_amount?: number | string;
  allocation_basis?: number | string;
  allocation_pool?: number | string;
  loss_rate?: number | string;
  return_rate?: number | string;
  default_rate?: number | string;
  growth_rate?: number | string;
  payment_term_days?: number | string;
  receivable_term_days?: number | string;
  scenario?: "conservative" | "base" | "aggressive" | "custom" | string;
};

export type FinancialPlanningResult = {
  status: "estimate";
  engine: "helvok-financial-planning-cost-engine";
  generated_at: string;
  scenario: string;
  currency: string;
  inputs: {
    period_months: number;
    volume_units: number;
    unit_price: number;
    unit_cost: number;
    target_margin_rate: number;
  };
  totals: {
    revenue: number;
    fixed_costs: number;
    variable_costs: number;
    direct_costs: number;
    indirect_costs: number;
    total_costs: number;
    gross_margin: number;
    gross_margin_rate: number;
    net_margin: number;
    net_margin_rate: number;
    contribution_margin: number;
    contribution_margin_rate: number;
    markup: number;
    minimum_unit_price: number;
    suggested_unit_price: number;
    break_even_units: number;
    working_capital: number;
    invested_capital: number;
    roi: number;
    payback_months: number | null;
    npv: number;
    irr: number | null;
    planned_amount: number;
    actual_amount: number;
    variance_amount: number;
    variance_rate: number;
    allocated_cost: number;
    loss_amount: number;
    return_amount: number;
    default_loss: number;
    cash_conversion_gap_days: number;
  };
  cash_flow: Array<{
    period: number;
    revenue: number;
    costs: number;
    net_cash_flow: number;
    accumulated_cash_flow: number;
  }>;
  warnings: string[];
  calculation_memory: {
    accounting_model: string;
    entry_model: string[];
    allocation_strategy: string;
    formulas: Record<string, string>;
    integrations: string[];
    spreadsheet_exports: string[];
  };
};

export function planFinancialScenario(input: FinancialPlanningInput): FinancialPlanningResult {
  const scenario = normalizeScenario(input.scenario);
  const factor = scenarioFactor(scenario);
  const currency = normalizeCurrency(input.currency);
  const periodMonths = whole(input.period_months, 12, 1, 120);
  const volumeUnits = whole(input.volume_units, 1000, 1, 100000000) * factor.volume;
  const unitPrice = money(input.unit_price, 45) * factor.price;
  const unitCost = money(input.unit_cost, 22) * factor.cost;
  const fixedCosts = money(input.fixed_costs, 12000);
  const variableCosts = money(input.variable_costs, 0);
  const logisticsCosts = money(input.logistics_costs, 0);
  const taxCosts = money(input.tax_costs, 0);
  const channelCosts = money(input.channel_costs, 0);
  const acquisitionCosts = money(input.acquisition_costs, 0);
  const workingCapital = money(input.working_capital, 0);
  const investmentInitial = money(input.investment_initial, 0);
  const targetMarginRate = rate(input.target_margin_rate, 0.32, 0.95);
  const monthlyDiscountRate = rate(input.discount_rate, 0.015, 1);
  const plannedAmount = money(input.planned_amount, 0);
  const actualAmount = money(input.actual_amount, 0);
  const allocationBasis = money(input.allocation_basis, volumeUnits);
  const allocationPool = money(input.allocation_pool, 0);
  const lossRate = rate(input.loss_rate, 0, 1);
  const returnRate = rate(input.return_rate, 0, 1);
  const defaultRate = rate(input.default_rate, 0, 1);
  const growthRate = rate(input.growth_rate, 0, 2);
  const paymentTermDays = whole(input.payment_term_days, 0, 0, 365);
  const receivableTermDays = whole(input.receivable_term_days, 0, 0, 365);

  const effectiveVolume = roundMoney(volumeUnits * (1 - lossRate - returnRate) * (1 + growthRate));
  const revenue = roundMoney(unitPrice * effectiveVolume);
  const directCosts = roundMoney(unitCost * volumeUnits + logisticsCosts + taxCosts + channelCosts);
  const indirectCosts = roundMoney(fixedCosts + acquisitionCosts + variableCosts);
  const lossAmount = roundMoney(unitPrice * volumeUnits * lossRate);
  const returnAmount = roundMoney(unitPrice * volumeUnits * returnRate);
  const defaultLoss = roundMoney(revenue * defaultRate);
  const allocatedCost = roundMoney(allocationPool * safeDivide(allocationBasis, Math.max(allocationBasis, volumeUnits)));
  const totalCosts = roundMoney(directCosts + indirectCosts + lossAmount + returnAmount + defaultLoss + allocatedCost);
  const grossMargin = roundMoney(revenue - directCosts);
  const netMargin = roundMoney(revenue - totalCosts);
  const variableUnitCost = roundMoney(unitCost + safeDivide(logisticsCosts + taxCosts + channelCosts + variableCosts, volumeUnits));
  const contributionMargin = roundMoney(revenue - variableUnitCost * volumeUnits);
  const contributionMarginRate = revenue > 0 ? roundRate(contributionMargin / revenue) : 0;
  const minimumUnitPrice = roundMoney(safeDivide(totalCosts, volumeUnits));
  const suggestedUnitPrice = roundMoney(variableUnitCost / Math.max(0.05, 1 - targetMarginRate));
  const breakEvenUnits = Math.ceil(safeDivide(fixedCosts + acquisitionCosts, Math.max(0.01, unitPrice - variableUnitCost)));
  const investedCapital = roundMoney(investmentInitial + workingCapital);
  const roi = investedCapital > 0 ? roundRate(netMargin / investedCapital) : 0;
  const monthlyNetCash = roundMoney(netMargin / periodMonths);
  const paybackMonths = investedCapital > 0 && monthlyNetCash > 0 ? Math.ceil(investedCapital / monthlyNetCash) : null;
  const cashFlow = buildCashFlow(periodMonths, revenue, totalCosts, investedCapital);
  const npv = roundMoney(cashFlow.reduce((sum, row) => sum + row.net_cash_flow / Math.pow(1 + monthlyDiscountRate, row.period), -investedCapital));
  const irr = calculateIrr([-investedCapital, ...cashFlow.map((row) => row.net_cash_flow)]);
  const varianceAmount = roundMoney(actualAmount - plannedAmount);
  const varianceRate = plannedAmount > 0 ? roundRate(varianceAmount / plannedAmount) : 0;

  return {
    status: "estimate",
    engine: "helvok-financial-planning-cost-engine",
    generated_at: new Date().toISOString(),
    scenario,
    currency,
    inputs: {
      period_months: periodMonths,
      volume_units: Math.round(effectiveVolume),
      unit_price: roundMoney(unitPrice),
      unit_cost: roundMoney(unitCost),
      target_margin_rate: targetMarginRate,
    },
    totals: {
      revenue,
      fixed_costs: fixedCosts,
      variable_costs: variableCosts,
      direct_costs: directCosts,
      indirect_costs: indirectCosts,
      total_costs: totalCosts,
      gross_margin: grossMargin,
      gross_margin_rate: revenue > 0 ? roundRate(grossMargin / revenue) : 0,
      net_margin: netMargin,
      net_margin_rate: revenue > 0 ? roundRate(netMargin / revenue) : 0,
      contribution_margin: contributionMargin,
      contribution_margin_rate: contributionMarginRate,
      markup: variableUnitCost > 0 ? roundRate((unitPrice - variableUnitCost) / variableUnitCost) : 0,
      minimum_unit_price: minimumUnitPrice,
      suggested_unit_price: suggestedUnitPrice,
      break_even_units: breakEvenUnits,
      working_capital: workingCapital,
      invested_capital: investedCapital,
      roi,
      payback_months: paybackMonths,
      npv,
      irr,
      planned_amount: plannedAmount,
      actual_amount: actualAmount,
      variance_amount: varianceAmount,
      variance_rate: varianceRate,
      allocated_cost: allocatedCost,
      loss_amount: lossAmount,
      return_amount: returnAmount,
      default_loss: defaultLoss,
      cash_conversion_gap_days: receivableTermDays - paymentTermDays,
    },
    cash_flow: cashFlow,
    warnings: buildWarnings({ taxCosts, revenue, netMargin, investedCapital, paybackMonths }),
    calculation_memory: buildCalculationMemory(),
  };
}

export function getFinancialBlueprint() {
  return {
    module: "Helvok Financial Planning and Cost Engine",
    accounting_model: {
      principle: "tenant ledger with immutable entries and reversal corrections",
      natures: ["revenue", "expense", "cost", "tax", "investment", "financing", "transfer", "adjustment", "reversal"],
      rule: "financial entries are not physically deleted; corrections create reversal entries",
    },
    entry_model: [
      "tenant", "organization", "establishment", "project", "cost_center", "account", "category", "nature", "currency", "amount",
      "competence_date", "payment_date", "status", "source", "related_document", "related_order", "related_product", "country", "channel", "tags", "notes",
    ],
    allocation_strategy: ["quantity", "weight", "volume", "value", "hours", "percentage", "custom"],
    formulas: buildCalculationMemory().formulas,
    integrations: buildCalculationMemory().integrations,
    entities: [
      "financial_accounts", "financial_entries", "cost_centers", "projects", "budgets", "budget_lines", "forecasts", "forecast_scenarios",
      "investments", "investment_events", "pricing_models", "pricing_rules", "product_costs", "logistics_costs", "tax_costs", "channel_costs",
      "currency_rates", "cash_flow_periods", "financial_reports", "spreadsheet_exports",
    ],
    flows: [
      "operational event -> financial entry draft -> review -> posted",
      "tax.calculated -> tax_cost provision -> pricing update",
      "budget -> actual ledger -> variance report -> updated forecast",
      "investment event -> cash flow -> ROI/payback/NPV/IRR",
    ],
    screens: [
      "visao financeira", "lancamentos", "centros de custo", "projetos", "orcamento", "investimentos", "formacao de precos",
      "cenarios", "fluxo de caixa", "comparativos", "planilhas", "relatorios",
    ],
    tests: ["engine formulas", "ledger immutability", "RLS/RPC boundaries", "export reproducibility", "tax engine integration contract"],
    spreadsheet_exports: buildCalculationMemory().spreadsheet_exports,
    automation_events: [
      "order.created", "order.paid", "invoice.authorized", "invoice.cancelled", "tax.calculated", "shipment.created",
      "marketplace.fee.charged", "payment.received", "refund.created", "inventory.consumed", "investment.recorded",
    ],
  };
}

function buildCalculationMemory(): FinancialPlanningResult["calculation_memory"] {
  return {
    accounting_model: "competence ledger plus cash-flow periods; corrections by reversal, not physical delete",
    entry_model: ["competence date", "payment date", "source document", "project", "cost center", "account", "currency", "country", "channel", "tags"],
    allocation_strategy: "allocate by quantity, weight, volume, value, hours, percentage, or custom rule",
    formulas: {
      gross_margin: "revenue - direct_costs",
      net_margin: "revenue - total_costs",
      markup: "(unit_price - variable_unit_cost) / variable_unit_cost",
      minimum_price: "total_costs / effective_volume",
      target_margin_price: "variable_unit_cost / (1 - target_margin_rate)",
      break_even: "(fixed_costs + acquisition_costs) / (unit_price - variable_unit_cost)",
      roi: "net_margin / invested_capital",
      npv: "sum(net_cash_flow_t / (1 + discount_rate)^t) - invested_capital",
      irr: "discount rate where NPV equals zero",
      variance: "actual_amount - planned_amount",
    },
    integrations: ["Helvok Tax Engine", "fiscal documents", "orders", "payments", "marketplaces", "ERPs", "CSV", "XLSX", "OFX", "XML", "webhooks"],
    spreadsheet_exports: ["XLSX", "CSV", "PDF", "dashboards", "calculation memory", "project report", "channel report", "country report", "product report", "period report"],
  };
}

function buildCashFlow(periodMonths: number, revenue: number, totalCosts: number, investedCapital: number): FinancialPlanningResult["cash_flow"] {
  const monthlyRevenue = roundMoney(revenue / periodMonths);
  const monthlyCosts = roundMoney(totalCosts / periodMonths);
  let accumulated = roundMoney(-investedCapital);
  return Array.from({ length: periodMonths }, (_, index) => {
    const netCashFlow = roundMoney(monthlyRevenue - monthlyCosts);
    accumulated = roundMoney(accumulated + netCashFlow);
    return {
      period: index + 1,
      revenue: monthlyRevenue,
      costs: monthlyCosts,
      net_cash_flow: netCashFlow,
      accumulated_cash_flow: accumulated,
    };
  });
}

function buildWarnings(input: { taxCosts: number; revenue: number; netMargin: number; investedCapital: number; paybackMonths: number | null }): string[] {
  const warnings = ["Helvok Financial Engine usa estimativas e deve guardar memória de cálculo antes de virar relatório oficial."];
  if (input.taxCosts === 0) {
    warnings.push("Custo tributário zerado: consuma o Helvok Tax Engine para provisionar impostos reais por país, UF, canal e produto.");
  }
  if (input.revenue > 0 && input.netMargin < 0) {
    warnings.push("Cenário com margem líquida negativa; revisar preço, volume, custos fixos, canal e carga tributária.");
  }
  if (input.investedCapital > 0 && input.paybackMonths === null) {
    warnings.push("Payback indisponível porque o fluxo líquido mensal não cobre o capital investido.");
  }
  return warnings;
}

function calculateIrr(cashFlows: number[]): number | null {
  if (!cashFlows.some((value) => value < 0) || !cashFlows.some((value) => value > 0)) {
    return null;
  }
  let low = -0.99;
  let high = 10;
  for (let i = 0; i < 80; i += 1) {
    const mid = (low + high) / 2;
    const value = cashFlows.reduce((sum, cashFlow, index) => sum + cashFlow / Math.pow(1 + mid, index), 0);
    if (value > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return roundRate((low + high) / 2);
}

function normalizeScenario(value: unknown): string {
  const scenario = typeof value === "string" && value.trim() ? value.trim().toLowerCase() : "base";
  return ["conservative", "base", "aggressive", "custom"].includes(scenario) ? scenario : "custom";
}

function scenarioFactor(scenario: string): { volume: number; price: number; cost: number } {
  if (scenario === "conservative") {
    return { volume: 0.82, price: 0.96, cost: 1.08 };
  }
  if (scenario === "aggressive") {
    return { volume: 1.22, price: 1.04, cost: 0.97 };
  }
  return { volume: 1, price: 1, cost: 1 };
}

function normalizeCurrency(value: unknown): string {
  return typeof value === "string" && /^[A-Za-z]{3}$/.test(value.trim()) ? value.trim().toUpperCase() : "BRL";
}

function whole(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(",", ".")) : fallback;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function money(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(",", ".")) : fallback;
  return roundMoney(Number.isFinite(parsed) ? Math.max(0, parsed) : fallback);
}

function rate(value: unknown, fallback: number, max: number): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(",", ".")) : fallback;
  const normalized = Number.isFinite(parsed) ? parsed : fallback;
  return Math.max(0, Math.min(max, normalized > 1 ? normalized / 100 : normalized));
}

function safeDivide(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundRate(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
