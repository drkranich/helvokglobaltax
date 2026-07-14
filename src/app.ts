import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";

import type { AppEnv } from "./env";
import { jsonResponse } from "./response";

export function createApp(): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.use(
    "*",
    secureHeaders({
      xFrameOptions: "DENY",
      xContentTypeOptions: "nosniff",
      referrerPolicy: "no-referrer",
    }),
  );

  app.get("/", (c) =>
    jsonResponse(c, {
      service: c.env.APP_NAME,
      status: "ok",
      message: "Helvok Tax API is online.",
      links: {
        health: "/health",
        version: `/${c.env.API_VERSION}`,
      },
    }),
  );

  app.get("/health", (c) =>
    jsonResponse(c, {
      service: "helvok-tax-api",
      status: "ok",
      environment: c.env.APP_ENV,
      timestamp: new Date().toISOString(),
      checks: {
        worker: "ok",
        supabase_configured: Boolean(c.env.SUPABASE_URL),
      },
    }),
  );

  app.get("/v1", (c) =>
    jsonResponse(c, {
      service: c.env.APP_NAME,
      api_version: "v1",
      status: "foundation-ready",
      modules: {
        tenants: "planned",
        organizations: "planned",
        tax_rules: "planned",
        fiscal_documents: "planned",
        audit: "planned",
      },
    }),
  );

  app.get("/v1/status", (c) =>
    jsonResponse(c, {
      service: "helvok-tax-api",
      api_version: "v1",
      status: "online",
      runtime: "cloudflare-workers",
      environment: c.env.APP_ENV,
    }),
  );

  app.get("/v1/meta", (c) =>
    jsonResponse(c, {
      product: "Helvok Tax",
      api_version: "v1",
      architecture_phase: "worker-api-foundation",
      principles: [
        "fiscal-neutral-core",
        "country-adapters",
        "versioned-tax-rules",
        "async-fiscal-documents",
        "immutable-audit",
      ],
    }),
  );

  app.notFound((c) =>
    jsonResponse(
      c,
      {
        error: {
          code: "not_found",
          message: "Route not found.",
        },
      },
      404,
    ),
  );

  app.onError((error, c) => {
    console.error(
      JSON.stringify({
        level: "error",
        message: error.message,
        request_id: c.req.header("cf-ray"),
      }),
    );

    return jsonResponse(
      c,
      {
        error: {
          code: "internal_error",
          message: "Unexpected server error.",
        },
      },
      500,
    );
  });

  return app;
}
