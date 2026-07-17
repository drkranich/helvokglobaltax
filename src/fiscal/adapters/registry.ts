import { ASIA_PACIFIC_ADAPTER_MANIFESTS } from "./manifests/asia-pacific";
import { BRAZIL_ADAPTER_MANIFESTS } from "./manifests/brazil";
import { CANADA_ADAPTER_MANIFESTS } from "./manifests/canada";
import { EUROPE_ADAPTER_MANIFESTS } from "./manifests/europe";
import { LATAM_ADAPTER_MANIFESTS } from "./manifests/latam";
import { MIDDLE_EAST_ADAPTER_MANIFESTS } from "./manifests/middle-east";
import { USA_ADAPTER_MANIFESTS } from "./manifests/usa";
import { StubFiscalAdapter } from "./stub-adapter";
import type { AdapterManifest, AdapterRegion, FiscalAdapter } from "./types";

export const ADAPTER_MANIFESTS: AdapterManifest[] = [
  ...BRAZIL_ADAPTER_MANIFESTS,
  ...USA_ADAPTER_MANIFESTS,
  ...CANADA_ADAPTER_MANIFESTS,
  ...EUROPE_ADAPTER_MANIFESTS,
  ...LATAM_ADAPTER_MANIFESTS,
  ...ASIA_PACIFIC_ADAPTER_MANIFESTS,
  ...MIDDLE_EAST_ADAPTER_MANIFESTS,
];

export function listAdapterManifests(): AdapterManifest[] {
  return ADAPTER_MANIFESTS;
}

export function listAdapterManifestsByRegion(region: AdapterRegion): AdapterManifest[] {
  return ADAPTER_MANIFESTS.filter((manifest) => manifest.region === region);
}

export function listAdapterManifestsByCountry(countryCode: string): AdapterManifest[] {
  const normalized = countryCode.trim().toUpperCase();
  return ADAPTER_MANIFESTS.filter((manifest) => manifest.country_code === normalized);
}

export function getAdapterManifest(adapterKey: string): AdapterManifest | undefined {
  return ADAPTER_MANIFESTS.find((manifest) => manifest.adapter_key === adapterKey);
}

export function getAdapter(adapterKey: string): FiscalAdapter | undefined {
  const manifest = getAdapterManifest(adapterKey);
  return manifest ? new StubFiscalAdapter(manifest) : undefined;
}

export interface AdapterCoverageSummary {
  total_adapters: number;
  by_region: Record<AdapterRegion, number>;
  by_status: Record<string, number>;
  countries_covered: number;
}

export function summarizeAdapterCoverage(): AdapterCoverageSummary {
  const byRegion = {} as Record<AdapterRegion, number>;
  const byStatus: Record<string, number> = {};
  const countries = new Set<string>();

  for (const manifest of ADAPTER_MANIFESTS) {
    byRegion[manifest.region] = (byRegion[manifest.region] ?? 0) + 1;
    byStatus[manifest.status] = (byStatus[manifest.status] ?? 0) + 1;
    countries.add(manifest.country_code);
  }

  return {
    total_adapters: ADAPTER_MANIFESTS.length,
    by_region: byRegion,
    by_status: byStatus,
    countries_covered: countries.size,
  };
}
