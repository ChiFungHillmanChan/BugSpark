import { createRequire } from "node:module";

/** Returns the installed @bugspark/widget version, or "latest" as fallback */
export function getWidgetVersion(): string {
  try {
    const require = createRequire(import.meta.url);
    const pkg = require("@bugspark/widget/package.json");
    return pkg.version;
  } catch {
    return "latest";
  }
}
