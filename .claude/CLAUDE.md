# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BugSpark is a bug reporting and tracking platform with four packages in a pnpm monorepo:

- **packages/api** — FastAPI backend (Python 3.11+, SQLAlchemy 2.0 async, PostgreSQL, Alembic migrations)
- **packages/dashboard** — Next.js 15 admin dashboard (React 19, TypeScript, TanStack Query, Tailwind CSS 4, next-intl, Recharts)
- **packages/widget** — Embeddable JavaScript bug reporter SDK (Rollup, html2canvas, Shadow DOM, IIFE + ESM)
- **packages/cli** — Command-line interface (Commander, chalk, prompts, Rollup)

The widget captures bug reports (screenshots with annotation tools, console/network logs, session recordings, performance metrics) and submits them to the API. The dashboard provides project management, report triage, AI analysis (root cause, fix suggestions, affected area), GitHub integration, and Linear integration. The CLI enables terminal-based project and report management with PAT authentication.

## Commands

### Root (pnpm + turbo)
```bash
pnpm dev              # Start all packages
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm dev:api          # API only (uvicorn --reload on port 8000)
pnpm dev:dashboard    # Dashboard only (Next.js on port 3000)
pnpm dev:widget       # Widget only (Rollup watch)
pnpm db:migrate       # Run Alembic migrations (alembic upgrade head)
pnpm db:seed          # Seed database (python scripts/seed.py)
pnpm docker:up        # Start Postgres + MinIO containers
pnpm docker:down      # Stop containers
pnpm cli:link         # Build CLI and npm link for local use
```

### API (from packages/api)
```bash
pytest                           # Run all tests
pytest tests/test_auth_router.py # Single test file
pytest -k "test_login"           # Single test by name
alembic upgrade head             # Apply migrations
alembic revision --autogenerate -m "description"  # New migration
```

### Dashboard (from packages/dashboard)
```bash
pnpm dev              # Dev server
pnpm build            # Production build
pnpm lint             # ESLint
pnpm test             # vitest run
pnpm test:watch       # vitest watch mode
pnpm test:coverage    # vitest with coverage
npx tsc --noEmit      # Type check
```

### Widget (from packages/widget)
```bash
pnpm dev              # Rollup watch
pnpm build            # Production build
pnpm lint             # tsc --noEmit
pnpm test             # vitest run
pnpm test:watch       # vitest watch mode
pnpm test:coverage    # vitest with coverage
```

### CLI (from packages/cli)
```bash
pnpm build            # Rollup build to dist/index.js
pnpm dev              # Rollup watch mode
```

## Architecture

### API Structure
- **Routers:** `app/routers/` — auth (split into auth_helpers, auth_email, auth_password, auth_cli, auth_beta), tokens, projects, reports, upload, comments, webhooks, stats, analysis, integrations, admin, device_auth
- **Models:** `app/models/` — SQLAlchemy ORM models (User, Project, Report, Comment, Webhook, Integration, PersonalAccessToken) with enums (Role, Plan)
- **Schemas:** `app/schemas/` — Pydantic request/response models with `CamelModel` base for camelCase serialization (auth, user, token, project, report, comment, webhook, integration, analysis, stats, admin, similarity)
- **Rate Limiter:** `app/rate_limiter.py` — Shared slowapi `Limiter` instance with API-key-aware key function (extracted from main.py to avoid circular imports)
- **Services:** `app/services/` — Business logic (auth, storage, tracking IDs, webhooks, AI analysis, GitHub, Linear, spam protection, similarity, stats, team, email, email verification, password reset, report formatter, plan limits, task queue, notification)
- **Middleware:** `app/middleware/` — CSRF double-submit cookie validation (`csrf.py`), security headers (`security_headers.py`), widget CORS (`widget_cors.py`)
- **Dependencies:** `app/dependencies.py` — FastAPI `Depends` for DB sessions, auth (`get_current_user`, `get_active_user`), role guards (`require_admin`, `require_superadmin`), API key validation (`validate_api_key`), PAT authentication
- **Exceptions:** `app/exceptions.py` — Custom exception hierarchy (NotFoundException, UnauthorizedException, ForbiddenException, BadRequestException) with i18n support
- **i18n:** `app/i18n/` — Server-side locale detection and message catalogs (English, Traditional Chinese)
- **Utils:** `app/utils/sanitize.py` — HTML tag stripping and XSS prevention
- **Config:** `app/config.py` — Pydantic `Settings` from environment variables

