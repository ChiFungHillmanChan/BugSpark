import chalk from "chalk";
import { createClient } from "../lib/api-client.js";
import { getConfigOrExit } from "../lib/config.js";
import { formatError } from "../lib/errors.js";
import { error, success, table } from "../lib/output.js";

interface TokenResponse {
  id: string;
  name: string;
  tokenPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface TokenCreateResponse {
  id: string;
  name: string;
  token: string;
  expiresAt: string | null;
  createdAt: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  if (diffMs < 60_000) return "just now";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return d.toLocaleDateString();
}

export async function listTokensCommand(): Promise<void> {
  const config = getConfigOrExit();
  const client = createClient(config);

  try {
    const tokens = await client.get<TokenResponse[]>("/auth/tokens");

    if (tokens.length === 0) {
      console.log();
      console.log("  No personal access tokens found.");
      console.log(
        `  Create one with ${chalk.cyan("bugspark tokens create <name>")}`
      );
      console.log();
      return;
    }

    console.log();
    table(
      ["NAME", "PREFIX", "LAST USED", "EXPIRES", "CREATED"],
      tokens.map((t) => [
        t.name,
        t.tokenPrefix,
        formatDate(t.lastUsedAt),
        t.expiresAt ? new Date(t.expiresAt).toLocaleDateString() : "never",
        new Date(t.createdAt).toLocaleDateString(),
      ])
    );
    console.log();
  } catch (err) {
    error(`Failed to list tokens: ${formatError(err)}`);
    process.exit(1);
  }
}

export async function createTokenCommand(
  name: string,
  options: { expires?: string }
): Promise<void> {
  const config = getConfigOrExit();
  const client = createClient(config);

  const body: { name: string; expiresInDays?: number } = { name };
  if (options.expires) {
    const days = parseInt(options.expires, 10);
    if (isNaN(days) || days < 1 || days > 365) {
      error("--expires must be between 1 and 365 days.");
      process.exit(1);
    }
    body.expiresInDays = days;
  }

  try {
    const res = await client.post<TokenCreateResponse>("/auth/tokens", body);

    console.log();
    success(`Token ${chalk.bold(res.name)} created.`);
    console.log();
    console.log(
      `  ${chalk.yellow("⚠")} Copy it now — it won't be shown again:`
    );
    console.log();
    console.log(`  ${chalk.green(res.token)}`);
    console.log();
  } catch (err) {
    error(`Failed to create token: ${formatError(err)}`);
    process.exit(1);
  }
}

export async function revokeTokenCommand(tokenId: string): Promise<void> {
  const config = getConfigOrExit();
  const client = createClient(config);

  try {
    await client.delete(`/auth/tokens/${tokenId}`);

    console.log();
    success(`Token ${chalk.dim(tokenId)} revoked.`);
    console.log();
  } catch (err) {
    error(`Failed to revoke token: ${formatError(err)}`);
    process.exit(1);
  }
}
