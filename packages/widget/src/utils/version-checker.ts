const CURRENT_VERSION = '__BUGSPARK_VERSION__';
const NPM_REGISTRY_URL = 'https://registry.npmjs.org/@bugspark/widget/latest';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEY = 'bugspark_version_check';

interface VersionCache {
  latestVersion: string;
  checkedAt: number;
}

function compareVersions(current: string, latest: string): number {
  const a = current.split('.').map(Number);
  const b = latest.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (b[i] || 0) - (a[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function getCachedCheck(): VersionCache | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as VersionCache;
    if (Date.now() - cached.checkedAt < CHECK_INTERVAL_MS) return cached;
  } catch {
    // localStorage not available or corrupted
  }
  return null;
}

function setCachedCheck(latestVersion: string): void {
  try {
    const cache: VersionCache = { latestVersion, checkedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage not available
  }
}

function logUpdateNotice(latestVersion: string): void {
  console.log(
    '%c 🐛 BugSpark Update Available %c\n' +
    `%c Current: v${CURRENT_VERSION}  →  Latest: v${latestVersion}\n` +
    '%c Run: npm install @bugspark/widget@latest\n' +
    '%c https://www.npmjs.com/package/@bugspark/widget',
    'background: #e94560; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px 4px 0 0;',
    '',
    'color: #e94560; font-weight: bold; padding: 2px 0;',
    'color: #666; padding: 2px 0;',
    'color: #888; font-size: 11px; padding: 2px 0;',
  );
}

export function checkForUpdates(): void {
  if (CURRENT_VERSION === '__BUGS' + 'PARK_VERSION__') return; // dev mode, placeholder not replaced

  const cached = getCachedCheck();
  if (cached) {
    if (compareVersions(CURRENT_VERSION, cached.latestVersion) > 0) {
      logUpdateNotice(cached.latestVersion);
    }
    return;
  }

  fetch(NPM_REGISTRY_URL)
    .then((res) => {
      if (!res.ok) return;
      return res.json();
    })
    .then((data: Record<string, unknown> | undefined) => {
      if (!data || typeof data.version !== 'string') return;
      const latestVersion = data.version;
      setCachedCheck(latestVersion);

      if (compareVersions(CURRENT_VERSION, latestVersion) > 0) {
        logUpdateNotice(latestVersion);
      }
    })
    .catch(() => {
      // Silently fail — version check is non-critical
    });
}
