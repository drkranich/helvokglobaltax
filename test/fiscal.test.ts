import { describe, expect, it } from "vitest";

import {
  applyVat,
  decideVat,
  OSS_ANNUAL_THRESHOLD_CENTS,
  vatAmountCents,
  vatRate,
} from "../src/fiscal/vat";
import { providerForCountry, type FiscalRouterConfig } from "../src/fiscal/fiscal-provider";
import { createFocusNfeProvider } from "../src/fiscal/providers/br-focusnfe";
import { createHelvokPeppolProvider } from "../src/fiscal/providers/eu-helvok-peppol";
import { createInvoiceProvider, buildInvoiceNumber } from "../src/fiscal/providers/invoice";

describe("Camada de VAT", () => {
  it("conhece as alíquotas standard do guia", () => {
    expect(vatRate("PT")).toBe(23);
    expect(vatRate("DE")).toBe(19);
    expect(vatRate("LU")).toBe(17);
    expect(vatRate("SE")).toBe(25);
    expect(vatRate("br")).toBeUndefined(); // fora da UE
  });

  it("calcula o VAT em centavos com arredondamento comercial", () => {
    expect(vatAmountCents(10000, 23)).toBe(2300); // 100,00 * 23% = 23,00
    expect(vatAmountCents(9999, 23)).toBe(2300); // 99,99 * 23% = 22,9977 -> 23,00
    expect(vatAmountCents(0, 20)).toBe(0);
  });

  it("rejeita entradas inválidas", () => {
    expect(() => vatAmountCents(-1, 20)).toThrow(RangeError);
    expect(() => vatAmountCents(100, -5)).toThrow(RangeError);
  });

  it("venda doméstica aplica o VAT do próprio país", () => {
    const d = decideVat({ originCountry: "PT", destinationCountry: "PT", isB2C: true });
    expect(d.regime).toBe("domestic");
    expect(d.ratePercent).toBe(23);
  });

  it("B2C intracomunitário acima do limite OSS usa VAT do destino", () => {
    const d = decideVat({
      originCountry: "PT",
      destinationCountry: "DE",
      isB2C: true,
      euCrossBorderSalesYtdCents: OSS_ANNUAL_THRESHOLD_CENTS,
    });
    expect(d.regime).toBe("oss");
    expect(d.applicableCountry).toBe("DE");
    expect(d.ratePercent).toBe(19); // Alemanha
  });

  it("B2C intracomunitário abaixo do limite OSS usa VAT da origem", () => {
    const d = decideVat({
      originCountry: "PT",
      destinationCountry: "DE",
      isB2C: true,
      euCrossBorderSalesYtdCents: 500_00,
    });
    expect(d.regime).toBe("domestic");
    expect(d.applicableCountry).toBe("PT");
    expect(d.ratePercent).toBe(23); // Portugal (origem)
  });

  it("B2B intracomunitário é reverse charge (VAT 0 no documento do vendedor)", () => {
    const d = decideVat({ originCountry: "PT", destinationCountry: "FR", isB2C: false });
    expect(d.regime).toBe("reverse_charge");
    expect(d.ratePercent).toBe(0);
  });

  it("importação para a UE dispara IOSS com VAT de destino", () => {
    const d = decideVat({
      originCountry: "BR",
      destinationCountry: "ES",
      isB2C: true,
      isImportIntoEu: true,
    });
    expect(d.regime).toBe("ioss");
    expect(d.ratePercent).toBe(21); // Espanha
  });

  it("applyVat compõe base + imposto + total", () => {
    const b = applyVat(10000, { originCountry: "FR", destinationCountry: "FR", isB2C: true });
    expect(b.netAmountCents).toBe(10000);
    expect(b.vatAmountCents).toBe(2000); // FR 20%
    expect(b.grossAmountCents).toBe(12000);
  });
});

describe("Roteador por país", () => {
  const config: FiscalRouterConfig = {
    focusNfe: () => createFocusNfeProvider({}),
    helvokPeppol: () => createHelvokPeppolProvider({}),
    invoiceFallback: () => createInvoiceProvider({ nextSequence: () => 1 }),
  };

  it("BR -> Focus NFe", () => {
    expect(providerForCountry("BR", config).key).toBe("br-focusnfe");
  });

  it("país da UE -> Helvok Peppol", () => {
    expect(providerForCountry("PT", config).key).toBe("eu-helvok-peppol");
    expect(providerForCountry("de", config).key).toBe("eu-helvok-peppol");
  });

  it("demais países -> fatura simples", () => {
    expect(providerForCountry("US", config).key).toBe("invoice");
    expect(providerForCountry("JP", config).key).toBe("invoice");
  });
});

describe("Guardrail: sem credencial, nunca finge emissão", () => {
  it("Focus NFe sem token retorna not_configured", async () => {
    const p = createFocusNfeProvider({});
    expect(p.ready()).toBe(false);
    const r = await p.emit({
      seller: { legalName: "Loja", countryCode: "BR", isBusiness: true },
      buyer: { legalName: "Cliente", countryCode: "BR", isBusiness: false },
      items: [{ description: "Camisa", quantity: 1, unitPriceCents: 10000 }],
      currency: "BRL",
    });
    expect(r.status).toBe("not_configured");
    expect(r.message).toContain("FOCUS_NFE_TOKEN");
  });

  it("Helvok Peppol sem Access Point calcula VAT mas NÃO entrega (draft)", async () => {
    const p = createHelvokPeppolProvider({});
    expect(p.ready()).toBe(false);
    const r = await p.emit({
      seller: { legalName: "Loja PT", countryCode: "PT", isBusiness: true },
      buyer: { legalName: "Cliente PT", countryCode: "PT", isBusiness: false },
      items: [{ description: "Casaco", quantity: 1, unitPriceCents: 20000 }],
      currency: "EUR",
    });
    expect(r.status).toBe("draft"); // montada, não entregue
    expect(r.tax?.taxAmountCents).toBe(4600); // 200,00 * 23% (PT doméstico)
    expect(r.message).toContain("HELVOK_PEPPOL_AP_KEY");
  });
});

describe("Fatura comercial simples", () => {
  it("numera sequencialmente no formato HKV-ANO-######", () => {
    expect(buildInvoiceNumber(1, 2026)).toBe("HKV-2026-000001");
    expect(buildInvoiceNumber(42, 2026)).toBe("HKV-2026-000042");
  });

  it("emite fatura própria com VAT quando envolve a UE", async () => {
    let seq = 0;
    const p = createInvoiceProvider({ nextSequence: () => ++seq });
    const r = await p.emit({
      seller: { legalName: "Loja PT", countryCode: "PT", isBusiness: true },
      buyer: { legalName: "Cliente PT", countryCode: "PT", isBusiness: false },
      items: [{ description: "Sapato", quantity: 2, unitPriceCents: 5000 }],
      currency: "EUR",
    });
    expect(r.status).toBe("authorized");
    expect(r.providerReference).toBe("HKV-2026-000001");
    expect(r.tax?.netAmountCents).toBe(10000);
    expect(r.tax?.taxAmountCents).toBe(2300); // 100,00 * 23%
  });
});
