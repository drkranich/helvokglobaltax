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
const organizationId = "44444444-4444-4444-8444-444444444444";
const partyId = "66666666-6666-4666-8666-666666666666";
const operationId = "77777777-7777-4777-8777-777777777777";

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

describe("Commerce parties endpoints", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists parties through the admin RPC", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: partyId, name: "Acme Ltda", status: "active" }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const app = createApp();
    const response = await app.request(
      `/v1/admin/tenants/${tenantId}/commerce/parties`,
      { headers: { "x-helvok-admin-token": "test-admin-token" } },
      adminEnv,
    );
    const body = await response.json<{ parties: Array<{ name: string }> }>();

    expect(response.status).toBe(200);
    expect(body.parties[0]?.name).toBe("Acme Ltda");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_list_parties",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ p_tenant_id: tenantId }) }),
    );
  });

  it("rejects party creation without a name", async () => {
    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/commerce/parties`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({}),
      },
      adminEnv,
    );
    const body = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_name");
  });

  it("creates a party through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen(
      { event_type: "party.created", party: { id: partyId, name: "Acme Ltda" }, parties: [] },
      201,
    );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/commerce/parties`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ name: "Acme Ltda", party_type: "customer" }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(201);
    expect(body.event_type).toBe("party.created");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_upsert_party",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("archives a party through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen({ event_type: "party.archived", parties: [] });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/commerce/parties/${partyId}/archive`,
      { method: "POST", headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("party.archived");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_archive_party",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_party_id: partyId }),
      }),
    );
  });

  it("deletes a party through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen({ event_type: "party.deleted", parties: [] });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/commerce/parties/${partyId}`,
      { method: "DELETE", headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("party.deleted");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_delete_party",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_party_id: partyId }),
      }),
    );
  });

  it("rejects party endpoints without a bearer token", async () => {
    const app = createApp();
    const response = await app.request(`/v1/tenants/${tenantId}/commerce/parties`, {}, env);
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(401);
    expect(body.error).toMatchObject({ code: "missing_token" });
  });
});

describe("Commerce operations (orders) endpoints", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists operations through the admin RPC", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: operationId, status: "draft", total_amount: 199.9 }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const app = createApp();
    const response = await app.request(
      `/v1/admin/tenants/${tenantId}/commerce/operations`,
      { headers: { "x-helvok-admin-token": "test-admin-token" } },
      adminEnv,
    );
    const body = await response.json<{ operations: Array<{ status: string }> }>();

    expect(response.status).toBe(200);
    expect(body.operations[0]?.status).toBe("draft");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_list_operations",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ p_tenant_id: tenantId }) }),
    );
  });

  it("rejects operation creation without organization_id", async () => {
    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/commerce/operations`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({}),
      },
      adminEnv,
    );
    const body = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_organization_id");
  });

  it("creates a commercial operation through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen(
      { event_type: "commercial_operation.created", operation: { id: operationId }, operations: [] },
      201,
    );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/commerce/operations`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({
          organization_id: organizationId,
          items: [{ quantity: 2, unit_amount: 50 }],
        }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(201);
    expect(body.event_type).toBe("commercial_operation.created");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_create_operation",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("updates operation status through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen({ event_type: "commercial_operation.status_changed", operations: [] });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/commerce/operations/${operationId}/status`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ status: "confirmed" }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("commercial_operation.status_changed");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_update_operation_status",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_operation_id: operationId, p_status: "confirmed" }),
      }),
    );
  });

  it("deletes a commercial operation through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen({ event_type: "commercial_operation.deleted", operations: [] });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/commerce/operations/${operationId}`,
      { method: "DELETE", headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("commercial_operation.deleted");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_delete_operation",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_operation_id: operationId }),
      }),
    );
  });

  it("rejects operation endpoints without a bearer token", async () => {
    const app = createApp();
    const response = await app.request(`/v1/tenants/${tenantId}/commerce/operations`, {}, env);
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(401);
    expect(body.error).toMatchObject({ code: "missing_token" });
  });
});
