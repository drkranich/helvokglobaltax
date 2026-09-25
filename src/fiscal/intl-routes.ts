// Helvok Tax - Rotas de serviços fiscais internacionais.
//
// Expõe a camada internacional criada em src/fiscal/:
//  - POST /v1/intl/vat    -> calcula o VAT de destino (vat.ts), sem tocar em governo.
//  - POST /v1/intl/emit   -> roteia por país (providerForCountry) e monta/emite o documento.
//  - GET  /v1/intl/vat-rates -> tabela de alíquotas VAT por país (para a tela).
//
// GUARDRAIL: a emissão real fica DESLIGADA até haver credenciais; sem elas, os
// provedores retornam status "not_configured"/"draft" — nunca fingem emissão.

import { Hono } from "hono";
import type { Context } from "hono";

import type { AppEnv } from "../env";
import { jsonResponse } from "../response";
import { applyVat, listVatRates, decideVat, type VatContext } from "./vat";
import {
  providerForCountry,
  type FiscalDocumentRequest,
  type FiscalRouterConfig,
} from "./fiscal-provider";
import { createFocusNfeProvider } from "./providers/br-focusnfe";
import { createHelvokPeppolProvider } from "./providers/eu-helvok-peppol";
import { createInvoiceProvider } from "./providers/invoice";

function badRequest(c: Context<AppEnv>, message: string) {
  return jsonResponse(c, { error: { code: "invalid_payload", message } }, 400);
}

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : fallback;
}

// Converte um valor monetário (unidades, ex.: 100.50) para centavos inteiros.
function toCents(value: unknown): number {
  return Math.round(toNumber(value, 0) * 100);
}

function buildRouterConfig(env: AppEnv["Bindings"]): FiscalRouterConfig {
  // Cada provedor lê sua credencial do ambiente; sem ela, opera em modo "não configurado".
  const focusToken = (env as Record<string, string | undefined>).FOCUS_NFE_TOKEN;
  const peppolKey = (env as Record<string, string | undefined>).HELVOK_PEPPOL_AP_KEY;
  return {
    focusNfe: () => createFocusNfeProvider({ token: focusToken }),
    helvokPeppol: () => createHelvokPeppolProvider({ accessPointKey: peppolKey }),
    // numeração sequencial simples (em produção, persistir o contador por tenant)
    invoiceFallback: () => createInvoiceProvider({ nextSequence: () => Date.now() % 1_000_000 }),
  };
}

export function createIntlFiscalRouter(): Hono<AppEnv> {
  const router = new Hono<AppEnv>();

  // Tabela de alíquotas VAT (para preencher a tela).
  router.get("/intl/vat-rates", (c) =>
    jsonResponse(c, {
      event_type: "intl.vat_rates.listed",
      rates: listVatRates(),
    }),
  );

  // Cálculo de VAT de destino (OSS/IOSS/reverse charge/doméstico).
  router.post("/intl/vat", async (c) => {
    let body: Record<string, unknown>;
    try {
      const parsed = (await c.req.json()) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return badRequest(c, "O corpo deve ser um objeto JSON.");
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return badRequest(c, "Corpo da requisição não é JSON válido.");
    }

    const origin = typeof body.origin_country === "string" ? body.origin_country : "";
    const destination = typeof body.destination_country === "string" ? body.destination_country : "";
    if (!origin || !destination) {
      return badRequest(c, "Informe origin_country e destination_country (ISO alpha-2).");
    }

    const netAmountCents = toCents(body.net_amount);
    const context: VatContext = {
      originCountry: origin,
      destinationCountry: destination,
      isB2C: body.is_b2c !== false, // default B2C
      euCrossBorderSalesYtdCents: toCents(body.eu_cross_border_sales_ytd),
      isImportIntoEu: body.is_import_into_eu === true,
      overrideRatePercent:
        typeof body.override_rate_percent === "number" ? body.override_rate_percent : undefined,
    };

    const decision = decideVat(context);
    const breakdown = applyVat(netAmountCents, context);

    return jsonResponse(c, {
      event_type: "intl.vat.calculated",
      decision: {
        applicable_country: decision.applicableCountry,
        rate_percent: decision.ratePercent,
        regime: decision.regime,
        rationale: decision.rationale,
      },
      amounts: {
        net_amount_cents: breakdown.netAmountCents,
        vat_amount_cents: breakdown.vatAmountCents,
        gross_amount_cents: breakdown.grossAmountCents,
        currency: typeof body.currency === "string" ? body.currency : "EUR",
      },
    });
  });

  // Monta/emite o documento roteando pelo país de destino.
  router.post("/intl/emit", async (c) => {
    let body: Record<string, unknown>;
    try {
      const parsed = (await c.req.json()) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return badRequest(c, "O corpo deve ser um objeto JSON.");
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return badRequest(c, "Corpo da requisição não é JSON válido.");
    }

    const seller = body.seller as Record<string, unknown> | undefined;
    const buyer = body.buyer as Record<string, unknown> | undefined;
    const rawItems = Array.isArray(body.items) ? (body.items as Record<string, unknown>[]) : [];

    if (!seller || !buyer || rawItems.length === 0) {
      return badRequest(c, "Informe seller, buyer e ao menos um item.");
    }
    const sellerCountry = typeof seller.country_code === "string" ? seller.country_code : "";
    const buyerCountry = typeof buyer.country_code === "string" ? buyer.country_code : "";
    if (!sellerCountry || !buyerCountry) {
      return badRequest(c, "seller.country_code e buyer.country_code são obrigatórios (ISO alpha-2).");
    }

    const request: FiscalDocumentRequest = {
      seller: {
        legalName: typeof seller.legal_name === "string" ? seller.legal_name : "Vendedor",
        countryCode: sellerCountry,
        taxId: typeof seller.tax_id === "string" ? seller.tax_id : undefined,
        isBusiness: seller.is_business !== false,
      },
      buyer: {
        legalName: typeof buyer.legal_name === "string" ? buyer.legal_name : "Comprador",
        countryCode: buyerCountry,
        taxId: typeof buyer.tax_id === "string" ? buyer.tax_id : undefined,
        isBusiness: buyer.is_business === true, // default consumidor (B2C)
      },
      items: rawItems.map((it) => ({
        description: typeof it.description === "string" ? it.description : "Item",
        quantity: Math.max(1, toNumber(it.quantity, 1)),
        unitPriceCents: toCents(it.unit_price),
        taxCode: typeof it.tax_code === "string" ? it.tax_code : undefined,
        vatRatePercent: typeof it.vat_rate_percent === "number" ? it.vat_rate_percent : undefined,
      })),
      currency: typeof body.currency === "string" ? body.currency : "EUR",
      euCrossBorderSalesYtdCents: toCents(body.eu_cross_border_sales_ytd),
      isImportIntoEu: body.is_import_into_eu === true,
      reference: typeof body.reference === "string" ? body.reference : undefined,
    };

    const config = buildRouterConfig(c.env);
    const provider = providerForCountry(buyerCountry, config);

    let result;
    try {
      result = await provider.emit(request);
    } catch (error) {
      return jsonResponse(
        c,
        {
          error: {
            code: "emit_failed",
            message: error instanceof Error ? error.message : "Falha ao montar o documento.",
          },
        },
        502,
      );
    }

    return jsonResponse(c, {
      event_type: "intl.document.processed",
      provider: result.providerKey,
      document: result,
    });
  });

  return router;
}
