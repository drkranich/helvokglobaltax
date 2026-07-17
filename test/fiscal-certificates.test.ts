import { afterEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app";

const CERT_KEY_BASE64 = btoa(String.fromCharCode(...Array.from({ length: 32 }, (_, i) => i + 1)));

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
  HELVOK_CERT_ENCRYPTION_KEY: CERT_KEY_BASE64,
};

const tenantId = "22222222-2222-4222-8222-222222222222";
const registrationId = "33333333-3333-4333-8333-333333333333";
const certificateId = "55555555-5555-4555-8555-555555555555";

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

describe("Fiscal certificate endpoints", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists fiscal certificate status metadata through the admin RPC", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([{ id: certificateId, file_name: "empresa.pfx", status: "active", valid_until: "2027-01-01" }]),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const app = createApp();
    const response = await app.request(
      `/v1/admin/tenants/${tenantId}/fiscal/certificates`,
      { headers: { "x-helvok-admin-token": "test-admin-token" } },
      adminEnv,
    );
    const body = await response.json<{ certificates: Array<{ file_name: string }> }>();

    expect(response.status).toBe(200);
    expect(body.certificates[0]?.file_name).toBe("empresa.pfx");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_list_fiscal_certificates",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ p_tenant_id: tenantId }) }),
    );
  });

  it("rejects a certificate upload without file_name, certificate_base64, or password", async () => {
    const app = createApp();

    const missingFile = await app.request(
      `/v1/tenants/${tenantId}/fiscal/registrations/${registrationId}/certificate`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ certificate_base64: "AAAA", password: "hunter2" }),
      },
      adminEnv,
    );
    expect(missingFile.status).toBe(400);
    expect((await missingFile.json<{ error: { code: string } }>()).error.code).toBe("invalid_file_name");

    const missingCert = await app.request(
      `/v1/tenants/${tenantId}/fiscal/registrations/${registrationId}/certificate`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ file_name: "empresa.pfx", password: "hunter2" }),
      },
      adminEnv,
    );
    expect(missingCert.status).toBe(400);
    expect((await missingCert.json<{ error: { code: string } }>()).error.code).toBe("invalid_certificate_base64");

    const missingPassword = await app.request(
      `/v1/tenants/${tenantId}/fiscal/registrations/${registrationId}/certificate`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ file_name: "empresa.pfx", certificate_base64: "AAAA" }),
      },
      adminEnv,
    );
    expect(missingPassword.status).toBe(400);
    expect((await missingPassword.json<{ error: { code: string } }>()).error.code).toBe("invalid_password");
  });

  it("returns a clear 503 when the certificate encryption key is not configured", async () => {
    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/fiscal/registrations/${registrationId}/certificate`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({ file_name: "empresa.pfx", certificate_base64: "AAAA", password: "hunter2" }),
      },
      { ...adminEnv, HELVOK_CERT_ENCRYPTION_KEY: undefined },
    );
    const body = await response.json<{ error: { code: string; message: string } }>();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("certificate_encryption_not_configured");
    expect(body.error.message).toMatch(/HELVOK_CERT_ENCRYPTION_KEY/);
  });

  it("encrypts the certificate and password before ever calling the Supabase RPC", async () => {
    const rawCertificateBase64 = btoa("fake-pfx-bytes-not-real");
    const rawPassword = "correct-horse-battery-staple";

    const fetchSpy = mockUserThen(
      {
        event_type: "fiscal_certificate.uploaded",
        certificate: { id: certificateId, file_name: "empresa.pfx", status: "active" },
        certificates: [],
      },
      201,
    );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/fiscal/registrations/${registrationId}/certificate`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer user-access-token" },
        body: JSON.stringify({
          file_name: "empresa.pfx",
          certificate_base64: rawCertificateBase64,
          password: rawPassword,
          issued_to: "Helvok Tax",
          valid_until: "2027-01-01",
        }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(201);
    expect(body.event_type).toBe("fiscal_certificate.uploaded");

    const rpcCall = fetchSpy.mock.calls[1] as [string, RequestInit];
    expect(rpcCall[0]).toBe("https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_upload_fiscal_certificate");
    const sentBody = JSON.parse(rpcCall[1].body as string);

    // The raw certificate bytes and password must never appear in the RPC call.
    expect(JSON.stringify(sentBody)).not.toContain(rawCertificateBase64);
    expect(JSON.stringify(sentBody)).not.toContain(rawPassword);
    expect(sentBody.p_payload.encrypted_payload).toBeTruthy();
    expect(sentBody.p_payload.payload_iv).toBeTruthy();
    expect(sentBody.p_payload.encrypted_password).toBeTruthy();
    expect(sentBody.p_payload.password_iv).toBeTruthy();
    expect(sentBody.p_payload.fiscal_registration_id).toBe(registrationId);
  });

  it("lists fiscal certificate status metadata for the authenticated tenant", async () => {
    const fetchSpy = mockUserThen([{ id: certificateId, status: "active" }]);

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/fiscal/certificates`,
      { headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ certificates: Array<{ status: string }> }>();

    expect(response.status).toBe(200);
    expect(body.certificates[0]?.status).toBe("active");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_list_fiscal_certificates",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ p_tenant_id: tenantId }) }),
    );
  });

  it("revokes a fiscal certificate through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen({ event_type: "fiscal_certificate.revoked", certificates: [] });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/fiscal/certificates/${certificateId}/revoke`,
      { method: "POST", headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("fiscal_certificate.revoked");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_revoke_fiscal_certificate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_certificate_id: certificateId }),
      }),
    );
  });

  it("deletes a fiscal certificate through the authenticated tenant RPC", async () => {
    const fetchSpy = mockUserThen({ event_type: "fiscal_certificate.deleted", certificates: [] });

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/fiscal/certificates/${certificateId}`,
      { method: "DELETE", headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("fiscal_certificate.deleted");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_delete_fiscal_certificate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_certificate_id: certificateId }),
      }),
    );
  });

  it("rejects certificate endpoints without a bearer token", async () => {
    const app = createApp();
    const response = await app.request(`/v1/tenants/${tenantId}/fiscal/certificates`, {}, env);
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(401);
    expect(body.error).toMatchObject({ code: "missing_token" });
  });
});
