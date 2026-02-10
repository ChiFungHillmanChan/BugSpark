import chalk from "chalk";
import open from "open";
import prompts from "prompts";
import { createClient } from "../lib/api-client.js";
import { DEFAULT_API_URL, DEFAULT_DASHBOARD_URL, saveConfig } from "../lib/config.js";
import { formatError } from "../lib/errors.js";
import { error, info, success } from "../lib/output.js";

interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function loginCommand(): Promise<void> {
  console.log();
  console.log(chalk.bold("  🐛⚡ BugSpark Login"));
  console.log();

  // 1. Ask for API URL
  const { apiUrl } = await prompts({
    type: "text",
    name: "apiUrl",
    message: "BugSpark API URL",
    initial: DEFAULT_API_URL,
  });
  if (!apiUrl) return;

  // 2. Ask for Dashboard URL (separate from API — they're on different hosts)
  const { dashboardUrl } = await prompts({
    type: "text",
    name: "dashboardUrl",
    message: "BugSpark Dashboard URL",
    initial: DEFAULT_DASHBOARD_URL,
  });
  if (!dashboardUrl) return;

  // 3. Open the dashboard settings/tokens page in browser
  const tokensUrl = `${dashboardUrl.replace(/\/+$/, "")}/settings/tokens`;

  console.log();
  info("Opening browser to create a Personal Access Token...");
  console.log();
  console.log(`  ${chalk.cyan(tokensUrl)}`);
  console.log();
  console.log(
    `  Create a token under ${chalk.bold("Settings → Personal Access Tokens")}`
  );
  console.log();

  // Auto-open in browser
  await open(tokensUrl).catch(() => {
    info("Could not open browser automatically. Please open the URL above manually.");
  });

  // 4. Prompt for the token
  const { token } = await prompts({
    type: "password",
    name: "token",
    message: "Paste your Personal Access Token (bsk_pat_...)",
    validate: (v: string) =>
      v.startsWith("bsk_pat_") ? true : "Token must start with bsk_pat_",
  });
  if (!token) return;

  // 5. Validate by calling /auth/me
  info("Verifying token...");
  const config = { apiUrl, dashboardUrl, token };

  try {
    const client = createClient(config);
    const user = await client.get<UserResponse>("/auth/me");

    await saveConfig(config);

    console.log();
    success(`Logged in as ${chalk.bold(user.name)} (${user.email})`);
    console.log();
    console.log(`  Token saved to ${chalk.dim("~/.bugspark/config.json")}`);
    console.log();
  } catch (err) {
    error(`Failed to verify token: ${formatError(err)}`);
    process.exit(1);
  }
}
