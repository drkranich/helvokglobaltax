import { Hono } from "hono";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { AppEnv } from "../env";
import { jsonResponse } from "../response";
import {
  isUuid,
  validateCatalogItemPayload,
  validateFinancialRecordPayload,
  validateFiscalDocumentPayload,
  validateInvitationAcceptPayload,
  validateInvitationPayload,
  validateInvitationResendPayload,
  validateMembershipPayload,
} from "../admin/validation";
import {
  getPublicAuthConfig,
  isSupabaseError,
  SupabaseAdminRpcClient,
  SupabaseAuthError,
  SupabaseAuthenticatedClient,
  SupabaseConfigurationError,
  SupabaseRpcError,
} from "../supabase";
import {
  CertificateEncryptionConfigError,
  encryptTextToBase64,
  encryptToBase64,
  loadCertificateEncryptionKey,
} from "../fiscal/certificate-crypto";

function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token?.trim()) {
    return null;
  }

  return token.trim();
}

function sessionErrorResponse(c: Context<AppEnv>, error: unknown): Response {
  if (error instanceof CertificateEncryptionConfigError) {
    return jsonResponse(
      c,
      {
        error: {
          code: "certificate_encryption_not_configured",
          message: error.message,
        },
      },
      503,
    );
  }

  if (error instanceof SupabaseConfigurationError) {
    return jsonResponse(
      c,
      {
        error: {
          code: "supabase_not_configured",
          message: error.message,
        },
      },
      503,
    );
  }

  if (error instanceof SupabaseAuthError) {
    return jsonResponse(
      c,
      {
        error: {
          code: error.code ?? "auth_error",
          message: error.message,
        },
      },
      (error.status >= 400 && error.status <= 599 ? error.status : 401) as ContentfulStatusCode,
    );
  }

  if (error instanceof SupabaseRpcError) {
    return jsonResponse(
      c,
      {
        error: {
          code: "supabase_rpc_error",
          message: error.message,
          upstream_status: error.status,
          upstream_code: error.code,
          upstream_details: error.details,
        },
      },
      (error.status >= 400 && error.status <= 599 ? error.status : 502) as ContentfulStatusCode,
    );
  }

  if (isSupabaseError(error)) {
    return jsonResponse(
      c,
      {
        error: {
          code: "supabase_error",
          message: error.message,
        },
      },
      502,
    );
  }

  throw error;
}

function getUserEmail(user: Record<string, unknown>): string | null {
  return typeof user.email === "string" && user.email.trim() ? user.email.trim().toLowerCase() : null;
}

function getUserFullName(user: Record<string, unknown>): string | null {
  const metadata = user.user_metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const fullName = (metadata as Record<string, unknown>).full_name;
    if (typeof fullName === "string" && fullName.trim()) {
      return fullName.trim();
    }
  }

  return getUserEmail(user);
}

async function readJsonBody(c: Context<AppEnv>): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}

function missingTokenResponse(c: Context<AppEnv>): Response {
  return jsonResponse(
    c,
    {
      error: {
        code: "missing_token",
        message: "Authorization Bearer token is required.",
      },
    },
    401,
  );
}

function isFinancialEntity(value: string): boolean {
  return [
    "accounts",
    "financial_accounts",
    "entries",
    "financial_entries",
    "cost_centers",
    "projects",
    "budgets",
    "forecasts",
    "investments",
    "pricing_models",
    "product_costs",
    "logistics_costs",
    "tax_costs",
    "channel_costs",
    "cash_flow_periods",
    "financial_reports",
    "spreadsheet_exports",
  ].includes(value);
}

function encodeBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";

  for (const byte of array) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function generateInvitationToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
}

async function hashInvitationToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return encodeBase64Url(digest);
}

