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

const tenantId = "22222222-2222-4222-8222-222222222222";
const eventId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function mockUserThen(payload: unknown, status = 200) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "11111111-1111-4111-8111-111111111111", email: "owner@helvok.tax" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } }),
    );
}

describe("Audit events endpoints", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists audit events through the admin RPC", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: eventId, event_type: "party.created" }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const app = createApp();
    const response = await app.request(
      `/v1/admin/tenants/${tenantId}/audit/events`,
      { headers: { "x-helvok-admin-token": "test-admin-token" } },
      adminEnv,
    );
    const body = await response.json<{ events: Array<{ event_type: string }> }>();

    expect(response.status).toBe(200);
    expect(body.events[0]?.event_type).toBe("party.created");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_list_audit_events",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ p_tenant_id: tenantId, p_limit: 100 }) }),
    );
  });

  it("lists audit events through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen([{ id: eventId, event_type: "rule_version.published" }]);

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/audit/events`,
      { headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ events: Array<{ event_type: string }> }>();

    expect(response.status).toBe(200);
    expect(body.events[0]?.event_type).toBe("rule_version.published");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_list_audit_events",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ p_tenant_id: tenantId, p_limit: 100 }) }),
    );
  });

  it("clamps an out-of-range limit query parameter to the maximum", async () => {
    const fetchSpy = mockUserThen([]);

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/audit/events?limit=9000`,
      { headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_list_audit_events",
      expect.objectContaining({ body: JSON.stringify({ p_tenant_id: tenantId, p_limit: 500 }) }),
    );
  });

  it("rejects audit events endpoint without a bearer token", async () => {
    const app = createApp();
    const response = await app.request(`/v1/tenants/${tenantId}/audit/events`, {}, env);
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(401);
    expect(body.error).toMatchObject({ code: "missing_token" });
  });
});
