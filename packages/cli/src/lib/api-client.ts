import { type BugSparkConfig } from "./config.js";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  config: BugSparkConfig,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${config.apiUrl}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.token}`,
    "Content-Type": "application/json",
  };

  const resp = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });

  if (!resp.ok) {
    let detail = `HTTP ${resp.status}`;
    let code: string | undefined;
    try {
      const errBody = (await resp.json()) as { detail?: string; code?: string };
      if (errBody.detail) detail = errBody.detail;
      if (errBody.code) code = errBody.code;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(resp.status, detail, code);
  }

  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}

/**
 * Unauthenticated request — used for CLI register / login before we have a token.
 */
async function requestNoAuth<T>(
  apiUrl: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${apiUrl}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const resp = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });

  if (!resp.ok) {
    let detail = `HTTP ${resp.status}`;
    let code: string | undefined;
    try {
      const errBody = (await resp.json()) as { detail?: string; code?: string };
      if (errBody.detail) detail = errBody.detail;
      if (errBody.code) code = errBody.code;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(resp.status, detail, code);
  }

  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}

export function createClient(config: BugSparkConfig) {
  return {
    get: <T>(path: string) => request<T>(config, "GET", path),
    post: <T>(path: string, body?: unknown) =>
      request<T>(config, "POST", path, body),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(config, "PATCH", path, body),
    delete: <T>(path: string) => request<T>(config, "DELETE", path),
  };
}

export type ApiClient = ReturnType<typeof createClient>;

/**
 * Create a client that does not require authentication.
 * Used for register and email/password login.
 */
export function createUnauthClient(apiUrl: string) {
  return {
    post: <T>(path: string, body?: unknown) =>
      requestNoAuth<T>(apiUrl, "POST", path, body),
  };
}
