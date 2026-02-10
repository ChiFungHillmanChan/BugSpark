import { type BugSparkConfig } from "./config.js";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
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
  });

  if (!resp.ok) {
    let detail = `HTTP ${resp.status}`;
    try {
      const errBody = (await resp.json()) as { detail?: string };
      if (errBody.detail) detail = errBody.detail;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(resp.status, detail);
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
