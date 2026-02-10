import { Command } from "commander";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { registerCommand } from "./commands/register.js";
import { whoamiCommand } from "./commands/whoami.js";
import { initCommand } from "./commands/init.js";
import {
  listProjectsCommand,
  createProjectCommand,
  deleteProjectCommand,
} from "./commands/projects.js";
import {
  listReportsCommand,
  viewReportCommand,
  updateReportCommand,
} from "./commands/reports.js";
import {
  listTokensCommand,
  createTokenCommand,
  revokeTokenCommand,
} from "./commands/tokens.js";

const program = new Command();

program
  .name("bugspark")
  .description("BugSpark CLI — manage projects and bug reports from the terminal")
  .version("0.1.0");

// ─── Auth ────────────────────────────────────────────────────────────────

program
  .command("register")
  .description("Create a new BugSpark account")
  .action(registerCommand);

program
  .command("login")
  .description("Authenticate with BugSpark")
  .action(loginCommand);

program
  .command("logout")
  .description("Remove stored credentials")
  .action(logoutCommand);

program
  .command("whoami")
  .description("Show current user info")
  .action(whoamiCommand);

// ─── Init ────────────────────────────────────────────────────────────────

program
  .command("init")
  .description("Set up BugSpark for a project (interactive)")
  .action(initCommand);

// ─── Projects ────────────────────────────────────────────────────────────

const projects = program
  .command("projects")
  .description("Manage projects");

projects
  .command("list")
  .description("List all projects")
  .action(listProjectsCommand);

projects
  .command("create <name>")
  .description("Create a new project")
  .option("-d, --domain <domain>", "Project domain")
  .action(createProjectCommand);

projects
  .command("delete <project-id>")
  .description("Delete a project")
  .action(deleteProjectCommand);

// ─── Reports ─────────────────────────────────────────────────────────────

const reports = program
  .command("reports")
  .description("Manage bug reports");

reports
  .command("list")
  .description("List bug reports")
  .option("-p, --project <id>", "Filter by project ID")
  .option("-s, --status <status>", "Filter by status (open, in_progress, resolved, closed)")
  .option("--severity <severity>", "Filter by severity (critical, high, medium, low)")
  .option("-l, --limit <n>", "Limit results")
  .action(listReportsCommand);

reports
  .command("view <report-id>")
  .description("View a bug report")
  .action(viewReportCommand);

reports
  .command("update <report-id>")
  .description("Update a bug report")
  .option("-s, --status <status>", "New status")
  .option("--severity <severity>", "New severity")
  .action(updateReportCommand);

// ─── Tokens ─────────────────────────────────────────────────────────────

const tokens = program
  .command("tokens")
  .description("Manage personal access tokens");

tokens
  .command("list")
  .description("List all personal access tokens")
  .action(listTokensCommand);

tokens
  .command("create <name>")
  .description("Create a new personal access token")
  .option("-e, --expires <days>", "Number of days until expiry (1-365)")
  .action(createTokenCommand);

tokens
  .command("revoke <token-id>")
  .description("Revoke a personal access token")
  .action(revokeTokenCommand);

program.parse();
