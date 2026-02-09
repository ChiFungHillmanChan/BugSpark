import chalk from "chalk";
import { createClient } from "../lib/api-client.js";
import { getConfigOrExit } from "../lib/config.js";
import { error } from "../lib/output.js";

interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
}

export async function whoamiCommand(): Promise<void> {
  const config = getConfigOrExit();
  const client = createClient(config);

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
    error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
