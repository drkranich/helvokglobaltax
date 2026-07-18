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
const ruleId = "88888888-8888-4888-8888-888888888888";

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

describe("Rules workflow endpoints", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists rule versions through the admin RPC", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: ruleId, market_code: "BR", status: "draft" }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const app = createApp();
    const response = await app.request(
      `/v1/admin/tenants/${tenantId}/rules/versions`,
      { headers: { "x-helvok-admin-token": "test-admin-token" } },
      adminEnv,
    );
    const body = await response.json<{ rule_versions: Array<{ market_code: string }> }>();

    expect(response.status).toBe(200);
    expect(body.rule_versions[0]?.market_code).toBe("BR");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_list_rule_versions",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ p_tenant_id: tenantId }) }),
    );
  });

  it("rejects rule version creation without a title", async () => {
    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/rules/versions`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ market_code: "BR" }),
      },
      adminEnv,
    );
    const body = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_title");
  });

  it("rejects rule version creation without a market_code", async () => {
    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/rules/versions`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ title: "Ajuste ICMS-ST" }),
      },
      adminEnv,
    );
    const body = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_market_code");
  });

  it("creates a rule version through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen(
      { event_type: "rule_version.created", rule_version: { id: ruleId, status: "draft" }, rule_versions: [] },
      201,
    );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/rules/versions`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ title: "Ajuste ICMS-ST", market_code: "BR", payload: { rate: 0.18 } }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(201);
    expect(body.event_type).toBe("rule_version.created");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_create_rule_version",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("submits a rule version for review", async () => {
    const fetchSpy = mockUserThen({ event_type: "rule_version.submitted", rule_versions: [] });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/rules/versions/${ruleId}/submit`,
      { method: "POST", headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("rule_version.submitted");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_submit_rule_version",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_rule_id: ruleId }),
      }),
    );
  });

  it("rejects review without a valid decision", async () => {
    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/rules/versions/${ruleId}/review`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ decision: "maybe" }),
      },
      adminEnv,
    );
    const body = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_decision");
  });

  it("reviews a rule version (approve) through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen({ event_type: "rule_version.approved", rule_versions: [] });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/rules/versions/${ruleId}/review`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ decision: "approved", notes: "Confere com a legislação vigente." }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("rule_version.approved");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_review_rule_version",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("publishes a rule version through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen({ event_type: "rule_version.published", rule_versions: [] });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/rules/versions/${ruleId}/publish`,
      { method: "POST", headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("rule_version.published");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_publish_rule_version",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_rule_id: ruleId }),
      }),
    );
  });

  it("deletes a rule version through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen({ event_type: "rule_version.deleted", rule_versions: [] });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/rules/versions/${ruleId}`,
      { method: "DELETE", headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("rule_version.deleted");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_delete_rule_version",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_rule_id: ruleId }),
      }),
    );
  });

  it("rejects rule endpoints without a bearer token", async () => {
    const app = createApp();
    const response = await app.request(`/v1/tenants/${tenantId}/rules/versions`, {}, env);
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(401);
    expect(body.error).toMatchObject({ code: "missing_token" });
  });
});
