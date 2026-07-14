import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

const env = {
  APP_NAME: "Helvok Tax",
  APP_ENV: "test",
  API_VERSION: "v1",
  SUPABASE_URL: "https://jlvwudjgfzhhdgttrycj.supabase.co",
};

describe("Helvok Tax Worker API", () => {
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
});
