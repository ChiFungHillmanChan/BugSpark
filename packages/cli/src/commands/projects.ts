import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import { getAuthenticatedClientOrExit } from "../lib/auth-guard.js";
import { formatError } from "../lib/errors.js";
import { error, success, table } from "../lib/output.js";
import { getWidgetVersion } from "../lib/widget-version.js";
import { validateId } from "../lib/validate.js";
import type { ProjectResponse } from "../types.js";

export async function listProjectsCommand(): Promise<void> {
  const { client } = await getAuthenticatedClientOrExit();

  try {
    const projects = await client.get<ProjectResponse[]>("/projects");

    if (projects.length === 0) {
      console.log();
      console.log("  No projects yet. Create one with:");
      console.log(chalk.cyan("  bugspark projects create <name>"));
      console.log();
      return;
    }

    console.log();
    table(
      ["Name", "Domain", "API Key", "Created"],
      projects.map((p) => [
        p.name,
        p.domain || "-",
        p.apiKey,
        new Date(p.createdAt).toLocaleDateString(),
      ])
    );
    console.log();
  } catch (err) {
    error(formatError(err));
    process.exit(1);
  }
}

export async function createProjectCommand(
  name: string,
  options: { domain?: string }
): Promise<void> {
  const { config, client } = await getAuthenticatedClientOrExit();

  try {
    const body: Record<string, string> = { name };
    if (options.domain) body.domain = options.domain;

    const project = await client.post<ProjectResponse>("/projects", body);

    console.log();
    success(`Project "${project.name}" created!`);
    console.log();
    console.log(`  ${chalk.bold("Project ID:")}  ${project.id}`);
    console.log(`  ${chalk.bold("API Key:")}     ${chalk.yellow(project.apiKey)}`);
    console.log();
    console.log(chalk.dim("  Save this API key — it won't be shown again."));
    console.log();
    const widgetVersion = getWidgetVersion();

    console.log(chalk.bold("  Install the widget:"));
    console.log();
    console.log(
      chalk.cyan(`  <script
    src="https://unpkg.com/@bugspark/widget@${widgetVersion}/dist/bugspark.iife.js"
    data-api-key="${project.apiKey}"
    data-endpoint="${config.apiUrl}"
  ></script>`)
    );
    console.log();
  } catch (err) {
    error(formatError(err));
    process.exit(1);
  }
}

export async function deleteProjectCommand(
  projectId: string,
  options: { force?: boolean }
): Promise<void> {
  const safeId = validateId(projectId);
  const { client } = await getAuthenticatedClientOrExit();

  if (!options.force) {
    const confirmed = await confirm({
      message: `Are you sure you want to delete project ${safeId}? This cannot be undone.`,
      default: false,
    });

    if (!confirmed) {
      console.log("Aborted.");
      return;
    }
  }

  try {
    await client.delete(`/projects/${safeId}`);
    success(`Project ${safeId} deleted.`);
  } catch (err) {
    error(formatError(err));
    process.exit(1);
  }
}
