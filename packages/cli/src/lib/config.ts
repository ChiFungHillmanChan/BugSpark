import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import {
  decryptToken,
  encryptToken,
  isPlaintextToken,
  secureDelete,
} from "./secure-storage.js";

export interface BugSparkConfig {
  apiUrl: string;
  dashboardUrl?: string;
  token: string;
}

const CONFIG_DIR = path.join(os.homedir(), ".bugspark");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

// Centralized BugSpark URLs - Update these to change URLs across the CLI
// These match the values in packages/dashboard/src/lib/constants.ts and packages/api/app/constants.py
const DEFAULT_API_URL = "https://api.bugspark.hillmanchan.com/api/v1";
const DEFAULT_DASHBOARD_URL = "https://bugspark.hillmanchan.com";

function ensureDir(): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
}

export function loadConfig(): BugSparkConfig | null {
  if (!fs.existsSync(CONFIG_FILE)) return null;

  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<BugSparkConfig>;

    if (!parsed.token || !parsed.apiUrl) return null;

    let token = parsed.token;

    // Decrypt token if it was stored encrypted; legacy plaintext tokens
    // (starting with bsk_pat_) are accepted as-is for backward compatibility.
    if (!isPlaintextToken(token)) {
      try {
        token = decryptToken(token);
      } catch {
        // Corrupted or generated on a different machine — require re-login
        return null;
      }
    }

    return { ...parsed, token } as BugSparkConfig;
  } catch {
    return null;
  }
}

export async function saveConfig(config: BugSparkConfig): Promise<void> {
  ensureDir();

  const stored = {
    ...config,
    token: encryptToken(config.token),
  };

  await fsp.writeFile(
    CONFIG_FILE,
    JSON.stringify(stored, null, 2) + "\n",
    { mode: 0o600 },
  );
}

export async function deleteConfig(): Promise<void> {
  await secureDelete(CONFIG_FILE);
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
