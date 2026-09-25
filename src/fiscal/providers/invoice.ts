// Helvok Tax - Fatura comercial simples (fallback).
//
// Para países sem clearance obrigatório (ou fora do escopo dos adaptadores), gera uma
// FATURA COMERCIAL real: numeração sequencial, partes, itens discriminados e VAT
// calculado quando aplicável. É um documento comercial válido — NÃO é uma nota fiscal
// governamental e não substitui obrigação de clearance onde ela exista.
//
// Este provedor está sempre "ready": não depende de credencial externa, porque produz
// um documento próprio (não transmite a nenhuma autoridade).

import {
  type FiscalDocumentRequest,
  type FiscalDocumentResult,
  type FiscalProvider,
} from "../fiscal-provider";
import { applyVat, isEuMember, type VatContext } from "../vat";

const PROVIDER_KEY = "invoice";

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPriceCents: number;
  lineNetCents: number;
}

export interface CommercialInvoice {
  number: string;
  issuedAt: string; // ISO 8601
  currency: string;
  seller: { legalName: string; countryCode: string; taxId?: string };
  buyer: { legalName: string; countryCode: string; taxId?: string };
  lines: InvoiceLine[];
  netTotalCents: number;
  taxTotalCents: number;
  grossTotalCents: number;
  taxNote: string;
}

/** Gera um número de fatura sequencial legível: HKV-YYYY-###### */
export function buildInvoiceNumber(sequence: number, year = new Date().getUTCFullYear()): string {
  const padded = String(sequence).padStart(6, "0");
  return `HKV-${year}-${padded}`;
}

export interface InvoiceProviderConfig {
  /** Fornece o próximo número sequencial (persistido pelo chamador). */
  nextSequence: () => number;
}

function buildInvoice(request: FiscalDocumentRequest, sequence: number): CommercialInvoice {
  const lines: InvoiceLine[] = request.items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    lineNetCents: item.unitPriceCents * item.quantity,
  }));

  const netTotalCents = lines.reduce((total, line) => total + line.lineNetCents, 0);

  // VAT só se aplica quando origem ou destino são da UE; caso contrário, fatura sem VAT europeu.
  let taxTotalCents = 0;
  let taxNote = "Fatura comercial sem VAT europeu aplicável a esta operação.";
  if (isEuMember(request.seller.countryCode) || isEuMember(request.buyer.countryCode)) {
    const ctx: VatContext = {
      originCountry: request.seller.countryCode,
      destinationCountry: request.buyer.countryCode,
      isB2C: !request.buyer.isBusiness,
      euCrossBorderSalesYtdCents: request.euCrossBorderSalesYtdCents,
      isImportIntoEu: request.isImportIntoEu,
    };
    const vat = applyVat(netTotalCents, ctx);
    taxTotalCents = vat.vatAmountCents;
    taxNote = vat.rationale;
  }

  return {
    number: buildInvoiceNumber(sequence),
    issuedAt: new Date().toISOString(),
    currency: request.currency,
    seller: {
      legalName: request.seller.legalName,
      countryCode: request.seller.countryCode.toUpperCase(),
      taxId: request.seller.taxId,
    },
    buyer: {
      legalName: request.buyer.legalName,
      countryCode: request.buyer.countryCode.toUpperCase(),
      taxId: request.buyer.taxId,
    },
    lines,
    netTotalCents,
    taxTotalCents,
    grossTotalCents: netTotalCents + taxTotalCents,
    taxNote,
  };
}

export function createInvoiceProvider(config: InvoiceProviderConfig): FiscalProvider & {
  buildCommercialInvoice: (request: FiscalDocumentRequest) => CommercialInvoice;
} {
  return {
    key: PROVIDER_KEY,
    countryScope: "*",

    ready(): boolean {
      return true; // documento próprio, não depende de credencial externa
    },

    buildCommercialInvoice(request: FiscalDocumentRequest): CommercialInvoice {
      return buildInvoice(request, config.nextSequence());
    },

    async emit(request: FiscalDocumentRequest): Promise<FiscalDocumentResult> {
      const invoice = buildInvoice(request, config.nextSequence());
      return {
        kind: "commercial_invoice",
        status: "authorized", // "autorizada" = documento próprio emitido (não é clearance governamental)
        providerKey: PROVIDER_KEY,
        providerReference: invoice.number,
        tax: {
          netAmountCents: invoice.netTotalCents,
          taxAmountCents: invoice.taxTotalCents,
          grossAmountCents: invoice.grossTotalCents,
          ratePercent: invoice.netTotalCents > 0
            ? Math.round((invoice.taxTotalCents / invoice.netTotalCents) * 10000) / 100
            : 0,
          rationale: invoice.taxNote,
        },
        message: `Fatura comercial ${invoice.number} emitida (documento próprio, não é nota fiscal governamental).`,
        artifacts: { xmlAvailable: false, pdfAvailable: true },
      };
    },

    async consult(providerReference: string): Promise<FiscalDocumentResult> {
      return {
        kind: "commercial_invoice",
        status: "authorized",
        providerKey: PROVIDER_KEY,
        providerReference,
        message: `Fatura comercial ${providerReference}.`,
      };
    },

    async cancel(providerReference: string, reason: string): Promise<FiscalDocumentResult> {
      return {
        kind: "commercial_invoice",
        status: "cancelled",
        providerKey: PROVIDER_KEY,
        providerReference,
        message: `Fatura comercial ${providerReference} cancelada. Motivo: ${reason}.`,
      };
    },
  };
}
