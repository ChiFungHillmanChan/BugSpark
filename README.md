# BugSpark

Universal embeddable bug reporting SDK with an admin dashboard. Drop a single `<script>` tag into any website to let users report bugs with automatic screenshots, console logs, network requests, and session recordings — then manage everything from a modern dashboard.

## Architecture

```
┌─────────────────────┐    POST /api/v1/reports    ┌──────────────────────┐
│   @bugspark/widget   │ ──────────────────────────► │   FastAPI Backend    │
│   (IIFE / ESM)       │       X-API-Key             │   /api/v1            │
│   Shadow DOM UI      │       + screenshot upload    │   PostgreSQL         │
│   html2canvas        │                              │   S3 / MinIO         │
└─────────────────────┘                              └──────────┬───────────┘
                                                                │
                                                                │ axios + JWT
                                                                │ cookies
┌─────────────────────┐    NEXT_PUBLIC_API_URL                  │
│   Dashboard          │ ◄──────────────────────────────────────┘
│   Next.js 15         │    /auth, /projects, /reports,
│   React 19           │    /stats, /analysis, /admin
│   TanStack Query     │
│   Recharts           │
└─────────────────────┘
```

| Package | Tech Stack | Description |
|---------|-----------|-------------|
| `packages/widget` | TypeScript, Rollup, html2canvas | Embeddable bug reporter (~229 KB) |
| `packages/api` | Python 3.11+, FastAPI, SQLAlchemy, Alembic | REST API backend |
| `packages/dashboard` | Next.js 15, React 19, TanStack Query, Tailwind CSS 4 | Admin dashboard |
| `packages/cli` | TypeScript, Commander.js, Rollup | CLI tool for managing projects and reports |

## Features

### Widget (`@bugspark/widget`)

- Auto screenshot via html2canvas with annotation tools (pen, arrow, rectangle, circle, text, blur)
- Last 50 console log entries (log, warn, error with stack traces)
- Last 30 network requests (method, URL, status, duration)
- Last 60 seconds of user actions (clicks, scrolls, navigation with CSS selectors)
- Device metadata (browser, OS, viewport, locale, timezone, connection type, Web Vitals)
- Shadow DOM — zero CSS conflicts with your site
- Works with any website: HTML, React, Next.js, Vue, Django, WordPress, PHP, etc.

### API

