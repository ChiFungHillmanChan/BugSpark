# BugSpark URL Configuration

This document describes where to update URLs when changing BugSpark's deployment domains.

## Centralized Configuration Files

All URLs are centralized in these three files. **Update these files to change URLs across the entire codebase:**

### 1. Dashboard (TypeScript/Next.js)
**File:** `packages/dashboard/src/lib/constants.ts`

```typescript
export const BUGSPARK_API_URL = "https://api.bugspark.hillmanchan.com/api/v1";
export const BUGSPARK_DASHBOARD_URL = "https://bugspark.hillmanchan.com";
export const BUGSPARK_WIDGET_CDN_URL = "https://cdn.jsdelivr.net/npm/@bugspark/widget@latest/dist/bugspark.iife.js";
```

### 2. CLI (TypeScript)
**File:** `packages/cli/src/lib/config.ts`

```typescript
const DEFAULT_API_URL = "https://api.bugspark.hillmanchan.com/api/v1";
const DEFAULT_DASHBOARD_URL = "https://bugspark.hillmanchan.com";
```

### 3. API (Python)
**File:** `packages/api/app/constants.py`

```python
BUGSPARK_API_URL = "https://api.bugspark.hillmanchan.com/api/v1"
BUGSPARK_DASHBOARD_URL = "https://bugspark.hillmanchan.com"
```

## Current URLs

- **Frontend/Dashboard:** `https://bugspark.hillmanchan.com`
- **Backend API:** `https://api.bugspark.hillmanchan.com/api/v1`
- **Widget CDN:** `https://cdn.jsdelivr.net/npm/@bugspark/widget@latest/dist/bugspark.iife.js`

## Environment Variable Overrides

These centralized values can be overridden by environment variables:

- `NEXT_PUBLIC_API_URL` - Overrides API URL in dashboard
- `NEXT_PUBLIC_APP_URL` - Overrides dashboard URL in dashboard
- `NEXT_PUBLIC_ENABLE_BUGSPARK` - Set to `"false"` to disable the widget on the BugSpark dashboard itself (default: `"true"`)
- `BUGSPARK_API_URL` - Overrides API URL in Python API (if set)
- `BUGSPARK_DASHBOARD_URL` - Overrides dashboard URL in Python API (if set)

## Enable/Disable Toggle for End Users

All code snippets (docs, dashboard integration page, AI setup prompts) include an `ENABLE_BUGSPARK` environment variable guard so users can disable the widget in their own projects without removing code:

| Framework | Env var name | Example |
|---|---|---|
| Node.js / generic | `ENABLE_BUGSPARK` | `ENABLE_BUGSPARK=false` |
| Next.js / React (client-side) | `NEXT_PUBLIC_ENABLE_BUGSPARK` | `NEXT_PUBLIC_ENABLE_BUGSPARK=false` |
| Vite / Vue | `VITE_ENABLE_BUGSPARK` | `VITE_ENABLE_BUGSPARK=false` |
| Angular | `environment.enableBugspark` | `enableBugspark: false` in `environment.ts` |

Default is enabled (`true`). Only an explicit `"false"` disables the widget.

## Files That Use These Constants

### Dashboard — Application Code
- `src/lib/api-client.ts` — API client base URL
- `src/lib/seo.ts` — SEO metadata URLs
- `src/app/layout.tsx` — Widget script endpoint
- `src/app/sitemap.ts` — Sitemap URLs
- `src/app/robots.ts` — Robots.txt URLs
- `src/app/(public)/page.tsx` — Landing page JSON-LD
- `src/app/(public)/changelog/page.tsx` — Changelog JSON-LD
- `src/app/(public)/about/page.tsx` — About page JSON-LD

### Dashboard — Documentation Snippets (also centralised)
- `src/lib/doc-snippets.ts` — **All code examples** used in docs and UI are defined here as template strings that reference `constants.ts`. This means docs auto-update when URLs change.
- `src/components/docs/widget-snippets.tsx` — MDX components (`<WidgetScriptSnippet>`, `<WidgetNpmSnippet>`, `<CspSnippet>`, `<AiSetupPrompt>`, etc.) that render the snippets from `doc-snippets.ts`.
- `src/components/landing/integration-examples.tsx` — Landing page code examples (imports from `doc-snippets.ts`)
- `src/app/(dashboard)/projects/[id]/components/project-integration-snippets.tsx` — Dashboard integration code (imports from `doc-snippets.ts`)

### Dashboard — MDX Docs (use components, no hardcoded URLs)
- `content/docs/cli/ai-setup.mdx` — Uses `<AiSetupPrompt>` component
- `content/docs/getting-started.mdx` — Uses `<WidgetScriptSnippet>`, `<WidgetNpmSnippet>`
- `content/docs/widget/installation.mdx` — Uses `<WidgetScriptSnippet>`, `<WidgetNpmSnippet>`, `<WidgetReactSnippet>`, `<WidgetVueSnippet>`, `<WidgetAngularSnippet>`
- `content/docs/widget/configuration.mdx` — Uses `<WidgetScriptSnippetFull>`
- `content/docs/widget/advanced.mdx` — Uses `<CspSnippet>`
- All `zh-HK/` locale variants use the same components

### CLI
- `src/lib/config.ts` — Default API and dashboard URLs
- All CLI commands use these defaults

### API
- `app/constants.py` — Centralized URL constants
- Can be imported by any Python module

## How to Change URLs

1. **Update `packages/dashboard/src/lib/constants.ts`** — all dashboard code, docs, and UI snippets auto-update
2. **Update `packages/cli/src/lib/config.ts`** — CLI defaults update
3. **Update `packages/api/app/constants.py`** — API backend updates
4. **Update environment variables** in deployment configs (.env files, Vercel, Render, etc.)

No need to touch individual doc files — they use MDX components that pull from `constants.ts` via `doc-snippets.ts`.

## Notes

- The widget CDN URL (`cdn.jsdelivr.net/npm/@bugspark/widget@latest/...`) is a public URL — safe to appear in docs
- The widget `README.md` (in `packages/widget/`) has its own hardcoded URLs as it is the source of truth for the widget package
- Test files may use mock URLs — these don't need to be changed
- Third-party API URLs (GitHub, Linear, etc.) should NOT be changed
