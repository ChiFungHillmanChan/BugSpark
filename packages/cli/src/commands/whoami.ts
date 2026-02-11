import chalk from "chalk";
import { getAuthenticatedClientOrExit } from "../lib/auth-guard.js";

export async function whoamiCommand(): Promise<void> {
  const { config, user } = await getAuthenticatedClientOrExit();

  console.log();
  console.log(`  ${chalk.bold("Name:")}   ${user.name}`);
  console.log(`  ${chalk.bold("Email:")}  ${user.email}`);
  console.log(`  ${chalk.bold("Role:")}   ${user.role}`);
  console.log(`  ${chalk.bold("Plan:")}   ${user.plan}`);
  console.log(`  ${chalk.bold("API:")}    ${config.apiUrl}`);
  console.log();
}
