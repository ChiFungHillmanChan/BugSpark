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
- Last 100 console log entries (log, warn, error with stack traces)
- Last 50 network requests (method, URL, status, duration)
- Last 30 seconds of user actions (clicks, scrolls, navigation with CSS selectors)
- Device metadata (browser, OS, viewport, locale, timezone, connection type, Web Vitals)
- Shadow DOM — zero CSS conflicts with your site
- Works with any website: HTML, React, Next.js, Vue, Django, WordPress, PHP, etc.

### API

- JWT authentication with refresh tokens and CSRF protection
- Project management with generated API keys (`bsk_pub_...`)
- Bug report ingestion with S3/MinIO screenshot storage
- AI-powered bug analysis (via Anthropic Claude)
- Webhook notifications and GitHub integration
- Rate limiting (100 req/min per API key or IP)
- Admin panel with super-admin role
- i18n support (English, Traditional Chinese)

### Dashboard

- Real-time bug list (Table + Kanban drag-and-drop views)
- Bug detail view: screenshots, console logs, network waterfall, session timeline, device info
- AI analysis and similar bug detection
- Comments and team collaboration
- Project management with API key generation
- Dashboard analytics: bug trends, severity distribution, stats
- Export bugs to GitHub Issues
- Multi-language (English, Traditional Chinese) with theme toggle
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

```bash
cp .env.example .env
```

Edit `.env` and set a `JWT_SECRET` (any random string). The other defaults work out of the box with Docker:

```env
# Database
DATABASE_URL=postgresql+asyncpg://bugspark:bugspark_dev@localhost:5432/bugspark

# JWT
JWT_SECRET=your-random-secret-string-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# MinIO / S3 (local)
S3_ENDPOINT_URL=http://localhost:9000
S3_ACCESS_KEY=bugspark
S3_SECRET_KEY=bugspark_dev
S3_BUCKET_NAME=bugspark-uploads
S3_PUBLIC_URL=http://localhost:9000/bugspark-uploads

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# API
API_BASE_URL=http://localhost:8000

# Dashboard
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Also copy the API-specific env file:

```bash
cp packages/api/.env.example packages/api/.env
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
  enableConsoleLogs: true,           // capture last 100 console entries
  enableNetworkLogs: true,           // capture last 50 network requests
  enableSessionRecording: true,      // capture last 30s of user actions
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
| **Integrations** | `POST /integrations/github/export/:id` (export bug to GitHub Issue) |
| **Admin** | `GET /admin/users`, user management (super-admin only) |
| **Health** | `GET /health` |

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
DATABASE_URL=postgresql+asyncpg://...@your-neon-host/neondb?sslmode=require
JWT_SECRET=<random-string>
S3_ENDPOINT_URL=https://<account>.r2.cloudflarestorage.com
S3_ACCESS_KEY=<r2-access-key>
S3_SECRET_KEY=<r2-secret-key>
S3_BUCKET_NAME=bug-spark
S3_PUBLIC_URL=https://pub-<account>.r2.dev
CORS_ORIGINS=https://your-dashboard.vercel.app
COOKIE_SECURE=true
COOKIE_SAMESITE=none
FRONTEND_URL=https://your-dashboard.vercel.app
```

4. Run migration from local (pointing to Neon):

```bash
cd packages/api
DATABASE_URL="postgresql+asyncpg://...@your-neon-host/neondb?sslmode=require" alembic upgrade head
```

### Deploy the Dashboard to Vercel

1. Import the repo on [vercel.com](https://vercel.com)
2. Root directory: `packages/dashboard`
3. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api/v1`
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
├── .env.example                # Environment variable template
├── docs/                       # Documentation
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
│   │   ├── routers/            # 10 API routers
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic (auth, storage, AI analysis, GitHub, webhooks, stats)
│   │   ├── middleware/         # CSRF middleware
│   │   ├── i18n/               # Internationalization messages
│   │   └── utils/              # Sanitization helpers
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
│   │   └── messages/           # en.json, zh-TW.json
│   ├── content/docs/           # MDX documentation (en + zh-TW)
│   └── package.json
│
├── packages/widget/            # Embeddable JS widget
│   ├── src/
│   │   ├── index.ts            # Entry point, auto-init
│   │   ├── core/               # Screenshot engine, console/network interceptors, session recorder
│   │   ├── ui/                 # Shadow DOM components (button, modal, toast, annotation overlay)
│   │   ├── api/                # Report composer (upload + submit)
│   │   └── utils/              # DOM helpers, event emitter
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

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (asyncpg) |
| `JWT_SECRET` | Yes | Secret key for JWT token signing |
| `JWT_ALGORITHM` | No | Default: `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | No | Default: `15` |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | No | Default: `7` |
| `S3_ENDPOINT_URL` | Yes | S3/MinIO endpoint |
| `S3_ACCESS_KEY` | Yes | S3/MinIO access key |
| `S3_SECRET_KEY` | Yes | S3/MinIO secret key |
| `S3_BUCKET_NAME` | No | Default: `bugspark-uploads` |
| `S3_PUBLIC_URL` | Yes | Public URL for serving screenshots |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins |
| `API_BASE_URL` | No | API base URL for internal use |
| `NEXT_PUBLIC_API_URL` | Yes | API URL used by the dashboard |
| `ANTHROPIC_API_KEY` | No | Enables AI bug analysis feature |
| `FRONTEND_URL` | No | Dashboard URL (for CSRF/cookies in production) |
| `COOKIE_SECURE` | No | Set to `true` in production |
| `COOKIE_SAMESITE` | No | Set to `none` for cross-origin in production |
| `SUPERADMIN_EMAIL` | No | Super admin account email |
| `SUPERADMIN_PASSWORD` | No | Super admin account password |

## What Each Bug Report Captures

| Data Type | Details | Value |
|-----------|---------|-------|
| Screenshot | Full-page via html2canvas + annotation tools | Visual proof of the UI state |
| Console Logs | Last 100 entries with stack traces | Identify JS errors without DevTools |
| Network Requests | Last 50 fetch/XHR with status and timing | Spot failed or slow API calls |
| User Actions | Last 30s of clicks, scrolls, navigation | Reproduce the exact steps |
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
