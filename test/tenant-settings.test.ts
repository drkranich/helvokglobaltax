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

describe("Tenant settings endpoints", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("gets tenant settings through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen({ settings: { display_name: "Helvok Tax Foundation", default_locale: "pt-BR" } });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/settings`,
      { headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ settings: { display_name: string } }>();

    expect(response.status).toBe(200);
    expect(body.settings.display_name).toBe("Helvok Tax Foundation");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_get_tenant_settings",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ p_tenant_id: tenantId }) }),
    );
  });

  it("updates tenant settings through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen({
      event_type: "tenant_settings.updated",
      settings: { display_name: "Helvok Global", default_currency: "USD" },
    });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/settings`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ display_name: "Helvok Global", default_currency: "USD" }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("tenant_settings.updated");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_update_tenant_settings",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejects settings endpoints without a bearer token", async () => {
    const app = createApp();
    const response = await app.request(`/v1/tenants/${tenantId}/settings`, {}, env);
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(401);
    expect(body.error).toMatchObject({ code: "missing_token" });
  });
});
