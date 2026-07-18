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
const obligationId = "99999999-9999-4999-8999-999999999999";

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

describe("Compliance obligations endpoints", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists obligations through the admin RPC", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: obligationId, market_code: "BR", status: "pending" }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const app = createApp();
    const response = await app.request(
      `/v1/admin/tenants/${tenantId}/compliance/obligations`,
      { headers: { "x-helvok-admin-token": "test-admin-token" } },
      adminEnv,
    );
    const body = await response.json<{ obligations: Array<{ market_code: string }> }>();

    expect(response.status).toBe(200);
    expect(body.obligations[0]?.market_code).toBe("BR");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_list_obligations",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ p_tenant_id: tenantId }) }),
    );
  });

  it("rejects obligation creation without a title", async () => {
    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/compliance/obligations`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ market_code: "BR", due_date: "2026-08-15" }),
      },
      adminEnv,
    );
    const body = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_title");
  });

  it("rejects obligation creation without a due_date", async () => {
    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/compliance/obligations`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ title: "DAS mensal", market_code: "BR" }),
      },
      adminEnv,
    );
    const body = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_due_date");
  });

  it("creates an obligation through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen(
      { event_type: "obligation.created", obligation: { id: obligationId, status: "pending" }, obligations: [] },
      201,
    );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/compliance/obligations`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ title: "DAS mensal", market_code: "BR", due_date: "2026-08-20" }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(201);
    expect(body.event_type).toBe("obligation.created");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_upsert_obligation",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("marks an obligation as completed through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen({ event_type: "obligation.completed", obligations: [] });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/compliance/obligations/${obligationId}/complete`,
      { method: "POST", headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("obligation.completed");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_complete_obligation",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_obligation_id: obligationId }),
      }),
    );
  });

  it("cancels an obligation through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen({ event_type: "obligation.cancelled", obligations: [] });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/compliance/obligations/${obligationId}/cancel`,
      { method: "POST", headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("obligation.cancelled");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_cancel_obligation",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_obligation_id: obligationId }),
      }),
    );
  });

  it("deletes an obligation through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen({ event_type: "obligation.deleted", obligations: [] });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/compliance/obligations/${obligationId}`,
      { method: "DELETE", headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("obligation.deleted");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_delete_obligation",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_obligation_id: obligationId }),
      }),
    );
  });

  it("rejects obligation endpoints without a bearer token", async () => {
    const app = createApp();
    const response = await app.request(`/v1/tenants/${tenantId}/compliance/obligations`, {}, env);
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(401);
    expect(body.error).toMatchObject({ code: "missing_token" });
  });
});