- JWT authentication with refresh tokens and CSRF protection
- Security headers middleware (HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- Encryption at rest for integration secrets (Fernet symmetric encryption)
- Production config validation (enforces ENCRYPTION_KEY, COOKIE_SECURE, remote S3)
- Project management with generated API keys (`bsk_pub_...`)
- Bug report ingestion with S3/MinIO screenshot storage
- AI-powered bug analysis (via Anthropic Claude — configurable model)
- Webhook notifications, GitHub integration, and Linear integration
- Rate limiting (100 req/min per API key or IP)
- Admin panel with super-admin role
- Transactional emails via Resend (optional)
- i18n support (English, Traditional Chinese)

### Dashboard

- Real-time bug list (Table + Kanban drag-and-drop views)
- Bug detail view: screenshots, console logs, network waterfall, session timeline, device info
- AI analysis and similar bug detection
- Comments and team collaboration
- Project management with API key generation
- Dashboard analytics: bug trends, severity distribution, stats
- Export bugs to GitHub Issues and Linear issues
- Multi-language (English, Traditional Chinese) with theme toggle
- Global error boundary and Sentry integration
- MDX documentation pages built-in

### CLI (`bugspark`)

- Register and login directly from the terminal (email/password or Personal Access Token)
- Create, list, and delete projects
- View, list, and update bug reports
- Manage personal access tokens (create, list, revoke)
- Interactive project setup with `bugspark init`
- Config stored in `~/.bugspark/config.json`

## CLI Usage

### Install globally (for local development)

```bash
cd packages/cli
pnpm build && npm link
```

### Register a new account

```bash
bugspark register
```

### Login

```bash
bugspark login
# Choose "Email and password" or "Personal Access Token"
```

### Manage projects

```bash
bugspark projects list
bugspark projects create "My Website" --domain example.com
bugspark projects delete <project-id>
```

### Manage bug reports

```bash
bugspark reports list --project <id> --status open
bugspark reports view <report-id>
bugspark reports update <report-id> --status resolved
```

### Manage tokens

```bash
bugspark tokens list
bugspark tokens create "CI Token" --expires 90
bugspark tokens revoke <token-id>
```

### Other commands

```bash
bugspark whoami       # Show current user info
bugspark init         # Interactive project setup
bugspark logout       # Remove stored credentials
bugspark --help       # Show all commands
```

## Prerequisites

- **Docker Desktop** (for PostgreSQL and MinIO)
- **Node.js** >= 20
- **Python** >= 3.11
- **pnpm** (package manager)

## Quick Start (Local Development)

### 1. Clone and install dependencies

```bash
git clone https://github.com/hillmanchan/BugSpark.git
cd BugSpark
pnpm install
```

### 2. Set up environment variables

Environment variables are split by package. The root `.env` only configures Docker Compose services.

```bash
# Root — Docker Compose (PostgreSQL + MinIO)
cp .env.example .env

# API — all backend config
cp packages/api/.env.example packages/api/.env

# Dashboard — frontend config
cp packages/dashboard/.env.example packages/dashboard/.env.local
```

Edit `packages/api/.env` and set a `JWT_SECRET` (any random string). The other defaults work out of the box with Docker:

```env
ENVIRONMENT=development
DATABASE_URL=postgresql+asyncpg://bugspark:bugspark_dev@localhost:5432/bugspark
JWT_SECRET=your-random-secret-string-here
S3_ENDPOINT_URL=http://localhost:9000
S3_ACCESS_KEY=bugspark
S3_SECRET_KEY=bugspark_dev
S3_BUCKET_NAME=bugspark-uploads
S3_PUBLIC_URL=http://localhost:9000/bugspark-uploads
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
FRONTEND_URL=http://localhost:3000
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
```

Edit `packages/dashboard/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Start infrastructure (PostgreSQL + MinIO)

```bash
pnpm docker:up
```

This starts:
- **PostgreSQL 16** on port 5432
- **MinIO** (S3-compatible storage) on port 9000 (API) and 9001 (console)

### 4. Run database migrations and seed data

```bash
pnpm db:migrate
pnpm db:seed
```

After seeding you get:
- Test account: `test@bugspark.dev` / `password123`
- Two sample projects with API keys
- 20 sample bug reports with console logs, network logs, and user actions

The terminal will print two API keys — save them for widget testing.

### 5. Start the development servers

Open three terminals:

```bash
# Terminal 1: API server
pnpm dev:api        # → http://localhost:8000

# Terminal 2: Dashboard
pnpm dev:dashboard  # → http://localhost:3000

# Terminal 3: Widget (dev + watch)
pnpm dev:widget     # → builds to packages/widget/dist/
```

Or run everything at once with Turborepo:

```bash
pnpm dev
```

### 6. Log in to the dashboard

Open `http://localhost:3000` and sign in with `test@bugspark.dev` / `password123`.

You will see:
- A dashboard with 20 seeded bug reports
- Two projects with their API keys
- Analytics charts (bug trends, severity distribution)

### 7. Embed the widget in a test page

Create a `test.html` file:

```html
<!DOCTYPE html>
<html>
<head><title>BugSpark Test</title></head>
<body>
  <h1>My Test Page</h1>
  <p>Click the bug button in the bottom-right corner to report a bug.</p>

  <script
    src="http://localhost:5173/bugspark.iife.js"
    data-api-key="bsk_pub_YOUR_API_KEY_HERE"
    data-endpoint="http://localhost:8000/api/v1"
    data-position="bottom-right"
    data-theme="light"
  ></script>
</body>
</html>
```

Open it with a local server (`npx serve .`) and click the bug button to submit a report.

## Widget Usage

### Option 1: Script Tag (any website)

```html
<script
  src="https://cdn.jsdelivr.net/npm/@bugspark/widget@latest/dist/bugspark.iife.js"
  data-api-key="YOUR_API_KEY"
  data-endpoint="https://your-bugspark-api.onrender.com/api/v1"
  data-position="bottom-right"
  data-theme="light"
></script>
```

### Option 2: npm

```bash
npm install @bugspark/widget
```

```javascript
import BugSpark from '@bugspark/widget';

BugSpark.init({
  apiKey: 'YOUR_API_KEY',
  endpoint: 'https://your-bugspark-api.onrender.com/api/v1',
});
```

### Configuration Options

```javascript
BugSpark.init({
  apiKey: 'bsk_pub_...',             // required
  endpoint: 'https://...',           // required — your API URL
  position: 'bottom-right',          // bottom-right | bottom-left | top-right | top-left
  theme: 'light',                    // light | dark | auto
  primaryColor: '#e94560',           // brand color
  enableScreenshot: true,            // auto screenshot on open
  enableConsoleLogs: true,           // capture last 50 console entries
  enableNetworkLogs: true,           // capture last 30 network requests
  enableSessionRecording: true,      // capture last 60s of user actions
  user: {                            // optional: identify the reporter
    id: 'user-123',
    email: 'user@example.com',
    name: 'Jane Doe',
  },
  beforeSend(report) {               // filter sensitive data before submission
    return report;                   // return null to cancel
  },
  onSubmit(report) {                 // callback after successful submit
    console.log('Bug submitted!');
  },
});
```

### Programmatic API

| Method | Description |
|--------|-------------|
| `BugSpark.init(config)` | Initialize the widget |
| `BugSpark.open()` | Open the report form |
| `BugSpark.close()` | Close the report form |
| `BugSpark.destroy()` | Remove the widget and clean up listeners |
| `BugSpark.identify(user)` | Update user info after init |

### Framework Integration Examples

**Next.js (App Router)**

```tsx
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="https://cdn.jsdelivr.net/npm/@bugspark/widget@latest/dist/bugspark.iife.js"
          data-api-key="YOUR_API_KEY"
          data-endpoint="https://your-api.onrender.com/api/v1"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

**React (Vite / CRA)**

```tsx
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@bugspark/widget@latest/dist/bugspark.iife.js';
    script.setAttribute('data-api-key', 'YOUR_API_KEY');
    script.setAttribute('data-endpoint', 'https://your-api.onrender.com/api/v1');
    document.body.appendChild(script);
    return () => { window.BugSpark?.destroy(); };
  }, []);

  return <div>Your App</div>;
}
```

**Vue.js / HTML / PHP / Django / WordPress** — just add the `<script>` tag before `</body>`. See `packages/widget/README.md` for more examples.

## API Endpoints

All routes are under `/api/v1`. Interactive docs available at `GET /docs` (Swagger) and `GET /redoc`.

| Group | Key Endpoints |
|-------|--------------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/cli/register`, `POST /auth/cli/login` |
| **Projects** | `GET /projects`, `POST /projects`, `GET /projects/:id`, `PUT /projects/:id`, `DELETE /projects/:id` |
| **Reports** | `GET /reports`, `POST /reports` (widget), `GET /reports/:id`, `PATCH /reports/:id` |
| **Upload** | `POST /upload/screenshot` (multipart, X-API-Key auth) |
| **Comments** | `GET /reports/:id/comments`, `POST /reports/:id/comments` |
| **Stats** | `GET /stats/overview`, `GET /stats/trends`, `GET /stats/severity` |
| **Analysis** | `POST /reports/:id/analyze` (AI-powered, requires `ANTHROPIC_API_KEY`) |
| **Webhooks** | CRUD for project webhook configurations |
| **Integrations** | `POST /integrations/github/export/:id`, `POST /integrations/linear/export/:id` |
| **Admin** | `GET /admin/users`, user management (super-admin only) |
| **Health** | `GET /health` |

