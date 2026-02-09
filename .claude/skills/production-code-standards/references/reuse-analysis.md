# Reuse Analysis Patterns

## Overview

Before writing ANY new code, perform systematic reuse analysis. This prevents duplication and maintains a clean, maintainable codebase.

## Step 1: Check Structure Registry

```bash
# First stop - check documented functions/components
cat readme/structure.md | grep -i "keyword"
```

**What to look for:**
- Functions with similar purpose
- Components with overlapping functionality
- Utilities that could be extended

## Step 2: Search Existing Code

### By Function Pattern
```bash
# Find similar function names
grep -r "function.*keyword" server/ --include="*.ts"
grep -r "const.*keyword.*=" server/ --include="*.ts"
```

### By Functionality
```bash
# Find usage patterns
grep -r "fetch.*api" server/app/services/
grep -r "validate.*" server/lib/
```

### By Type
```bash
# Find type definitions
grep -r "interface.*Name" server/app/types/
grep -r "type.*Name" server/app/types/
```

## Step 3: Centralization Locations

### Utilities (`server/lib/`)
| File | Contains |
|------|----------|
| `utils.ts` | General utilities |
| `api-middleware.ts` | API helpers |
| `subscription-utils.ts` | Subscription logic |
| `document-sanitize.ts` | HTML sanitization |
| `ai-models.ts` | AI model registry |

### Services (`server/app/services/`)
| File | Contains |
|------|----------|
| `openai.ts` | OpenAI client factory |
| `gemini.ts` | Gemini client factory |
| `gamma.ts` | Gamma client factory |
| `google-tts.ts` | TTS client factory |

### Hooks (`server/app/hooks/`)
Shared React hooks for common patterns

### Components (`client/`)
Shared UI components

## Step 4: Extension vs New Creation

### When to EXTEND existing code:
- Similar functionality exists (80%+ overlap)
- Adding a parameter solves the difference
- Logic can be made generic
- Original code is well-tested

### When to CREATE new code:
- No similar functionality exists
- Extending would violate SRP
- Use case is genuinely unique
- Coupling would be harmful

## Step 5: Document New Code

After creating new reusable code:

```markdown
# Update readme/structure.md

## New Entry Format:
| Name | Location | Purpose |
|------|----------|---------|
| functionName | server/lib/utils.ts | Brief description |
```

## Common Reuse Opportunities

### API Response Handling
```typescript
// WRONG: Duplicate in each route
return NextResponse.json({ error: 'Not found' }, { status: 404 });

// RIGHT: Use shared helper
import { apiError } from '@/lib/api-middleware';
return apiError('Not found', 404);
```

### Validation Schemas
```typescript
// WRONG: Duplicate schema per route
const schema = z.object({ email: z.string().email() });

// RIGHT: Centralized schemas
import { emailSchema } from '@/lib/validation-schemas';
```

### Type Definitions
```typescript
// WRONG: Inline types per file
interface User { id: string; name: string; }

// RIGHT: Shared types
import type { User } from '@/app/types/user';
```

## Anti-Patterns

| Pattern | Problem | Solution |
|---------|---------|----------|
| Copy-paste between files | Maintenance nightmare | Extract to shared module |
| Similar functions with slight variations | Inconsistent behavior | Parameterize single function |
| Inline type definitions | Type drift | Centralize in types/ |
| Hardcoded values | No single source of truth | Use constants file |
| Local utility functions | Hidden reuse opportunity | Move to lib/ if used 2+ times |

## Checklist

Before creating new code:
- [ ] Searched `readme/structure.md`
- [ ] Ran grep for similar patterns
- [ ] Checked `server/lib/` for utilities
- [ ] Checked `server/app/services/` for services
- [ ] Confirmed no duplication will occur

After creating new reusable code:
- [ ] Added entry to `readme/structure.md`
- [ ] Placed in appropriate centralized location
- [ ] Documented with JSDoc comments
