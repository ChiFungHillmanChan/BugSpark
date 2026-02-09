# Project Instructions

## Self-Improving Instructions

When Claude makes a mistake or the user corrects a pattern, **update this file immediately**:

1. Add the correction to the relevant section below
2. If no section fits, add a "Lessons Learned" entry at the bottom
3. Include the date and context of the correction
4. This ensures the same mistake never happens twice

```
<!-- Lessons Learned (append new entries here)
- YYYY-MM-DD: [correction description]
-->
```

---

## Quick Reference

<!-- [PROJECT: Customize these for your project] -->

| Item | Location |
|------|----------|
| Project overview | `README.md` |
| Package commands | `package.json` |
| Tech stack | _[Add your stack: e.g., "Next.js 15, Prisma, TailwindCSS"]_ |
| Package manager | _[Add: pnpm / npm / yarn / bun]_ |
| Source directory | _[Add: src/ / server/ / app/]_ |
| Test directory | _[Add: tests/ / __tests__/ / spec/]_ |

### Essential Commands

```bash
# [PROJECT: Replace with your actual commands]
# Development
# <package-manager> run dev

# Build
# <package-manager> run build

# Test
# <package-manager> test

# Lint
# <package-manager> run lint

# Type check (TypeScript projects)
# npx tsc --noEmit
```

---

## Universal Coding Standards

### 1. File Size Limit: 300 Lines Maximum

Every file MUST be under 300 lines of code. No exceptions.

**When a file exceeds 300 lines:**
1. Identify logical sections - group related functions/components
2. Create max 3-4 new files - don't over-fragment
3. Run tests after each extraction - verify no regressions
4. Update imports - ensure clean dependency graph

### 2. Zero Code Redundancy (DRY)

Never duplicate code. Every function must be reusable.

**Before creating ANY new code:**
1. Search the codebase for existing similar logic
2. Check shared utility directories (`lib/`, `utils/`, `helpers/`)
3. If similar code exists, extract a shared function first
4. Document new shared utilities for team discovery

### 3. Variable Naming Standards

Variables must be self-documenting:

```
# Forbidden patterns
x, j, d, a           -> Use descriptive names
success: boolean      -> isSuccessful: boolean
filename()            -> generateFilename()
interface Props {}    -> interface UserCardProps {}
const chi = 'chinese' -> const languageChinese = 'chinese'

# Required patterns
Booleans:  is/has/should/can prefix (isVisible, hasAccess)
Functions: verb prefix (fetchData, createUser, validateInput)
Constants: SCREAMING_SNAKE_CASE (API_BASE_URL, MAX_RETRIES)
Types:     PascalCase with domain context (UserProfile, ApiResponse)
```

### 4. Type Safety (TypeScript Projects)

```
FORBIDDEN:  any, @ts-ignore, @ts-expect-error, eslint-disable
REQUIRED:   unknown + type guards for external data
REQUIRED:   Explicit function parameter and return types
REQUIRED:   Fix root causes, never suppress errors
```

### 5. Error Handling

- Never catch errors unless you can handle them meaningfully
- Never use empty catch blocks or generic "Internal server error"
- Let errors propagate to framework-level handlers with full context
- Log errors with sufficient context (error, stack, request info)

### 6. Environment Variables & Secrets

```
FORBIDDEN:  Hardcoded credentials, secrets, or tokens in source
FORBIDDEN:  Module-level env var access (causes build-time issues)
REQUIRED:   Runtime access via factory functions
REQUIRED:   .env files in .gitignore
REQUIRED:   env.example with variable names only (no values)
```

### 7. Build Error Resolution

- Fix root causes - never suppress with eslint-disable or ts-ignore
- Add proper types using framework-generated types where available
- Use type guards to validate unknown data at boundaries
- Understand WHY the error exists before fixing

---

## Framework-Specific Rules

<!-- [PROJECT: Add your framework rules here. Examples below for reference.] -->

<!--
### Next.js Example
- Always await route params (Next.js 15 requirement)
- Use server components for data fetching where possible
- Use NextAuth.js for authentication
- Import AI models from centralized registry, never hardcode

