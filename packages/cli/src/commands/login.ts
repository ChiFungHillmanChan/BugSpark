import chalk from "chalk";
import open from "open";
import prompts from "prompts";
import { createClient, createUnauthClient } from "../lib/api-client.js";
import {
  DEFAULT_API_URL,
  DEFAULT_DASHBOARD_URL,
  saveConfig,
} from "../lib/config.js";
import { formatError } from "../lib/errors.js";
import { error, info, success } from "../lib/output.js";

interface CLIAuthResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  token: string;
}

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

  // 2. Choose authentication method
  const { method } = await prompts({
    type: "select",
    name: "method",
    message: "How would you like to authenticate?",
    choices: [
      { title: "Email and password", value: "email" },
      { title: "Personal Access Token", value: "pat" },
    ],
  });
  if (method === undefined) return;

  if (method === "email") {
    await loginWithEmail(apiUrl);
  } else {
    await loginWithPAT(apiUrl);
  }
}

async function loginWithEmail(apiUrl: string): Promise<void> {
  const answers = await prompts([
    {
      type: "text",
      name: "email",
      message: "Email address",
      validate: (v: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? true : "Enter a valid email",
    },
    {
      type: "password",
      name: "password",
      message: "Password",
      validate: (v: string) =>
        v.length >= 8 ? true : "Password must be at least 8 characters",
    },
  ]);
  if (!answers.email || !answers.password) return;

  info("Authenticating...");

  try {
    const client = createUnauthClient(apiUrl);
    const res = await client.post<CLIAuthResponse>("/auth/cli/login", {
      email: answers.email.trim(),
      password: answers.password,
    });

    await saveConfig({ apiUrl, token: res.token });

    console.log();
    success(`Logged in as ${chalk.bold(res.name)} (${res.email})`);
    console.log();
    console.log(`  Token saved to ${chalk.dim("~/.bugspark/config.json")}`);
    console.log();
  } catch (err) {
    error(`Login failed: ${formatError(err)}`);
    process.exit(1);
  }
}

async function loginWithPAT(apiUrl: string): Promise<void> {
  // Ask for Dashboard URL to open token creation page
  const { dashboardUrl } = await prompts({
    type: "text",
    name: "dashboardUrl",
    message: "BugSpark Dashboard URL (to open token page)",
    initial: DEFAULT_DASHBOARD_URL,
  });

  if (dashboardUrl) {
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

    await open(tokensUrl).catch(() => {
      info(
        "Could not open browser automatically. Please open the URL above manually."
      );
    });
  }

  // Prompt for the token
  const { token } = await prompts({
    type: "password",
    name: "token",
    message: "Paste your Personal Access Token (bsk_pat_...)",
    validate: (v: string) =>
      v.startsWith("bsk_pat_") ? true : "Token must start with bsk_pat_",
  });
  if (!token) return;

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
