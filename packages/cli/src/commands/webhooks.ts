import chalk from "chalk";
import { getAuthenticatedClientOrExit } from "../lib/auth-guard.js";
import { formatError } from "../lib/errors.js";
import { error, success, table } from "../lib/output.js";
import { validateId } from "../lib/validate.js";
import type { WebhookResponse } from "../types.js";

export async function listWebhooksCommand(options: {
  project: string;
}): Promise<void> {
  const safeProjectId = validateId(options.project);
  const { client } = await getAuthenticatedClientOrExit();

  try {
    const webhooks = await client.get<WebhookResponse[]>(
      `/webhooks?project_id=${safeProjectId}`,
    );

    if (webhooks.length === 0) {
      console.log();
      console.log("  No webhooks found for this project.");
      console.log(
        `  Create one with ${chalk.cyan('bugspark webhooks create <url> -p <project-id>')}`,
      );
      console.log();
      return;
    }

    console.log();
    table(
      ["URL", "EVENTS", "ACTIVE", "CREATED"],
      webhooks.map((w) => [
        w.url.length > 40 ? w.url.slice(0, 37) + "..." : w.url,
        w.events.join(", "),
        w.isActive ? chalk.green("yes") : chalk.dim("no"),
        new Date(w.createdAt).toLocaleDateString(),
      ]),
    );
    console.log();
  } catch (err) {
    error(`Failed to list webhooks: ${formatError(err)}`);
    process.exit(1);
  }
}

export async function createWebhookCommand(
  url: string,
  options: { project: string; events?: string },
): Promise<void> {
  const safeProjectId = validateId(options.project);
  const { client } = await getAuthenticatedClientOrExit();

  const events = options.events
    ? options.events.split(",").map((e) => e.trim())
    : ["report.created", "report.updated"];

  try {
    const webhook = await client.post<WebhookResponse>(
      `/webhooks?project_id=${safeProjectId}`,
      { url, events },
    );

    console.log();
    success(`Webhook created.`);
    console.log();
    console.log(`  ${chalk.bold("ID:")}     ${webhook.id}`);
    console.log(`  ${chalk.bold("URL:")}    ${webhook.url}`);
    console.log(`  ${chalk.bold("Events:")} ${webhook.events.join(", ")}`);
    console.log();
  } catch (err) {
    error(`Failed to create webhook: ${formatError(err)}`);
    process.exit(1);
  }
}

export async function updateWebhookCommand(
  webhookId: string,
  options: { url?: string; events?: string; active?: string },
): Promise<void> {
  const safeId = validateId(webhookId);
  const { client } = await getAuthenticatedClientOrExit();

  const body: Record<string, unknown> = {};
  if (options.url) body.url = options.url;
  if (options.events) body.events = options.events.split(",").map((e) => e.trim());
  if (options.active !== undefined) {
    if (options.active !== "true" && options.active !== "false") {
      error('--active must be "true" or "false".');
      process.exit(1);
    }
    body.isActive = options.active === "true";
  }

  if (Object.keys(body).length === 0) {
    error("Provide at least one option to update (--url, --events, or --active).");
    process.exit(1);
  }

  try {
    const webhook = await client.patch<WebhookResponse>(
      `/webhooks/${safeId}`,
      body,
    );

    console.log();
    success(`Webhook ${chalk.dim(safeId)} updated.`);
    console.log();
    console.log(`  ${chalk.bold("URL:")}    ${webhook.url}`);
    console.log(`  ${chalk.bold("Active:")} ${webhook.isActive ? chalk.green("yes") : chalk.dim("no")}`);
    console.log();
  } catch (err) {
    error(`Failed to update webhook: ${formatError(err)}`);
    process.exit(1);
  }
}

export async function deleteWebhookCommand(webhookId: string): Promise<void> {
  const safeId = validateId(webhookId);
  const { client } = await getAuthenticatedClientOrExit();

  try {
    await client.delete(`/webhooks/${safeId}`);

    console.log();
    success(`Webhook ${chalk.dim(safeId)} deleted.`);
    console.log();
  } catch (err) {
    error(`Failed to delete webhook: ${formatError(err)}`);
    process.exit(1);
  }
}
