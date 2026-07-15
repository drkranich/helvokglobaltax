type JsonRecord = Record<string, unknown>;

export type ValidationResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;
const countryPattern = /^[A-Z]{2}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const roleKeyPattern = /^[a-z][a-z0-9_]{1,63}$/;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getOptionalString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getOptionalRecord(record: JsonRecord, key: string): JsonRecord | undefined {
  const value = record[key];
  return isRecord(value) ? value : undefined;
}

function getOptionalInteger(record: JsonRecord, key: string): number | undefined {
  const value = record[key];
  const parsed = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim()
      ? Number(value)
      : NaN;

  return Number.isInteger(parsed) ? parsed : undefined;
}

function getOptionalNumber(record: JsonRecord, key: string): number | undefined {
  const value = record[key];
  const parsed = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim()
      ? Number(value.replace(",", "."))
      : NaN;

  return Number.isFinite(parsed) ? parsed : undefined;
}

function invalid(message: string, code = "invalid_payload"): ValidationResult<never> {
  return { ok: false, code, message };
}

export function isUuid(value: string): boolean {
  return uuidPattern.test(value);
}

export function validateTenantPayload(input: unknown): ValidationResult<JsonRecord> {
  if (!isRecord(input)) {
    return invalid("Request body must be a JSON object.");
  }

  const slug = getOptionalString(input, "slug")?.toLowerCase();
  const legalName = getOptionalString(input, "legal_name");

  if (!slug || !slugPattern.test(slug)) {
    return invalid("slug must be lowercase kebab-case with 3 to 64 characters.");
  }

  if (!legalName) {
    return invalid("legal_name is required.");
  }

  const metadata = getOptionalRecord(input, "metadata");
  const payload: JsonRecord = {
    slug,
    legal_name: legalName,
  };

  const displayName = getOptionalString(input, "display_name");
  const defaultLocale = getOptionalString(input, "default_locale");

  if (displayName) {
    payload.display_name = displayName;
  }

  if (defaultLocale) {
    payload.default_locale = defaultLocale;
  }

  if (metadata) {
    payload.metadata = metadata;
  }

  return { ok: true, value: payload };
}

export function validateInvitationPayload(input: unknown): ValidationResult<JsonRecord> {
  if (!isRecord(input)) {
    return invalid("Request body must be a JSON object.");
  }

  const tenantId = getOptionalString(input, "tenant_id");
  const email = getOptionalString(input, "email")?.toLowerCase();
  const roleKey = getOptionalString(input, "role_key")?.toLowerCase() ?? "viewer";
  const scopeType = getOptionalString(input, "scope_type")?.toLowerCase() ?? "tenant";
  const scopeId = getOptionalString(input, "scope_id");
  const expiresInDays = getOptionalInteger(input, "expires_in_days") ?? 7;

  if (!tenantId || !isUuid(tenantId)) {
    return invalid("tenant_id must be a valid UUID.");
  }

  if (!email || !emailPattern.test(email)) {
    return invalid("email must be valid.");
  }

  if (!roleKeyPattern.test(roleKey)) {
    return invalid("role_key must be a valid role key.");
  }

  if (!["tenant", "organization", "establishment", "environment"].includes(scopeType)) {
    return invalid("scope_type must be tenant, organization, establishment, or environment.");
  }

  if (scopeType === "tenant" && scopeId) {
    return invalid("tenant scoped invitation must not include scope_id.");
  }

  if (scopeType !== "tenant" && (!scopeId || !isUuid(scopeId))) {
    return invalid("non-tenant scoped invitation requires a valid scope_id.");
  }

  if (expiresInDays < 1 || expiresInDays > 30) {
    return invalid("expires_in_days must be an integer from 1 to 30.");
  }

  const payload: JsonRecord = {
    tenant_id: tenantId,
    email,
    role_key: roleKey,
    scope_type: scopeType,
    expires_in_days: expiresInDays,
  };

  if (scopeId) {
    payload.scope_id = scopeId;
  }

  return { ok: true, value: payload };
}

export function validateInvitationResendPayload(input: unknown): ValidationResult<JsonRecord> {
  const record = isRecord(input) ? input : {};
  const expiresInDays = getOptionalInteger(record, "expires_in_days") ?? 7;

  if (expiresInDays < 1 || expiresInDays > 30) {
    return invalid("expires_in_days must be an integer from 1 to 30.");
  }

  return { ok: true, value: { expires_in_days: expiresInDays } };
}

