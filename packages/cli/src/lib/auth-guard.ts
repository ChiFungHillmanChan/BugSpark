import { ApiError, createClient } from "./api-client.js";
import { getConfigOrExit } from "./config.js";
import { error } from "./output.js";
import type { UserResponse } from "../types.js";

/**
 * Require a valid CLI PAT before executing protected commands.
 * This prevents bypass by manually editing the local config with
 * an invalid or expired token.
 *
 * Returns the authenticated user alongside the client so callers
 * (e.g. whoami) can reuse it without a second `/auth/me` call.
 */
export async function getAuthenticatedClientOrExit() {
  const config = getConfigOrExit();

  if (!config.token.startsWith("bsk_pat_")) {
    error("Invalid CLI token format. Run `bugspark login` to authenticate.");
    process.exit(1);
  }

  const client = createClient(config);

  let user: UserResponse;
  try {
    user = await client.get<UserResponse>("/auth/me");
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      error("Authentication required. Run `bugspark login` before using this command.");
      process.exit(1);
    }
    throw err;
  }

  return { config, client, user };
}
