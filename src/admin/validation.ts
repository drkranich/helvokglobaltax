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