## Webhook Setup

Webhooks notify your external services whenever events occur in BugSpark (e.g. a new bug report is submitted). Webhooks are currently configured via API only (no dashboard UI yet).

### Create a Webhook

```bash
curl -X POST "https://your-api.onrender.com/api/v1/webhooks?project_id=YOUR_PROJECT_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: bugspark_access_token=YOUR_JWT" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "url": "https://your-server.com/webhook",
    "events": ["report.created"]
  }'
```

The response includes the webhook `id`. The secret is auto-generated (64-char hex, encrypted at rest).

### Available Events

| Event | Trigger |
|-------|---------|
| `report.created` | A new bug report is submitted via the widget |

### Webhook Payload

When an event fires, BugSpark sends a `POST` request to your URL:

```
POST https://your-server.com/webhook
Content-Type: application/json
X-BugSpark-Signature: <hmac-sha256-hex-digest>
X-BugSpark-Event: report.created

{
  "event": "report.created",
  "data": { /* full report object */ }
}
```

### Verify the Signature

The `X-BugSpark-Signature` header contains an HMAC-SHA256 hex digest signed with your webhook secret. Verify it server-side to ensure the request is authentic:

**Python**
```python
import hmac, hashlib

def verify_signature(payload_bytes: bytes, secret: str, signature: str) -> bool:
    expected = hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
```

