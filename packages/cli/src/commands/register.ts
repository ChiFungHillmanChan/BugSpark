import chalk from "chalk";
import { input, password } from "@inquirer/prompts";
import { createUnauthClient } from "../lib/api-client.js";
import { DEFAULT_API_URL, DEFAULT_DASHBOARD_URL, saveConfig } from "../lib/config.js";
import { formatError } from "../lib/errors.js";
import { error, info, success } from "../lib/output.js";
import { validateApiUrl } from "../lib/validate.js";
import type { CLIAuthResponse } from "../types.js";

export async function registerCommand(): Promise<void> {
  console.log();
  console.log(chalk.bold("  🐛⚡ BugSpark Register"));
  console.log();

  try {
    const apiUrl = await input({
      message: "BugSpark API URL",
      default: DEFAULT_API_URL,
    });

    validateApiUrl(apiUrl);

    const name = await input({
      message: "Your name",
      validate: (v: string) => (v.trim().length > 0 ? true : "Name is required"),
    });

    const email = await input({
      message: "Email address",
      validate: (v: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? true : "Enter a valid email",
    });

    const pw = await password({
      message: "Password (min 8 characters)",
      validate: (v: string) =>
        v.length >= 8 ? true : "Password must be at least 8 characters",
    });

    const confirmPassword = await password({
      message: "Confirm password",
    });

    if (pw !== confirmPassword) {
      error("Passwords do not match.");
      process.exit(1);
    }

    info("Creating account...");

    const client = createUnauthClient(apiUrl);
    const res = await client.post<CLIAuthResponse>("/auth/cli/register", {
      name: name.trim(),
      email: email.trim(),
      password: pw,
    });

    await saveConfig({
      apiUrl,
      dashboardUrl: DEFAULT_DASHBOARD_URL,
      token: res.token,
    });

    console.log();
    success(
      `Account created! Logged in as ${chalk.bold(res.name)} (${res.email}) — ${res.plan} plan`
    );
    console.log();
    console.log(`  Token saved to ${chalk.dim("~/.bugspark/config.json")}`);
    console.log(
      `  Run ${chalk.cyan("bugspark init")} to set up your first project.`
    );
    console.log();
  } catch (err) {
    if ((err as Error).name === "ExitPromptError") return;
    error(`Registration failed: ${formatError(err)}`);
    process.exit(1);
  }
}
