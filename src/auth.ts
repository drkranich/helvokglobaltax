import type { MiddlewareHandler } from "hono";

import type { AppEnv } from "./env";
import { jsonResponse } from "./response";

const encoder = new TextEncoder();

function extractAdminToken(authorization: string | undefined, headerToken: string | undefined): string | null {
  if (headerToken) {
    return headerToken.trim() || null;
  }

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim() || null;
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }

  return diff === 0;
}

async function isValidSecret(provided: string, expected: string): Promise<boolean> {
  const [providedHash, expectedHash] = await Promise.all([sha256(provided), sha256(expected)]);
  return constantTimeEqual(providedHash, expectedHash);
}

export const requireAdminToken: MiddlewareHandler<AppEnv> = async (c, next) => {
  const expectedToken = c.env.HELVOK_ADMIN_TOKEN?.trim();
  if (!expectedToken) {
    return jsonResponse(
      c,
      {
        error: {
          code: "admin_token_not_configured",
          message: "Administrative API token is not configured.",
        },
      },
      503,
    );
  }

  const providedToken = extractAdminToken(c.req.header("authorization"), c.req.header("x-helvok-admin-token"));
  if (!providedToken || !(await isValidSecret(providedToken, expectedToken))) {
    return jsonResponse(
      c,
      {
        error: {
          code: "unauthorized",
          message: "Administrative authorization is required.",
        },
      },
      401,
    );
  }

  await next();
};
