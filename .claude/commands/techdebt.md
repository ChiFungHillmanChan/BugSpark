# Tech Debt Scanner

Scan the codebase for technical debt, violations, and improvement opportunities.

## Usage

Run `/techdebt` to scan the project for common issues.

## Scan Categories

### 1. File Size Violations (>300 lines)

```bash
# Find files exceeding 300 lines
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" | \
  grep -v node_modules | grep -v .next | grep -v dist | grep -v build | \
  xargs wc -l | sort -rn | awk '$1 > 300 {print}'
```

### 2. `any` Type Usage (TypeScript)

```bash
# Find uses of 'any' type
grep -rn ": any" --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist | \
  grep -v "node_modules" | grep -v ".d.ts"
```

### 3. Lint/Type Suppressions

```bash
# Find eslint-disable and ts-ignore comments
grep -rn "eslint-disable\|@ts-ignore\|@ts-expect-error\|@ts-nocheck" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --exclude-dir=node_modules
```

### 4. TODO/FIXME/HACK Comments

```bash
# Find technical debt markers
grep -rn "TODO\|FIXME\|HACK\|XXX\|WORKAROUND" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.go" --include="*.rs" \
  --exclude-dir=node_modules --exclude-dir=.next
```

### 5. Duplicated Code Patterns

Look for:
- Functions with similar names across files
- Copy-pasted utility functions
- Repeated error handling patterns
- Similar API call patterns

### 6. Unused Dependencies

```bash
# Check for unused packages (Node.js)
# npx depcheck

# Check for outdated packages
# npm outdated / pnpm outdated
```

### 7. Empty Catch Blocks

```bash
grep -rn "catch.*{" --include="*.ts" --include="*.tsx" -A1 \
  --exclude-dir=node_modules | grep -B1 "^[^}]*}$"
```

## Output Format

Generate a report in this format:

```
===== TECH DEBT REPORT =====
Generated: [date]

## Critical (Fix Now)
- [file:line] Description of issue

## High (Fix This Sprint)
- [file:line] Description of issue

## Medium (Plan to Fix)
- [file:line] Description of issue

## Low (When Convenient)
- [file:line] Description of issue

## Summary
- Files over 300 lines: [count]
- `any` type usages: [count]
- Lint suppressions: [count]
- TODO/FIXME markers: [count]
- Estimated debt items: [total]
```

## When to Run

- Before starting a new sprint/milestone
- After a large feature merge
- Monthly as a health check
- Before major refactoring efforts
