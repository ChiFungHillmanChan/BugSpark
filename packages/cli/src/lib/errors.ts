import { ApiError } from "./api-client.js";

/**
 * Safely extract a context-aware error message from an unknown thrown value.
 */
export function formatError(err: unknown): string {
  if (err instanceof ApiError) {
    return formatApiError(err);
  }

  if (err instanceof TypeError && err.message === "fetch failed") {
    const cause = (err as { cause?: { code?: string } }).cause;
    return formatNetworkError(cause?.code);
  }

  if (err instanceof DOMException && err.name === "TimeoutError") {
    return "Request timed out. The server may be slow or unreachable.";
  }

  return err instanceof Error ? err.message : String(err);
}

function formatApiError(err: ApiError): string {
  switch (err.status) {
    case 401:
      return "Authentication failed. Run `bugspark login` to re-authenticate.";
    case 403:
      return "Access denied. You don't have permission to perform this action.";
    case 503:
      return "Service temporarily unavailable. Please try again later.";
    default:
      return err.message;
  }
}

function formatNetworkError(code: string | undefined): string {
  switch (code) {
    case "ECONNREFUSED":
      return "Connection refused. Is the API server running?";
    case "ENOTFOUND":
      return "Server not found. Check your internet connection and API URL.";
    default:
      return "Network error. Check your internet connection.";
  }
}
