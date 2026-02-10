import { deleteConfig, loadConfig } from "../lib/config.js";
import { info, success } from "../lib/output.js";

export async function logoutCommand(): Promise<void> {
  const config = loadConfig();
  if (!config) {
    info("Not logged in.");
    return;
  }

  await deleteConfig();
  success("Logged out. Token removed from ~/.bugspark/config.json");
}