### Django Example
- Use class-based views for CRUD, function views for custom logic
- Always use Django ORM, avoid raw SQL
- Run makemigrations + migrate after model changes
- Use Django REST Framework serializers for validation

### FastAPI Example
- Use Pydantic models for request/response validation
- Use dependency injection for database sessions
- Always define response_model on endpoints
- Use async def for I/O-bound endpoints

### React Native Example
- Use React Navigation for routing
- Handle platform differences with Platform.select()
- Test on both iOS and Android simulators
- Use SafeAreaView for notch handling
-->

---

## Git Conventions

### Branch Naming

**Format:** `<type>/<ticket-id>-<short-description>`

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New functionality | `feature/JIRA-123-user-auth` |
| `fix/` | Bug fixes | `fix/PROD-456-login-error` |
| `hotfix/` | Urgent production fixes | `hotfix/critical-payment-bug` |
| `release/` | Release preparation | `release/v2.1.0` |
| `chore/` | Maintenance tasks | `chore/update-dependencies` |
| `refactor/` | Code restructuring | `refactor/auth-module` |

Rules: lowercase only, hyphens as separators, include ticket numbers, 3-5 words max.

### Commit Messages (Conventional Commits)

**Format:** `<type>(<scope>): <description>`

| Type | Purpose |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code restructuring |
| `test` | Adding/fixing tests |
| `chore` | Maintenance |
| `perf` | Performance improvement |

Rules:
- Subject line <=50 characters, imperative mood, no period
- Body wraps at 72 characters, explains WHY not what
- Breaking changes: `feat!:` or `BREAKING CHANGE:` footer

<!-- [PROJECT: Add your scopes here, e.g., api, ui, db, auth] -->

### Co-Author Attribution

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Context Management

### Plan-First Development

For non-trivial tasks, always plan before implementing:
1. **Explore** - Read relevant code, understand patterns
2. **Design** - Outline approach, identify affected files
3. **Review** - Get user sign-off on the plan
4. **Implement** - Execute the plan systematically
5. **Verify** - Run tests, check build, validate behavior

### Parallel Workflows (Git Worktrees)

Use git worktrees for parallel Claude Code sessions:
```bash
git worktree add ../project-feature-a feature/branch-a
git worktree add ../project-feature-b feature/branch-b
```
Each worktree gets its own Claude Code session for true parallelism.

### Session Management

- Use `/compact` when context exceeds 80% capacity
- Name sessions descriptively with `/rename`
- Use `/rewind` for checkpoints before risky changes
- Break large tasks into focused episodes
- Track progress with TodoWrite for multi-step tasks

---

## Hooks Reference

| Hook | Purpose | Script |
|------|---------|--------|
| SessionStart | Set development environment | `hooks/session-start.sh` |
| PostToolUse | Visual notification on file changes | `hooks/task-notify.sh` |
| PostToolUse | Test file change detection | `hooks/test-runner.sh` |
| PostToolUse | Auto-format on save | `hooks/auto-format.sh` |
| PreToolUse | Block edits to protected files | `hooks/protected-files.sh` |
| Notification | Alert when Claude needs input | Inline osascript |

---

## Pre-Commit Checklist

Before committing ANY code:
- [ ] File is under 300 lines
- [ ] No code duplication introduced
- [ ] All variables have descriptive names
- [ ] Boolean fields use is/has/should/can prefix
- [ ] No `any` types (TypeScript projects)
- [ ] No eslint-disable or ts-ignore comments
- [ ] Build passes
- [ ] Tests pass

---

## Available Commands

| Command | Description |
|---------|-------------|
| `core-rules` | Core programming principles |
| `typescript-rules` | TypeScript best practices |
| `error-handling` | Error handling patterns |
| `security-rules` | Security and credential handling |
| `code-cleanup` | Code quality detection patterns |
| `style-guide` | Visual design and styling rules |
| `troubleshooting` | Common issues and solutions |
| `techdebt` | Scan for tech debt and violations |
| `worktree-workflow` | Git worktree parallel workflow |
| `plan-mode` | Plan-first development discipline |
| `framework-rules` | Template for adding framework rules |
