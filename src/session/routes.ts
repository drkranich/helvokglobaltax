import { Hono } from "hono";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { AppEnv } from "../env";
import { jsonResponse } from "../response";
import { isUuid, validateMembershipPayload } from "../admin/validation";
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

  return session;
}
