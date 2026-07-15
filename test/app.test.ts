import { afterEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app";

const env = {
  APP_NAME: "Helvok Tax",
  APP_ENV: "test",
  API_VERSION: "v1",
  SUPABASE_URL: "https://jlvwudjgfzhhdgttrycj.supabase.co",
};

const adminEnv = {
  ...env,
  HELVOK_ADMIN_TOKEN: "test-admin-token\n",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key\n",
};

describe("Helvok Tax Worker API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("serves the glass command center at the root route", async () => {
    const app = createApp();
    const response = await app.request("/", {}, env);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Helvok Tax");
    expect(body).toContain("Command center vivo");
  });

  it("returns a healthy response", async () => {
    const app = createApp();
    const response = await app.request("/health", {}, env);
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("helvok-tax-api");
  });

  it("returns API metadata", async () => {
    const app = createApp();
    const response = await app.request("/v1/meta", {}, env);
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(200);
    expect(body.product).toBe("Helvok Tax");
    expect(body.api_version).toBe("v1");
  });

  it("rejects admin routes without a token", async () => {
    const app = createApp();
    const response = await app.request("/v1/admin/health", {}, adminEnv);
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(401);
    expect(body.error).toMatchObject({ code: "unauthorized" });
  });

  it("reports admin health with a valid bearer token", async () => {
    const app = createApp();
    const response = await app.request(
      "/v1/admin/health",
      {
        headers: {
          authorization: "Bearer test-admin-token",
        },
      },
      adminEnv,
    );
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.checks).toMatchObject({
      admin_token_configured: true,
      supabase_url_configured: true,
      supabase_service_role_configured: true,
    });
  });

  it("calls the tenant list RPC through Supabase REST", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: "tenant-1", slug: "tenant-one" }]), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const app = createApp();
    const response = await app.request(
      "/v1/admin/tenants",
      {
        headers: {
          "x-helvok-admin-token": "test-admin-token",
        },
      },
      adminEnv,
    );
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(200);
    expect(body.tenants).toEqual([{ id: "tenant-1", slug: "tenant-one" }]);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_list_tenants",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          apikey: "test-service-role-key",
          authorization: "Bearer test-service-role-key",
        }),
      }),
    );
  });

  it("returns structured errors when Supabase returns a non-JSON response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("upstream unavailable", {
        status: 503,
        headers: {
          "content-type": "text/plain",
        },
      }),
    );

    const app = createApp();
    const response = await app.request(
      "/v1/admin/tenants",
      {
        headers: {
          "x-helvok-admin-token": "test-admin-token",
        },
      },
      adminEnv,
    );
    const body = await response.json<Record<string, { code: string; message: string }>>();

    expect(response.status).toBe(503);
    expect(body.error).toMatchObject({
      code: "supabase_rpc_error",
      message: "Supabase RPC returned a non-JSON response.",
    });
  });
});
