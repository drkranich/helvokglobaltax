import { afterEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app";
import { ADAPTER_MANIFESTS, getAdapter, getAdapterManifest, summarizeAdapterCoverage } from "../src/fiscal/adapters/registry";
import { FiscalAdapterNotConnectedError } from "../src/fiscal/adapters/types";

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

describe("Fiscal adapter registry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers an adapter for every country/jurisdiction requested for the compliance roadmap", () => {
    const coverage = summarizeAdapterCoverage();

    expect(coverage.total_adapters).toBe(ADAPTER_MANIFESTS.length);
    expect(coverage.by_region).toMatchObject({
      brazil: 6,
      usa: 1,
      canada: 1,
      europe: 14,
      latam: 8,
      asia_pacific: 7,
      middle_east: 3,
    });
    // Every adapter starts out "planned": no certificate, government
    // enrollment, or live transport exists yet for any of them.
    expect(coverage.by_status).toEqual({ planned: coverage.total_adapters });
  });

  it("keeps Brazil's NF-e/NFC-e/NFS-e/CT-e/MDF-e/SAT-CF-e adapters distinct and jurisdiction-complete", () => {
    const nfe = getAdapterManifest("adapters/brazil/nfe");
    const nfse = getAdapterManifest("adapters/brazil/nfse");

    expect(nfe).toBeDefined();
    expect(nfse).toBeDefined();
    expect(nfe?.supported_jurisdictions).toHaveLength(27);
    expect(nfe?.supported_jurisdictions.map((state) => state.code)).toEqual(expect.arrayContaining(["SP", "RJ", "MG", "DF"]));
    expect(
      ["adapters/brazil/nfce", "adapters/brazil/cte", "adapters/brazil/mdfe", "adapters/brazil/cfe-sat"].every(
        (key) => getAdapterManifest(key) !== undefined,
      ),
    ).toBe(true);
  });

  it("declares every adapter as not production-ready, matching the 'no faked emission' requirement", () => {
    for (const manifest of ADAPTER_MANIFESTS) {
      expect(manifest.production_support).toBe(false);
      expect(manifest.requirements.length).toBeGreaterThan(0);
    }
  });

  it("throws a clearly labeled FiscalAdapterNotConnectedError instead of faking a transmission", async () => {
    const adapter = getAdapter("adapters/brazil/nfe");
    expect(adapter).toBeDefined();

    await expect(adapter?.transmitDocument({})).rejects.toBeInstanceOf(FiscalAdapterNotConnectedError);
    await expect(adapter?.transmitDocument({})).rejects.toThrow(/no live government connector/i);
  });

  it("returns undefined for an unknown adapter key", () => {
    expect(getAdapterManifest("adapters/does-not-exist")).toBeUndefined();
    expect(getAdapter("adapters/does-not-exist")).toBeUndefined();
  });
});

describe("Fiscal adapter HTTP endpoints", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists every registered adapter with coverage totals", async () => {
    const app = createApp();
    const response = await app.request("/v1/fiscal/adapters", {}, env);
    const body = await response.json<{
      event_type: string;
      coverage: { total_adapters: number; countries_covered: number };
      adapters: Array<{ adapter_key: string; status: string }>;
    }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("fiscal.adapters.listed");
    expect(body.coverage.total_adapters).toBe(body.adapters.length);
    expect(body.adapters.every((adapter) => adapter.status === "planned")).toBe(true);
  });

  it("returns adapter coverage summary", async () => {
    const app = createApp();
    const response = await app.request("/v1/fiscal/adapters/coverage", {}, env);
    const body = await response.json<{ coverage: { total_adapters: number } }>();

    expect(response.status).toBe(200);
    expect(body.coverage.total_adapters).toBeGreaterThan(30);
  });

  it("looks up a single adapter manifest by its (slash-containing) key", async () => {
    const app = createApp();
    const response = await app.request("/v1/fiscal/adapters/adapters%2Fusa%2Fsales-tax", {}, env);
    const body = await response.json<{ adapter: { adapter_key: string; supported_jurisdictions: unknown[] } }>();

    expect(response.status).toBe(200);
    expect(body.adapter.adapter_key).toBe("adapters/usa/sales-tax");
    expect(body.adapter.supported_jurisdictions).toHaveLength(10);
  });

  it("returns 404 for an adapter key that is not registered", async () => {
    const app = createApp();
    const response = await app.request("/v1/fiscal/adapters/adapters%2Fdoes-not-exist", {}, env);
    const body = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("adapter_not_found");
  });

  it("returns Brazil's real CFOP/CST/CSOSN/NCM-CEST tax tables seed", async () => {
    const app = createApp();
    const response = await app.request("/v1/fiscal/adapters/brazil/tax-tables", {}, env);
    const body = await response.json<{
      event_type: string;
      cfop: Array<{ code: string }>;
      cst_icms: Array<{ code: string }>;
      csosn: Array<{ code: string }>;
      ncm_cest_sample: Array<{ ncm: string }>;
    }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("fiscal.brazil.tax_tables_loaded");
    expect(body.cfop.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(["5101", "5102", "6102", "6108"]),
    );
    expect(body.cst_icms).toHaveLength(11);
    expect(body.csosn).toHaveLength(10);
    expect(body.ncm_cest_sample.length).toBeGreaterThan(0);
  });

  it("advertises the fiscal_adapters module in the API manifest", async () => {
    const app = createApp();
    const response = await app.request("/v1", {}, env);
    const body = await response.json<{ modules: Record<string, unknown> }>();

    expect(body.modules.fiscal_adapters).toBe("country-adapter-scaffold-preview");
  });

  it("lists fiscal document rejections through the admin RPC", async () => {
    const tenantId = "22222222-2222-4222-8222-222222222222";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          { id: "doc-1", status: "rejected", last_event: { event_type: "fiscal_document.rejected" } },
        ]),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const app = createApp();
    const response = await app.request(
      `/v1/admin/tenants/${tenantId}/fiscal/rejections`,
      { headers: { "x-helvok-admin-token": "test-admin-token" } },
      adminEnv,
    );
    const body = await response.json<{ rejections: Array<{ id: string; status: string }> }>();

    expect(response.status).toBe(200);
    expect(body.rejections[0]?.status).toBe("rejected");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_list_fiscal_rejections",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ p_tenant_id: tenantId }) }),
    );
  });

  it("lists fiscal document rejections through the authenticated tenant RPC", async () => {
    const tenantId = "22222222-2222-4222-8222-222222222222";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "11111111-1111-4111-8111-111111111111", email: "owner@helvok.tax" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } }),
      );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/fiscal/rejections`,
      { headers: { authorization: "Bearer user-access-token" } },
      adminEnv,
    );
    const body = await response.json<{ rejections: unknown[] }>();

    expect(response.status).toBe(200);
    expect(body.rejections).toEqual([]);
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_list_fiscal_rejections",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ p_tenant_id: tenantId }) }),
    );
  });

  it("rejects the rejections endpoint without a bearer token", async () => {
    const app = createApp();
    const response = await app.request("/v1/tenants/22222222-2222-4222-8222-222222222222/fiscal/rejections", {}, env);
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(401);
    expect(body.error).toMatchObject({ code: "missing_token" });
  });
});
