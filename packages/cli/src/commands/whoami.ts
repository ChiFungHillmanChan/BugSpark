import chalk from "chalk";
import { getAuthenticatedClientOrExit } from "../lib/auth-guard.js";
import { createClient } from "../lib/api-client.js";
import type { UserUsage } from "../types/index.js";

function formatQuotaStatus(current: number, limit: number | null): string {
  if (limit === null) {
    return chalk.green(`${current}/∞`);
  }

  if (current >= limit) {
    return chalk.red(`${current}/${limit}`);
  }

  const percentUsed = Math.round((current / limit) * 100);
  if (percentUsed >= 80) {
    return chalk.yellow(`${current}/${limit}`);
  }

  return chalk.green(`${current}/${limit}`);
}

export async function whoamiCommand(): Promise<void> {
  const { config, user } = await getAuthenticatedClientOrExit();
  const client = createClient(config);

  console.log();
  console.log(`  ${chalk.bold("Name:")}   ${user.name}`);
  console.log(`  ${chalk.bold("Email:")}  ${user.email}`);
  console.log(`  ${chalk.bold("Role:")}   ${user.role}`);
  console.log(`  ${chalk.bold("Plan:")}   ${chalk.cyan(user.plan)}`);
  console.log(`  ${chalk.bold("API:")}    ${config.apiUrl}`);

  // Fetch and display usage (optional, don't fail if unavailable)
  try {
    const usage = await client.get<UserUsage>("/auth/usage");

    console.log();
    console.log(`  ${chalk.bold("Quota Usage:")}`);
    console.log(
      `    Projects: ${formatQuotaStatus(usage.projects.current, usage.projects.limit)}`
    );
    console.log(
      `    Reports this month: ${formatQuotaStatus(usage.reportsThisMonth.current, usage.reportsThisMonth.limit)}`
    );
  } catch {
    // Quota fetch is optional - don't fail if it's unavailable
  }

  console.log();
}
