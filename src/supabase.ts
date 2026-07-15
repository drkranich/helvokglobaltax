import type { AppBindings } from "./env";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = Record<string, unknown>;

export class SupabaseRpcError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly details: string | undefined;

  constructor(status: number, message: string, code?: string, details?: string) {
    super(message);
    this.name = "SupabaseRpcError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigurationError";
  }
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  return JSON.parse(text) as unknown;
}

export class SupabaseAdminRpcClient {
  private readonly baseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly fetcher: typeof fetch;

  constructor(env: AppBindings, fetcher: typeof fetch = fetch) {
    if (!env.SUPABASE_URL) {
      throw new SupabaseConfigurationError("SUPABASE_URL is not configured.");
    }

    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new SupabaseConfigurationError("SUPABASE_SERVICE_ROLE_KEY is not configured.");
    }

    this.baseUrl = normalizeBaseUrl(env.SUPABASE_URL);
    this.serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    this.fetcher = fetcher;
  }

  async rpc(functionName: string, payload: JsonObject = {}): Promise<unknown> {
    const response = await this.fetcher(`${this.baseUrl}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: {
        accept: "application/json",
        apikey: this.serviceRoleKey,
        authorization: `Bearer ${this.serviceRoleKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await readJsonResponse(response);

    if (!response.ok) {
      const errorBody = responseBody && typeof responseBody === "object" ? responseBody : {};
      const record = errorBody as Record<string, unknown>;
      const message = typeof record.message === "string" ? record.message : "Supabase RPC request failed.";
      const code = typeof record.code === "string" ? record.code : undefined;
      const details = typeof record.details === "string" ? record.details : undefined;
      throw new SupabaseRpcError(response.status, message, code, details);
    }

    return responseBody;
  }
}

export function isSupabaseError(error: unknown): error is SupabaseRpcError | SupabaseConfigurationError {
  return error instanceof SupabaseRpcError || error instanceof SupabaseConfigurationError;
}
