import chalk from "chalk";
import { getAuthenticatedClientOrExit } from "../lib/auth-guard.js";
import { formatError } from "../lib/errors.js";
import { error } from "../lib/output.js";

interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
}

export async function whoamiCommand(): Promise<void> {
  const { config, client } = await getAuthenticatedClientOrExit();

  try {
    const user = await client.get<UserResponse>("/auth/me");
    console.log();
    console.log(`  ${chalk.bold("Name:")}   ${user.name}`);
    console.log(`  ${chalk.bold("Email:")}  ${user.email}`);
    console.log(`  ${chalk.bold("Role:")}   ${user.role}`);
    console.log(`  ${chalk.bold("Plan:")}   ${user.plan}`);
    console.log(`  ${chalk.bold("API:")}    ${config.apiUrl}`);
    console.log();
  } catch (err) {
    error(formatError(err));
    process.exit(1);
  }
}