function invitationExpiresAt(expiresInDays: unknown): string {
  const days = typeof expiresInDays === "number" ? expiresInDays : 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function buildInvitationUrl(c: Context<AppEnv>, token: string): string {
  const requestUrl = new URL(c.req.url);
  return `${requestUrl.origin}/app?invite=${encodeURIComponent(token)}`;
}

function withInvitationDelivery(c: Context<AppEnv>, result: unknown, token: string): Record<string, unknown> {
  const payload = result && typeof result === "object" ? { ...(result as Record<string, unknown>) } : { result };
  return {
    ...payload,
    invitation_token: token,
    invitation_url: buildInvitationUrl(c, token),
  };
}

async function syncCoreUser(c: Context<AppEnv>, authUser: Record<string, unknown>): Promise<void> {
  const authUserId = typeof authUser.id === "string" ? authUser.id : null;
  const email = getUserEmail(authUser);

  if (!authUserId || !email) {
    throw new SupabaseAuthError(422, "Supabase Auth user is missing id or email.", "invalid_auth_user");
  }

  const adminClient = new SupabaseAdminRpcClient(c.env);
  await adminClient.rpc("helvok_admin_sync_user", {
    payload: {
      auth_user_id: authUserId,
      email,
      full_name: getUserFullName(authUser),
      metadata: {
        source: "worker-session-sync",
        provider: "supabase",
      },
    },
  });
}

export function createSessionRouter(): Hono<AppEnv> {
  const session = new Hono<AppEnv>();

  session.get("/auth/config", (c) => {
    try {
      return jsonResponse(c, {
        auth: {
          ...getPublicAuthConfig(c.env),
          provider: "supabase",
          password_enabled: true,
        },
      });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.get("/me", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const sessionSummary = await client.rpc("helvok_current_session");
      return jsonResponse(c, { session: sessionSummary && typeof sessionSummary === "object" ? sessionSummary : {} });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/session/sync", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    try {
      const authClient = new SupabaseAuthenticatedClient(c.env, accessToken);
      const authUser = await authClient.getUser();
      await syncCoreUser(c, authUser);

      const sessionSummary = await authClient.rpc("helvok_current_session");
      return jsonResponse(c, { session: sessionSummary && typeof sessionSummary === "object" ? sessionSummary : {} });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.get("/tenants/:tenantId/access", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_tenant_id",
            message: "tenantId must be a valid UUID.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const access = await client.rpc("helvok_current_tenant_access", { p_tenant_id: tenantId });
      return jsonResponse(c, { access: access && typeof access === "object" ? access : {} });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/memberships", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_tenant_id",
            message: "tenantId must be a valid UUID.",
          },
        },
        400,
      );
    }

    const body = await readJsonBody(c);
    const requestBody = body && typeof body === "object" && !Array.isArray(body)
      ? { ...(body as Record<string, unknown>), tenant_id: tenantId }
      : { tenant_id: tenantId };
    const validation = validateMembershipPayload(requestBody);

    if (!validation.ok) {
      return jsonResponse(
        c,
        {
          error: {
            code: validation.code,
            message: validation.message,
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_upsert_membership", { payload: validation.value });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result }, 201);
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.get("/tenants/:tenantId/catalog/items", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_tenant_id",
            message: "tenantId must be a valid UUID.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const items = await client.rpc("helvok_current_list_catalog_items", { p_tenant_id: tenantId });
      return jsonResponse(c, { items });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/catalog/items", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_tenant_id",
            message: "tenantId must be a valid UUID.",
          },
        },
        400,
      );
    }

    const body = await readJsonBody(c);
    const requestBody = body && typeof body === "object" && !Array.isArray(body)
      ? { ...(body as Record<string, unknown>), tenant_id: tenantId }
      : { tenant_id: tenantId };
    const validation = validateCatalogItemPayload(requestBody);

    if (!validation.ok) {
      return jsonResponse(
        c,
        {
          error: {
            code: validation.code,
            message: validation.message,
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_upsert_catalog_item", { payload: validation.value });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result }, 201);
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.delete("/tenants/:tenantId/catalog/items/:itemId", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const itemId = c.req.param("itemId");
    if (!isUuid(tenantId) || !isUuid(itemId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_catalog_delete_target",
            message: "tenantId and itemId must be valid UUIDs.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_delete_catalog_item", { p_tenant_id: tenantId, p_item_id: itemId });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.get("/tenants/:tenantId/organizations", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_tenant_id",
            message: "tenantId must be a valid UUID.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const organizations = await client.rpc("helvok_current_list_organizations", { p_tenant_id: tenantId });
      return jsonResponse(c, { organizations });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.get("/tenants/:tenantId/fiscal/documents", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_tenant_id",
            message: "tenantId must be a valid UUID.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const documents = await client.rpc("helvok_current_list_fiscal_documents", { p_tenant_id: tenantId });
      return jsonResponse(c, { documents });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.get("/tenants/:tenantId/fiscal/rejections", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_tenant_id",
            message: "tenantId must be a valid UUID.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const rejections = await client.rpc("helvok_current_list_fiscal_rejections", { p_tenant_id: tenantId });
      return jsonResponse(c, { rejections });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.get("/tenants/:tenantId/fiscal/registrations", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_tenant_id",
            message: "tenantId must be a valid UUID.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const registrations = await client.rpc("helvok_current_list_fiscal_registrations", { p_tenant_id: tenantId });
      return jsonResponse(c, { registrations });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/fiscal/registrations", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_tenant_id",
            message: "tenantId must be a valid UUID.",
          },
        },
        400,
      );
    }

    const body = await readJsonBody(c);
    const payload = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};

    if (typeof payload.organization_id !== "string" || payload.organization_id.trim() === "") {
      return jsonResponse(
        c,
        { error: { code: "invalid_organization_id", message: "organization_id is required." } },
        400,
      );
    }

    if (typeof payload.country_code !== "string" || payload.country_code.trim() === "") {
      return jsonResponse(
        c,
        { error: { code: "invalid_country_code", message: "country_code is required." } },
        400,
      );
    }

    if (typeof payload.tax_id !== "string" || payload.tax_id.trim() === "") {
      return jsonResponse(
        c,
        { error: { code: "invalid_tax_id", message: "tax_id is required." } },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_upsert_fiscal_registration", {
        p_tenant_id: tenantId,
        p_payload: payload,
      });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result }, 201);
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/fiscal/registrations/:registrationId/archive", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const registrationId = c.req.param("registrationId");
    if (!isUuid(tenantId) || !isUuid(registrationId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_fiscal_registration_archive_target",
            message: "tenantId and registrationId must be valid UUIDs.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_archive_fiscal_registration", {
        p_tenant_id: tenantId,
        p_registration_id: registrationId,
      });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.delete("/tenants/:tenantId/fiscal/registrations/:registrationId", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const registrationId = c.req.param("registrationId");
    if (!isUuid(tenantId) || !isUuid(registrationId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_fiscal_registration_delete_target",
            message: "tenantId and registrationId must be valid UUIDs.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_delete_fiscal_registration", {
        p_tenant_id: tenantId,
        p_registration_id: registrationId,
      });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.get("/tenants/:tenantId/commerce/parties", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(c, { error: { code: "invalid_tenant_id", message: "tenantId must be a valid UUID." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const parties = await client.rpc("helvok_current_list_parties", { p_tenant_id: tenantId });
      return jsonResponse(c, { parties });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/commerce/parties", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(c, { error: { code: "invalid_tenant_id", message: "tenantId must be a valid UUID." } }, 400);
    }

    const body = await readJsonBody(c);
    const payload = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};

    if (typeof payload.name !== "string" || payload.name.trim() === "") {
      return jsonResponse(c, { error: { code: "invalid_name", message: "name is required." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_upsert_party", { p_tenant_id: tenantId, p_payload: payload });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result }, 201);
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/commerce/parties/:partyId/archive", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const partyId = c.req.param("partyId");
    if (!isUuid(tenantId) || !isUuid(partyId)) {
      return jsonResponse(c, { error: { code: "invalid_party_archive_target", message: "tenantId and partyId must be valid UUIDs." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_archive_party", { p_tenant_id: tenantId, p_party_id: partyId });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.delete("/tenants/:tenantId/commerce/parties/:partyId", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const partyId = c.req.param("partyId");
    if (!isUuid(tenantId) || !isUuid(partyId)) {
      return jsonResponse(c, { error: { code: "invalid_party_delete_target", message: "tenantId and partyId must be valid UUIDs." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_delete_party", { p_tenant_id: tenantId, p_party_id: partyId });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.get("/tenants/:tenantId/commerce/operations", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(c, { error: { code: "invalid_tenant_id", message: "tenantId must be a valid UUID." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const operations = await client.rpc("helvok_current_list_operations", { p_tenant_id: tenantId });
      return jsonResponse(c, { operations });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/commerce/operations", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(c, { error: { code: "invalid_tenant_id", message: "tenantId must be a valid UUID." } }, 400);
    }

    const body = await readJsonBody(c);
    const payload = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};

    if (typeof payload.organization_id !== "string" || payload.organization_id.trim() === "") {
      return jsonResponse(c, { error: { code: "invalid_organization_id", message: "organization_id is required." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_create_operation", { p_tenant_id: tenantId, p_payload: payload });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result }, 201);
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/commerce/operations/:operationId/status", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const operationId = c.req.param("operationId");
    if (!isUuid(tenantId) || !isUuid(operationId)) {
      return jsonResponse(c, { error: { code: "invalid_operation_status_target", message: "tenantId and operationId must be valid UUIDs." } }, 400);
    }

    const body = await readJsonBody(c);
    const payload = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
    if (typeof payload.status !== "string" || payload.status.trim() === "") {
      return jsonResponse(c, { error: { code: "invalid_status", message: "status is required." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_update_operation_status", {
        p_tenant_id: tenantId,
        p_operation_id: operationId,
        p_status: payload.status,
      });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.delete("/tenants/:tenantId/commerce/operations/:operationId", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const operationId = c.req.param("operationId");
    if (!isUuid(tenantId) || !isUuid(operationId)) {
      return jsonResponse(c, { error: { code: "invalid_operation_delete_target", message: "tenantId and operationId must be valid UUIDs." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_delete_operation", { p_tenant_id: tenantId, p_operation_id: operationId });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.get("/tenants/:tenantId/rules/versions", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(c, { error: { code: "invalid_tenant_id", message: "tenantId must be a valid UUID." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const ruleVersions = await client.rpc("helvok_current_list_rule_versions", { p_tenant_id: tenantId });
      return jsonResponse(c, { rule_versions: ruleVersions });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/rules/versions", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(c, { error: { code: "invalid_tenant_id", message: "tenantId must be a valid UUID." } }, 400);
    }

    const body = await readJsonBody(c);
    const payload = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};

    if (typeof payload.title !== "string" || payload.title.trim() === "") {
      return jsonResponse(c, { error: { code: "invalid_title", message: "title is required." } }, 400);
    }
    if (typeof payload.market_code !== "string" || payload.market_code.trim() === "") {
      return jsonResponse(c, { error: { code: "invalid_market_code", message: "market_code is required." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_create_rule_version", { p_tenant_id: tenantId, p_payload: payload });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result }, 201);
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/rules/versions/:ruleId/submit", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const ruleId = c.req.param("ruleId");
    if (!isUuid(tenantId) || !isUuid(ruleId)) {
      return jsonResponse(c, { error: { code: "invalid_rule_submit_target", message: "tenantId and ruleId must be valid UUIDs." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_submit_rule_version", { p_tenant_id: tenantId, p_rule_id: ruleId });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/rules/versions/:ruleId/review", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const ruleId = c.req.param("ruleId");
    if (!isUuid(tenantId) || !isUuid(ruleId)) {
      return jsonResponse(c, { error: { code: "invalid_rule_review_target", message: "tenantId and ruleId must be valid UUIDs." } }, 400);
    }

    const body = await readJsonBody(c);
    const payload = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
    if (typeof payload.decision !== "string" || (payload.decision !== "approved" && payload.decision !== "rejected")) {
      return jsonResponse(c, { error: { code: "invalid_decision", message: "decision must be 'approved' or 'rejected'." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_review_rule_version", {
        p_tenant_id: tenantId,
        p_rule_id: ruleId,
        p_decision: payload.decision,
        p_notes: typeof payload.notes === "string" ? payload.notes : null,
      });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/rules/versions/:ruleId/publish", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const ruleId = c.req.param("ruleId");
    if (!isUuid(tenantId) || !isUuid(ruleId)) {
      return jsonResponse(c, { error: { code: "invalid_rule_publish_target", message: "tenantId and ruleId must be valid UUIDs." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_publish_rule_version", { p_tenant_id: tenantId, p_rule_id: ruleId });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.delete("/tenants/:tenantId/rules/versions/:ruleId", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const ruleId = c.req.param("ruleId");
    if (!isUuid(tenantId) || !isUuid(ruleId)) {
      return jsonResponse(c, { error: { code: "invalid_rule_delete_target", message: "tenantId and ruleId must be valid UUIDs." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_delete_rule_version", { p_tenant_id: tenantId, p_rule_id: ruleId });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.get("/tenants/:tenantId/compliance/obligations", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(c, { error: { code: "invalid_tenant_id", message: "tenantId must be a valid UUID." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const obligations = await client.rpc("helvok_current_list_obligations", { p_tenant_id: tenantId });
      return jsonResponse(c, { obligations });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/compliance/obligations", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(c, { error: { code: "invalid_tenant_id", message: "tenantId must be a valid UUID." } }, 400);
    }

    const body = await readJsonBody(c);
    const payload = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};

    if (typeof payload.title !== "string" || payload.title.trim() === "") {
      return jsonResponse(c, { error: { code: "invalid_title", message: "title is required." } }, 400);
    }
    if (typeof payload.market_code !== "string" || payload.market_code.trim() === "") {
      return jsonResponse(c, { error: { code: "invalid_market_code", message: "market_code is required." } }, 400);
    }
    if (typeof payload.due_date !== "string" || payload.due_date.trim() === "") {
      return jsonResponse(c, { error: { code: "invalid_due_date", message: "due_date is required." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_upsert_obligation", { p_tenant_id: tenantId, p_payload: payload });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result }, 201);
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/compliance/obligations/:obligationId/complete", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const obligationId = c.req.param("obligationId");
    if (!isUuid(tenantId) || !isUuid(obligationId)) {
      return jsonResponse(c, { error: { code: "invalid_obligation_complete_target", message: "tenantId and obligationId must be valid UUIDs." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_complete_obligation", { p_tenant_id: tenantId, p_obligation_id: obligationId });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/compliance/obligations/:obligationId/cancel", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const obligationId = c.req.param("obligationId");
    if (!isUuid(tenantId) || !isUuid(obligationId)) {
      return jsonResponse(c, { error: { code: "invalid_obligation_cancel_target", message: "tenantId and obligationId must be valid UUIDs." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_cancel_obligation", { p_tenant_id: tenantId, p_obligation_id: obligationId });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.delete("/tenants/:tenantId/compliance/obligations/:obligationId", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const obligationId = c.req.param("obligationId");
    if (!isUuid(tenantId) || !isUuid(obligationId)) {
      return jsonResponse(c, { error: { code: "invalid_obligation_delete_target", message: "tenantId and obligationId must be valid UUIDs." } }, 400);
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_delete_obligation", { p_tenant_id: tenantId, p_obligation_id: obligationId });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.get("/tenants/:tenantId/fiscal/certificates", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_tenant_id",
            message: "tenantId must be a valid UUID.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const certificates = await client.rpc("helvok_current_list_fiscal_certificates", { p_tenant_id: tenantId });
      return jsonResponse(c, { certificates });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/fiscal/registrations/:registrationId/certificate", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const registrationId = c.req.param("registrationId");
    if (!isUuid(tenantId) || !isUuid(registrationId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_fiscal_registration_certificate_target",
            message: "tenantId and registrationId must be valid UUIDs.",
          },
        },
        400,
      );
    }

    const body = await readJsonBody(c);
    const payload = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};

    const fileName = typeof payload.file_name === "string" ? payload.file_name.trim() : "";
    const certificateBase64 = typeof payload.certificate_base64 === "string" ? payload.certificate_base64.trim() : "";
    const password = typeof payload.password === "string" ? payload.password : "";

    if (!fileName) {
      return jsonResponse(c, { error: { code: "invalid_file_name", message: "file_name is required." } }, 400);
    }
    if (!certificateBase64) {
      return jsonResponse(
        c,
        { error: { code: "invalid_certificate_base64", message: "certificate_base64 (the .pfx file content, base64-encoded) is required." } },
        400,
      );
    }
    if (!password) {
      return jsonResponse(c, { error: { code: "invalid_password", message: "password is required." } }, 400);
    }

    try {
      const encryptionKey = await loadCertificateEncryptionKey(c.env.HELVOK_CERT_ENCRYPTION_KEY);
      const encryptedPayload = await encryptToBase64(encryptionKey, certificateBase64);
      const encryptedPassword = await encryptTextToBase64(encryptionKey, password);

      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_upload_fiscal_certificate", {
        p_tenant_id: tenantId,
        p_payload: {
          fiscal_registration_id: registrationId,
          certificate_type: typeof payload.certificate_type === "string" ? payload.certificate_type : "a1",
          file_name: fileName,
          encrypted_payload: encryptedPayload.ciphertext_base64,
          payload_iv: encryptedPayload.iv_base64,
          encrypted_password: encryptedPassword.ciphertext_base64,
          password_iv: encryptedPassword.iv_base64,
          issued_to: typeof payload.issued_to === "string" ? payload.issued_to : undefined,
          issuer: typeof payload.issuer === "string" ? payload.issuer : undefined,
          valid_from: typeof payload.valid_from === "string" ? payload.valid_from : undefined,
          valid_until: typeof payload.valid_until === "string" ? payload.valid_until : undefined,
        },
      });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result }, 201);
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/fiscal/certificates/:certificateId/revoke", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const certificateId = c.req.param("certificateId");
    if (!isUuid(tenantId) || !isUuid(certificateId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_fiscal_certificate_revoke_target",
            message: "tenantId and certificateId must be valid UUIDs.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_revoke_fiscal_certificate", {
        p_tenant_id: tenantId,
        p_certificate_id: certificateId,
      });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.delete("/tenants/:tenantId/fiscal/certificates/:certificateId", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const certificateId = c.req.param("certificateId");
    if (!isUuid(tenantId) || !isUuid(certificateId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_fiscal_certificate_delete_target",
            message: "tenantId and certificateId must be valid UUIDs.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_delete_fiscal_certificate", {
        p_tenant_id: tenantId,
        p_certificate_id: certificateId,
      });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/fiscal/documents", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_tenant_id",
            message: "tenantId must be a valid UUID.",
          },
        },
        400,
      );
    }

    const body = await readJsonBody(c);
    const requestBody = body && typeof body === "object" && !Array.isArray(body)
      ? { ...(body as Record<string, unknown>), tenant_id: tenantId }
      : { tenant_id: tenantId };
    const validation = validateFiscalDocumentPayload(requestBody);

    if (!validation.ok) {
      return jsonResponse(
        c,
        {
          error: {
            code: validation.code,
            message: validation.message,
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_create_fiscal_document", { payload: validation.value });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result }, 201);
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.patch("/tenants/:tenantId/fiscal/documents/:documentId", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const documentId = c.req.param("documentId");
    if (!isUuid(tenantId) || !isUuid(documentId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_fiscal_document_target",
            message: "tenantId and documentId must be valid UUIDs.",
          },
        },
        400,
      );
    }

    const body = await readJsonBody(c);
    const payload = body && typeof body === "object" && !Array.isArray(body) ? body : {};

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_update_fiscal_document", {
        p_tenant_id: tenantId,
        p_document_id: documentId,
        payload,
      });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/fiscal/documents/:documentId/archive", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const documentId = c.req.param("documentId");
    if (!isUuid(tenantId) || !isUuid(documentId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_fiscal_document_archive_target",
            message: "tenantId and documentId must be valid UUIDs.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_archive_fiscal_document", {
        p_tenant_id: tenantId,
        p_document_id: documentId,
      });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.delete("/tenants/:tenantId/fiscal/documents/:documentId", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const documentId = c.req.param("documentId");
    if (!isUuid(tenantId) || !isUuid(documentId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_fiscal_document_delete_target",
            message: "tenantId and documentId must be valid UUIDs.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_delete_fiscal_document", {
        p_tenant_id: tenantId,
        p_document_id: documentId,
      });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.get("/tenants/:tenantId/financial/:entity", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const entity = c.req.param("entity");
    const limit = Number(c.req.query("limit") || 100);
    if (!isUuid(tenantId) || !isFinancialEntity(entity)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_financial_list_target",
            message: "tenantId and entity must identify a supported financial resource.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const records = await client.rpc("helvok_current_list_financial_records", {
        p_tenant_id: tenantId,
        p_entity: entity,
        p_limit: Number.isFinite(limit) ? Math.max(1, Math.min(limit, 500)) : 100,
      });
      return jsonResponse(c, { entity, records });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/financial/:entity", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const entity = c.req.param("entity");
    if (!isUuid(tenantId) || !isFinancialEntity(entity)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_financial_upsert_target",
            message: "tenantId and entity must identify a supported financial resource.",
          },
        },
        400,
      );
    }

    const body = await readJsonBody(c);
    const requestBody = body && typeof body === "object" && !Array.isArray(body)
      ? { ...(body as Record<string, unknown>), tenant_id: tenantId, entity }
      : { tenant_id: tenantId, entity };
    const validation = validateFinancialRecordPayload(requestBody);

    if (!validation.ok) {
      return jsonResponse(
        c,
        {
          error: {
            code: validation.code,
            message: validation.message,
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_upsert_financial_record", { payload: validation.value });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result }, 201);
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/financial/:entity/:recordId/archive", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const entity = c.req.param("entity");
    const recordId = c.req.param("recordId");
    if (!isUuid(tenantId) || !isUuid(recordId) || !isFinancialEntity(entity)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_financial_archive_target",
            message: "tenantId, entity, and recordId must identify a supported financial record.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_archive_financial_record", {
        p_tenant_id: tenantId,
        p_entity: entity,
        p_record_id: recordId,
      });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/financial/entries/:entryId/reverse", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const entryId = c.req.param("entryId");
    if (!isUuid(tenantId) || !isUuid(entryId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_financial_reverse_target",
            message: "tenantId and entryId must be valid UUIDs.",
          },
        },
        400,
      );
    }

    const body = await readJsonBody(c);
    const notes = body && typeof body === "object" && !Array.isArray(body) && typeof (body as Record<string, unknown>).notes === "string"
      ? String((body as Record<string, unknown>).notes).trim()
      : null;

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_reverse_financial_entry", {
        p_tenant_id: tenantId,
        p_entry_id: entryId,
        p_notes: notes,
      });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/invitations", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    if (!isUuid(tenantId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_tenant_id",
            message: "tenantId must be a valid UUID.",
          },
        },
        400,
      );
    }

    const body = await readJsonBody(c);
    const requestBody = body && typeof body === "object" && !Array.isArray(body)
      ? { ...(body as Record<string, unknown>), tenant_id: tenantId }
      : { tenant_id: tenantId };
    const validation = validateInvitationPayload(requestBody);

    if (!validation.ok) {
      return jsonResponse(
        c,
        {
          error: {
            code: validation.code,
            message: validation.message,
          },
        },
        400,
      );
    }

    try {
      const token = generateInvitationToken();
      const tokenHash = await hashInvitationToken(token);
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_create_membership_invitation", {
        payload: {
          ...validation.value,
          token_hash: tokenHash,
          expires_at: invitationExpiresAt(validation.value.expires_in_days),
        },
      });

      return jsonResponse(c, withInvitationDelivery(c, result, token), 201);
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/invitations/:invitationId/resend", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const invitationId = c.req.param("invitationId");
    if (!isUuid(tenantId) || !isUuid(invitationId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_invitation_path",
            message: "tenantId and invitationId must be valid UUIDs.",
          },
        },
        400,
      );
    }

    const validation = validateInvitationResendPayload(await readJsonBody(c));
    if (!validation.ok) {
      return jsonResponse(
        c,
        {
          error: {
            code: validation.code,
            message: validation.message,
          },
        },
        400,
      );
    }

    try {
      const token = generateInvitationToken();
      const tokenHash = await hashInvitationToken(token);
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_rotate_membership_invitation", {
        payload: {
          invitation_id: invitationId,
          token_hash: tokenHash,
          expires_at: invitationExpiresAt(validation.value.expires_in_days),
        },
      });

      return jsonResponse(c, withInvitationDelivery(c, result, token));
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/tenants/:tenantId/invitations/:invitationId/revoke", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const tenantId = c.req.param("tenantId");
    const invitationId = c.req.param("invitationId");
    if (!isUuid(tenantId) || !isUuid(invitationId)) {
      return jsonResponse(
        c,
        {
          error: {
            code: "invalid_invitation_path",
            message: "tenantId and invitationId must be valid UUIDs.",
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      await client.getUser();
      const result = await client.rpc("helvok_current_revoke_membership_invitation", {
        p_invitation_id: invitationId,
      });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  session.post("/invitations/accept", async (c) => {
    const accessToken = extractBearerToken(c.req.header("authorization"));
    if (!accessToken) {
      return missingTokenResponse(c);
    }

    const validation = validateInvitationAcceptPayload(await readJsonBody(c));
    if (!validation.ok) {
      return jsonResponse(
        c,
        {
          error: {
            code: validation.code,
            message: validation.message,
          },
        },
        400,
      );
    }

    try {
      const client = new SupabaseAuthenticatedClient(c.env, accessToken);
      const authUser = await client.getUser();
      await syncCoreUser(c, authUser);
      const tokenHash = await hashInvitationToken(String(validation.value.token));
      const result = await client.rpc("helvok_current_accept_membership_invitation", {
        p_token_hash: tokenHash,
      });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result });
    } catch (error) {
      return sessionErrorResponse(c, error);
    }
  });

  return session;
}
