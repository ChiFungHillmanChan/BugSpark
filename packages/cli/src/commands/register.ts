import chalk from "chalk";
import prompts from "prompts";
import { createUnauthClient } from "../lib/api-client.js";
import { DEFAULT_API_URL, saveConfig } from "../lib/config.js";
import { formatError } from "../lib/errors.js";
import { error, info, success } from "../lib/output.js";

interface CLIAuthResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  token: string;
}

export async function registerCommand(): Promise<void> {
  console.log();
  console.log(chalk.bold("  🐛⚡ BugSpark Register"));
  console.log();

  const answers = await prompts([
    {
      type: "text",
      name: "apiUrl",
      message: "BugSpark API URL",
      initial: DEFAULT_API_URL,
    },
    {
      type: "text",
      name: "name",
      message: "Your name",
      validate: (v: string) => (v.trim().length > 0 ? true : "Name is required"),
    },
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
      message: "Password (min 8 characters)",
      validate: (v: string) =>
        v.length >= 8 ? true : "Password must be at least 8 characters",
    },
    {
      type: "password",
      name: "confirmPassword",
      message: "Confirm password",
    },
  ]);

  if (!answers.apiUrl || !answers.name || !answers.email || !answers.password) return;

  if (answers.password !== answers.confirmPassword) {
    error("Passwords do not match.");
    process.exit(1);
  }

  info("Creating account...");

  try {
    const client = createUnauthClient(answers.apiUrl);
    const res = await client.post<CLIAuthResponse>("/auth/cli/register", {
      name: answers.name.trim(),
      email: answers.email.trim(),
      password: answers.password,
    });

    await saveConfig({
      apiUrl: answers.apiUrl,
      token: res.token,
    });

    console.log();
    success(
      `Account created! Logged in as ${chalk.bold(res.name)} (${res.email})`
    );
    console.log();
    console.log(`  Token saved to ${chalk.dim("~/.bugspark/config.json")}`);
    console.log(
      `  Run ${chalk.cyan("bugspark init")} to set up your first project.`
    );
    console.log();
  } catch (err) {
    error(`Registration failed: ${formatError(err)}`);
    process.exit(1);
  }
}
