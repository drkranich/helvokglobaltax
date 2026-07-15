import { Hono } from "hono";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { requireAdminToken } from "../auth";
import type { AppEnv } from "../env";
import { jsonResponse } from "../response";
import { isSupabaseError, SupabaseAdminRpcClient, SupabaseConfigurationError, SupabaseRpcError } from "../supabase";
import { isUuid, validateMembershipPayload, validateOrganizationPayload, validateTenantPayload } from "./validation";

async function readJsonBody(c: Context<AppEnv>): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}

function adminErrorResponse(c: Context<AppEnv>, error: unknown): Response {
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

export function createAdminRouter(): Hono<AppEnv> {
  const admin = new Hono<AppEnv>();

  admin.use("*", requireAdminToken);

  admin.get("/health", (c) =>
    jsonResponse(c, {
      service: "helvok-tax-admin-api",
      status: "ok",
      checks: {
        admin_token_configured: Boolean(c.env.HELVOK_ADMIN_TOKEN),
        supabase_url_configured: Boolean(c.env.SUPABASE_URL),
        supabase_service_role_configured: Boolean(c.env.SUPABASE_SERVICE_ROLE_KEY),
      },
    }),
  );

  admin.get("/tenants", async (c) => {
    try {
      const client = new SupabaseAdminRpcClient(c.env);
      const tenants = await client.rpc("helvok_admin_list_tenants");
      return jsonResponse(c, { tenants });
    } catch (error) {
      return adminErrorResponse(c, error);
    }
  });

  admin.post("/tenants", async (c) => {
    const body = await readJsonBody(c);
    const validation = validateTenantPayload(body);

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
      const client = new SupabaseAdminRpcClient(c.env);
      const result = await client.rpc("helvok_admin_create_tenant", { payload: validation.value });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result }, 201);
    } catch (error) {
      return adminErrorResponse(c, error);
    }
  });

  admin.get("/tenants/:tenantId/organizations", async (c) => {
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
      const client = new SupabaseAdminRpcClient(c.env);
      const organizations = await client.rpc("helvok_admin_list_organizations", { p_tenant_id: tenantId });
      return jsonResponse(c, { organizations });
    } catch (error) {
      return adminErrorResponse(c, error);
    }
  });

  admin.post("/organizations", async (c) => {
    const body = await readJsonBody(c);
    const validation = validateOrganizationPayload(body);

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
      const client = new SupabaseAdminRpcClient(c.env);
      const result = await client.rpc("helvok_admin_create_organization", { payload: validation.value });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result }, 201);
    } catch (error) {
      return adminErrorResponse(c, error);
    }
  });

  admin.get("/tenants/:tenantId/memberships", async (c) => {
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
      const client = new SupabaseAdminRpcClient(c.env);
      const memberships = await client.rpc("helvok_admin_list_memberships", { p_tenant_id: tenantId });
      return jsonResponse(c, { memberships });
    } catch (error) {
      return adminErrorResponse(c, error);
    }
  });

  admin.post("/memberships", async (c) => {
    const body = await readJsonBody(c);
    const validation = validateMembershipPayload(body);

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
      const client = new SupabaseAdminRpcClient(c.env);
      const result = await client.rpc("helvok_admin_upsert_membership", { payload: validation.value });
      return jsonResponse(c, result && typeof result === "object" ? (result as Record<string, unknown>) : { result }, 201);
    } catch (error) {
      return adminErrorResponse(c, error);
    }
  });

  return admin;
}
