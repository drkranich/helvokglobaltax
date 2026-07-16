import { Hono } from "hono";

import type { AppEnv } from "../env";
import { jsonResponse } from "../response";
import { planFinancialScenario, type FinancialPlanningInput } from "./engine";

export function createFinancialRouter(): Hono<AppEnv> {
  const router = new Hono<AppEnv>();

  router.post("/financial/plan", async (c) => {
    let payload: FinancialPlanningInput;
    try {
      const body = (await c.req.json()) as unknown;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return jsonResponse(
          c,
          {
            error: {
              code: "invalid_payload",
              message: "Financial planning payload must be a JSON object.",
            },
          },
          400,
        );
      }
      payload = body as FinancialPlanningInput;
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

    return jsonResponse(c, {
      event_type: "financial.plan.calculated",
      plan: planFinancialScenario(payload),
    });
  });

  return router;
}
