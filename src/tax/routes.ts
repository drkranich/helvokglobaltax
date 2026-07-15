import { Hono } from "hono";

import type { AppEnv } from "../env";
import { jsonResponse } from "../response";
import { simulateTax, TaxSimulationError, type TaxSimulationInput } from "./engine";
import { EXPORT_MARKETS, getMarket, RULE_PACK_VERSION } from "./rule-pack";

type TaxComparePayload = TaxSimulationInput & {
  scenario?: TaxSimulationInput;
  destinations?: string[];
  limit?: number | string;
  keep_destination_tax_override?: boolean;
};

const DEFAULT_COMPARE_DESTINATIONS = ["PT", "DE", "FR", "ES", "IT", "NL", "GB", "US", "CA", "JP", "SG", "AU"];

export function createTaxRouter(): Hono<AppEnv> {
  const router = new Hono<AppEnv>();

  router.get("/tax/markets", (c) =>
    jsonResponse(c, {
      rule_pack_version: RULE_PACK_VERSION,
      count: EXPORT_MARKETS.length,
      markets: EXPORT_MARKETS,
    }),
  );

  router.post("/tax/simulate", async (c) => {
    let payload: TaxSimulationInput;
    try {
      const body = (await c.req.json()) as unknown;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return jsonResponse(
          c,
          {
            error: {
              code: "invalid_payload",
              message: "Simulation payload must be a JSON object.",
            },
          },
          400,
        );
      }
      payload = body as TaxSimulationInput;
    } catch {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_json",
            message: "Request body must be valid JSON.",
          },
        },
        400,
      );
    }

    try {
      return jsonResponse(c, {
        event_type: "tax.simulation.completed",
        simulation: simulateTax(payload),
      });
    } catch (error) {
      if (error instanceof TaxSimulationError) {
        return jsonResponse(
          c,
          {
            error: {
              code: error.code,
              message: error.message,
            },
          },
          400,
        );
      }
      throw error;
    }
  });

  router.post("/tax/compare", async (c) => {
    let payload: TaxComparePayload;
    try {
      const body = (await c.req.json()) as unknown;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return jsonResponse(
          c,
          {
            error: {
              code: "invalid_payload",
              message: "Comparison payload must be a JSON object.",
            },
          },
          400,
        );
      }
      payload = body as TaxComparePayload;
    } catch {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_json",
            message: "Request body must be valid JSON.",
          },
        },
        400,
      );
    }

    const scenario = payload.scenario && typeof payload.scenario === "object" ? payload.scenario : payload;
    const destinations = normalizeDestinations(payload.destinations);
    const limit = normalizeLimit(payload.limit);
    const scenarioForMarket = payload.keep_destination_tax_override ? scenario : omitDestinationTaxOverride(scenario);

    const comparisons = destinations
      .map((destination) => {
        const market = getMarket(destination);
        if (!market) {
          return null;
        }

        const simulation = simulateTax({
          ...scenarioForMarket,
          destination_country: market.code,
          currency: market.currency,
        });
        const riskScore = calculateRiskScore(simulation.warnings.length, simulation.next_required_data.length, market.sourceStatus);

        return {
          market: {
            code: market.code,
            name: market.name,
            region: market.region,
            currency: market.currency,
            indirect_tax_name: market.indirectTaxName,
            source_status: market.sourceStatus,
          },
          totals: {
            cost_index: roundCompareIndex(simulation.totals.customer_total / Math.max(simulation.totals.commercial_subtotal, 1)),
            customer_total: simulation.totals.customer_total,
            seller_cash_out: simulation.totals.seller_cash_out,
            destination_indirect_tax: simulation.totals.destination_indirect_tax,
            import_duty: simulation.totals.import_duty,
            excise_tax: simulation.totals.excise_tax,
            seller_gross_margin: simulation.totals.seller_gross_margin,
            seller_gross_margin_rate: simulation.totals.seller_gross_margin_rate,
            suggested_unit_price: simulation.totals.suggested_unit_price,
          },
          operational_load: {
            risk_score: riskScore,
            warnings: simulation.warnings.length,
            required_data: simulation.next_required_data.length,
            documents: simulation.document_checklist.length,
          },
          top_warnings: simulation.warnings.slice(0, 3),
          required_data: simulation.next_required_data.slice(0, 5),
        };
      })
      .filter((comparison): comparison is NonNullable<typeof comparison> => Boolean(comparison))
      .sort((a, b) => a.totals.cost_index - b.totals.cost_index)
      .slice(0, limit);

    return jsonResponse(c, {
      event_type: "tax.market_comparison.completed",
      rule_pack_version: RULE_PACK_VERSION,
      compared_at: new Date().toISOString(),
      count: comparisons.length,
      summary: {
        cheapest_market: comparisons[0] ?? null,
        best_margin_market: [...comparisons].sort((a, b) => b.totals.seller_gross_margin_rate - a.totals.seller_gross_margin_rate)[0] ?? null,
        lowest_operational_load_market: [...comparisons].sort((a, b) => a.operational_load.risk_score - b.operational_load.risk_score)[0] ?? null,
      },
      comparisons,
    });
  });

  return router;
}

function normalizeDestinations(destinations: unknown): string[] {
  const source = Array.isArray(destinations) && destinations.length > 0 ? destinations : DEFAULT_COMPARE_DESTINATIONS;
  return Array.from(
    new Set(
      source
        .map((destination) => (typeof destination === "string" ? destination.trim().slice(0, 2).toUpperCase() : ""))
        .filter(Boolean),
    ),
  );
}

function normalizeLimit(value: unknown): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : 12;
  if (!Number.isFinite(parsed)) {
    return 12;
  }
  return Math.max(1, Math.min(50, Math.floor(parsed)));
}

function omitDestinationTaxOverride(input: TaxSimulationInput): TaxSimulationInput {
  const { destination_tax_rate: _destinationTaxRate, ...rest } = input;
  return rest;
}

function calculateRiskScore(warnings: number, requiredData: number, sourceStatus: "official-seed" | "estimated-seed" | "manual-required"): number {
  const sourcePenalty = sourceStatus === "official-seed" ? 0 : sourceStatus === "estimated-seed" ? 2 : 4;
  return warnings * 2 + requiredData + sourcePenalty;
}

function roundCompareIndex(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
