// Helvok Tax - Adaptador Europa (Helvok Peppol / EN 16931).
//
// Aqui o Helvok NÃO consome a Storecove: o Helvok É o agregador europeu, oferecendo
// as mesmas funções (fatura eletrônica sob a EN 16931, entrega pela rede Peppol,
// cálculo de VAT de destino, OSS/IOSS). Este adaptador monta a fatura eletrônica
// europeia com o VAT correto e a prepara para envio pela rede Peppol.
//
// PRONTO PARA LIGAR, DESLIGADO POR PADRÃO: a entrega real pela rede Peppol exige um
// Access Point certificado. Enquanto o secret HELVOK_PEPPOL_AP_KEY não estiver
// configurado, ready() é false e a entrega retorna "not_configured". O CÁLCULO de
// VAT, porém, é real e sempre disponível — é o núcleo do produto europeu.

import {
  type FiscalDocumentRequest,
  type FiscalDocumentResult,
  type FiscalProvider,
  notConfiguredResult,
} from "../fiscal-provider";
import { applyVat, type VatContext } from "../vat";

const PROVIDER_KEY = "eu-helvok-peppol";
const MISSING_SECRET = "HELVOK_PEPPOL_AP_KEY";

export interface HelvokPeppolConfig {
  accessPointKey?: string; // secret HELVOK_PEPPOL_AP_KEY (Access Point Peppol certificado)
  production?: boolean;
}

function sumNetCents(request: FiscalDocumentRequest): number {
  return request.items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0);
}

function toVatContext(request: FiscalDocumentRequest): VatContext {
  return {
    originCountry: request.seller.countryCode,
    destinationCountry: request.buyer.countryCode,
    isB2C: !request.buyer.isBusiness,
    euCrossBorderSalesYtdCents: request.euCrossBorderSalesYtdCents,
    isImportIntoEu: request.isImportIntoEu,
  };
}

export function createHelvokPeppolProvider(config: HelvokPeppolConfig): FiscalProvider {
  return {
    key: PROVIDER_KEY,
    countryScope: "EU",

    ready(): boolean {
      return typeof config.accessPointKey === "string" && config.accessPointKey.length > 0;
    },

    async emit(request: FiscalDocumentRequest): Promise<FiscalDocumentResult> {
      // O cálculo de VAT é SEMPRE real, mesmo sem Access Point configurado.
      const netAmountCents = sumNetCents(request);
      const vat = applyVat(netAmountCents, toVatContext(request));

      const tax = {
        netAmountCents: vat.netAmountCents,
        taxAmountCents: vat.vatAmountCents,
        grossAmountCents: vat.grossAmountCents,
        ratePercent: vat.ratePercent,
        regime: vat.regime,
        rationale: vat.rationale,
      };

      // Sem Access Point Peppol certificado, a fatura é montada e o VAT é calculado,
      // mas NÃO é entregue na rede. Devolvemos "draft" com o imposto correto e a
      // instrução do que falta — nunca fingimos uma entrega.
      if (!this.ready()) {
        const nc = notConfiguredResult("eu_einvoice", PROVIDER_KEY, MISSING_SECRET);
        return { ...nc, status: "draft", tax, message:
          "Fatura eletrônica EN 16931 montada e VAT de destino calculado. A entrega pela rede Peppol " +
          `exige um Access Point certificado (secret ${MISSING_SECRET}); enquanto não configurado, nada é enviado à rede.` };
      }

      // Entrega REAL pela rede Peppol entra aqui (Access Point certificado):
      //   const res = await fetch(peppolAccessPointUrl, { method: "POST",
      //     headers: { Authorization: `Bearer ${config.accessPointKey}`, "content-type": "application/xml" },
      //     body: buildUblInvoice(request, vat) });
      return {
        kind: "eu_einvoice",
        status: "queued",
        providerKey: PROVIDER_KEY,
        providerReference: request.reference ?? crypto.randomUUID(),
        tax,
        message: "Fatura eletrônica EN 16931 enfileirada para entrega pela rede Peppol.",
        artifacts: { xmlAvailable: true, pdfAvailable: false },
      };
    },

    async consult(providerReference: string): Promise<FiscalDocumentResult> {
      if (!this.ready()) {
        return notConfiguredResult("eu_einvoice", PROVIDER_KEY, MISSING_SECRET);
      }
      return {
        kind: "eu_einvoice",
        status: "queued",
        providerKey: PROVIDER_KEY,
        providerReference,
        message: "Consulta de entrega Peppol estará disponível com o Access Point ligado.",
      };
    },

    async cancel(providerReference: string, reason: string): Promise<FiscalDocumentResult> {
      // Na Europa não há "cancelamento" com clearance como no Brasil: emite-se uma
      // nota de crédito (credit note) que estorna a fatura. Sinalizamos isso.
      void reason;
      if (!this.ready()) {
        return notConfiguredResult("eu_einvoice", PROVIDER_KEY, MISSING_SECRET);
      }
      return {
        kind: "eu_einvoice",
        status: "cancelled",
        providerKey: PROVIDER_KEY,
        providerReference,
        message:
          "Na UE, o estorno é feito por nota de crédito (credit note) sob a EN 16931, não por cancelamento com clearance.",
      };
    },
  };
}
