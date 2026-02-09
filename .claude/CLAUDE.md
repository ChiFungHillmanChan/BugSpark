# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BugSpark is a bug reporting and tracking platform with three packages in a pnpm monorepo:

- **packages/api** — FastAPI backend (Python 3.11+, SQLAlchemy 2.0 async, PostgreSQL, Alembic migrations)
- **packages/dashboard** — Next.js 15 admin dashboard (React 19, TypeScript, TanStack Query, Tailwind CSS 4, next-intl)
- **packages/widget** — Embeddable JavaScript bug reporter SDK (Rollup, html2canvas, IIFE + ESM)

The widget captures bug reports (screenshots, console/network logs, performance metrics) and submits them to the API. The dashboard provides project management, report triage, AI analysis, and GitHub integration.

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
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest run
```

## Architecture

### API Structure
- **Routers:** `app/routers/` — auth, projects, reports, upload, comments, webhooks, stats, analysis, integrations
- **Models:** `app/models/` — SQLAlchemy ORM models (User, Project, Report, Comment, Webhook, Integration)
- **Schemas:** `app/schemas/` — Pydantic request/response models
- **Services:** `app/services/` — Business logic (storage, tracking IDs, webhooks, AI analysis, GitHub, similarity)
- **Dependencies:** `app/dependencies.py` — FastAPI `Depends` for DB sessions, auth (`get_current_user`), API key validation (`get_api_key_project`)
- **Config:** `app/config.py` — Pydantic `Settings` from environment variables

### Authentication Flow
- JWT access tokens (15 min) + refresh tokens (7 days) stored in HttpOnly cookies
- CSRF protection via custom middleware (`X-CSRF-Token` header)
- Widget uses API keys (`X-API-Key` header, `bsk_pub_` prefix) instead of JWT
- Dashboard auth: `src/providers/auth-provider.tsx` (context) + `src/middleware.ts` (route protection)

### Database
- PostgreSQL in production, SQLite in tests (with type compatibility shims in `tests/conftest.py`)
- Async SQLAlchemy engine with connection pool: `pool_pre_ping=True`, `pool_recycle=300` for Neon/Supabase compatibility
- `statement_cache_size=0` in connect_args for Supabase transaction pooler
- Alembic migrations in `packages/api/migrations/versions/`

### Dashboard Patterns
- App Router with `(auth)` and `(dashboard)` route groups
- `src/lib/api-client.ts` — Axios instance with CSRF token injection and 401 auto-refresh interceptor
- `src/hooks/` — TanStack Query hooks for data fetching
- `src/types/index.ts` — Shared TypeScript interfaces (Project, Report, User, Comment, etc.)
- `src/i18n/` + `src/messages/` — next-intl for English and Chinese

### Widget Initialization
The widget auto-initializes from script tag data attributes:
```html
<script src="bugspark.js" data-api-key="bsk_pub_..." data-endpoint="https://api.example.com"></script>
```
Exposes `window.BugSpark` global and named ESM exports.

### File Storage
S3-compatible storage (MinIO locally, any S3-compatible in production). Screenshots uploaded via presigned URLs through the `/api/v1/upload` endpoint.

## Testing

### API Tests
- Use `pytest-asyncio` with async test functions
- `conftest.py` provides fixtures: `db_session`, `client` (httpx AsyncClient), `test_user`, `test_project`, `auth_cookies`
- Tests use SQLite in-memory with shims for PostgreSQL types (UUID → String, JSONB → JSON, ARRAY → JSON)
- Auth-protected endpoints need `cookies=auth_cookies` on the client

### Dashboard Tests
- Vitest + React Testing Library with jsdom environment
- Tests in `packages/dashboard/tests/`

### Widget Tests
- Vitest with browser environment
- Tests in `packages/widget/tests/` (if present) or inline

## Key Enums and Types

**Report severity:** `low`, `medium`, `high`, `critical`
**Report status:** `open`, `in_progress`, `resolved`, `closed`
**Report category:** `ui`, `functional`, `performance`, `crash`, `network`, `other`

## Environment Variables (API)

Key variables (see `app/config.py`):
- `DATABASE_URL` — PostgreSQL async connection string
- `JWT_SECRET`, `JWT_ALGORITHM` — Token signing
- `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` — File storage
- `ANTHROPIC_API_KEY` — AI analysis feature
- `CORS_ORIGINS` — Comma-separated allowed origins
- `FRONTEND_URL` — Dashboard URL for redirects

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
Format: `feat(api):`, `fix(dashboard):`, scopes are `api`, `dashboard`, `widget`, `db`
