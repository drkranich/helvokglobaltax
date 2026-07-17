import { FiscalAdapterNotConnectedError } from "./types";
import type { AdapterCapabilityName, AdapterManifest, FiscalAdapter } from "./types";

/**
 * Generic adapter implementation shared by every country/jurisdiction until
 * a real government connector is wired in. It never fabricates a document
 * status, signature, or authorization: every capability throws a
 * FiscalAdapterNotConnectedError that names exactly what is missing
 * (certificate, enrollment, credential) so the gap is visible instead of
 * silently faked.
 */
export class StubFiscalAdapter implements FiscalAdapter {
  constructor(public readonly manifest: AdapterManifest) {}

  validateOperation(): Promise<never> {
    return this.fail("validateOperation");
  }

  classify(): Promise<never> {
    return this.fail("classify");
  }

  calculateTax(): Promise<never> {
    return this.fail("calculateTax");
  }

  prepareDocument(): Promise<never> {
    return this.fail("prepareDocument");
  }

  signDocument(): Promise<never> {
    return this.fail("signDocument");
  }

  transmitDocument(): Promise<never> {
    return this.fail("transmitDocument");
  }

  cancelDocument(): Promise<never> {
    return this.fail("cancelDocument");
  }

  getDocumentStatus(): Promise<never> {
    return this.fail("getDocumentStatus");
  }

  generateArtifacts(): Promise<never> {
    return this.fail("generateArtifacts");
  }

  generateObligation(): Promise<never> {
    return this.fail("generateObligation");
  }

  explainRejection(): Promise<never> {
    return this.fail("explainRejection");
  }

  private fail(capability: AdapterCapabilityName): Promise<never> {
    if (!this.manifest.supported_capabilities.includes(capability)) {
      return Promise.reject(
        new FiscalAdapterNotConnectedError(
          this.manifest.adapter_key,
          capability,
          "This capability is not declared in the adapter manifest yet.",
        ),
      );
    }

    return Promise.reject(
      new FiscalAdapterNotConnectedError(this.manifest.adapter_key, capability, this.manifest.notes),
    );
  }
}
