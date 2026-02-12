import chalk from "chalk";
import ora from "ora";
import open from "open";
import { confirm } from "@inquirer/prompts";
import { getAuthenticatedClientOrExit } from "../lib/auth-guard.js";
import { DEFAULT_DASHBOARD_URL } from "../lib/config.js";
import { formatError } from "../lib/errors.js";
import { error, success, warn } from "../lib/output.js";

interface SubscriptionInfo {
  plan: string;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  billingInterval: string | null;
  amount: number | null;
}

function formatStatus(status: string | null): string {
  if (!status) return chalk.dim("none");

  const colors: Record<string, (s: string) => string> = {
    active: chalk.green,
    canceled: chalk.yellow,
    past_due: chalk.red,
    incomplete: chalk.yellow,
  };

  return (colors[status] ?? chalk.white)(status);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";

  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function billingStatusCommand(): Promise<void> {
  const { config, client } = await getAuthenticatedClientOrExit();

  const spinner = ora("Fetching subscription info...").start();
  try {
    const sub = await client.get<SubscriptionInfo>("/billing/subscription");
    spinner.stop();

    console.log(chalk.bold("\n  Subscription Status\n"));
    console.log(`  Plan:     ${chalk.cyan(sub.plan)}`);
    console.log(`  Status:   ${formatStatus(sub.status)}`);

    if (sub.cancelAtPeriodEnd) {
      console.log(
        chalk.yellow(`\n  Cancels on: ${formatDate(sub.currentPeriodEnd)}`),
      );
    } else if (sub.currentPeriodEnd) {
      console.log(`  Renews:   ${formatDate(sub.currentPeriodEnd)}`);
      if (sub.amount) {
        console.log(
          `  Amount:   HK$${sub.amount / 100}/${sub.billingInterval}`,
        );
      }
    }

    console.log();
  } catch (err) {
    spinner.fail("Failed to fetch subscription info");
    error(formatError(err));
    process.exit(1);
  }
}

export async function billingUpgradeCommand(): Promise<void> {
  const { config } = await getAuthenticatedClientOrExit();

  const dashboardUrl = config.dashboardUrl ?? DEFAULT_DASHBOARD_URL;
  const upgradeUrl = `${dashboardUrl}/settings/billing`;

  console.log(chalk.bold("\n  Upgrade Your Plan\n"));
  console.log("  Payment processing requires a browser.");
  console.log(`  Opening: ${chalk.cyan(upgradeUrl)}\n`);

  await open(upgradeUrl);

  console.log(
    chalk.dim("  After upgrading, run: bugspark billing status\n"),
  );
}

export async function billingCancelCommand(): Promise<void> {
  const { client } = await getAuthenticatedClientOrExit();

  const spinner = ora("Fetching subscription info...").start();
  let sub: SubscriptionInfo;
  try {
    sub = await client.get<SubscriptionInfo>("/billing/subscription");
    spinner.stop();
  } catch (err) {
    spinner.fail("Failed to fetch subscription info");
    error(formatError(err));
    process.exit(1);
  }

  if (sub.plan === "free") {
    warn("You are on the Free plan. Nothing to cancel.");
    console.log();
    return;
  }

  if (sub.cancelAtPeriodEnd) {
    warn("Your subscription is already scheduled for cancellation.");
    console.log();
    return;
  }

  const confirmed = await confirm({
    message: `Cancel subscription? You'll keep ${sub.plan} access until ${formatDate(sub.currentPeriodEnd)}.`,
    default: false,
  });

  if (!confirmed) return;

  const cancelSpinner = ora("Canceling subscription...").start();
  try {
    await client.post<{ message: string }>("/billing/cancel-subscription");
    cancelSpinner.succeed("Subscription canceled");
    console.log(
      chalk.dim(`  Access continues until ${formatDate(sub.currentPeriodEnd)}\n`),
    );
  } catch (err) {
    cancelSpinner.fail("Failed to cancel subscription");
    error(formatError(err));
    process.exit(1);
  }
}
