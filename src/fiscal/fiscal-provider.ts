// Helvok Tax - Interface fiscal comum + roteador por país.
//
// Segue o padrão do guia de internacionalização fiscal: uma única interface
// (emitir / consultar / cancelar / ready) que o resto do sistema usa sem saber
// se está falando com o Brasil (Focus NFe), com a Europa (Helvok Peppol/EN 16931,
// atuando como agregador — o mesmo papel da Storecove) ou com a fatura simples de fallback.
//
// A camada de pedidos e produtos nunca conhece legislação específica: ela monta um
// documento fiscal NEUTRO (vendedor, comprador, itens, totais) e o roteador escolhe
// o provedor pelo país de destino.
//
// GUARDRAIL: nenhum provedor aqui fabrica uma autorização fiscal. Um provedor sem
// credencial configurada retorna status "not_configured" — nunca finge que emitiu.

import type { VatRegime } from "./vat";

// ---------- Documento fiscal neutro (independente de país) ----------

export interface FiscalParty {
  legalName: string;
  countryCode: string; // ISO alpha-2
  taxId?: string; // CNPJ, VAT id, EIN etc. (nunca em claro em logs)
  isBusiness: boolean; // true = empresa (B2B); false = consumidor final (B2C)
  address?: {
    line1?: string;
    city?: string;
    region?: string;
    postalCode?: string;
  };
}

export interface FiscalLineItem {
  description: string;
  quantity: number;
  unitPriceCents: number; // preço líquido unitário, em centavos
  taxCode?: string; // NCM (BR), código de serviço, ou classificação por país
  vatRatePercent?: number; // alíquota reduzida explícita, se houver
}

export interface FiscalDocumentRequest {
  seller: FiscalParty;
  buyer: FiscalParty;
  items: FiscalLineItem[];
  currency: string; // ISO 4217 (BRL, EUR...)
  /** Total já vendido para a UE (B2C) no ano, em centavos — usado na regra OSS. */
  euCrossBorderSalesYtdCents?: number;
  /** Importação de fora da UE (dispara IOSS). */
  isImportIntoEu?: boolean;
  reference?: string; // referência interna do pedido
}

export type FiscalDocumentKind =
  | "nfe" // Brasil - NF-e (modelo 55)
  | "nfce" // Brasil - NFC-e (modelo 65)
  | "eu_einvoice" // Europa - fatura eletrônica EN 16931 / Peppol
  | "commercial_invoice"; // fatura comercial simples (fallback)

export type FiscalDocumentStatus =
  | "not_configured" // provedor sem credencial — nada foi transmitido
  | "draft" // documento montado e validado, ainda não transmitido
  | "queued" // enfileirado para transmissão (emissão assíncrona)
  | "authorized" // autorizado pela autoridade / aceito na rede
  | "rejected" // rejeitado pela autoridade
  | "cancelled"; // cancelado após autorização

export interface FiscalDocumentResult {
  kind: FiscalDocumentKind;
  status: FiscalDocumentStatus;
  providerKey: string; // "br-focusnfe", "eu-helvok-peppol", "invoice"
  /** Referência única do documento no provedor (para consultar/cancelar depois). */
  providerReference?: string;
  /** Discriminação de imposto calculada (VAT/ICMS), em centavos. */
  tax?: {
    netAmountCents: number;
    taxAmountCents: number;
    grossAmountCents: number;
    ratePercent: number;
    regime?: VatRegime;
    rationale?: string;
  };
  /** Mensagem legível — inclui a instrução de configuração quando not_configured. */
  message: string;
  /** Artefatos gerados, quando houver (nunca fabricados). */
  artifacts?: {
    xmlAvailable: boolean;
    pdfAvailable: boolean;
  };
}

/**
 * Interface fiscal comum. Todo provedor de país implementa este contrato.
 * `ready()` diz se o provedor tem credencial para operar de verdade.
 */
export interface FiscalProvider {
  readonly key: string;
  readonly countryScope: string; // "BR", "EU", "*"
  /** true quando há credencial/certificado configurado para operar de verdade. */
  ready(): boolean;
  /** Emite (ou enfileira) um documento fiscal. Sem credencial -> not_configured. */
  emit(request: FiscalDocumentRequest): Promise<FiscalDocumentResult>;
  /** Consulta o status de um documento pela referência do provedor. */
  consult(providerReference: string): Promise<FiscalDocumentResult>;
  /** Cancela um documento autorizado, quando o país/documento permite. */
  cancel(providerReference: string, reason: string): Promise<FiscalDocumentResult>;
}

// ---------- Roteador por país ----------

export type ProviderResolver = () => FiscalProvider;

export interface FiscalRouterConfig {
  focusNfe: ProviderResolver; // Brasil
  helvokPeppol: ProviderResolver; // Europa (Helvok como agregador)
  invoiceFallback: ProviderResolver; // demais países
}

const EU_COUNTRIES = new Set([
  "PT", "ES", "FR", "IT", "DE", "NL", "BE", "IE", "AT", "PL", "SE", "DK", "LU", "GR",
  "FI", "CZ", "HU", "RO", "BG", "HR", "SI", "SK", "LT", "LV", "EE", "CY", "MT",
]);

/**
 * Escolhe o provedor fiscal pelo país de destino:
 *  - BR  -> Focus NFe (NF-e / NFC-e via SEFAZ)
 *  - UE  -> Helvok Peppol (e-invoicing EN 16931 — o Helvok como agregador europeu)
 *  - resto -> fatura comercial simples (fallback)
 */
export function providerForCountry(countryCode: string, config: FiscalRouterConfig): FiscalProvider {
  const code = countryCode.trim().toUpperCase();
  if (code === "BR") {
    return config.focusNfe();
  }
  if (EU_COUNTRIES.has(code)) {
    return config.helvokPeppol();
  }
  return config.invoiceFallback();
}

/** Mensagem padrão de "não configurado" — honesta, com o secret que falta. */
export function notConfiguredResult(
  kind: FiscalDocumentKind,
  providerKey: string,
  missingSecret: string,
): FiscalDocumentResult {
  return {
    kind,
    status: "not_configured",
    providerKey,
    message:
      `Provedor "${providerKey}" ainda não está configurado: falta o secret ${missingSecret}. ` +
      "Nenhum documento foi transmitido a nenhuma autoridade. Configure a credencial e homologue antes de emitir em produção.",
    artifacts: { xmlAvailable: false, pdfAvailable: false },
  };
}
