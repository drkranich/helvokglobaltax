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
const organizationId = "33333333-3333-4333-8333-333333333333";
const registrationId = "44444444-4444-4444-8444-444444444444";

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

describe("Fiscal registration endpoints", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists fiscal registrations through the admin RPC", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          { id: registrationId, country_code: "BR", tax_id: "12345678000199", status: "draft" },
        ]),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const app = createApp();
    const response = await app.request(
      `/v1/admin/tenants/${tenantId}/fiscal/registrations`,
      { headers: { "x-helvok-admin-token": "test-admin-token" } },
      adminEnv,
    );
    const body = await response.json<{ registrations: Array<{ country_code: string }> }>();

    expect(response.status).toBe(200);
    expect(body.registrations[0]?.country_code).toBe("BR");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_list_fiscal_registrations",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ p_tenant_id: tenantId }) }),
    );
  });

  it("lists organizations for the authenticated tenant", async () => {
    const fetchSpy = mockUserThen([{ id: organizationId, legal_name: "Helvok Tax", country_of_registration: "BR" }]);

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/organizations`,
      { headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ organizations: Array<{ id: string }> }>();

    expect(response.status).toBe(200);
    expect(body.organizations[0]?.id).toBe(organizationId);
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_list_organizations",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ p_tenant_id: tenantId }) }),
    );
  });

  it("lists fiscal registrations for the authenticated tenant", async () => {
    const fetchSpy = mockUserThen([{ id: registrationId, country_code: "BR", status: "draft" }]);

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/fiscal/registrations`,
      { headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ registrations: Array<{ country_code: string }> }>();

    expect(response.status).toBe(200);
    expect(body.registrations[0]?.country_code).toBe("BR");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_list_fiscal_registrations",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ p_tenant_id: tenantId }) }),
    );
  });

  it("rejects fiscal registration creation without organization_id, country_code, or tax_id", async () => {
    const app = createApp();

    const missingOrg = await app.request(
      `/v1/tenants/${tenantId}/fiscal/registrations`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ country_code: "BR", tax_id: "12345678000199" }),
      },
      adminEnv,
    );
    expect(missingOrg.status).toBe(400);
    expect((await missingOrg.json<{ error: { code: string } }>()).error.code).toBe("invalid_organization_id");

    const missingCountry = await app.request(
      `/v1/tenants/${tenantId}/fiscal/registrations`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ organization_id: organizationId, tax_id: "12345678000199" }),
      },
      adminEnv,
    );
    expect(missingCountry.status).toBe(400);
    expect((await missingCountry.json<{ error: { code: string } }>()).error.code).toBe("invalid_country_code");

    const missingTaxId = await app.request(
      `/v1/tenants/${tenantId}/fiscal/registrations`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ organization_id: organizationId, country_code: "BR" }),
      },
      adminEnv,
    );
    expect(missingTaxId.status).toBe(400);
    expect((await missingTaxId.json<{ error: { code: string } }>()).error.code).toBe("invalid_tax_id");
  });

  it("creates a fiscal registration through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen(
      {
        event_type: "fiscal_registration.created",
        registration: { id: registrationId, country_code: "BR", tax_id: "12345678000199", status: "draft" },
        registrations: [],
      },
      201,
    );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/fiscal/registrations`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({
          organization_id: organizationId,
          country_code: "BR",
          tax_id: "12345678000199",
          tax_id_label: "CNPJ",
          tax_regime: "simples_nacional",
          secondary_registration: "1234567890",
          secondary_registration_label: "Inscrição Estadual",
          fiscal_address: { city: "São Paulo", state_code: "SP", country_code: "BR" },
        }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(201);
    expect(body.event_type).toBe("fiscal_registration.created");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_upsert_fiscal_registration",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("archives a fiscal registration through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen({
      event_type: "fiscal_registration.archived",
      registration: { id: registrationId, status: "archived" },
      registrations: [],
    });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/fiscal/registrations/${registrationId}/archive`,
      { method: "POST", headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("fiscal_registration.archived");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_archive_fiscal_registration",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_registration_id: registrationId }),
      }),
    );
  });

  it("deletes a fiscal registration through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen({
      event_type: "fiscal_registration.deleted",
      registrations: [],
    });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/fiscal/registrations/${registrationId}`,
      { method: "DELETE", headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("fiscal_registration.deleted");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_delete_fiscal_registration",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_registration_id: registrationId }),
      }),
    );
  });

  it("rejects registration endpoints without a bearer token", async () => {
    const app = createApp();
    const response = await app.request(`/v1/tenants/${tenantId}/fiscal/registrations`, {}, env);
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(401);
    expect(body.error).toMatchObject({ code: "missing_token" });
  });
});
