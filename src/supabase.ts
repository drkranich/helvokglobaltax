import type { AppBindings } from "./env";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = Record<string, unknown>;
type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type ParsedResponseBody = {
  body: unknown;
  isJson: boolean;
  text: string;
};

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

function sanitizeErrorDetail(error: unknown): string | undefined {
  if (!(error instanceof Error) || !error.message) {
    return undefined;
  }

  const redactedMessage = error.message.replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[redacted-jwt]");
  return `${error.name}: ${redactedMessage}`.slice(0, 240);
}

async function readResponseBody(response: Response): Promise<ParsedResponseBody> {
  const text = await response.text();
  if (!text) {
    return { body: null, isJson: true, text };
  }

  try {
    return { body: JSON.parse(text) as unknown, isJson: true, text };
  } catch {
    return { body: null, isJson: false, text };
  }
}

export class SupabaseAdminRpcClient {
  private readonly baseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly fetcher: Fetcher;

  constructor(env: AppBindings, fetcher: Fetcher = (input, init) => fetch(input, init)) {
    const supabaseUrl = env.SUPABASE_URL?.trim();
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl) {
      throw new SupabaseConfigurationError("SUPABASE_URL is not configured.");
    }

    if (!serviceRoleKey) {
      throw new SupabaseConfigurationError("SUPABASE_SERVICE_ROLE_KEY is not configured.");
    }

    this.baseUrl = normalizeBaseUrl(supabaseUrl);
    this.serviceRoleKey = serviceRoleKey;
    this.fetcher = (input, init) => fetcher(input, init);
  }

  async rpc(functionName: string, payload: JsonObject = {}): Promise<unknown> {
    let response: Response;

    try {
      response = await this.fetcher(`${this.baseUrl}/rest/v1/rpc/${functionName}`, {
        method: "POST",
        headers: {
          accept: "application/json",
          apikey: this.serviceRoleKey,
          authorization: `Bearer ${this.serviceRoleKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new SupabaseRpcError(
        502,
        "Supabase RPC request could not reach Supabase.",
        undefined,
        sanitizeErrorDetail(error),
      );
    }

    const responseBody = await readResponseBody(response);

    if (!responseBody.isJson) {
      throw new SupabaseRpcError(
        response.ok ? 502 : response.status,
        "Supabase RPC returned a non-JSON response.",
      );
    }

    if (!response.ok) {
      const errorBody = responseBody.body && typeof responseBody.body === "object" ? responseBody.body : {};
      const record = errorBody as Record<string, unknown>;
      const message = typeof record.message === "string" ? record.message : "Supabase RPC request failed.";
      const code = typeof record.code === "string" ? record.code : undefined;
      const details = typeof record.details === "string" ? record.details : undefined;
      throw new SupabaseRpcError(response.status, message, code, details);
    }

    return responseBody.body;
  }
}

export function isSupabaseError(error: unknown): error is SupabaseRpcError | SupabaseConfigurationError {
  return error instanceof SupabaseRpcError || error instanceof SupabaseConfigurationError;
}
