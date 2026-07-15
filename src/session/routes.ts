import { Hono } from "hono";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { AppEnv } from "../env";
import { jsonResponse } from "../response";
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

  return session;
}
