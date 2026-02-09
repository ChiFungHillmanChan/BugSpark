import chalk from "chalk";
import prompts from "prompts";
import { createClient } from "../lib/api-client.js";
import { getConfigOrExit } from "../lib/config.js";
import { formatError } from "../lib/errors.js";
import { error, info, success } from "../lib/output.js";

interface ProjectResponse {
  id: string;
  name: string;
  domain: string;
  apiKey: string;
  isActive: boolean;
  createdAt: string;
}

export async function initCommand(): Promise<void> {
  const config = getConfigOrExit();
  const client = createClient(config);

  console.log();
  console.log(chalk.bold("  🐛⚡ BugSpark Project Setup"));
  console.log();

  try {
    // Fetch existing projects
    const projects = await client.get<ProjectResponse[]>("/projects");

    let project: ProjectResponse;

    if (projects.length > 0) {
      const choices = [
        ...projects.map((p) => ({ title: `${p.name} (${p.apiKey})`, value: p.id })),
        { title: chalk.green("+ Create new project"), value: "__new__" },
      ];

      const { selected } = await prompts({
        type: "select",
        name: "selected",
        message: "Select a project or create a new one",
        choices,
      });
      if (!selected) return;

      if (selected === "__new__") {
        project = await createNewProject(client, config.apiUrl);
      } else {
        project = projects.find((p) => p.id === selected)!;
        info(`Using existing project: ${chalk.bold(project.name)}`);
        info(`API key (masked): ${project.apiKey}`);
        console.log();
        console.log(
          chalk.dim("  Note: For the full API key, rotate it with:")
        );
        console.log(chalk.dim(`  bugspark projects list`));
        console.log();
      }
    } else {
      info("No projects found. Let's create one!");
      project = await createNewProject(client, config.apiUrl);
    }

    // Detect masked API keys from existing projects
    const isMaskedKey = project.apiKey.includes("...");
    const keyForSnippet = isMaskedKey ? "YOUR_API_KEY_HERE" : project.apiKey;

    // Show installation instructions
    console.log(chalk.bold("  📋 Installation Instructions"));
    console.log();

    if (isMaskedKey) {
      console.log(
        chalk.yellow(
          "  ⚠  The API key below is a placeholder — existing keys are masked for security."
        )
      );
      console.log(
        chalk.yellow(
          "     Replace YOUR_API_KEY_HERE with the real key you saved when the project was created."
        )
      );
      console.log();
    }

    console.log(chalk.bold("  HTML / Django / WordPress / PHP:"));
    console.log();
    console.log(
      chalk.cyan(`  <script
    src="https://unpkg.com/@bugspark/widget@0.1.0/dist/bugspark.iife.js"
    data-api-key="${keyForSnippet}"
    data-endpoint="${config.apiUrl}"
  ></script>`)
    );
    console.log();
    console.log(chalk.bold("  npm (React / Next.js / Vue):"));
    console.log();
    console.log(chalk.cyan(`  npm install @bugspark/widget`));
    console.log();
    console.log(
      chalk.cyan(`  import BugSpark from '@bugspark/widget';
  BugSpark.init({
    apiKey: '${keyForSnippet}',
    endpoint: '${config.apiUrl}',
  });`)
    );
    console.log();
  } catch (err) {
    error(formatError(err));
    process.exit(1);
  }
}

async function createNewProject(
  client: ReturnType<typeof createClient>,
  apiUrl: string
): Promise<ProjectResponse> {
  const { name } = await prompts({
    type: "text",
    name: "name",
    message: "Project name",
    validate: (v: string) => (v.length > 0 ? true : "Name is required"),
  });
  if (!name) process.exit(0);

  const { domain } = await prompts({
    type: "text",
    name: "domain",
    message: "Domain (optional, e.g. example.com)",
    initial: "",
  });

  const body: Record<string, string> = { name };
  if (domain) body.domain = domain;

  const project = await client.post<ProjectResponse>("/projects", body);

  console.log();
  success(`Project "${project.name}" created!`);
  console.log();
  console.log(`  ${chalk.bold("API Key:")} ${chalk.yellow(project.apiKey)}`);
  console.log(chalk.dim("  ⚠  Save this API key — it won't be shown again."));
  console.log();

  return project;
}
