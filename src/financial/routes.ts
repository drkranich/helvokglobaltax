import { Hono } from "hono";
import type { Context } from "hono";

import type { AppEnv } from "../env";
import { jsonResponse } from "../response";
import { getFinancialBlueprint, planFinancialScenario, type FinancialPlanningInput } from "./engine";

export function createFinancialRouter(): Hono<AppEnv> {
  const router = new Hono<AppEnv>();

  router.get("/financial/blueprint", (c) =>
    jsonResponse(c, {
      event_type: "financial.blueprint.loaded",
      blueprint: getFinancialBlueprint(),
    }),
  );

  const exportPlanHandler = (c: Context<AppEnv>) =>
    jsonResponse(c, {
      event_type: "financial.export_plan.loaded",
      exports: getFinancialBlueprint().spreadsheet_exports.map((format) => ({
        format,
        reproducible: true,
        stores_calculation_memory: true,
      })),
    });

  router.get("/financial/export-plan", exportPlanHandler);
  router.get("/financial/exports", exportPlanHandler);

  router.get("/financial/automation-events", (c) =>
    jsonResponse(c, {
      event_type: "financial.automation_events.loaded",
      events: getFinancialBlueprint().automation_events,
    }),
  );

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
