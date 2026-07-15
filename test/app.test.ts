import { afterEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app";

const env = {
  APP_NAME: "Helvok Tax",
  APP_ENV: "test",
  API_VERSION: "v1",
  SUPABASE_URL: "https://jlvwudjgfzhhdgttrycj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
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

  it("returns public Supabase Auth configuration", async () => {
    const app = createApp();
    const response = await app.request("/v1/auth/config", {}, env);
    const body = await response.json<Record<string, { supabase_url: string; supabase_publishable_key: string }>>();

    expect(response.status).toBe(200);
    expect(body.auth).toMatchObject({
      supabase_url: "https://jlvwudjgfzhhdgttrycj.supabase.co",
      supabase_publishable_key: "test-publishable-key",
    });
  });

  it("rejects session routes without a user token", async () => {
    const app = createApp();
    const response = await app.request("/v1/me", {}, env);
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(401);
    expect(body.error).toMatchObject({ code: "missing_token" });
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

  it("calls the membership list RPC through Supabase REST", async () => {
    const tenantId = "22222222-2222-4222-8222-222222222222";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: "membership-1", status: "active" }]), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const app = createApp();
    const response = await app.request(
      `/v1/admin/tenants/${tenantId}/memberships`,
      {
        headers: {
          "x-helvok-admin-token": "test-admin-token",
        },
      },
      adminEnv,
    );
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(200);
    expect(body.memberships).toEqual([{ id: "membership-1", status: "active" }]);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_list_memberships",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId }),
      }),
    );
  });

  it("creates a tenant owner membership through admin RPC", async () => {
    const tenantId = "22222222-2222-4222-8222-222222222222";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          membership: {
            id: "membership-1",
            status: "active",
            user: { email: "owner@helvok.tax" },
            role: { role_key: "owner" },
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const app = createApp();
    const response = await app.request(
      "/v1/admin/memberships",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-helvok-admin-token": "test-admin-token",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          email: "Owner@Helvok.Tax",
          role_key: "owner",
        }),
      },
      adminEnv,
    );
    const body = await response.json<{ membership: { user: { email: string }; role: { role_key: string } } }>();

    expect(response.status).toBe(201);
    expect(body.membership.user.email).toBe("owner@helvok.tax");
    expect(body.membership.role.role_key).toBe("owner");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_upsert_membership",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          payload: {
            tenant_id: tenantId,
            role_key: "owner",
            scope_type: "tenant",
            status: "active",
            email: "owner@helvok.tax",
          },
        }),
      }),
    );
  });

  it("rejects membership creation without a user selector", async () => {
    const app = createApp();
    const response = await app.request(
      "/v1/admin/memberships",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-helvok-admin-token": "test-admin-token",
        },
        body: JSON.stringify({
          tenant_id: "22222222-2222-4222-8222-222222222222",
        }),
      },
      adminEnv,
    );
    const body = await response.json<Record<string, { code: string; message: string }>>();

    expect(response.status).toBe(400);
    expect(body.error).toMatchObject({
      code: "invalid_payload",
      message: "user_id, auth_user_id, or email is required.",
    });
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

  it("syncs a Supabase Auth user before returning a session summary", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "11111111-1111-4111-8111-111111111111",
            email: "Owner@Helvok.Tax",
            user_metadata: {
              full_name: "Helvok Owner",
            },
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user: { email: "owner@helvok.tax" } }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user: { email: "owner@helvok.tax" }, counts: { tenants: 0 } }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

    const app = createApp();
    const response = await app.request(
      "/v1/session/sync",
      {
        method: "POST",
        headers: {
          authorization: "Bearer user-access-token",
        },
      },
      adminEnv,
    );
    const body = await response.json<{ session: { user: { email: string } } }>();

    expect(response.status).toBe(200);
    expect(body.session.user.email).toBe("owner@helvok.tax");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/auth/v1/user",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          apikey: "test-publishable-key",
          authorization: "Bearer user-access-token",
        }),
      }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_sync_user",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      3,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_session",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer user-access-token",
        }),
      }),
    );
  });

  it("loads authenticated tenant access for a member manager", async () => {
    const tenantId = "22222222-2222-4222-8222-222222222222";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "11111111-1111-4111-8111-111111111111", email: "owner@helvok.tax" }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ memberships: [], roles: [], counts: { memberships: 0 } }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/access`,
      {
        headers: {
          authorization: "Bearer user-access-token",
        },
      },
      adminEnv,
    );
    const body = await response.json<{ access: { counts: { memberships: number } } }>();

    expect(response.status).toBe(200);
    expect(body.access.counts.memberships).toBe(0);
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_tenant_access",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          apikey: "test-publishable-key",
          authorization: "Bearer user-access-token",
        }),
        body: JSON.stringify({ p_tenant_id: tenantId }),
      }),
    );
  });

  it("grants membership through authenticated tenant access RPC", async () => {
    const tenantId = "22222222-2222-4222-8222-222222222222";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "11111111-1111-4111-8111-111111111111", email: "owner@helvok.tax" }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ event_type: "membership.created", membership: { status: "active" } }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/memberships`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer user-access-token",
        },
        body: JSON.stringify({
          email: "Member@Helvok.Tax",
          role_key: "viewer",
          status: "active",
        }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string; membership: { status: string } }>();

    expect(response.status).toBe(201);
    expect(body.event_type).toBe("membership.created");
    expect(body.membership.status).toBe("active");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_upsert_membership",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          apikey: "test-publishable-key",
          authorization: "Bearer user-access-token",
        }),
        body: JSON.stringify({
          payload: {
            tenant_id: tenantId,
            role_key: "viewer",
            scope_type: "tenant",
            status: "active",
            email: "member@helvok.tax",
          },
        }),
      }),
    );
  });
});
