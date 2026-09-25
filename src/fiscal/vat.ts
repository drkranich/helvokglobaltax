// Helvok Tax - Camada de VAT (Value Added Tax / IVA) da União Europeia.
//
// Este módulo calcula o imposto de valor agregado europeu de forma determinística,
// sem tocar em nenhuma autoridade fiscal. É a base para o Helvok atuar como provedor
// de e-invoicing europeu (concorrente de agregadores como a Storecove): o cálculo do
// VAT de destino é pré-requisito para emitir uma fatura eletrônica correta sob a
// EN 16931 / rede Peppol.
//
// Regras implementadas (referência 2026, confirmar na legislação vigente antes de produção):
//  - Alíquotas VAT standard por país-membro da UE.
//  - Regra do país de destino no B2C intracomunitário acima do limite OSS.
//  - Limite OSS de EUR 10.000/ano (abaixo dele, aplica-se o VAT do país de origem).
//  - OSS (One-Stop Shop) para vendas intra-UE e IOSS (Import OSS) para importações de baixo valor.
//
// IMPORTANTE: alíquotas reduzidas e isenções (livros, alimentos, vestuário infantil etc.)
// variam muito por categoria e país. Este módulo trata a alíquota STANDARD; alíquotas
// reduzidas devem ser informadas explicitamente via `overrideRatePercent`.

export type VatRegime = "domestic" | "oss" | "ioss" | "reverse_charge" | "exempt";

export interface VatCountry {
  readonly code: string; // ISO 3166-1 alpha-2, maiúsculo
  readonly name: string;
  readonly standardRatePercent: number; // ex.: 23 para 23%
  readonly euMember: boolean;
}

// Alíquotas STANDARD de VAT — referência do guia de internacionalização fiscal (2026).
// Fonte: valores de referência; confirmar sempre na autoridade de cada país.
export const EU_VAT_COUNTRIES: Record<string, VatCountry> = {
  PT: { code: "PT", name: "Portugal", standardRatePercent: 23, euMember: true },
  ES: { code: "ES", name: "Espanha", standardRatePercent: 21, euMember: true },
  FR: { code: "FR", name: "França", standardRatePercent: 20, euMember: true },
  IT: { code: "IT", name: "Itália", standardRatePercent: 22, euMember: true },
  DE: { code: "DE", name: "Alemanha", standardRatePercent: 19, euMember: true },
  NL: { code: "NL", name: "Países Baixos", standardRatePercent: 21, euMember: true },
  BE: { code: "BE", name: "Bélgica", standardRatePercent: 21, euMember: true },
  IE: { code: "IE", name: "Irlanda", standardRatePercent: 23, euMember: true },
  AT: { code: "AT", name: "Áustria", standardRatePercent: 20, euMember: true },
  PL: { code: "PL", name: "Polônia", standardRatePercent: 23, euMember: true },
  SE: { code: "SE", name: "Suécia", standardRatePercent: 25, euMember: true },
  DK: { code: "DK", name: "Dinamarca", standardRatePercent: 25, euMember: true },
  LU: { code: "LU", name: "Luxemburgo", standardRatePercent: 17, euMember: true },
  GR: { code: "GR", name: "Grécia", standardRatePercent: 24, euMember: true },
};

// Limite anual do regime OSS para vendas B2C intracomunitárias (EUR 10.000).
// Abaixo dele, o vendedor pode aplicar o VAT do próprio país (origem).
export const OSS_ANNUAL_THRESHOLD_CENTS = 10_000_00;

export function normalizeCountry(code: string): string {
  return code.trim().toUpperCase();
}

export function isEuMember(code: string): boolean {
  return EU_VAT_COUNTRIES[normalizeCountry(code)]?.euMember === true;
}

/**
 * Alíquota STANDARD de VAT de um país da UE, em porcentagem (ex.: 23).
 * Retorna undefined para países fora da tabela (não-UE ou não coberto).
 */
export function vatRate(countryCode: string): number | undefined {
  return EU_VAT_COUNTRIES[normalizeCountry(countryCode)]?.standardRatePercent;
}

export interface VatContext {
  /** País de origem (onde o vendedor está registrado). */
  originCountry: string;
  /** País de destino (onde o consumidor está). */
  destinationCountry: string;
  /** true = venda para consumidor final (B2C); false = venda entre empresas (B2B). */
  isB2C: boolean;
  /**
   * Total já vendido para a UE (intracomunitário B2C) no ano corrente, em centavos.
   * Usado para decidir se o limite OSS foi ultrapassado. Default 0.
   */
  euCrossBorderSalesYtdCents?: number;
  /** Importação de fora da UE (dispara IOSS quando de baixo valor). Default false. */
  isImportIntoEu?: boolean;
  /**
   * Sobrescreve a alíquota (para alíquotas reduzidas/isenções por categoria).
   * Em porcentagem. Quando informado, tem prioridade sobre a alíquota standard.
   */
  overrideRatePercent?: number;
}

export interface VatDecision {
  /** País cuja alíquota se aplica. */
  applicableCountry: string;
  /** Alíquota efetivamente aplicada, em porcentagem. */
  ratePercent: number;
  /** Regime fiscal identificado. */
  regime: VatRegime;
  /** Explicação legível da decisão (para auditoria e exibição). */
  rationale: string;
}