export function validateInvitationAcceptPayload(input: unknown): ValidationResult<JsonRecord> {
  if (!isRecord(input)) {
    return invalid("Request body must be a JSON object.");
  }

  const token = getOptionalString(input, "token");
  if (!token || !/^[A-Za-z0-9_-]{32,256}$/.test(token)) {
    return invalid("token must be a valid invitation token.");
  }

  return { ok: true, value: { token } };
}

export function validateOrganizationPayload(input: unknown): ValidationResult<JsonRecord> {
  if (!isRecord(input)) {
    return invalid("Request body must be a JSON object.");
  }

  const tenantId = getOptionalString(input, "tenant_id");
  const legalName = getOptionalString(input, "legal_name");
  const country = getOptionalString(input, "country_of_registration")?.toUpperCase();

  if (!tenantId || !isUuid(tenantId)) {
    return invalid("tenant_id must be a valid UUID.");
  }

  if (!legalName) {
    return invalid("legal_name is required.");
  }

  if (!country || !countryPattern.test(country)) {
    return invalid("country_of_registration must be ISO 3166-1 alpha-2.");
  }

  const payload: JsonRecord = {
    tenant_id: tenantId,
    legal_name: legalName,
    country_of_registration: country,
  };

  const organizationType = getOptionalString(input, "organization_type");
  const tradeName = getOptionalString(input, "trade_name");
  const establishmentName = getOptionalString(input, "establishment_name");
  const metadata = getOptionalRecord(input, "metadata");

  if (organizationType) {
    payload.organization_type = organizationType;
  }

  if (tradeName) {
    payload.trade_name = tradeName;
  }

  if (establishmentName) {
    payload.establishment_name = establishmentName;
  }

  if (typeof input.create_default_establishment === "boolean") {
    payload.create_default_establishment = input.create_default_establishment;
  }

  if (metadata) {
    payload.metadata = metadata;
  }

  return { ok: true, value: payload };
}

export function validateMembershipPayload(input: unknown): ValidationResult<JsonRecord> {
  if (!isRecord(input)) {
    return invalid("Request body must be a JSON object.");
  }

  const tenantId = getOptionalString(input, "tenant_id");
  const userId = getOptionalString(input, "user_id");
  const authUserId = getOptionalString(input, "auth_user_id");
  const email = getOptionalString(input, "email")?.toLowerCase();
  const roleKey = getOptionalString(input, "role_key")?.toLowerCase() ?? "owner";
  const scopeType = getOptionalString(input, "scope_type")?.toLowerCase() ?? "tenant";
  const scopeId = getOptionalString(input, "scope_id");
  const status = getOptionalString(input, "status")?.toLowerCase() ?? "active";

  if (!tenantId || !isUuid(tenantId)) {
    return invalid("tenant_id must be a valid UUID.");
  }

  if (!userId && !authUserId && !email) {
    return invalid("user_id, auth_user_id, or email is required.");
  }

  if (userId && !isUuid(userId)) {
    return invalid("user_id must be a valid UUID.");
  }

  if (authUserId && !isUuid(authUserId)) {
    return invalid("auth_user_id must be a valid UUID.");
  }

  if (email && !emailPattern.test(email)) {
    return invalid("email must be valid.");
  }

  if (!roleKeyPattern.test(roleKey)) {
    return invalid("role_key must be a valid role key.");
  }

  if (!["tenant", "organization", "establishment", "environment"].includes(scopeType)) {
    return invalid("scope_type must be tenant, organization, establishment, or environment.");
  }

  if (scopeType === "tenant" && scopeId) {
    return invalid("tenant scoped membership must not include scope_id.");
  }

  if (scopeType !== "tenant" && (!scopeId || !isUuid(scopeId))) {
    return invalid("non-tenant scoped membership requires a valid scope_id.");
  }

  if (!["invited", "active", "disabled", "revoked"].includes(status)) {
    return invalid("status must be invited, active, disabled, or revoked.");
  }

  const payload: JsonRecord = {
    tenant_id: tenantId,
    role_key: roleKey,
    scope_type: scopeType,
    status,
  };

  if (userId) {
    payload.user_id = userId;
  }

  if (authUserId) {
    payload.auth_user_id = authUserId;
  }

  if (email) {
    payload.email = email;
  }

  if (scopeId) {
    payload.scope_id = scopeId;
  }

  return { ok: true, value: payload };
}

