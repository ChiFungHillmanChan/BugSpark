import chalk from "chalk";
import { input, password } from "@inquirer/prompts";
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

  try {
    const apiUrl = await input({
      message: "BugSpark API URL",
      default: DEFAULT_API_URL,
    });

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

    const reason = await input({
      message: "Why do you want to join the beta? (optional)",
      default: "",
    });

    if (pw !== confirmPassword) {
      error("Passwords do not match.");
      process.exit(1);
    }

    info("Submitting beta application...");

    const client = createUnauthClient(apiUrl);
    await client.post<BetaRegisterResponse>("/auth/cli/register/beta", {
      name: name.trim(),
      email: email.trim(),
      password: pw,
      reason: reason?.trim() || "",
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
    if ((err as Error).name === "ExitPromptError") return;
    error(`Beta registration failed: ${formatError(err)}`);
    process.exit(1);
  }
}