### Authentication Flow
- **Dashboard (JWT):** Access tokens (15 min) + refresh tokens (7 days) stored in HttpOnly cookies (`bugspark_access_token`, `bugspark_refresh_token`)
- **CLI (PAT):** Personal Access Tokens via `Authorization: Bearer bsk_pat_...` header, SHA256-hashed in DB with prefix lookup
- **Widget (API Key):** `X-API-Key: bsk_pub_...` header, SHA256-hashed in DB with prefix lookup
- **CSRF:** Double-submit cookie pattern (`X-CSRF-Token` header vs `bugspark_csrf_token` cookie), exempts API key/Bearer/safe methods
- **Roles:** `user`, `admin`, `superadmin` — enforced via `require_admin()` and `require_superadmin()` dependencies
- **Device auth:** OAuth-style device code flow for CLI (`/device/code`, `/device/token`, `/device/approve`) with polling and expiry
- **Team/project members:** Invite-based team membership with role assignment per project
- **Dashboard auth:** `src/providers/auth-provider.tsx` (context with safe redirect validation) + `src/middleware.ts` (route guards for `/dashboard`, `/bugs`, `/projects`, `/settings`, `/admin` + locale cookie init)

### Database
- PostgreSQL in production, SQLite in tests (with type compatibility shims in `tests/conftest.py`)
- Async SQLAlchemy engine with connection pool: `pool_size=5`, `max_overflow=10`, `pool_pre_ping=True`, `pool_recycle=300`
- `statement_cache_size=0` in connect_args for Supabase transaction pooler
- UUID primary keys, JSONB for flexible data (settings, logs, metadata), ARRAY for webhook events
- Alembic migrations in `packages/api/migrations/versions/`

### Dashboard Patterns
- App Router with three route groups: `(public)` (landing, docs), `(auth)` (login, register), `(dashboard)` (protected app)
- Dashboard pages: overview, bugs (list + detail), projects (list + detail), settings (profile, integrations, tokens, team), admin (overview, users, reports, beta)
- `src/lib/api-client.ts` — Axios instance with CSRF token injection (try-catch safe `decodeURIComponent`), Accept-Language header, and 401 auto-refresh interceptor
- `src/lib/query-keys.ts` — Factory pattern for TanStack Query cache key management
- `src/hooks/` — TanStack Query hooks: use-bugs, use-projects, use-comments, use-stats, use-admin, use-analysis, use-integrations, use-similar-bugs, use-team, use-debounce
- `src/types/index.ts` — Shared TypeScript interfaces (User, Project, BugReport, Comment, Webhook, Integration, AnalysisResponse with rootCause/fixSuggestions/affectedArea, ExportResult with issueIdentifier, etc.)
- `src/providers/` — AuthProvider (login/register/logout context), ThemeProvider (light/dark/system with localStorage), QueryProvider
- `src/i18n/` + `src/messages/` — next-intl for English and Traditional Chinese (cookie-based `bugspark_locale`, no URL prefix)
- `content/docs/` — MDX documentation with locale-aware loading (English + zh-TW), categories: getting-started, widget, cli, api, dashboard
- `src/components/docs/` — Custom MDX components (CodeBlock, Callout, ApiEndpoint, DocsTabs), `DocsMobileSidebar` (slide-out drawer for mobile with overlay, Escape-key dismiss, scroll lock)
- `src/components/landing/` — Public landing page (hero, features, pricing with "Coming Soon" badges and comparison table, cinematic widget demo with auto-looping phase animation, integrations, CTA, footer)
- `src/components/landing/widget-demo-section.tsx` — Auto-looping demo with 7 phases (idle → click → modal → fill → submit → toast → reset), respects `prefers-reduced-motion`
- `src/components/landing/pricing-data.ts` — Pricing data with `HighlightItem` type (`string | { key: string; comingSoon: boolean }`), `ComparisonFeature` with `comingSoon?: PricingTierId[]`, and `ENTERPRISE_FEATURE_KEYS` as `Array<{ key: string; comingSoon: boolean }>`
- `src/components/bug-detail/ai-analysis-panel.tsx` — AI analysis panel showing summary, category, reproduction steps, root cause, affected area (as badge), and fix suggestions (as numbered list)
- `src/components/bug-detail/export-to-tracker.tsx` — Export buttons for GitHub and Linear, handles `issueIdentifier` for Linear links
- Tailwind CSS 4 with `@theme` custom colors: navy (dark mode palette), accent (`#e94560`), severity colors, status colors
- Auth forms use password visibility toggle (Eye/EyeOff icons) and loading spinners (Loader2 animate-spin)

### CLI Architecture
- Entry point: `src/index.ts` — Commander-based CLI registered as `bugspark` binary
- **Commands:** `src/commands/` — login, register, logout, whoami, init, projects, reports, tokens
- **Lib:** `src/lib/` — api-client (authenticated + unauthenticated factories using native fetch), config (`~/.bugspark/config.json` with 0600 permissions), output (table/success/error formatting with chalk), errors
- Auth: email/password login or PAT-based, stores JWT token in config file
- Default API URL: `https://bugspark-api.onrender.com/api/v1`

