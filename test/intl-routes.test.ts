import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

const env = {
  APP_NAME: "Helvok Tax",
  APP_ENV: "test",
  API_VERSION: "v1",
  SUPABASE_URL: "https://jlvwudjgfzhhdgttrycj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
};

describe("Rotas internacionais (VAT + emissão)", () => {
  it("GET /v1/intl/vat-rates lista alíquotas dos países da UE", async () => {
    const app = createApp();
    const res = await app.request("/v1/intl/vat-rates", {}, env);
    const body = (await res.json()) as { rates: Array<{ code: string }> };
    expect(res.status).toBe(200);
    expect(body.rates.length).toBeGreaterThanOrEqual(14);
    expect(body.rates.some((r) => r.code === "PT")).toBe(true);
  });

  it("POST /v1/intl/vat calcula VAT de destino (OSS acima do limite)", async () => {
    const app = createApp();
    const res = await app.request(
      "/v1/intl/vat",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          origin_country: "PT",
          destination_country: "DE",
          is_b2c: true,
          net_amount: 1000,
          currency: "EUR",
          eu_cross_border_sales_ytd: 20000, // acima do limite OSS
        }),
      },
      env,
    );
    const body = (await res.json()) as {
      decision: { regime: string; rate_percent: number; applicable_country: string };
      amounts: { vat_amount_cents: number };
    };
    expect(res.status).toBe(200);
    expect(body.decision.regime).toBe("oss");
    expect(body.decision.applicable_country).toBe("DE");
    expect(body.decision.rate_percent).toBe(19); // Alemanha
    expect(body.amounts.vat_amount_cents).toBe(19000); // 1000,00 * 19%
  });

  it("POST /v1/intl/vat: B2B intracomunitário é reverse charge (0%)", async () => {
    const app = createApp();
    const res = await app.request(
      "/v1/intl/vat",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          origin_country: "PT",
          destination_country: "FR",
          is_b2c: false,
          net_amount: 1000,
        }),
      },
      env,
    );
    const body = (await res.json()) as { decision: { regime: string; rate_percent: number } };
    expect(body.decision.regime).toBe("reverse_charge");
    expect(body.decision.rate_percent).toBe(0);
  });

  it("POST /v1/intl/emit roteia UE -> Helvok Peppol e calcula VAT, sem credencial fica draft", async () => {
    const app = createApp();
    const res = await app.request(
      "/v1/intl/emit",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          seller: { legal_name: "Loja PT", country_code: "PT", is_business: true },
          buyer: { legal_name: "Cliente PT", country_code: "PT", is_business: false },
          items: [{ description: "Casaco", quantity: 1, unit_price: 200 }],
          currency: "EUR",
        }),
      },
      env,
    );
    const body = (await res.json()) as {
      provider: string;
      document: { status: string; tax?: { taxAmountCents: number } };
    };
    expect(res.status).toBe(200);
    expect(body.provider).toBe("eu-helvok-peppol");
    expect(body.document.status).toBe("draft"); // sem Access Point, montado mas não entregue
    expect(body.document.tax?.taxAmountCents).toBe(4600); // 200,00 * 23% (PT doméstico)
  });

  it("POST /v1/intl/emit roteia país fora BR/UE -> fatura comercial", async () => {
    const app = createApp();
    const res = await app.request(
      "/v1/intl/emit",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          seller: { legal_name: "Loja", country_code: "PT", is_business: true },
          buyer: { legal_name: "US Buyer", country_code: "US", is_business: false },
          items: [{ description: "Item", quantity: 1, unit_price: 100 }],
          currency: "USD",
        }),
      },
      env,
    );
    const body = (await res.json()) as { provider: string };
    expect(body.provider).toBe("invoice");
  });
});
