import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export interface BugSparkConfig {
  apiUrl: string;
  dashboardUrl: string;
  token: string;
}

const CONFIG_DIR = path.join(os.homedir(), ".bugspark");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const DEFAULT_API_URL = "https://bugspark-api.onrender.com/api/v1";
const DEFAULT_DASHBOARD_URL = "http://localhost:3000";

function ensureDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

export function loadConfig(): BugSparkConfig | null {
  if (!fs.existsSync(CONFIG_FILE)) return null;

  const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
  const parsed = JSON.parse(raw) as Partial<BugSparkConfig>;

  if (!parsed.token || !parsed.apiUrl) return null;
  // Backfill dashboardUrl for configs saved before this field existed
  if (!parsed.dashboardUrl) {
    parsed.dashboardUrl = DEFAULT_DASHBOARD_URL;
  }
  return parsed as BugSparkConfig;
}

export async function saveConfig(config: BugSparkConfig): Promise<void> {
  ensureDir();
  await fsp.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n", {
    mode: 0o600,
  });
}

export async function deleteConfig(): Promise<void> {
  if (fs.existsSync(CONFIG_FILE)) {
    await fsp.unlink(CONFIG_FILE);
  }
}

export function getConfigOrExit(): BugSparkConfig {
  const config = loadConfig();
  if (!config) {
    console.error(
      "Not logged in. Run `bugspark login` first."
    );
    process.exit(1);
  }
  return config;
}

export { DEFAULT_API_URL, DEFAULT_DASHBOARD_URL };
