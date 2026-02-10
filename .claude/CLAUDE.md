# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BugSpark is a bug reporting and tracking platform with four packages in a pnpm monorepo:

- **packages/api** — FastAPI backend (Python 3.11+, SQLAlchemy 2.0 async, PostgreSQL, Alembic migrations)
- **packages/dashboard** — Next.js 15 admin dashboard (React 19, TypeScript, TanStack Query, Tailwind CSS 4, next-intl, Recharts)
- **packages/widget** — Embeddable JavaScript bug reporter SDK (Rollup, html2canvas, Shadow DOM, IIFE + ESM)
- **packages/cli** — Command-line interface (Commander, chalk, prompts, Rollup)

The widget captures bug reports (screenshots with annotation tools, console/network logs, session recordings, performance metrics) and submits them to the API. The dashboard provides project management, report triage, AI analysis, and GitHub integration. The CLI enables terminal-based project and report management with PAT authentication.

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
- **Routers:** `app/routers/` — auth, tokens, projects, reports, upload, comments, webhooks, stats, analysis, integrations, admin
- **Models:** `app/models/` — SQLAlchemy ORM models (User, Project, Report, Comment, Webhook, Integration, PersonalAccessToken) with enums (Role, Plan)
- **Schemas:** `app/schemas/` — Pydantic request/response models with `CamelModel` base for camelCase serialization (auth, user, token, project, report, comment, webhook, integration, analysis, stats, admin, similarity)
- **Services:** `app/services/` — Business logic (auth, storage, tracking IDs, webhooks, AI analysis, GitHub, similarity, stats)
- **Middleware:** `app/middleware/csrf.py` — CSRF double-submit cookie validation
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
- **Dashboard auth:** `src/providers/auth-provider.tsx` (context) + `src/middleware.ts` (locale cookie init)

### Database
- PostgreSQL in production, SQLite in tests (with type compatibility shims in `tests/conftest.py`)
- Async SQLAlchemy engine with connection pool: `pool_size=5`, `max_overflow=10`, `pool_pre_ping=True`, `pool_recycle=300`
- `statement_cache_size=0` in connect_args for Supabase transaction pooler
- UUID primary keys, JSONB for flexible data (settings, logs, metadata), ARRAY for webhook events
- Alembic migrations in `packages/api/migrations/versions/`

### Dashboard Patterns
- App Router with three route groups: `(public)` (landing, docs), `(auth)` (login, register), `(dashboard)` (protected app)
- Dashboard pages: overview, bugs (list + detail), projects (list + detail), settings (profile, integrations, tokens), admin (overview, users)
- `src/lib/api-client.ts` — Axios instance with CSRF token injection, Accept-Language header, and 401 auto-refresh interceptor
- `src/lib/query-keys.ts` — Factory pattern for TanStack Query cache key management
- `src/hooks/` — TanStack Query hooks: use-bugs, use-projects, use-comments, use-stats, use-admin, use-analysis, use-integrations, use-similar-bugs
- `src/types/index.ts` — Shared TypeScript interfaces (User, Project, BugReport, Comment, Webhook, Integration, etc.)
- `src/providers/` — AuthProvider (login/register/logout context), ThemeProvider (light/dark/system with localStorage), QueryProvider
- `src/i18n/` + `src/messages/` — next-intl for English and Traditional Chinese (cookie-based `bugspark_locale`, no URL prefix)
- `content/docs/` — MDX documentation with locale-aware loading (English + zh-TW), categories: getting-started, widget, cli, api, dashboard
- `src/components/docs/` — Custom MDX components (CodeBlock, Callout, ApiEndpoint, DocsTabs)
- `src/components/landing/` — Public landing page (hero, features, pricing with comparison, integrations, CTA, footer)
- Tailwind CSS 4 with `@theme` custom colors: navy (dark mode palette), accent (`#e94560`), severity colors, status colors
- Auth forms use password visibility toggle (Eye/EyeOff icons) and loading spinners (Loader2 animate-spin)

### CLI Architecture
- Entry point: `src/index.ts` — Commander-based CLI registered as `bugspark` binary
- **Commands:** `src/commands/` — login, register, logout, whoami, init, projects, reports, tokens
- **Lib:** `src/lib/` — api-client (authenticated + unauthenticated factories using native fetch), config (`~/.bugspark/config.json` with 0600 permissions), output (table/success/error formatting with chalk), errors
- Auth: email/password login or PAT-based, stores JWT token in config file
- Default API URL: `https://bugspark-api.onrender.com/api/v1`

### Widget Architecture
- Shadow DOM host for CSS isolation, auto-initializes from `<script>` data attributes (`data-api-key`, `data-endpoint`, `data-position`, `data-theme`)
- **Core modules:** console interceptor (100 entries), network interceptor (50 requests, filters sensitive headers), error tracker, screenshot engine (html2canvas), metadata collector, performance collector (Web Vitals: LCP, CLS, FID, INP, TTFB), session recorder (30-second sliding window)
- **Annotation tools:** pen, arrow, rectangle, circle, text, blur — with undo/redo history and color picker
- **UI:** floating button (4 position options), report modal (title, description, severity, category, email, screenshot preview), annotation overlay, toast notifications
- **API layer:** presigned URL screenshot upload, retry logic (1 retry on 5xx), `beforeSend` hook
- Exposes `window.BugSpark` global with `init()`, `open()`, `close()`, `destroy()`, `identify()` methods

### File Storage
S3-compatible storage (MinIO locally, any S3-compatible in production). Screenshots uploaded via presigned URLs through the `/api/v1/upload` endpoint. Validates file magic bytes (PNG/JPEG/WebP), 10MB size limit.

## Testing

### API Tests
- Use `pytest-asyncio` with async test functions
- `conftest.py` provides fixtures: `db_session`, `client` (httpx AsyncClient), `test_user`, `test_project`, `auth_cookies`
- Tests use SQLite in-memory with shims for PostgreSQL types (UUID → String, JSONB → JSON, ARRAY → JSON)
- Auth-protected endpoints need `cookies=auth_cookies` on the client
- 17 test files covering: auth router/service, projects, reports, comments, admin, integrations, dependencies, storage, similarity, GitHub integration, webhooks, config, schemas, tracking IDs

### Dashboard Tests
- Vitest + React Testing Library with jsdom environment
- Tests in `packages/dashboard/tests/` organized by type: `components/`, `hooks/`, `lib/`
- Use `renderWithIntl` from `tests/test-utils.tsx` for components that use `useTranslations()` (wraps with NextIntlClientProvider)

### Widget Tests
- Vitest with jsdom environment
- 11 test files in `packages/widget/tests/` covering: config, index, annotation history, console/network interceptors, DOM helpers, error tracker, event emitter, metadata collector, report composer, session recorder

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
