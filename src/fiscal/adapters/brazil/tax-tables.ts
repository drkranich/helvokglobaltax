// Brazil-specific tax classification tables (CFOP, CST/CSOSN, NCM/CEST).
//
// These codes are official Brazilian tax law (Convênio s/n de 1970, Ajuste
// SINIEF 03/1994, Anexo do Convênio ICMS 142/2018, TIPI/NCM) and therefore
// belong entirely inside the Brazil adapter boundary, never in Core. Core
// only ever sees the generic tax_families ("ICMS", "ICMS_ST", ...) declared
// in the adapter manifest; it never has ICMS/CFOP/NCM logic of its own.
//
// Coverage is intentionally a curated, verified seed, not the full official
// table (CFOP has ~600 codes, NCM has ~10,000, CEST has ~1,300). Every entry
// here was checked against multiple independent tax-reference sources during
// this seed's creation (2026-07). Treat `coverage` on each table as the
// honest signal of how much of the official table this seed represents —
// nothing here should be read as "the complete official table".

export interface CfopCode {
  code: string;
  description: string;
  direction: "entrada" | "saida";
  scope: "interna" | "interestadual" | "exterior";
}

export const CFOP_CODES: CfopCode[] = [
  { code: "1101", description: "Compra para industrialização ou produção rural", direction: "entrada", scope: "interna" },
  { code: "1102", description: "Compra para comercialização", direction: "entrada", scope: "interna" },
  { code: "2101", description: "Compra para industrialização ou produção rural", direction: "entrada", scope: "interestadual" },
  { code: "2102", description: "Compra para comercialização", direction: "entrada", scope: "interestadual" },
  { code: "5101", description: "Venda de produção do estabelecimento", direction: "saida", scope: "interna" },
  { code: "5102", description: "Venda de mercadoria adquirida ou recebida de terceiros", direction: "saida", scope: "interna" },
  { code: "5202", description: "Devolução de compra para comercialização", direction: "saida", scope: "interna" },
  { code: "5405", description: "Venda de mercadoria sujeita a ICMS por substituição tributária, na condição de contribuinte substituído", direction: "saida", scope: "interna" },
  { code: "5949", description: "Outra saída de mercadoria ou prestação de serviço não especificado", direction: "saida", scope: "interna" },
  { code: "6102", description: "Venda de mercadoria adquirida ou recebida de terceiros", direction: "saida", scope: "interestadual" },
  { code: "6108", description: "Venda de mercadoria adquirida ou recebida de terceiros, destinada a não contribuinte", direction: "saida", scope: "interestadual" },
  { code: "6202", description: "Devolução de compra para comercialização", direction: "saida", scope: "interestadual" },
  { code: "6949", description: "Outra saída de mercadoria ou prestação de serviço não especificado", direction: "saida", scope: "interestadual" },
];

export const CFOP_TABLE_COVERAGE =
  "Seed verificado de 13 códigos de compra/venda/devolução mais usados em e-commerce B2C/B2B. A tabela oficial completa (Ajuste SINIEF, Convênio s/n de 1970) tem cerca de 600 códigos, incluindo industrialização, ativo imobilizado, consignação, exportação, ST em outras posições e prestação de serviço de transporte/comunicação, que não estão neste seed.";

export interface CstIcmsCode {
  code: string;
  regime: "normal";
  description: string;
}

/**
 * CST (Código de Situação Tributária) do ICMS — usado por empresas do
 * Regime Normal (Lucro Real/Presumido). O 1º dígito da origem (Tabela A,
 * 0-8) é modelado separadamente por quem monta o documento; esta tabela
 * cobre apenas os 2 dígitos de tributação (Tabela B).
 */
export const CST_ICMS_CODES: CstIcmsCode[] = [
  { code: "00", regime: "normal", description: "Tributada integralmente" },
  { code: "10", regime: "normal", description: "Tributada e com cobrança do ICMS por substituição tributária" },
  { code: "20", regime: "normal", description: "Com redução de base de cálculo" },
  { code: "30", regime: "normal", description: "Isenta ou não tributada e com cobrança do ICMS por substituição tributária" },
  { code: "40", regime: "normal", description: "Isenta" },
  { code: "41", regime: "normal", description: "Não tributada" },
  { code: "50", regime: "normal", description: "Suspensão" },
  { code: "51", regime: "normal", description: "Diferimento" },
  { code: "60", regime: "normal", description: "ICMS cobrado anteriormente por substituição tributária" },
  { code: "70", regime: "normal", description: "Com redução de base de cálculo e cobrança do ICMS por substituição tributária" },
  { code: "90", regime: "normal", description: "Outras" },
];

export interface CsosnCode {
  code: string;
  regime: "simples_nacional";
  description: string;
}

