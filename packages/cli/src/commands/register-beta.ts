import chalk from "chalk";
import prompts from "prompts";
import { createUnauthClient } from "../lib/api-client.js";
import { DEFAULT_API_URL } from "../lib/config.js";
import { formatError } from "../lib/errors.js";
import { error, info, success } from "../lib/output.js";

interface BetaRegisterResponse {
  message: string;
  betaStatus: string;
}

export async function registerBetaCommand(): Promise<void> {
  console.log();
  console.log(chalk.bold("  🐛⚡ BugSpark Beta Registration"));
  console.log();
  console.log(
    chalk.dim(
      "  Apply for beta testing access. Your account will be placed on a\n" +
      "  waiting list until approved by an admin."
    )
  );
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
    {
      type: "text",
      name: "reason",
      message: "Why do you want to join the beta? (optional)",
    },
  ]);

  if (!answers.apiUrl || !answers.name || !answers.email || !answers.password) return;

  if (answers.password !== answers.confirmPassword) {
    error("Passwords do not match.");
    process.exit(1);
  }

  info("Submitting beta application...");

  try {
    const client = createUnauthClient(answers.apiUrl);
    await client.post<BetaRegisterResponse>("/auth/cli/register/beta", {
      name: answers.name.trim(),
      email: answers.email.trim(),
      password: answers.password,
      reason: answers.reason?.trim() || "",
    });

    console.log();
    success("Beta application submitted!");
    console.log();
    console.log(
      `  ${chalk.yellow("⏳")} You have been added to the ${chalk.bold("waiting list")}.`
    );
    console.log(
      `  An admin will review your application and approve your account.`
    );
    console.log();
    console.log(
      `  Once approved, you can log in with: ${chalk.cyan("bugspark login")}`
    );
    console.log();
  } catch (err) {
    error(`Beta registration failed: ${formatError(err)}`);
    process.exit(1);
  }
}
