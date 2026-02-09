# Cost-Effective Implementation

## Principle

**Simplest solution that meets requirements.** Every dependency, abstraction, or pattern has a cost. Only pay that cost when the benefit exceeds it.

## Decision Framework

### Before Adding a Dependency

| Question | If No | If Yes |
|----------|-------|--------|
| Is native API insufficient? | Use native | Continue |
| Used in 3+ places? | Inline solution | Continue |
| Bundle size < 10KB? | Reconsider | Continue |
| Actively maintained? | Find alternative | Add dependency |

### Before Creating Abstraction

| Question | If No | If Yes |
|----------|-------|--------|
| Repeated 3+ times? | Keep inline | Consider abstraction |
| Likely to change together? | Keep separate | Abstract |
| Reduces complexity? | Don't abstract | Abstract |
| Easy to understand? | Simplify first | Proceed |

## Native vs Library

### Use Native APIs

| Need | Native Solution | Skip This Library |
|------|-----------------|-------------------|
| HTTP requests | `fetch()` | axios (simple cases) |
| Date formatting | `Intl.DateTimeFormat` | moment.js, date-fns |
| Array operations | `.map()`, `.filter()` | lodash (most cases) |
| Object cloning | `structuredClone()` | lodash.cloneDeep |
| UUID generation | `crypto.randomUUID()` | uuid package |
| URL parsing | `URL` class | query-string |
| Form validation | HTML5 + Zod | formik (simple forms) |

### When Libraries Are Worth It

| Need | Use Library | Because |
|------|-------------|---------|
| Complex forms | React Hook Form | Performance, UX |
| Schema validation | Zod | Type inference |
| State management | Zustand | Simplicity |
| Date manipulation | date-fns (tree-shaken) | Complex operations |
| Animation | Framer Motion | Complex animations |

## Project-Specific Choices

### This Project Uses

| Category | Choice | Why |
|----------|--------|-----|
| Styling | TailwindCSS | Utility-first, no runtime |
| State | Zustand + React hooks | Minimal, no boilerplate |
| Validation | Zod | TypeScript integration |
| ORM | Prisma | Type-safe, migrations |
| Auth | NextAuth.js | Next.js integration |
| i18n | next-intl | SSR support |

### Don't Add

| Library | Reason |
|---------|--------|
| Redux | Zustand is simpler |
| styled-components | TailwindCSS is standard |
| axios | fetch is sufficient |
| moment.js | date-fns or native |
| lodash | Native methods |
| jQuery | React handles DOM |

## Pattern Costs

### Over-Engineering Signs

```typescript
// OVER: Abstract factory for one implementation
class UserRepositoryFactory {
  static create(): IUserRepository {
    return new PrismaUserRepository();
  }
}

// SIMPLE: Direct usage
import { prisma } from '@/lib/prisma';
const users = await prisma.user.findMany();
```

```typescript
// OVER: Generic for single use
function createFetcher<T, P>(
  endpoint: string,
  transform: (data: T) => P
): (id: string) => Promise<P> { }

// SIMPLE: Direct function
async function getUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`).then(r => r.json());
}
```

### Right-Sized Patterns

```typescript
// RIGHT: Abstraction with 3+ uses
const apiClient = {
  get: <T>(url: string) => fetch(url).then(r => r.json() as T),
  post: <T>(url: string, data: unknown) =>
    fetch(url, { method: 'POST', body: JSON.stringify(data) })
      .then(r => r.json() as T),
};

// Usage in multiple places
const user = await apiClient.get<User>('/api/user/1');
const posts = await apiClient.get<Post[]>('/api/posts');
```

## Bundle Size Impact

### Check Before Adding
```bash
# Check package size
npx bundle-size package-name

# Analyze current bundle
pnpm run build
npx @next/bundle-analyzer
```

### Size Guidelines

| Package Size | Guideline |
|--------------|-----------|
| < 5KB | Generally acceptable |
| 5-20KB | Justify the value |
| 20-50KB | Must be essential |
| > 50KB | Need strong justification |

## Cost-Benefit Checklist

Before implementation:
- [ ] Can native APIs solve this? (5 min check)
- [ ] Does similar logic exist in codebase?
- [ ] Is this the simplest solution?
- [ ] Will future maintainers understand this?

Before adding dependency:
- [ ] Bundle size checked
- [ ] Alternatives evaluated
- [ ] Tree-shaking possible?
- [ ] Maintenance status verified

Before creating abstraction:
- [ ] Used 3+ times (or will be)?
- [ ] Reduces net complexity?
- [ ] Clear interface?
- [ ] Easy to remove if wrong?
