import { createBillingRouter } from "./billing/routes";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";

import { createAdminRouter } from "./admin/routes";
import type { AppEnv } from "./env";
import { createFiscalAdapterRouter } from "./fiscal/routes";
import { createIntlFiscalRouter } from "./fiscal/intl-routes";
import { createFinancialRouter } from "./financial/routes";
import { renderDashboard } from "./frontend/dashboard";
import { pwaManifest, serviceWorker } from "./frontend/pwa";
import { pwaIcons } from "./frontend/pwa-icons";
import { htmlResponse, jsonResponse } from "./response";
import { createSessionRouter } from "./session/routes";
import { createTaxRouter } from "./tax/routes";

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

  app.get("/", (c) => htmlResponse(c, renderDashboard()));
  app.get("/favicon.ico", () => new Response(Uint8Array.from(atob(pwaIcons["192"]!), character => character.charCodeAt(0)), { headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" } }));
  app.get("/app", (c) => htmlResponse(c, renderDashboard()));
  app.get("/manifest.webmanifest", () => new Response(JSON.stringify(pwaManifest), {
    headers: { "content-type": "application/manifest+json", "cache-control": "public, max-age=3600" },
  }));
  app.get("/sw.js", () => new Response(serviceWorker, {
    headers: { "content-type": "application/javascript", "cache-control": "no-cache", "service-worker-allowed": "/" },
  }));
  for (const size of ["192", "512"]) {
    app.get(`/pwa-icon-${size}.png`, () => {
      const bytes = Uint8Array.from(atob(pwaIcons[size]!), character => character.charCodeAt(0));
      return new Response(bytes, { headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" } });
    });
  }

  app.route("/v1", createBillingRouter());

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
        auth: "supabase-auth-preview",
        session: "rls-session-preview",
        tenants: "admin-api-preview",
        members: "authenticated-rbac-preview",
        invitations: "authenticated-invite-preview",
        organizations: "admin-api-preview",
        products: "authenticated-catalog-preview",
        tax_simulator: "edge-estimate-engine-preview",
        tax_rules: "seed-rule-pack-preview",
        financial_planning: "helvok-cost-engine-preview",
        fiscal_documents: "global-lifecycle-preview",
        fiscal_adapters: "country-adapter-scaffold-preview",
        fiscal_registrations: "tenant-registration-preview",
        fiscal_certificates: "encrypted-storage-preview",
        commerce_parties: "authenticated-crud-preview",
        commerce_operations: "authenticated-crud-preview",
        rules_workflow: "authenticated-review-workflow-preview",
        compliance_obligations: "authenticated-crud-preview",
        audit: "authenticated-read-preview",
        tenant_settings: "authenticated-settings-preview",
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

  app.route("/v1/admin", createAdminRouter());
  app.route("/v1", createSessionRouter());
  app.route("/v1", createTaxRouter());
  app.route("/v1", createFinancialRouter());
  app.route("/v1", createFiscalAdapterRouter());
  app.route("/v1", createIntlFiscalRouter());

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
