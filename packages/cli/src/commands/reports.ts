import chalk from "chalk";
import { getAuthenticatedClientOrExit } from "../lib/auth-guard.js";
import { formatError } from "../lib/errors.js";
import { error, success, table } from "../lib/output.js";
import { validateId } from "../lib/validate.js";

interface ReportResponse {
  id: string;
  trackingId: string;
  title: string;
  severity: string;
  status: string;
  category: string;
  createdAt: string;
  reporterIdentifier?: string;
}

interface PaginatedReports {
  items: ReportResponse[];
  total: number;
  page: number;
  pageSize: number;
}

const SEVERITY_COLORS: Record<string, (s: string) => string> = {
  critical: chalk.red,
  high: chalk.yellow,
  medium: chalk.blue,
  low: chalk.dim,
};

const STATUS_COLORS: Record<string, (s: string) => string> = {
  open: chalk.red,
  in_progress: chalk.yellow,
  resolved: chalk.green,
  closed: chalk.dim,
};

export async function listReportsCommand(options: {
  project?: string;
  status?: string;
  severity?: string;
  limit?: string;
}): Promise<void> {
  const { client } = await getAuthenticatedClientOrExit();

  try {
    const params = new URLSearchParams();
    if (options.project) params.set("project_id", options.project);
    if (options.status) params.set("status", options.status);
    if (options.severity) params.set("severity", options.severity);
    if (options.limit) params.set("limit", options.limit);

    const qs = params.toString();
    const path = `/reports${qs ? `?${qs}` : ""}`;
    const response = await client.get<PaginatedReports>(path);
    const reports = response.items;

    if (reports.length === 0) {
      console.log();
      console.log("  No bug reports found.");
      console.log();
      return;
    }

    console.log();
    table(
      ["Tracking ID", "UUID", "Title", "Severity", "Status", "Date"],
      reports.map((r) => {
        const sevColor = SEVERITY_COLORS[r.severity] || chalk.white;
        const statColor = STATUS_COLORS[r.status] || chalk.white;
        return [
          r.trackingId || "-",
          r.id.slice(0, 8),
          r.title.length > 40 ? r.title.slice(0, 37) + "..." : r.title,
          sevColor(r.severity),
          statColor(r.status),
          new Date(r.createdAt).toLocaleDateString(),
        ];
      })
    );
    console.log();
    console.log(chalk.dim(`  ${reports.length} of ${response.total} report(s)`));
    console.log();
  } catch (err) {
    error(formatError(err));
    process.exit(1);
  }
}

export async function viewReportCommand(reportId: string): Promise<void> {
  const safeId = validateId(reportId);
  const { client } = await getAuthenticatedClientOrExit();

  try {
    const r = await client.get<ReportResponse & {
      description: string;
      url?: string;
      reporterIdentifier?: string;
      consoleLogs?: unknown[];
      networkLogs?: unknown[];
    }>(`/reports/${safeId}`);

    const sevColor = SEVERITY_COLORS[r.severity] || chalk.white;
    const statColor = STATUS_COLORS[r.status] || chalk.white;

    console.log();
    console.log(`  ${chalk.bold(r.title)}`);
    console.log(`  ${chalk.dim(r.trackingId || r.id)}`);
    console.log();
    console.log(`  ${chalk.bold("Severity:")}  ${sevColor(r.severity)}`);
    console.log(`  ${chalk.bold("Status:")}    ${statColor(r.status)}`);
    console.log(`  ${chalk.bold("Category:")}  ${r.category}`);
    if (r.reporterIdentifier) {
      console.log(`  ${chalk.bold("Reporter:")}  ${r.reporterIdentifier}`);
    }
    console.log(
      `  ${chalk.bold("Created:")}   ${new Date(r.createdAt).toLocaleString()}`
    );
    console.log();
    if (r.description) {
      console.log(`  ${chalk.bold("Description:")}`);
      console.log(`  ${r.description}`);
      console.log();
    }
    if (r.consoleLogs && r.consoleLogs.length > 0) {
      console.log(`  ${chalk.bold("Console Logs:")} ${r.consoleLogs.length} entries`);
    }
    if (r.networkLogs && r.networkLogs.length > 0) {
      console.log(`  ${chalk.bold("Network Logs:")} ${r.networkLogs.length} entries`);
    }
    console.log();
  } catch (err) {
    error(formatError(err));
    process.exit(1);
  }
}

export async function updateReportCommand(
  reportId: string,
  options: { status?: string; severity?: string }
): Promise<void> {
  const safeId = validateId(reportId);
  const { client } = await getAuthenticatedClientOrExit();

  const body: Record<string, string> = {};
  if (options.status) body.status = options.status;
  if (options.severity) body.severity = options.severity;

  if (Object.keys(body).length === 0) {
    error("Provide at least --status or --severity to update.");
    process.exit(1);
  }

  try {
    await client.patch(`/reports/${safeId}`, body);
    success(`Report ${safeId} updated.`);
  } catch (err) {
    error(formatError(err));
    process.exit(1);
  }
}
