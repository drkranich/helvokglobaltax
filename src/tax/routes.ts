import { Hono } from "hono";

import type { AppEnv } from "../env";
import { jsonResponse } from "../response";
import { simulateTax, TaxSimulationError, type TaxSimulationInput } from "./engine";
import { EXPORT_MARKETS, RULE_PACK_VERSION } from "./rule-pack";

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

  return router;
}
