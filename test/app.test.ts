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
    expect(body).toContain("Central de comando viva");
    expect(body).toContain("Simulador fiscal operacional");
    expect(body).toContain("Bebida alcoólica");
    expect(body).toContain("Cosméticos");
    expect(body).toContain("Serviço digital");
    expect(body).toContain("Serviço profissional");
    expect(body).toContain("Venda doméstica");
    expect(body).toContain("Assinatura SaaS");
    expect(body).toContain("Turismo e experiências");
    expect(body).toContain('class="app-view active" id="dashboard"');
    expect(body).toContain('class="app-view" id="produtos"');
    expect(body).toContain('class="app-view" id="motor"');
    expect(body).toContain('class="app-view" id="financeiro"');
    expect(body).toContain('class="app-view" id="documentos"');
    expect(body).toContain("Produtos e serviços");
    expect(body).toContain("Salvar produto ou serviço");
    expect(body).toContain("Usar no simulador");
    expect(body).toContain("Documentos fiscais globais");
    expect(body).toContain("Criar draft fiscal global");
    expect(body).toContain("Planejamento financeiro");
    expect(body).toContain("Helvok Financial Engine");
    expect(body).toContain("Calcular plano financeiro");
    expect(body).toContain("Mesa operacional financeira");
    expect(body).toContain('id="financial-record-form"');
    expect(body).toContain('id="financial-records-list"');
    expect(body).toContain('data-financial-action="archive"');
    expect(body).toContain('data-financial-action="reverse"');
    expect(body).toContain("Lançamentos");
    expect(body).toContain("Centros de custo");
    expect(body).toContain("Investimentos");
    expect(body).toContain("Planilhas e relatórios");
    expect(body).toContain("function populateTaxSimulatorFromCatalog");
    expect(body).toContain("function createFiscalDocumentDraft");
    expect(body).toContain("PDF da simulação");
    expect(body).toContain("Arquivar simulação");
    expect(body).toContain("Excluir simulação");
    expect(body).toContain('data-catalog-action="archive"');
    expect(body).toContain('data-catalog-action="delete"');
    expect(body).toContain('data-catalog-action="pdf"');
    expect(body).toContain('id="tax-simulator-form" novalidate');
    expect(body).toContain('id="tax-simulate-button" type="button"');
    expect(body).toContain("function initializeCustomSelects");
    expect(body).toContain(".select-panel");
    expect(body).toContain("initializeCustomSelects();");
    expect(body).toContain("function activateView");
    expect(body).toContain("--petroleum:");
    expect(body).toContain("--midnight:");
    expect(body).toContain("--gold:");
    expect(body).toContain("--champagne:");
    expect(body).not.toContain("--royal-");
    expect(body).not.toContain("--ochre-");
    expect(body).not.toContain("--frost");
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

  it("returns API module manifest", async () => {
    const app = createApp();
    const response = await app.request("/v1", {}, env);
    const body = await response.json<{ modules: Record<string, unknown> }>();

    expect(response.status).toBe(200);
    expect(body.modules.fiscal_documents).toBe("global-lifecycle-preview");
    expect(body.modules.financial_planning).toBe("helvok-cost-engine-preview");
  });

  it("calculates a Helvok financial planning scenario", async () => {
    const app = createApp();
    const response = await app.request(
      "/v1/financial/plan",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenario: "base",
          currency: "BRL",
          period_months: 12,
          volume_units: 1200,
          unit_price: 45,
          unit_cost: 22,
          fixed_costs: 12000,
          logistics_costs: 1800,
          tax_costs: 3200,
          channel_costs: 1400,
          working_capital: 8000,
          investment_initial: 25000,
          target_margin_rate: 32,
        }),
      },
      env,
    );
    const body = await response.json<{
      event_type: string;
      plan: {
        engine: string;
        totals: { revenue: number; suggested_unit_price: number; break_even_units: number; roi: number };
        cash_flow: unknown[];
        calculation_memory: { spreadsheet_exports: string[] };
      };
    }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("financial.plan.calculated");
    expect(body.plan.engine).toBe("helvok-financial-planning-cost-engine");
    expect(body.plan.totals.revenue).toBeGreaterThan(50000);
    expect(body.plan.totals.suggested_unit_price).toBeGreaterThan(0);
    expect(body.plan.totals.break_even_units).toBeGreaterThan(0);
    expect(body.plan.cash_flow).toHaveLength(12);
    expect(body.plan.calculation_memory.spreadsheet_exports).toEqual(expect.arrayContaining(["XLSX", "CSV", "PDF"]));
  });

  it("exposes the complete Helvok financial module blueprint", async () => {
    const app = createApp();
    const response = await app.request("/v1/financial/blueprint", {}, env);
    const body = await response.json<{
      blueprint: {
        entities: string[];
        allocation_strategy: string[];
        screens: string[];
        automation_events: string[];
        spreadsheet_exports: string[];
      };
    }>();

    expect(response.status).toBe(200);
    expect(body.blueprint.entities).toEqual(expect.arrayContaining(["financial_accounts", "financial_entries", "cost_centers", "budgets", "spreadsheet_exports"]));
    expect(body.blueprint.allocation_strategy).toEqual(expect.arrayContaining(["quantity", "weight", "volume", "value", "hours", "percentage", "custom"]));
    expect(body.blueprint.screens).toEqual(expect.arrayContaining(["visao financeira", "lancamentos", "orcamento", "relatorios"]));
    expect(body.blueprint.automation_events).toEqual(expect.arrayContaining(["invoice.authorized", "tax.calculated", "investment.recorded"]));
    expect(body.blueprint.spreadsheet_exports).toEqual(expect.arrayContaining(["XLSX", "CSV", "PDF"]));
  });

  it("lists global export markets for the tax simulator", async () => {
    const app = createApp();
    const response = await app.request("/v1/tax/markets", {}, env);
    const body = await response.json<{
      count: number;
      rule_pack_version: string;
      markets: Array<{ code: string; name: string; region: string; indirectTaxName: string }>;
    }>();

    expect(response.status).toBe(200);
    expect(body.rule_pack_version).toContain("global-indirect-tax-seed");
    expect(body.count).toBeGreaterThan(55);
    expect(body.markets.map((market) => market.code)).toEqual(expect.arrayContaining(["BR", "GB", "US", "CA", "SG", "JP", "AG", "BB", "DO", "JM", "TT"]));
    expect(body.markets.map((market) => market.name)).toEqual(
      expect.arrayContaining([
        "Canadá",
        "México",
        "França",
        "Itália",
        "Polônia",
        "Suécia",
        "Romênia",
        "Grécia",
        "Japão",
        "Austrália",
        "Bélgica",
        "Suíça",
        "Emirados Árabes",
        "Antígua e Barbuda",
        "República Dominicana",
        "São Cristóvão e Névis",
        "São Vicente e Granadinas",
      ]),
    );
    expect(body.markets.map((market) => market.region)).toEqual(expect.arrayContaining(["América Latina", "Caribe", "Ásia", "Oriente Médio", "África"]));
  });

  it("lists Brazilian state tax profiles for domestic clients", async () => {
    const app = createApp();
    const response = await app.request("/v1/tax/brazil/states", {}, env);
    const body = await response.json<{
      count: number;
      states: Array<{ code: string; name: string; taxFamilies: Array<{ code: string }> }>;
    }>();

    expect(response.status).toBe(200);
    expect(body.count).toBe(27);
    expect(body.states.map((state) => state.code)).toEqual(expect.arrayContaining(["SP", "MG", "RJ", "BA", "DF"]));
    expect(body.states.find((state) => state.code === "SP")?.taxFamilies.map((tax) => tax.code)).toEqual(
      expect.arrayContaining(["ICMS", "ICMS_ST", "DIFAL", "FCP", "ISS", "IPI", "PIS_COFINS"]),
    );
  });

  it("simulates a cross-border DDP tax and cost scenario", async () => {
    const app = createApp();
    const response = await app.request(
      "/v1/tax/simulate",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          origin_country: "BR",
          destination_country: "GB",
          operation_type: "export_goods",
          customer_type: "b2c",
          incoterm: "DDP",
          channel: "marketplace",
          items: [
            {
              description: "Cachaca premium 700ml",
              category: "beverage_alcohol",
              quantity: 120,
              unit_price: 45,
              unit_cost: 22,
            },
          ],
          freight: 680,
          insurance: 90,
          packaging_cost: 240,
          preparation_cost: 180,
          export_clearance_cost: 320,
          compliance_cost: 260,
          storage_cost: 180,
          local_delivery_cost: 140,
          marketing_cost: 300,
          import_duty_rate: 0.08,
          excise_rate: 0.12,
          payment_fee_rate: 0.03,
          marketplace_fee_rate: 0.1,
          margin_target_rate: 0.38,
        }),
      },
      env,
    );
    const body = await response.json<{
      event_type: string;
      simulation: {
        market: { code: string };
        totals: {
          customer_total: number;
          seller_cash_out: number;
          destination_indirect_tax: number;
          suggested_unit_price: number;
        };
        tax_lines: Array<{ code: string; amount: number; payer: string }>;
        document_checklist: string[];
        value_chain: Array<{ key: string; amount: number }>;
        warnings: string[];
      };
    }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("tax.simulation.completed");
    expect(body.simulation.market.code).toBe("GB");
    expect(body.simulation.totals.customer_total).toBeGreaterThan(7000);
    expect(body.simulation.totals.seller_cash_out).toBeGreaterThan(5000);
    expect(body.simulation.totals.destination_indirect_tax).toBeGreaterThan(0);
    expect(body.simulation.totals.suggested_unit_price).toBeGreaterThan(0);
    expect(body.simulation.tax_lines.map((line) => line.code)).toEqual(
      expect.arrayContaining(["import_duty", "excise", "destination_indirect_tax"]),
    );
    expect(body.simulation.document_checklist).toEqual(expect.arrayContaining(["DU-E / Siscomex", "Registro MAPA do estabelecimento/produto"]));
    expect(body.simulation.document_checklist).toEqual(expect.arrayContaining(["Classificação fiscal HS/NCM", "Documentação MAPA/ANVISA quando o produto exigir"]));
    expect(body.simulation.value_chain.map((stage) => stage.key)).toContain("destination_import");
    expect(body.simulation.warnings.length).toBeGreaterThan(0);
  });

  it("rejects unsupported simulator destinations", async () => {
    const app = createApp();
    const response = await app.request(
      "/v1/tax/simulate",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ destination_country: "ZZ" }),
      },
      env,
    );
    const body = await response.json<{ error: { code: string } }>();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("unsupported_market");
  });

  it("compares the same export scenario across multiple destination markets", async () => {
    const app = createApp();
    const response = await app.request(
      "/v1/tax/compare",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          scenario: {
            origin_country: "BR",
            operation_type: "export_goods",
            customer_type: "b2c",
            incoterm: "DDP",
            channel: "marketplace",
            items: [
              {
                description: "Cachaca premium 700ml",
                category: "beverage_alcohol",
                quantity: 120,
                unit_price: 45,
                unit_cost: 22,
              },
            ],
            freight: 680,
            insurance: 90,
            packaging_cost: 240,
            preparation_cost: 180,
            export_clearance_cost: 320,
            compliance_cost: 260,
            storage_cost: 180,
            local_delivery_cost: 140,
            marketing_cost: 300,
            import_duty_rate: 0.08,
            excise_rate: 0.12,
            payment_fee_rate: 0.03,
            marketplace_fee_rate: 0.1,
            margin_target_rate: 0.38,
          },
          destinations: ["PT", "DE", "GB", "US", "SG"],
        }),
      },
      env,
    );
    const body = await response.json<{
      event_type: string;
      count: number;
      summary: {
        cheapest_market: { market: { code: string }; totals: { cost_index: number; customer_total: number } } | null;
        best_margin_market: { market: { code: string }; totals: { seller_gross_margin_rate: number } } | null;
      };
      comparisons: Array<{
        market: { code: string; currency: string };
        totals: { cost_index: number; customer_total: number; suggested_unit_price: number };
        operational_load: { risk_score: number; warnings: number };
      }>;
    }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("tax.market_comparison.completed");
    expect(body.count).toBe(5);
    expect(body.summary.cheapest_market?.market.code).toBe(body.comparisons[0]?.market.code);
    expect(body.summary.best_margin_market?.totals.seller_gross_margin_rate).toBeGreaterThanOrEqual(0);
    expect(body.comparisons.map((comparison) => comparison.market.code)).toEqual(expect.arrayContaining(["PT", "DE", "GB", "US", "SG"]));
    expect(body.comparisons[0]?.totals.cost_index).toBeLessThanOrEqual(body.comparisons[body.comparisons.length - 1]?.totals.cost_index ?? 0);
    expect(body.comparisons.every((comparison) => comparison.operational_load.risk_score >= comparison.operational_load.warnings)).toBe(true);
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

  it("lists catalog items through admin RPC", async () => {
    const tenantId = "22222222-2222-4222-8222-222222222222";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: "item-1", sku: "CACHA-700", name: "CachaÃ§a premium 700ml" }]), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const app = createApp();
    const response = await app.request(
      `/v1/admin/tenants/${tenantId}/catalog/items`,
      {
        headers: {
          "x-helvok-admin-token": "test-admin-token",
        },
      },
      adminEnv,
    );
    const body = await response.json<Record<string, unknown>>();

    expect(response.status).toBe(200);
    expect(body.items).toEqual([{ id: "item-1", sku: "CACHA-700", name: "CachaÃ§a premium 700ml" }]);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_list_catalog_items",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId }),
      }),
    );
  });

  it("creates a catalog item through admin RPC", async () => {
    const tenantId = "22222222-2222-4222-8222-222222222222";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          event_type: "product.created",
          item: {
            sku: "CACHA-700",
            name: "CachaÃ§a premium 700ml",
            item_kind: "goods",
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
      "/v1/admin/catalog/items",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-helvok-admin-token": "test-admin-token",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          sku: "cacha-700",
          name: "CachaÃ§a premium 700ml",
          item_kind: "goods",
          category: "beverage_alcohol",
          country_of_origin: "br",
          currency_code: "brl",
          unit_price: 45,
          unit_cost: 22,
          status: "active",
        }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string; item: { sku: string; country_of_origin?: string } }>();

    expect(response.status).toBe(201);
    expect(body.event_type).toBe("product.created");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_upsert_catalog_item",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          payload: {
            tenant_id: tenantId,
            sku: "CACHA-700",
            name: "CachaÃ§a premium 700ml",
            item_kind: "goods",
            category: "beverage_alcohol",
            unit_code: "UN",
            currency_code: "BRL",
            unit_price: 45,
            unit_cost: 22,
            status: "active",
            country_of_origin: "BR",
          },
        }),
      }),
    );
  });

  it("rejects catalog items without SKU", async () => {
    const app = createApp();
    const response = await app.request(
      "/v1/admin/catalog/items",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-helvok-admin-token": "test-admin-token",
        },
        body: JSON.stringify({
          tenant_id: "22222222-2222-4222-8222-222222222222",
          name: "Produto sem SKU",
        }),
      },
      adminEnv,
    );
    const body = await response.json<Record<string, { code: string; message: string }>>();

    expect(response.status).toBe(400);
    expect(body.error).toMatchObject({
      code: "invalid_payload",
      message: "sku must have 2 to 64 characters and use letters, numbers, dot, dash, slash, colon, or underscore.",
    });
  });

  it("deletes catalog items through admin RPC", async () => {
    const tenantId = "22222222-2222-4222-8222-222222222222";
    const itemId = "33333333-3333-4333-8333-333333333333";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ event_type: "product.deleted", items: [] }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const app = createApp();
    const response = await app.request(
      `/v1/admin/tenants/${tenantId}/catalog/items/${itemId}`,
      {
        method: "DELETE",
        headers: {
          "x-helvok-admin-token": "test-admin-token",
        },
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("product.deleted");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_delete_catalog_item",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_item_id: itemId }),
      }),
    );
  });

  it("lists fiscal authorities through admin RPC", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ country_code: "BR", authority_code: "BR-SEFAZ-NFE", adapter_key: "adapters/brazil/nfe" }]), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const app = createApp();
    const response = await app.request(
      "/v1/admin/fiscal/authorities",
      {
        headers: {
          "x-helvok-admin-token": "test-admin-token",
        },
      },
      adminEnv,
    );
    const body = await response.json<{ authorities: Array<{ authority_code: string }> }>();

    expect(response.status).toBe(200);
    expect(body.authorities[0]?.authority_code).toBe("BR-SEFAZ-NFE");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_list_fiscal_authorities",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("creates a global fiscal document through admin RPC", async () => {
    const tenantId = "22222222-2222-4222-8222-222222222222";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          event_type: "fiscal_document.created",
          document: {
            id: "document-1",
            country_code: "BR",
            document_type: "NFE",
            status: "draft",
          },
          documents: [],
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
      "/v1/admin/fiscal/documents",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-helvok-admin-token": "test-admin-token",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          country_code: "br",
          document_type: "nfe",
          adapter_key: "adapters/brazil/nfe",
          total_amount: 1200,
          tax_amount: 216,
        }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string; document: { status: string } }>();

    expect(response.status).toBe(201);
    expect(body.event_type).toBe("fiscal_document.created");
    expect(body.document.status).toBe("draft");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_create_fiscal_document",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          payload: {
            tenant_id: tenantId,
            country_code: "BR",
            document_type: "NFE",
            adapter_key: "adapters/brazil/nfe",
            operation_type: "sale",
            currency_code: "BRL",
            total_amount: 1200,
            tax_amount: 216,
            jurisdiction_path: ["BR"],
            payload: {},
            calculation_snapshot: {},
            metadata: {},
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

  it("loads catalog items through authenticated tenant RPC", async () => {
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
        new Response(JSON.stringify([{ sku: "CACHA-700", name: "CachaÃ§a premium 700ml" }]), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/catalog/items`,
      {
        headers: {
          authorization: "Bearer user-access-token",
        },
      },
      adminEnv,
    );
    const body = await response.json<{ items: Array<{ sku: string }> }>();

    expect(response.status).toBe(200);
    expect(body.items[0]?.sku).toBe("CACHA-700");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_list_catalog_items",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer user-access-token",
        }),
        body: JSON.stringify({ p_tenant_id: tenantId }),
      }),
    );
  });

  it("creates catalog items through authenticated tenant RPC", async () => {
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
        new Response(JSON.stringify({ event_type: "product.created", item: { sku: "SAAS-001" }, items: [] }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/catalog/items`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer user-access-token",
        },
        body: JSON.stringify({
          sku: "saas-001",
          name: "Assinatura Helvok mensal",
          item_kind: "saas",
          category: "saas",
          currency_code: "usd",
          unit_price: 99,
        }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(201);
    expect(body.event_type).toBe("product.created");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_upsert_catalog_item",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          payload: {
            tenant_id: tenantId,
            sku: "SAAS-001",
            name: "Assinatura Helvok mensal",
            item_kind: "saas",
            category: "saas",
            unit_code: "UN",
            currency_code: "USD",
            unit_price: 99,
            unit_cost: 0,
            status: "draft",
          },
        }),
      }),
    );
  });

  it("deletes catalog items through authenticated tenant RPC", async () => {
    const tenantId = "22222222-2222-4222-8222-222222222222";
    const itemId = "33333333-3333-4333-8333-333333333333";
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
        new Response(JSON.stringify({ event_type: "product.deleted", items: [] }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/catalog/items/${itemId}`,
      {
        method: "DELETE",
        headers: {
          authorization: "Bearer user-access-token",
        },
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("product.deleted");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_delete_catalog_item",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_item_id: itemId }),
      }),
    );
  });

  it("creates fiscal document drafts through authenticated tenant RPC", async () => {
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
        new Response(JSON.stringify({ event_type: "fiscal_document.created", document: { status: "draft" }, documents: [] }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/fiscal/documents`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer user-access-token",
        },
        body: JSON.stringify({
          country_code: "pt",
          document_type: "einvoice",
          adapter_key: "adapters/portugal/einvoice",
          currency_code: "eur",
          total_amount: 250,
          tax_amount: 57.5,
        }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(201);
    expect(body.event_type).toBe("fiscal_document.created");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_create_fiscal_document",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          payload: {
            tenant_id: tenantId,
            country_code: "PT",
            document_type: "EINVOICE",
            adapter_key: "adapters/portugal/einvoice",
            operation_type: "sale",
            currency_code: "EUR",
            total_amount: 250,
            tax_amount: 57.5,
            jurisdiction_path: ["PT"],
            payload: {},
            calculation_snapshot: {},
            metadata: {},
          },
        }),
      }),
    );
  });

  it("loads financial records through authenticated tenant RPC", async () => {
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
        new Response(JSON.stringify([{ category: "exportacao", amount: 10839.88 }]), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/financial/financial_entries`,
      {
        headers: {
          authorization: "Bearer user-access-token",
        },
      },
      adminEnv,
    );
    const body = await response.json<{ records: Array<{ amount: number }> }>();

    expect(response.status).toBe(200);
    expect(body.records[0]?.amount).toBe(10839.88);
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_list_financial_records",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_entity: "financial_entries", p_limit: 100 }),
      }),
    );
  });

  it("creates financial records through authenticated tenant RPC", async () => {
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
        new Response(JSON.stringify({ event_type: "financial.record.created", record: { category: "exportacao" }, records: [] }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/financial/financial_entries`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer user-access-token",
        },
        body: JSON.stringify({
          category: "exportacao",
          nature: "expense",
          currency_code: "brl",
          amount: 10839.88,
          country_code: "br",
          tags: ["BR", "marketplace"],
        }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(201);
    expect(body.event_type).toBe("financial.record.created");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_upsert_financial_record",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          payload: {
            tenant_id: tenantId,
            entity: "financial_entries",
            category: "exportacao",
            nature: "expense",
            currency_code: "BRL",
            amount: 10839.88,
            country_code: "BR",
            tags: ["BR", "marketplace"],
          },
        }),
      }),
    );
  });

  it("archives financial records through authenticated tenant RPC", async () => {
    const tenantId = "22222222-2222-4222-8222-222222222222";
    const recordId = "33333333-3333-4333-8333-333333333333";
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
        new Response(JSON.stringify({ event_type: "financial.record.archived", records: [] }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/financial/investments/${recordId}/archive`,
      {
        method: "POST",
        headers: {
          authorization: "Bearer user-access-token",
        },
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("financial.record.archived");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_archive_financial_record",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_entity: "investments", p_record_id: recordId }),
      }),
    );
  });

  it("reverses financial entries through authenticated tenant RPC", async () => {
    const tenantId = "22222222-2222-4222-8222-222222222222";
    const entryId = "33333333-3333-4333-8333-333333333333";
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
        new Response(JSON.stringify({ event_type: "financial.entry.reversed", records: [] }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );

    const app = createApp();
    const response = await app.request(
      `/v1/tenants/${tenantId}/financial/entries/${entryId}/reverse`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer user-access-token",
        },
        body: JSON.stringify({ notes: "Estorno solicitado" }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("financial.entry.reversed");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_reverse_financial_entry",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ p_tenant_id: tenantId, p_entry_id: entryId, p_notes: "Estorno solicitado" }),
      }),
    );
  });

  it("creates a membership invitation and returns a one-time invite URL", async () => {
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
        new Response(
          JSON.stringify({
            event_type: "invitation.created",
            invitation: {
              id: "33333333-3333-4333-8333-333333333333",
              email: "guest@helvok.tax",
              status: "pending",
            },
            access: { invitations: [] },
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
      `https://helvokglobaltax.genialidadefilosofica.workers.dev/v1/tenants/${tenantId}/invitations`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer user-access-token",
        },
        body: JSON.stringify({
          email: "Guest@Helvok.Tax",
          role_key: "viewer",
          expires_in_days: 5,
        }),
      },
      adminEnv,
    );
    const body = await response.json<{
      event_type: string;
      invitation_token: string;
      invitation_url: string;
    }>();

    expect(response.status).toBe(201);
    expect(body.event_type).toBe("invitation.created");
    expect(body.invitation_token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(body.invitation_url).toContain("/app?invite=");

    const secondCall = fetchSpy.mock.calls[1];
    expect(secondCall?.[0]).toBe(
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_create_membership_invitation",
    );
    const rpcBody = JSON.parse(String((secondCall?.[1] as RequestInit | undefined)?.body)) as {
      payload: {
        email: string;
        role_key: string;
        token_hash: string;
        expires_at: string;
      };
    };
    expect(rpcBody.payload.email).toBe("guest@helvok.tax");
    expect(rpcBody.payload.role_key).toBe("viewer");
    expect(rpcBody.payload.token_hash).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(new Date(rpcBody.payload.expires_at).toString()).not.toBe("Invalid Date");
  });

  it("accepts an invitation after syncing the authenticated user", async () => {
    const token = "Abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "11111111-1111-4111-8111-111111111111",
            email: "guest@helvok.tax",
            user_metadata: {
              full_name: "Guest User",
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
        new Response(JSON.stringify({ user: { email: "guest@helvok.tax" } }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            event_type: "invitation.accepted",
            membership: {
              status: "active",
              user: { email: "guest@helvok.tax" },
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
      "/v1/invitations/accept",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer user-access-token",
        },
        body: JSON.stringify({ token }),
      },
      adminEnv,
    );
    const body = await response.json<{ event_type: string; membership: { status: string } }>();

    expect(response.status).toBe(200);
    expect(body.event_type).toBe("invitation.accepted");
    expect(body.membership.status).toBe("active");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_admin_sync_user",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      3,
      "https://jlvwudjgfzhhdgttrycj.supabase.co/rest/v1/rpc/helvok_current_accept_membership_invitation",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer user-access-token",
        }),
      }),
    );
  });
});