### Widget Architecture
- Shadow DOM host for CSS isolation, auto-initializes from `<script>` data attributes (`data-api-key`, `data-endpoint`, `data-position`, `data-theme`, `data-watermark`)
- **Core modules:** console interceptor (50 entries default), network interceptor (30 requests default, filters sensitive headers), error tracker, screenshot engine (html2canvas), metadata collector, performance collector (Web Vitals: LCP, CLS, FID, INP, TTFB), session recorder (60-second sliding window)
- **Remote config:** `widget-lifecycle.ts` fetches project config from API on init, can override `enableScreenshot`, `showWatermark`, `ownerPlan`, `primaryColor`, `buttonText`, `modalTitle`, `logo`
- **Annotation tools:** pen, arrow, rectangle, circle, text, blur — with undo/redo history and color picker
- **UI:** floating button (4 position options, optional `buttonText` label), report modal (title, description, severity, category, email, screenshot preview, hidden honeypot field), annotation overlay, toast notifications, "Powered by BugSpark" watermark (default on, togglable via `branding.showWatermark`)
- **Branding:** `BugSparkBranding` interface — `showWatermark`, `customColors` (background/text/border), `buttonText`, `modalTitle`, `logo`; colors applied via `getStyles(theme, branding)` with theme fallbacks
- **Spam protection (client-side):** 30-second submit cooldown (`SUBMIT_COOLDOWN_MS`), honeypot field (`hpField`) in `BugReport` sent as `hp_field` to API
- **API layer:** presigned URL screenshot upload, retry logic (1 retry on 5xx), `beforeSend` hook
- Exposes `window.BugSpark` global with `init()`, `open()`, `close()`, `destroy()`, `identify()` methods

### File Storage
S3-compatible storage (MinIO locally, any S3-compatible in production). Screenshots uploaded via presigned URLs through the `/api/v1/upload` endpoint. Validates file magic bytes (PNG/JPEG/WebP), 10MB size limit.

### Spam Protection & Rate Limiting
- **Rate limiter** (`app/rate_limiter.py`): Shared `slowapi.Limiter` instance with API-key-aware key function — uses first 8 chars of API key as key, falls back to remote address. Default 100/min global, 10/min on report creation.
- **Spam protection service** (`app/services/spam_protection_service.py`):
  - `check_honeypot(hp_value)` — rejects non-empty honeypot field values (bot trap)
  - `is_duplicate_report(db, project_id, title, description)` — queries for identical title within 5-minute window
  - `validate_origin(request, project)` — checks Origin/Referer header against `project.domain` (allows subdomains, skips if no domain configured)
- **Report endpoint** (`app/routers/reports.py`): `@limiter.limit("10/minute")` decorator, checks honeypot → origin → duplicate before processing
- **Widget client-side**: hidden honeypot `<input>` (off-screen, `aria-hidden`, `tabIndex=-1`), 30-second cooldown between submissions

### Integrations
- **GitHub** (`app/services/github_integration.py`): Creates GitHub Issues via REST API. Config requires `token`, `owner`, `repo`.
- **Linear** (`app/services/linear_integration.py`): Creates Linear issues via GraphQL API (`https://api.linear.app/graphql`). Config requires `apiKey`, `teamId`. Uses `SEVERITY_TO_PRIORITY` mapping (critical=1, high=2, medium=3, low=4). Returns `issue_url`, `issue_identifier` (e.g. "ENG-123"), `issue_id`.
- **Schema validation** (`app/schemas/integration.py`): `SUPPORTED_PROVIDERS = {"github", "linear"}`, validates required config keys per provider. `ExportResponse` includes `issue_identifier: str | None` for Linear.
- **Dashboard**: Integrations settings page split into orchestrator (`page.tsx`) + `settings/components/github-integration-form.tsx`, `linear-integration-form.tsx`, `integration-list.tsx`. Bug detail page shows "Export to GitHub" and "Export to Linear" buttons.

### AI Analysis
- **Service** (`app/services/ai_analysis_service.py`): Sends structured prompt to Anthropic API requesting 6 fields: `summary`, `suggestedCategory`, `suggestedSeverity`, `reproductionSteps`, `rootCause`, `fixSuggestions`, `affectedArea`
- Log formatting includes stack traces (truncated to 300 chars) and `[FAILED]` labels on network requests with status >= 400
- Fallback parsing provides empty defaults for new fields when JSON parse fails
- **Schema** (`app/schemas/analysis.py`): `AnalysisResponse` with `root_cause: str`, `fix_suggestions: list[str]`, `affected_area: str`
- **Dashboard panel** (`src/components/bug-detail/ai-analysis-panel.tsx`): Shows root cause paragraph, affected area badge, and numbered fix suggestions list

