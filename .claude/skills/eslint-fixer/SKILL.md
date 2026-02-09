---
name: eslint-fixer
description: Use when fixing ESLint errors, running lint commands, or resolving TypeScript/JavaScript code quality issues. Automatically diagnoses and fixes linting problems.
allowed-tools: Read, Edit, Bash, Glob, Grep
---

# ESLint Fixer

## Required Rules

**CRITICAL: Before proceeding, load these project rules using the Skill tool:**
- `typescript-rules` - Type safety, no `any`, proper typing patterns
- `error-handling` - No eslint-disable, no ts-ignore, fix root causes

These rules define what fixes are acceptable and what is FORBIDDEN.

## Overview

Systematically diagnose and fix ESLint, TypeScript, and code quality issues in JavaScript/TypeScript projects.

## When to Use

- After running `npx next lint` or `pnpm lint`
- When build fails due to linting errors
- When IDE shows red squiggly lines
- To clean up code before commit/PR

## Process

### 1. Diagnose

Run the appropriate lint command:
```bash
npx next lint          # Next.js projects
pnpm lint              # If configured in package.json
npx eslint . --ext .ts,.tsx,.js,.jsx
```

### 2. Categorize Errors

| Category | Examples | Fix Strategy |
|----------|----------|--------------|
| **Type Errors** | `any` type, missing types | Add explicit types, use `unknown` |
| **Import Issues** | Unused imports, wrong paths | Remove unused, fix paths |
| **React Rules** | Missing keys, hooks deps | Add keys, fix dependency arrays |
| **Formatting** | Spacing, quotes, semicolons | Run Prettier or auto-fix |
| **Code Quality** | Unused vars, no-console | Remove or comment with reason |

### 3. Fix Strategies

#### Auto-fix (safe)
```bash
npx next lint --fix
npx eslint . --fix
npx prettier --write .
```

#### Manual fixes by type

**Unused variables:**
```typescript
// Remove if truly unused
// Or prefix with underscore: _unusedVar
// Or use in code
```

**Missing dependencies in useEffect:**
```typescript
// Add to dependency array
useEffect(() => { ... }, [missingDep]);
// Or use useCallback/useMemo for functions
```

**`any` type violations:**
```typescript
// Replace with specific type
// Or use `unknown` with type guard
function process(data: unknown) {
  if (isValidData(data)) { ... }
}
```

**No-console errors:**
```typescript
// Use logger utility
import { logger } from '@/lib/logger';
logger.info('message');
// Or disable for specific line with reason:
// eslint-disable-next-line no-console -- Debug output for development
```

### 4. Verify

```bash
npx next lint        # Should show no errors
npx tsc --noEmit     # Type check passes
pnpm run build       # Full build passes
```

## Common ESLint Rules & Fixes

| Rule | Issue | Fix |
|------|-------|-----|
| `@typescript-eslint/no-explicit-any` | Using `any` | Use specific type or `unknown` |
| `@typescript-eslint/no-unused-vars` | Declared but unused | Remove or prefix with `_` |
| `react-hooks/exhaustive-deps` | Missing deps | Add deps or use useCallback |
| `react/jsx-key` | Missing key in list | Add unique `key` prop |
| `@next/next/no-img-element` | Using `<img>` | Use `next/image` |
| `import/no-unresolved` | Bad import path | Fix path or install package |
| `no-console` | Console statements | Use logger or disable with reason |

## Red Flags

- Don't use `// eslint-disable` without a comment explaining why
- Don't add `any` to silence type errors
- Don't remove hooks dependencies without understanding implications
- Don't ignore errors in build output

## Integration with Build

Always verify fixes don't break the build:
```bash
pnpm run build
```

If build still fails after lint fixes, check for:
- Type errors (separate from lint)
- Missing imports after removing "unused" ones
- Runtime issues from dependency array changes
