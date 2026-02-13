import { select, input, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import { getAuthenticatedClientOrExit } from "../lib/auth-guard.js";
import { selectProject } from "../lib/project-select.js";
import { validateId } from "../lib/validate.js";
import { success, error, info, table } from "../lib/output.js";
import { formatError } from "../lib/errors.js";
import type { ApiClient } from "../lib/api-client.js";
import type { ProjectResponse } from "../types.js";

const CONFIGURABLE_KEYS: Record<string, { type: "string" | "boolean"; description: string }> = {
  widgetColor: { type: "string", description: "Primary widget color (hex)" },
  showWatermark: { type: "boolean", description: "Show \"Powered by BugSpark\"" },
  enableScreenshot: { type: "boolean", description: "Enable screenshot capture" },
  modalTitle: { type: "string", description: "Custom modal title" },
  buttonText: { type: "string", description: "Floating button label" },
};

function formatSettingValue(value: unknown): string {
  if (value === undefined || value === null) return chalk.dim("(not set)");
  if (typeof value === "boolean") return value ? chalk.green("true") : chalk.red("false");
  return String(value);
}

function parseBoolean(value: string): boolean {
  const truthy = new Set(["true", "yes", "1"]);
  const falsy = new Set(["false", "no", "0"]);
  const lower = value.toLowerCase();
  if (truthy.has(lower)) return true;
  if (falsy.has(lower)) return false;
  throw new Error(`Invalid boolean value: "${value}". Use true/false, yes/no, or 1/0.`);
}

async function resolveProject(
  client: ApiClient,
  projectId?: string,
): Promise<ProjectResponse> {
  if (projectId) {
    validateId(projectId);
    return client.get<ProjectResponse>(`/projects/${projectId}`);
  }
  return selectProject(client);
}

export async function configCommand(): Promise<void> {
  try {
    const { client } = await getAuthenticatedClientOrExit();
    const project = await selectProject(client);
    const settings = project.settings || {};

    info(`Project: ${chalk.bold(project.name)}\n`);

    const rows = Object.entries(CONFIGURABLE_KEYS).map(([key, meta]) => [
      key,
      meta.description,
      formatSettingValue(settings[key]),
    ]);
    table(["Key", "Description", "Value"], rows);

    console.log();

    const selectedKey = await select({
      message: "Which setting do you want to change?",
      choices: Object.entries(CONFIGURABLE_KEYS).map(([key, meta]) => ({
        name: `${key} — ${meta.description}`,
        value: key,
      })),
    });

    const meta = CONFIGURABLE_KEYS[selectedKey];
    let newValue: unknown;

    if (meta.type === "boolean") {
      newValue = await confirm({
        message: `Enable ${selectedKey}?`,
        default: settings[selectedKey] === true,
      });
    } else {
      const currentStr = settings[selectedKey] != null ? String(settings[selectedKey]) : "";
      newValue = await input({
        message: `New value for ${selectedKey}:`,
        default: currentStr,
      });
      if (newValue === "") newValue = null;
    }

    const merged = { ...settings, [selectedKey]: newValue };
    await client.patch(`/projects/${project.id}`, { settings: merged });
    success(`Updated ${chalk.bold(selectedKey)} to ${formatSettingValue(newValue)}`);
  } catch (err) {
    error(formatError(err));
    process.exit(1);
  }
}

export async function configGetCommand(
  key: string,
  options: { project?: string },
): Promise<void> {
  try {
    const { client } = await getAuthenticatedClientOrExit();
    const project = await resolveProject(client, options.project);
    const settings = project.settings || {};

    if (!(key in CONFIGURABLE_KEYS)) {
      error(`Unknown setting: "${key}". Valid keys: ${Object.keys(CONFIGURABLE_KEYS).join(", ")}`);
      process.exit(1);
    }

    console.log(formatSettingValue(settings[key]));
  } catch (err) {
    error(formatError(err));
    process.exit(1);
  }
}

export async function configSetCommand(
  key: string,
  value: string,
  options: { project?: string },
): Promise<void> {
  try {
    const { client } = await getAuthenticatedClientOrExit();
    const project = await resolveProject(client, options.project);

    if (!(key in CONFIGURABLE_KEYS)) {
      error(`Unknown setting: "${key}". Valid keys: ${Object.keys(CONFIGURABLE_KEYS).join(", ")}`);
      process.exit(1);
    }

    const meta = CONFIGURABLE_KEYS[key];
    let parsed: unknown = value;
    if (meta.type === "boolean") {
      parsed = parseBoolean(value);
    }

    const settings = project.settings || {};
    const merged = { ...settings, [key]: parsed };
    await client.patch(`/projects/${project.id}`, { settings: merged });
    success(`Updated ${chalk.bold(key)} to ${formatSettingValue(parsed)}`);
  } catch (err) {
    error(formatError(err));
    process.exit(1);
  }
}