/**
 * Decide qual VAT se aplica a uma operação, seguindo as regras do guia:
 *  - B2B intracomunitário: reverse charge (VAT do destino, recolhido pelo comprador) -> alíquota 0 no documento do vendedor.
 *  - B2C acima do limite OSS: alíquota do PAÍS DE DESTINO (regra do consumidor).
 *  - B2C abaixo do limite OSS: alíquota do PAÍS DE ORIGEM.
 *  - Doméstico (origem == destino): alíquota do próprio país.
 *  - Importação para a UE de baixo valor: IOSS, alíquota do país de destino.
 */
export function decideVat(context: VatContext): VatDecision {
  const origin = normalizeCountry(context.originCountry);
  const destination = normalizeCountry(context.destinationCountry);
  const ytd = context.euCrossBorderSalesYtdCents ?? 0;

  const rateFor = (country: string): number => {
    if (typeof context.overrideRatePercent === "number") {
      return context.overrideRatePercent;
    }
    return vatRate(country) ?? 0;
  };

  // Importação de fora da UE para dentro da UE.
  if (context.isImportIntoEu) {
    return {
      applicableCountry: destination,
      ratePercent: rateFor(destination),
      regime: "ioss",
      rationale:
        "Importação para a UE: aplica-se o VAT do país de destino via IOSS (Import One-Stop Shop) para remessas de baixo valor.",
    };
  }

  // Operação doméstica (mesmo país).
  if (origin === destination) {
    return {
      applicableCountry: destination,
      ratePercent: rateFor(destination),
      regime: "domestic",
      rationale: "Venda doméstica: aplica-se o VAT do próprio país.",
    };
  }

  const bothEu = isEuMember(origin) && isEuMember(destination);

  // Intracomunitário B2B: reverse charge (o comprador recolhe o VAT no destino).
  if (bothEu && !context.isB2C) {
    return {
      applicableCountry: destination,
      ratePercent: 0,
      regime: "reverse_charge",
      rationale:
        "Venda B2B intracomunitária: reverse charge — o documento do vendedor sai com VAT 0 e o comprador recolhe o VAT no país de destino.",
    };
  }

  // Intracomunitário B2C.
  if (bothEu && context.isB2C) {
    if (ytd >= OSS_ANNUAL_THRESHOLD_CENTS) {
      return {
        applicableCountry: destination,
        ratePercent: rateFor(destination),
        regime: "oss",
        rationale:
          "Venda B2C intracomunitária acima do limite OSS (EUR 10.000/ano): aplica-se o VAT do país de destino, declarado via OSS.",
      };
    }
    return {
      applicableCountry: origin,
      ratePercent: rateFor(origin),
      regime: "domestic",
      rationale:
        "Venda B2C intracomunitária abaixo do limite OSS (EUR 10.000/ano): aplica-se o VAT do país de origem.",
    };
  }

  // Fora do escopo UE conhecido: sem VAT europeu aplicável por este módulo.
  return {
    applicableCountry: destination,
    ratePercent: 0,
    regime: "exempt",
    rationale:
      "Operação fora do escopo de VAT intra-UE coberto por este módulo. Confirme o tratamento fiscal do destino manualmente.",
  };
}

/**
 * Calcula o valor de VAT em centavos sobre uma base líquida em centavos.
 * Trabalha em inteiros (centavos) e arredonda meio-para-cima, evitando erros de ponto flutuante.
 */
export function vatAmountCents(netAmountCents: number, ratePercent: number): number {
  if (!Number.isFinite(netAmountCents) || netAmountCents < 0) {
    throw new RangeError("netAmountCents deve ser um número não-negativo em centavos.");
  }
  if (!Number.isFinite(ratePercent) || ratePercent < 0) {
    throw new RangeError("ratePercent deve ser um número não-negativo.");
  }
  // net * rate / 100, com arredondamento comercial (round-half-up).
  return Math.round((netAmountCents * ratePercent) / 100);
}

export interface VatBreakdown {
  netAmountCents: number;
  vatAmountCents: number;
  grossAmountCents: number;
  ratePercent: number;
  applicableCountry: string;
  regime: VatRegime;
  rationale: string;
}

/**
 * Aplica a decisão de VAT a uma base líquida e devolve a discriminação completa
 * (base, imposto, total) pronta para compor uma fatura eletrônica.
 */
export function applyVat(netAmountCents: number, context: VatContext): VatBreakdown {
  const decision = decideVat(context);
  const vat = vatAmountCents(netAmountCents, decision.ratePercent);
  return {
    netAmountCents,
    vatAmountCents: vat,
    grossAmountCents: netAmountCents + vat,
    ratePercent: decision.ratePercent,
    applicableCountry: decision.applicableCountry,
    regime: decision.regime,
    rationale: decision.rationale,
  };
}

/** Lista as alíquotas standard de todos os países cobertos (para exibição/tabela). */
export function listVatRates(): VatCountry[] {
  return Object.values(EU_VAT_COUNTRIES).sort((a, b) => a.name.localeCompare(b.name, "pt"));
}