### Pricing Page
- `src/components/landing/pricing-data.ts` defines tiers (Free, Starter HK$199, Team HK$799, Enterprise Custom) with `HighlightItem` type supporting `comingSoon` flag
- "Coming Soon" amber badges on unimplemented features: Session Replay (Starter/Team), Jira/Linear/Slack (Team), Custom Branding (Team), SSO (Enterprise), Audit Logs (Enterprise)
- Comparison table uses `ComparisonFeature.comingSoon?: PricingTierId[]` to render per-cell badges

## Key Enums and Types

**Report severity:** `low`, `medium`, `high`, `critical`
**Report status:** `new`, `triaging`, `in_progress`, `resolved`, `closed`
**Report category:** `bug`, `ui`, `performance`, `crash`, `other`
**User role:** `user`, `admin`, `superadmin`
**User plan:** `free`, `pro`, `enterprise`

## Environment Variables (API)

Key variables (see `app/config.py`):
- `DATABASE_URL` — PostgreSQL async connection string
- `JWT_SECRET`, `JWT_ALGORITHM` — Token signing
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`, `JWT_REFRESH_TOKEN_EXPIRE_DAYS` — Token TTLs (defaults: 15 min, 7 days)
- `S3_ENDPOINT_URL`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_NAME`, `S3_PUBLIC_URL` — File storage
- `ANTHROPIC_API_KEY` — AI analysis feature
- `CORS_ORIGINS` — Comma-separated allowed origins
- `FRONTEND_URL` — Dashboard URL for redirects
- `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` — Initial superadmin credentials
- `COOKIE_SECURE`, `COOKIE_SAMESITE` — Cookie security settings (defaults: `False`, `lax`)

## CI/CD

- **CI (ci.yml):** Runs on PRs to main — lints dashboard + widget, runs pytest (API), vitest (dashboard + widget), then full turbo build
- **Deploy (deploy.yml):** Runs on push to main — deploys API to Render (deploy hook), dashboard to Vercel, widget build as GitHub artifact
- **Docker:** PostgreSQL 16 + MinIO with init container for bucket setup

## Coding Standards

### Zero Tolerance Policy
- **Zero `eslint-disable`** — never suppress linting rules; fix the root cause
- **Zero `ts-ignore` / `ts-expect-error`** — never suppress TypeScript errors; add proper types
- **Zero `any` types** — use `unknown` + type guards for external data, explicit types everywhere else
- **Zero `# type: ignore`** — Python equivalent; fix the typing, don't silence it
- These are absolute rules with no exceptions. If a library forces `any`, wrap it in a typed adapter.

### Single Responsibility Per File
- Every file must have **one clear purpose** — one component, one hook, one service, one model, one router
- If a file needs a helper function that could be reused, put it in a separate file under `utils/` or `lib/`
- If adding a new function would give the file a second responsibility, create a new file instead
- Keep every file between **200–300 lines maximum**. If a file approaches 200 lines, evaluate whether it should be split
- Name files after their single purpose: `use-projects.ts`, `storage-service.py`, `severity-badge.tsx`

### Code Quality
- Booleans prefixed with `is`/`has`/`should`/`can`
- Functions prefixed with verbs (`fetch`, `create`, `validate`, `handle`)
- Constants in `SCREAMING_SNAKE_CASE`
- Types/interfaces in `PascalCase` with domain context
- No dead code, no commented-out code, no unused imports
- No magic numbers or strings — extract to named constants
- Prefer early returns over deeply nested conditionals
- One level of abstraction per function — if a function does A then B then C, each step should be its own function if non-trivial

### Error Handling
- Never use empty `catch` blocks or generic error messages
- Let errors propagate to framework-level handlers with full context
- Python: use specific exception types, never bare `except:`
- TypeScript: type error boundaries properly, never swallow errors

### Conventional Commits
Format: `feat(api):`, `fix(dashboard):`, scopes are `api`, `dashboard`, `widget`, `cli`, `db`

## On-Demand References

Run these commands for detailed guidelines:
- `/techdebt` — Known issues, security vulnerabilities, test coverage gaps, and automated scanning
- `/testing-guide` — Test patterns, fixtures, and conventions for all four packages
- `/security-rules` — Auth architecture, CSRF, rate limiting, widget security
- `/framework-rules` — Next.js 15, FastAPI, Rollup Widget, Commander CLI specifics
- `/style-guide` — Tailwind CSS 4, naming conventions, component patterns
- `/troubleshooting` — Common issues: PostgreSQL shims, Supabase pooler, CSRF, auth cookies
