// Country-neutral adapter contract. This mirrors the manifest described in
// docs/architecture/06-country-plugin-strategy.md. The Core never contains
// fixed tax law; every capability below is implemented (or, for now, left
// unconnected) inside a country/jurisdiction adapter.

export type AdapterRegion =
  | "brazil"
  | "usa"
  | "canada"
  | "europe"
  | "latam"
  | "asia_pacific"
  | "middle_east";

export type AdapterAuthorityLevel =
  | "national"
  | "federal"
  | "state"
  | "province"
  | "county"
  | "city"
  | "municipal"
  | "regional"
  | "supranational";

/**
 * Lifecycle of an adapter's live connection to its government/authority
 * transport. This is intentionally conservative: "planned" is the default
 * and only moves forward once a real credential/certificate/enrollment
 * exists and has been exercised against a real sandbox or production
 * endpoint. Nothing in this codebase should claim "active" without that.
 */
export type AdapterConnectionStatus = "planned" | "sandbox" | "active" | "deprecated" | "offline";

export type AdapterCapabilityName =
  | "manifest"
  | "validateOperation"
  | "classify"
  | "calculateTax"
  | "prepareDocument"
  | "signDocument"
  | "transmitDocument"
  | "cancelDocument"
  | "getDocumentStatus"
  | "generateArtifacts"
  | "generateObligation"
  | "explainRejection";

export const ADAPTER_CAPABILITY_NAMES: AdapterCapabilityName[] = [
  "manifest",
  "validateOperation",
  "classify",
  "calculateTax",
  "prepareDocument",
  "signDocument",
  "transmitDocument",
  "cancelDocument",
  "getDocumentStatus",
  "generateArtifacts",
  "generateObligation",
  "explainRejection",
];

export interface AdapterJurisdictionUnit {
  code: string;
  name: string;
}

export type AdapterRequirementCategory =
  | "digital_certificate"
  | "government_enrollment"
  | "legal_registration"
  | "tax_representative"
  | "software_credential"
  | "accountant_review";

export interface AdapterRequirement {
  key: string;
  label: string;
  category: AdapterRequirementCategory;
  required_for_production: boolean;
}

export interface AdapterManifest {
  adapter_key: string;
  country_code: string;
  region: AdapterRegion;
  authority_level: AdapterAuthorityLevel;
  authority_name: string;
  document_families: string[];
  tax_families: string[];
  supported_jurisdictions: AdapterJurisdictionUnit[];
  supported_capabilities: AdapterCapabilityName[];
  requirements: AdapterRequirement[];
  sandbox_support: boolean;
  production_support: boolean;
  status: AdapterConnectionStatus;
  official_sources: string[];
  contract_version: string;
  adapter_version: string;
  notes: string;
}

export class FiscalAdapterNotConnectedError extends Error {
  readonly adapterKey: string;
  readonly capability: AdapterCapabilityName;

  constructor(adapterKey: string, capability: AdapterCapabilityName, notes: string) {
    super(`Adapter "${adapterKey}" has no live government connector for "${capability}" yet. ${notes}`);
    this.name = "FiscalAdapterNotConnectedError";
    this.adapterKey = adapterKey;
    this.capability = capability;
  }
}

/**
 * Every operational capability returns `Promise<never>` on purpose: a stub
 * adapter cannot succeed, it can only throw a clearly labeled
 * FiscalAdapterNotConnectedError. This makes it structurally impossible for
 * a stub to silently report a fake authorization.
 */
export interface FiscalAdapter {
  readonly manifest: AdapterManifest;
  validateOperation(context: unknown): Promise<never>;
  classify(context: unknown): Promise<never>;
  calculateTax(context: unknown): Promise<never>;
  prepareDocument(context: unknown): Promise<never>;
  signDocument(context: unknown): Promise<never>;
  transmitDocument(context: unknown): Promise<never>;
  cancelDocument(context: unknown): Promise<never>;
  getDocumentStatus(context: unknown): Promise<never>;
  generateArtifacts(context: unknown): Promise<never>;
  generateObligation(context: unknown): Promise<never>;
  explainRejection(context: unknown): Promise<never>;
}

export function defineAdapterManifest(
  manifest: Omit<AdapterManifest, "contract_version" | "adapter_version"> &
    Partial<Pick<AdapterManifest, "contract_version" | "adapter_version">>,
): AdapterManifest {
  return {
    contract_version: "1.0.0",
    adapter_version: "0.1.0-scaffold",
    ...manifest,
  };
}