**Node.js**
```javascript
const crypto = require('crypto');

function verifySignature(payloadBuffer, secret, signature) {
  const expected = crypto.createHmac('sha256', secret).update(payloadBuffer).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
```

### Manage Webhooks

```bash
# List all webhooks for a project
curl "https://your-api.onrender.com/api/v1/webhooks?project_id=YOUR_PROJECT_ID" \
  -H "Cookie: bugspark_access_token=YOUR_JWT"

# Update a webhook (change URL, events, or disable)
curl -X PATCH "https://your-api.onrender.com/api/v1/webhooks/WEBHOOK_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: bugspark_access_token=YOUR_JWT" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{ "is_active": false }'

# Delete a webhook
curl -X DELETE "https://your-api.onrender.com/api/v1/webhooks/WEBHOOK_ID" \
  -H "Cookie: bugspark_access_token=YOUR_JWT" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN"
```

### Webhook Behavior

- **Timeout:** 5 seconds per delivery attempt
- **Retries:** Enqueued via background task queue; retries on 5xx responses
- **Security:** URL validated against private/loopback addresses (SSRF protection)
- **Signature:** HMAC-SHA256 with auto-generated 64-char hex secret (encrypted at rest)

## Cloud Deployment

### Recommended Stack (Free Tier)

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Vercel** | Dashboard hosting | Hobby plan |
| **Render** | API hosting | Free web service |
| **Neon** | PostgreSQL | 0.5 GB storage |
| **Cloudflare R2** | Screenshot storage | 10 GB / 1M writes/mo |

### Deploy the API to Render

The project includes a `render.yaml` for one-click deploy:

