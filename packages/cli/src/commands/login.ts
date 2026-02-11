import chalk from "chalk";
import open from "open";
import { select, input, password } from "@inquirer/prompts";
import { ApiError, createClient, createUnauthClient } from "../lib/api-client.js";
import {
  DEFAULT_API_URL,
  DEFAULT_DASHBOARD_URL,
  saveConfig,
} from "../lib/config.js";
import { formatError } from "../lib/errors.js";
import { error, info, success, warn } from "../lib/output.js";
import { validateApiUrl } from "../lib/validate.js";
import type { CLIAuthResponse, UserResponse } from "../types.js";

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_in: number;
  interval: number;
}

interface DeviceTokenResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    plan: string;
  };
}

export async function loginCommand(options?: {
  method?: string;
}): Promise<void> {
  console.log();
  console.log(chalk.bold("  🐛⚡ BugSpark Login"));
  console.log();

  try {
    // 1. Ask for API URL
    const apiUrl = await input({
      message: "BugSpark API URL",
      default: DEFAULT_API_URL,
    });

    validateApiUrl(apiUrl);

    // 2. Choose authentication method (default: browser / device flow)
    const method = options?.method ?? await pickMethod();

    if (method === "browser") {
      await loginWithDeviceFlow(apiUrl);
    } else if (method === "email") {
      await loginWithEmail(apiUrl);
    } else {
      await loginWithPAT(apiUrl);
    }
  } catch (err) {
    if ((err as Error).name === "ExitPromptError") return;
    error(formatError(err));
    process.exit(1);
  }
}

async function pickMethod(): Promise<string> {
  return select({
    message: "How would you like to authenticate?",
    choices: [
      {
        name: "Login with browser (recommended)",
        description: "Opens your browser to authorize this CLI",
        value: "browser",
      },
      { name: "Email and password", value: "email" },
      { name: "Personal Access Token", value: "pat" },
    ],
  });
}

// ── Device flow (like `gh auth login`) ─────────────────────────────────

async function loginWithDeviceFlow(apiUrl: string): Promise<void> {
  info("Requesting device authorization...");

  const client = createUnauthClient(apiUrl);

  let deviceResp: DeviceCodeResponse;
  try {
    deviceResp = await client.post<DeviceCodeResponse>("/auth/device/code", {});
  } catch (err) {
    error(`Failed to start device flow: ${formatError(err)}`);
    process.exit(1);
  }

  console.log();
  console.log(
    `  ${chalk.bold("Your one-time code:")}  ${chalk.cyan.bold(deviceResp.user_code)}`
  );
  console.log();
  console.log(
    `  ${chalk.dim("Opening:")} ${chalk.underline(deviceResp.verification_url)}`
  );
  console.log();

  // Open the browser
  await open(deviceResp.verification_url).catch(() => {
    info(
      "Could not open browser automatically. Please open the URL above manually."
    );
  });

  info("Waiting for you to approve in the browser...");
  console.log(
    chalk.dim("  Press Ctrl+C to cancel")
  );

  // Poll for the token
  const intervalMs = (deviceResp.interval || 5) * 1000;
  const deadline = Date.now() + deviceResp.expires_in * 1000;

  while (Date.now() < deadline) {
    await sleep(intervalMs);

    try {
      const tokenResp = await client.post<DeviceTokenResponse>(
        "/auth/device/token",
        { device_code: deviceResp.device_code }
      );

      // Success!
      await saveConfig({ apiUrl, dashboardUrl: DEFAULT_DASHBOARD_URL, token: tokenResp.access_token });

      console.log();
      success(
        `Logged in as ${chalk.bold(tokenResp.user.name)} (${tokenResp.user.email}) — ${tokenResp.user.plan} plan`
      );
      console.log();
      console.log(`  Token saved to ${chalk.dim("~/.bugspark/config.json")}`);
      console.log();
      return;
    } catch (err: unknown) {
      // If status 401, it means "authorization_pending" — keep polling
      if (
        err &&
        typeof err === "object" &&
        "status" in err &&
        (err as { status: number }).status === 401
      ) {
        continue;
      }

      // Any other error means failure
      error(`Device login failed: ${formatError(err)}`);
      process.exit(1);
    }
  }

  error("Device code expired. Please try again.");
  process.exit(1);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Email / password flow ──────────────────────────────────────────────

async function loginWithEmail(apiUrl: string): Promise<void> {
  const email = await input({
    message: "Email address",
    validate: (v: string) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? true : "Enter a valid email",
  });

  const pw = await password({
    message: "Password",
    validate: (v: string) =>
      v.length >= 8 ? true : "Password must be at least 8 characters",
  });

  info("Authenticating...");

  try {
    const client = createUnauthClient(apiUrl);
    const res = await client.post<CLIAuthResponse>("/auth/cli/login", {
      email: email.trim(),
      password: pw,
    });

    await saveConfig({ apiUrl, dashboardUrl: DEFAULT_DASHBOARD_URL, token: res.token });

    console.log();
    success(`Logged in as ${chalk.bold(res.name)} (${res.email}) — ${res.plan} plan`);
    console.log();
    console.log(`  Token saved to ${chalk.dim("~/.bugspark/config.json")}`);
    console.log();
  } catch (err) {
    if (err instanceof ApiError && err.code === "beta.waiting_list") {
      console.log();
      warn("Your account is on the beta testing waiting list.");
      console.log("  Please wait for admin approval before logging in.");
      console.log();
      process.exit(1);
    }
    if (err instanceof ApiError && err.code === "beta.rejected") {
      console.log();
      error("Your beta testing application has been rejected.");
      console.log();
      process.exit(1);
    }
    error(`Login failed: ${formatError(err)}`);
    process.exit(1);
  }
}

// ── PAT flow ───────────────────────────────────────────────────────────

async function loginWithPAT(apiUrl: string): Promise<void> {
  // Ask for Dashboard URL to open token creation page
  const dashboardUrl = await input({
    message: "BugSpark Dashboard URL (to open token page)",
    default: DEFAULT_DASHBOARD_URL,
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
  const token = await password({
    message: "Paste your Personal Access Token (bsk_pat_...)",
    validate: (v: string) =>
      v.startsWith("bsk_pat_") ? true : "Token must start with bsk_pat_",
  });

  info("Verifying token...");

  const config = { apiUrl, dashboardUrl, token };

  try {
    const client = createClient(config);
    const user = await client.get<UserResponse>("/auth/me");

    await saveConfig(config);

    console.log();
    success(`Logged in as ${chalk.bold(user.name)} (${user.email}) — ${user.plan} plan`);
    console.log();
    console.log(`  Token saved to ${chalk.dim("~/.bugspark/config.json")}`);
    console.log();
  } catch (err) {
    error(`Failed to verify token: ${formatError(err)}`);
    process.exit(1);
  }
}
