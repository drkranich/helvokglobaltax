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
  };
  cash_flow: Array<{
    period: number;
    revenue: number;
    costs: number;
    net_cash_flow: number;
    accumulated_cash_flow: number;
  }>;
  warnings: string[];
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

  const revenue = roundMoney(unitPrice * volumeUnits);
  const directCosts = roundMoney(unitCost * volumeUnits + logisticsCosts + taxCosts + channelCosts);
  const indirectCosts = roundMoney(fixedCosts + acquisitionCosts + variableCosts);
  const totalCosts = roundMoney(directCosts + indirectCosts);
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

  return {
    status: "estimate",
    engine: "helvok-financial-planning-cost-engine",
    generated_at: new Date().toISOString(),
    scenario,
    currency,
    inputs: {
      period_months: periodMonths,
      volume_units: Math.round(volumeUnits),
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
    },
    cash_flow: cashFlow,
    warnings: buildWarnings({ taxCosts, revenue, netMargin, investedCapital, paybackMonths }),
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
