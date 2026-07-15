import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { AppEnv } from "./env";

type JsonRecord = Record<string, unknown>;

export function getRequestId(c: Context<AppEnv>): string {
  return c.req.header("cf-ray") ?? crypto.randomUUID();
}

export function jsonResponse(
  c: Context<AppEnv>,
  body: JsonRecord,
  status: ContentfulStatusCode = 200,
): Response {
  const requestId = getRequestId(c);

  c.header("x-request-id", requestId);
  c.header("cache-control", "no-store");

  return c.json(
    {
      ...body,
      request_id: requestId,
    },
    status,
  );
}

export function htmlResponse(c: Context<AppEnv>, body: string, status: ContentfulStatusCode = 200): Response {
  const requestId = getRequestId(c);

  c.header("x-request-id", requestId);
  c.header("cache-control", "no-store");
  c.header("content-type", "text/html; charset=utf-8");

  return c.body(body, status);
}
