---
name: techdebt-scanner
description: Automated technical debt detection. Scans for file size violations, any usage, duplicated code, TODO/FIXME markers, lint suppressions, and unused dependencies.
---

# Tech Debt Scanner

## When to Use

- Before starting a new sprint/milestone
- After a large feature merge
- Monthly as a health check
- Before major refactoring efforts

## Scanning Process

### Step 1: File Size Violations

Scan for files exceeding 300 lines:
```bash
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" | \
  grep -v node_modules | grep -v dist | grep -v build | grep -v .next | \
  xargs wc -l | sort -rn | awk '$1 > 300 {print}'
```

### Step 2: Type Safety Issues (TypeScript)

Find `any` type usage:
```bash
grep -rn ": any" --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=dist | grep -v ".d.ts"
```

### Step 3: Lint/Type Suppressions

Find suppression comments:
```bash
grep -rn "eslint-disable\|@ts-ignore\|@ts-expect-error\|@ts-nocheck\|# type: ignore\|# noqa" \
  --exclude-dir=node_modules --exclude-dir=dist
```

### Step 4: TODO/FIXME Markers

```bash
grep -rn "TODO\|FIXME\|HACK\|XXX\|WORKAROUND" \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next
```

### Step 5: Duplicate Code Patterns

Look for:
- Functions with similar names across different files
- Copy-pasted utility functions
- Repeated error handling patterns

### Step 6: Dependency Health

```bash
# Node.js
npx depcheck          # Unused dependencies
npm outdated          # Outdated packages
npm audit             # Known vulnerabilities

# Python
pip list --outdated
safety check
```

## Report Format

```
===== TECH DEBT REPORT =====
Generated: [date]

## Critical (Fix Now)
- [file:line] Description

## High (Fix This Sprint)
- [file:line] Description

## Medium (Plan to Fix)
- [file:line] Description

## Low (When Convenient)
- [file:line] Description

## Summary
- Files over 300 lines: [count]
- any usages: [count]
- Lint suppressions: [count]
- TODO/FIXME markers: [count]
- Total debt items: [count]
```

## Reference

See `references/scanning-patterns.md` for additional detection patterns.
