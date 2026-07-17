import { Hono } from "hono";

import type { AppEnv } from "../env";
import { jsonResponse } from "../response";
import { getAdapterManifest, listAdapterManifests, summarizeAdapterCoverage } from "./adapters/registry";
import {
  BRAZIL_TAX_TABLES_SUMMARY,
  CFOP_CODES,
  CSOSN_CODES,
  CST_ICMS_CODES,
  NCM_CEST_SAMPLE,
} from "./adapters/brazil/tax-tables";

export function createFiscalAdapterRouter(): Hono<AppEnv> {
  const router = new Hono<AppEnv>();

  router.get("/fiscal/adapters", (c) =>
    jsonResponse(c, {
      event_type: "fiscal.adapters.listed",
      coverage: summarizeAdapterCoverage(),
      adapters: listAdapterManifests(),
    }),
  );

  router.get("/fiscal/adapters/coverage", (c) =>
    jsonResponse(c, {
      event_type: "fiscal.adapters.coverage_loaded",
      coverage: summarizeAdapterCoverage(),
    }),
  );

  router.get("/fiscal/adapters/brazil/tax-tables", (c) =>
    jsonResponse(c, {
      event_type: "fiscal.brazil.tax_tables_loaded",
      summary: BRAZIL_TAX_TABLES_SUMMARY,
      cfop: CFOP_CODES,
      cst_icms: CST_ICMS_CODES,
      csosn: CSOSN_CODES,
      ncm_cest_sample: NCM_CEST_SAMPLE,
    }),
  );

  router.get("/fiscal/adapters/:adapterKey{.+}", (c) => {
    const adapterKey = c.req.param("adapterKey");
    const manifest = getAdapterManifest(adapterKey);

    if (!manifest) {
      return jsonResponse(
        c,
        {
          error: {
            code: "adapter_not_found",
            message: `No adapter is registered for key "${adapterKey}".`,
          },
        },
        404,
      );
    }

    return jsonResponse(c, {
      event_type: "fiscal.adapter.loaded",
      adapter: manifest,
    });
  });

  return router;
}
