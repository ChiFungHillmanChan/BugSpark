# Framework-Specific Rules Template

Use this template to add framework-specific rules to your project.

## How to Use

1. Copy the relevant section below into your `.claude/CLAUDE.md` under "Framework-Specific Rules"
2. Customize for your project's specific patterns
3. Remove the examples that don't apply

---

## Next.js 15

```markdown
### Next.js Rules
- Always await route params: `const { id } = await params;`
- Use server components for data fetching where possible
- Use `'use server'` directive for server actions
- Use `'use client'` only when component needs browser APIs or hooks
- Import AI models from centralized registry, never hardcode
- Use NextAuth.js for authentication
- Use `next/image` for optimized images
- Use `next/link` for client-side navigation

### API Routes
- Always use api-middleware helpers for consistent responses
- Validate all request bodies with Zod schemas
- Use Prisma-generated types, never create manual DB interfaces

### Package Manager
- ALWAYS use pnpm, never npm or yarn
```

---

## Django / Django REST Framework

```markdown
### Django Rules
- Use class-based views for CRUD operations
- Use function-based views for custom logic
- Always use Django ORM, avoid raw SQL queries
- Run `makemigrations` + `migrate` after model changes
- Use Django REST Framework serializers for API validation
- Use `select_related()` and `prefetch_related()` to avoid N+1 queries
- Keep views thin, put business logic in services/managers
- Use Django's built-in auth system, don't roll your own

### Testing
- Use pytest-django with factory_boy for test data
- Test views, serializers, and models separately
```

---

## FastAPI

```markdown
### FastAPI Rules
- Use Pydantic models for request/response validation
- Use dependency injection for database sessions and auth
- Always define `response_model` on endpoints
- Use `async def` for I/O-bound endpoints, `def` for CPU-bound
- Use SQLAlchemy with Alembic for database migrations
- Group routes with APIRouter
- Use BackgroundTasks for non-blocking operations

### Testing
- Use TestClient for API testing
- Use pytest with async fixtures
```

---

## React Native / Expo

```markdown
### React Native Rules
- Use React Navigation for routing
- Handle platform differences with `Platform.select()`
- Test on both iOS and Android simulators
- Use `SafeAreaView` for notch handling
- Use `FlatList` for long lists (never `ScrollView` with map)
- Handle keyboard avoidance properly
- Use Expo APIs when available, eject only when necessary

### Performance
- Use `React.memo()` for list items
- Avoid inline styles in render methods
- Use Hermes engine for improved startup time
```

---

## Flask

```markdown
### Flask Rules
- Use Blueprints for modular route organization
- Use Flask-SQLAlchemy for database operations
- Use Flask-Marshmallow for serialization/validation
- Use Flask-Login or Flask-JWT-Extended for auth
- Keep routes thin, business logic in services
- Use application factory pattern (`create_app()`)

### Testing
- Use pytest with Flask test client
- Use factory fixtures for test data
```

---

## Go (Gin / Echo)

```markdown
### Go Rules
- Use interfaces for dependency injection
- Keep handler functions thin, delegate to services
- Use middleware for cross-cutting concerns (auth, logging)
- Handle errors explicitly, never ignore `err` returns
- Use `context.Context` for request-scoped values
- Use `go vet` and `golangci-lint` before committing
- Write table-driven tests

### Database
- Use GORM or sqlx for database operations
- Use golang-migrate for schema migrations
```

---

## Adding Your Framework

If your framework isn't listed above, create a section following this pattern:

```markdown
### [Framework] Rules
- [Core convention 1]
- [Core convention 2]
- [Database/ORM pattern]
- [Authentication approach]
- [Testing approach]
- [Package manager requirement]

### [Framework] Anti-Patterns
- [Common mistake and fix]
```