1. Go to [render.com](https://render.com) and connect your GitHub repo
2. Root directory: `packages/api`
3. Set environment variables:

```
ENVIRONMENT=production
DATABASE_URL=postgresql+asyncpg://...@your-neon-host/neondb?sslmode=require
JWT_SECRET=<random-string-min-32-chars>
ENCRYPTION_KEY=<fernet-key>
S3_ENDPOINT_URL=https://<account>.r2.cloudflarestorage.com
S3_ACCESS_KEY=<r2-access-key>
S3_SECRET_KEY=<r2-secret-key>
S3_BUCKET_NAME=bug-spark
S3_PUBLIC_URL=https://pub-<account>.r2.dev
CORS_ORIGINS=https://your-dashboard.vercel.app
CORS_ORIGIN_REGEX=^https://bugspark-[a-z0-9-]+\.vercel\.app$
COOKIE_SECURE=true
COOKIE_SAMESITE=none
FRONTEND_URL=https://your-dashboard.vercel.app
```

Generate keys:
```bash
# JWT_SECRET
python -c "import secrets; print(secrets.token_urlsafe(64))"
# ENCRYPTION_KEY
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

4. Run migration from local (pointing to Neon):

```bash
cd packages/api
DATABASE_URL="postgresql+asyncpg://...@your-neon-host/neondb?sslmode=require" alembic upgrade head
```

### Deploy the Dashboard to Vercel

1. Import the repo on [vercel.com](https://vercel.com)
2. Root directory: `packages/dashboard`
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api/v1`
   - `NEXT_PUBLIC_S3_HOSTNAME=pub-<account>.r2.dev` (for `next/image` remote patterns)
   - `NEXT_PUBLIC_SENTRY_DSN=...` (optional)
4. Deploy

### Render Cold-Start Workaround

Render free tier sleeps after 15 minutes of inactivity. Add a keep-alive cron on Vercel:

```typescript
// packages/dashboard/src/app/api/keep-alive/route.ts
export async function GET() {
  await fetch('https://your-api.onrender.com/health');
  return Response.json({ ok: true });
}
```

```json
// vercel.json
{
  "crons": [{ "path": "/api/keep-alive", "schedule": "*/14 * * * *" }]
}
```

## Project Structure

```
BugSpark/
├── docker-compose.yml          # PostgreSQL 16 + MinIO
├── package.json                # Root scripts (turbo dev/build/lint)
├── pnpm-workspace.yaml         # Monorepo workspace config
├── turbo.json                  # Turborepo pipeline
├── render.yaml                 # Render.com deployment config
├── .env.example                # Docker Compose variables only
├── docs/                       # Documentation
│   ├── deployment.md           # Production deployment guide
│   ├── testing-guide.md        # Full testing walkthrough
│   ├── future-plan.md          # Roadmap
│   └── report-verification.md  # Architecture verification
│
├── packages/api/               # Python FastAPI backend
│   ├── app/
│   │   ├── main.py             # App entry, routers, middleware
│   │   ├── config.py           # Pydantic settings
│   │   ├── database.py         # Async SQLAlchemy engine
│   │   ├── models/             # SQLAlchemy models (User, Project, Report, Comment, Webhook, Integration)
│   │   ├── routers/            # API routers (auth split: helpers, cli, email, password, beta)
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic (auth, storage, AI, GitHub, Linear, webhooks, stats)
│   │   ├── middleware/         # CSRF, security headers, widget CORS
│   │   ├── i18n/               # Internationalization messages
│   │   └── utils/              # Sanitization, encryption helpers
│   ├── migrations/             # Alembic migrations (9 versions)
│   ├── scripts/                # seed.py, seed_superadmin.py
│   ├── tests/                  # pytest test suite
│   └── pyproject.toml          # Python dependencies
│
├── packages/dashboard/         # Next.js 15 admin dashboard
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, Register pages
│   │   │   ├── (dashboard)/    # Main app: dashboard, bugs, projects, settings, admin
│   │   │   └── (public)/       # Landing page, docs
│   │   ├── components/
│   │   │   ├── bug-detail/     # AI analysis, comments, console viewer, network waterfall, session timeline
│   │   │   ├── bugs/           # Bug table, Kanban board, filters
│   │   │   ├── dashboard/      # Stat cards, charts
│   │   │   ├── landing/        # Landing page sections
│   │   │   ├── layout/         # Sidebar, topbar, mobile nav
│   │   │   └── shared/         # Theme toggle, locale switcher, dialogs
│   │   ├── hooks/              # Custom React hooks (useBugs, useProjects, useStats, etc.)
│   │   ├── lib/                # API client, auth helpers
│   │   ├── providers/          # Auth, React Query, Theme providers
│   │   ├── i18n/               # next-intl config
│   │   └── messages/           # en.json, zh-HK.json
│   ├── content/docs/           # MDX documentation (en + zh-HK)
│   └── package.json
│
├── packages/widget/            # Embeddable JS widget
│   ├── src/
│   │   ├── index.ts            # Entry point, auto-init
│   │   ├── widget-lifecycle.ts # Widget lifecycle (init, open, close, destroy)
│   │   ├── core/               # Screenshot engine, console/network interceptors, session recorder
│   │   ├── ui/                 # Shadow DOM components, styles (base, modal, annotation, responsive)
│   │   ├── api/                # Report composer (upload + submit)
│   │   └── utils/              # DOM helpers
│   ├── rollup.config.mjs       # Builds IIFE + ESM
│   └── package.json
│
└── packages/cli/               # Command-line interface
    ├── src/
    │   ├── index.ts            # Entry point, Commander.js program
    │   ├── commands/           # register, login, logout, whoami, init, projects, reports, tokens
    │   └── lib/                # API client, config (~/.bugspark/), output helpers
    ├── rollup.config.mjs       # Builds to dist/index.js
    └── package.json
```

## Scripts Reference

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all packages in dev mode (Turborepo) |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm dev:api` | Start API server at `http://localhost:8000` |
| `pnpm dev:dashboard` | Start dashboard at `http://localhost:3000` |
| `pnpm dev:widget` | Start widget dev server with watch |
| `pnpm db:migrate` | Run Alembic migrations |
| `pnpm db:seed` | Seed test data (users, projects, reports) |
| `pnpm docker:up` | Start PostgreSQL + MinIO containers |
| `pnpm docker:down` | Stop and remove containers |

## Environment Variables

### API (`packages/api/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENVIRONMENT` | Yes | `development` | `development`, `staging`, or `production` |
| `DATABASE_URL` | Yes | (local) | PostgreSQL connection string (asyncpg) |
| `JWT_SECRET` | Yes | - | Secret key for JWT signing (min 32 chars in production) |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | No | `60` | Access token TTL |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | No | `30` | Refresh token TTL |
| `ENCRYPTION_KEY` | Prod | - | Fernet key for encrypting integration secrets at rest |
| `S3_ENDPOINT_URL` | Yes | (local) | S3/MinIO endpoint (must be remote in production) |
| `S3_ACCESS_KEY` | Yes | - | S3/MinIO access key |
| `S3_SECRET_KEY` | Yes | - | S3/MinIO secret key |
| `S3_BUCKET_NAME` | No | `bugspark-uploads` | S3 bucket name |
| `S3_PUBLIC_URL` | Yes | - | Public URL for serving screenshots |
| `CORS_ORIGINS` | Yes | - | Comma-separated allowed origins |
| `CORS_ORIGIN_REGEX` | No | - | Regex for dynamic origins (e.g. Vercel previews) |
| `FRONTEND_URL` | Yes | - | Dashboard URL for redirects and email links |
| `COOKIE_SECURE` | Prod | `false` | Must be `true` in production (HTTPS) |
| `COOKIE_SAMESITE` | No | `lax` | `none` for cross-origin API/dashboard deployments |
| `ANTHROPIC_API_KEY` | No | - | Enables AI bug analysis |
| `AI_MODEL` | No | `claude-haiku-4-5-20251001` | Anthropic model ID for analysis |
| `RESEND_API_KEY` | No | - | Enables transactional emails via Resend |
| `EMAIL_FROM_ADDRESS` | No | `BugSpark <noreply@bugspark.dev>` | Sender address |
| `SENTRY_DSN` | No | - | Enables Sentry error tracking |
| `SUPERADMIN_EMAIL` | No | - | Auto-create superadmin on startup |
| `SUPERADMIN_PASSWORD` | No | - | Superadmin password |

### Dashboard (`packages/dashboard/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | BugSpark API base URL (including `/api/v1`) |
| `NEXT_PUBLIC_S3_HOSTNAME` | No | S3 hostname for `next/image` remote patterns |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for error tracking |
| `NEXT_PUBLIC_BUGSPARK_API_KEY` | No | Embed BugSpark widget on the dashboard (dogfooding) |

### Root (`.env` — Docker Compose only)

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `bugspark` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `bugspark_dev` | PostgreSQL password |
| `POSTGRES_DB` | `bugspark` | PostgreSQL database name |
| `MINIO_ROOT_USER` | `bugspark` | MinIO access key |
| `MINIO_ROOT_PASSWORD` | `bugspark_dev` | MinIO secret key |

## What Each Bug Report Captures

| Data Type | Details | Value |
|-----------|---------|-------|
| Screenshot | Full-page via html2canvas + annotation tools | Visual proof of the UI state |
| Console Logs | Last 50 entries with stack traces | Identify JS errors without DevTools |
| Network Requests | Last 30 fetch/XHR with status and timing | Spot failed or slow API calls |
| User Actions | Last 60s of clicks, scrolls, navigation | Reproduce the exact steps |
| Error Stack Traces | Uncaught exceptions + unhandled rejections | Pinpoint the failing line of code |
| Device Info | Browser, OS, viewport, screen, locale, timezone, connection | Debug device-specific issues |
| Reporter Identity | ID, email, name (if `identify()` was called) | Know who reported the bug |

## Testing

### API Tests

```bash
cd packages/api
pip install -e ".[dev]"
pytest
```

### Dashboard Tests

```bash
cd packages/dashboard
pnpm test
```

### Widget Tests

```bash
cd packages/widget
pnpm test
```

For a comprehensive production deployment guide (Render, Vercel, CORS/cookie configuration, database migrations, backup strategy, CI/CD pipeline), see [`docs/deployment.md`](docs/deployment.md).

## Troubleshooting

**Widget button doesn't appear?**
Check the browser console for errors. Usually `data-api-key` is wrong or the script `src` path is incorrect.

**Report submission fails?**
Check CORS — the API's `CORS_ORIGINS` must include your site's domain. For local dev, use `http://localhost:3000,http://localhost:5173`.

**Screenshot is gray?**
html2canvas doesn't support all CSS features (e.g., `backdrop-filter`). The report still submits normally with a fallback gray canvas.

**Dashboard login fails?**
Make sure the API and Dashboard point to the same database and that `pnpm db:seed` has been run.

**AI analysis button does nothing?**
Set `ANTHROPIC_API_KEY` in your `.env`. Without it, AI features are disabled; everything else works normally.

## License

MIT
