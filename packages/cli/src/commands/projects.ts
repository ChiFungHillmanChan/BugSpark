import chalk from "chalk";
import { createClient } from "../lib/api-client.js";
import { getConfigOrExit } from "../lib/config.js";
import { formatError } from "../lib/errors.js";
import { error, success, table } from "../lib/output.js";

interface ProjectResponse {
  id: string;
  name: string;
  domain: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
}

export async function listProjectsCommand(): Promise<void> {
  const config = getConfigOrExit();
  const client = createClient(config);

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
  const config = getConfigOrExit();
  const client = createClient(config);

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
    console.log(chalk.dim("  ⚠  Save this API key — it won't be shown again."));
    console.log();
    console.log(chalk.bold("  Install the widget:"));
    console.log();
    console.log(
      chalk.cyan(`  <script
    src="https://unpkg.com/@bugspark/widget@0.1.0/dist/bugspark.iife.js"
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

export async function deleteProjectCommand(projectId: string): Promise<void> {
  const config = getConfigOrExit();
  const client = createClient(config);

  try {
    await client.delete(`/projects/${projectId}`);
    success(`Project ${projectId} deleted.`);
  } catch (err) {
    error(formatError(err));
    process.exit(1);
  }
}
