import { Hono } from "hono";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { AppEnv } from "../env";
import { jsonResponse } from "../response";
import {
  isUuid,
  validateCatalogItemPayload,
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
