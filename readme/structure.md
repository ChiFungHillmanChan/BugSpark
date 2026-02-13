# Codebase Structure

This file documents key functions, components, and utilities across the BugSpark monorepo to prevent duplication and promote reuse.

---

## CLI (`packages/cli`)

### Utilities (`packages/cli/src/lib/`)

| Function | File | Purpose |
|---|---|---|
| `getWidgetVersion()` | `packages/cli/src/lib/widget-version.ts` | Returns the installed `@bugspark/widget` version by reading its `package.json` at runtime. Falls back to `"latest"` if the widget package is not found. Used in CLI snippet generation (`init.ts`, `projects.ts`) to keep the widget CDN URL in sync. |