const catalogSkuPattern = /^[A-Za-z0-9][A-Za-z0-9_.:/-]{1,63}$/;
const catalogSlugPattern = /^[a-z][a-z0-9_]{1,63}$/;
const currencyPattern = /^[A-Z]{3}$/;
const unitPattern = /^[A-Z0-9_]{1,16}$/;
const catalogKinds = new Set([
  "goods",
  "service",
  "digital_product",
  "saas",
  "subscription",
  "license",
  "kit",
  "bundle",
  "rental",
  "event",
  "tourism",
  "asset",
]);

export function validateCatalogItemPayload(input: unknown): ValidationResult<JsonRecord> {
  if (!isRecord(input)) {
    return invalid("Request body must be a JSON object.");
  }

  const tenantId = getOptionalString(input, "tenant_id");
  const organizationId = getOptionalString(input, "organization_id");
  const id = getOptionalString(input, "id");
  const sku = getOptionalString(input, "sku")?.toUpperCase();
  const name = getOptionalString(input, "name");
  const itemKind = getOptionalString(input, "item_kind")?.toLowerCase() ?? "goods";
  const category = getOptionalString(input, "category")?.toLowerCase() ?? "goods";
  const countryOfOrigin = getOptionalString(input, "country_of_origin")?.toUpperCase();
  const currencyCode = getOptionalString(input, "currency_code")?.toUpperCase() ?? "BRL";
  const unitCode = getOptionalString(input, "unit_code")?.toUpperCase() ?? "UN";
  const unitPrice = getOptionalNumber(input, "unit_price") ?? 0;
  const unitCost = getOptionalNumber(input, "unit_cost") ?? 0;
  const status = getOptionalString(input, "status")?.toLowerCase() ?? "draft";

  if (!tenantId || !isUuid(tenantId)) {
    return invalid("tenant_id must be a valid UUID.");
  }

  if (id && !isUuid(id)) {
    return invalid("id must be a valid UUID.");
  }

  if (organizationId && !isUuid(organizationId)) {
    return invalid("organization_id must be a valid UUID.");
  }

  if (!sku || !catalogSkuPattern.test(sku)) {
    return invalid("sku must have 2 to 64 characters and use letters, numbers, dot, dash, slash, colon, or underscore.");
  }

  if (!name) {
    return invalid("name is required.");
  }

  if (!catalogKinds.has(itemKind)) {
    return invalid("item_kind must be a supported catalog kind.");
  }

  if (!catalogSlugPattern.test(category)) {
    return invalid("category must be a lowercase catalog slug.");
  }

  if (countryOfOrigin && !countryPattern.test(countryOfOrigin)) {
    return invalid("country_of_origin must be ISO 3166-1 alpha-2.");
  }

  if (!currencyPattern.test(currencyCode)) {
    return invalid("currency_code must be ISO 4217.");
  }

  if (!unitPattern.test(unitCode)) {
    return invalid("unit_code must be a short uppercase unit code.");
  }

  if (unitPrice < 0 || unitCost < 0) {
    return invalid("unit_price and unit_cost must be greater than or equal to zero.");
  }

  if (!["draft", "active", "inactive", "archived"].includes(status)) {
    return invalid("status must be draft, active, inactive, or archived.");
  }

  const metadata = getOptionalRecord(input, "metadata");
  const payload: JsonRecord = {
    tenant_id: tenantId,
    sku,
    name,
    item_kind: itemKind,
    category,
    unit_code: unitCode,
    currency_code: currencyCode,
    unit_price: unitPrice,
    unit_cost: unitCost,
    status,
  };

  const description = getOptionalString(input, "description");
  const taxCategory = getOptionalString(input, "tax_category")?.toLowerCase();
  const ncmCode = getOptionalString(input, "ncm_code")?.toUpperCase();
  const hsCode = getOptionalString(input, "hs_code")?.toUpperCase();

  if (id) {
    payload.id = id;
  }

  if (organizationId) {
    payload.organization_id = organizationId;
  }

  if (description) {
    payload.description = description;
  }

  if (taxCategory) {
    payload.tax_category = taxCategory;
  }

  if (ncmCode) {
    payload.ncm_code = ncmCode;
  }

  if (hsCode) {
    payload.hs_code = hsCode;
  }

  if (countryOfOrigin) {
    payload.country_of_origin = countryOfOrigin;
  }

  if (metadata) {
    payload.metadata = metadata;
  }

  return { ok: true, value: payload };
}