/** CSOSN (Código de Situação da Operação no Simples Nacional), Lei Complementar 123/2006. */
export const CSOSN_CODES: CsosnCode[] = [
  { code: "101", regime: "simples_nacional", description: "Tributada pelo Simples Nacional com permissão de crédito" },
  { code: "102", regime: "simples_nacional", description: "Tributada pelo Simples Nacional sem permissão de crédito" },
  { code: "103", regime: "simples_nacional", description: "Isenção do ICMS no Simples Nacional para faixa de receita bruta" },
  { code: "201", regime: "simples_nacional", description: "Tributada pelo Simples Nacional com permissão de crédito e com cobrança do ICMS por substituição tributária" },
  { code: "202", regime: "simples_nacional", description: "Tributada pelo Simples Nacional sem permissão de crédito e com cobrança do ICMS por substituição tributária" },
  { code: "203", regime: "simples_nacional", description: "Isenção do ICMS no Simples Nacional para faixa de receita bruta e com cobrança do ICMS por substituição tributária" },
  { code: "300", regime: "simples_nacional", description: "Imune" },
  { code: "400", regime: "simples_nacional", description: "Não tributada pelo Simples Nacional" },
  { code: "500", regime: "simples_nacional", description: "ICMS cobrado anteriormente por substituição tributária ou por antecipação" },
  { code: "900", regime: "simples_nacional", description: "Outros" },
];

export const CST_CSOSN_COVERAGE =
  "Tabela completa oficial: 11 códigos de CST (Regime Normal) e 10 de CSOSN (Simples Nacional) — este seed cobre 100% dos códigos publicados, mas não substitui a Tabela A (origem da mercadoria) nem regras de CST específicas de PIS/COFINS/IPI, que ainda não têm seed próprio.";

export interface NcmCestSample {
  ncm: string;
  description: string;
  cest?: string;
  icmsStStandardApplies: boolean;
}

/**
 * NCM (Nomenclatura Comum do Mercosul) tem ~10.000 códigos e CEST
 * (Convênio ICMS 142/2018) cerca de 1.300 — nenhuma tabela genérica caberia
 * aqui com honestidade de "completa". Esta é uma amostra pequena e
 * verificada de categorias comuns em e-commerce, só para dar ao adaptador
 * Brasil uma estrutura real de classify() para começar, não uma base
 * completa de classificação fiscal.
 */
export const NCM_CEST_SAMPLE: NcmCestSample[] = [
  { ncm: "8517.12.31", description: "Telefones celulares (smartphones)", cest: "21.041.00", icmsStStandardApplies: true },
  { ncm: "6109.10.00", description: "Camisetas de malha de algodão", icmsStStandardApplies: false },
  { ncm: "9503.00.99", description: "Outros brinquedos", cest: "11.009.00", icmsStStandardApplies: true },
  { ncm: "3304.99.90", description: "Outros produtos de beleza/cosméticos", cest: "20.001.00", icmsStStandardApplies: true },
  { ncm: "4901.99.00", description: "Livros não periódicos", icmsStStandardApplies: false },
  { ncm: "8471.30.12", description: "Notebooks/laptops", icmsStStandardApplies: false },
];

export const NCM_CEST_COVERAGE =
  "Amostra de 6 NCM comuns em e-commerce, verificada manualmente. NÃO é uma base de classificação fiscal completa: a tabela NCM oficial (TIPI/Receita Federal) tem cerca de 10.000 códigos e a tabela CEST (Convênio ICMS 142/2018) cerca de 1.300 — este seed é o ponto de partida estrutural, não substitui consulta a contador antes de classificar um produto real.";

export function findCfop(code: string): CfopCode | undefined {
  return CFOP_CODES.find((entry) => entry.code === code);
}

export function findCstIcms(code: string): CstIcmsCode | undefined {
  return CST_ICMS_CODES.find((entry) => entry.code === code);
}

export function findCsosn(code: string): CsosnCode | undefined {
  return CSOSN_CODES.find((entry) => entry.code === code);
}

export function findNcmSample(ncm: string): NcmCestSample | undefined {
  return NCM_CEST_SAMPLE.find((entry) => entry.ncm === ncm);
}

export const BRAZIL_TAX_TABLES_SUMMARY = {
  cfop: { count: CFOP_CODES.length, coverage: CFOP_TABLE_COVERAGE },
  cst_icms: { count: CST_ICMS_CODES.length, coverage: CST_CSOSN_COVERAGE },
  csosn: { count: CSOSN_CODES.length, coverage: CST_CSOSN_COVERAGE },
  ncm_cest_sample: { count: NCM_CEST_SAMPLE.length, coverage: NCM_CEST_COVERAGE },
};
