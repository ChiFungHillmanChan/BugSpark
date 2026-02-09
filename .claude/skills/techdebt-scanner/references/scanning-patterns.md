# Tech Debt Scanning Patterns

## Additional Detection Patterns

### Empty Catch Blocks
```bash
grep -rn "catch.*{" --include="*.ts" --include="*.tsx" -A1 \
  --exclude-dir=node_modules | grep -B1 "^\s*}$"
```

### Console.log Statements (Production Code)
```bash
grep -rn "console\.\(log\|warn\|error\|debug\)" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=tests --exclude-dir=__tests__
```

### Magic Numbers
Look for numeric literals that should be named constants:
- HTTP status codes inline instead of constants
- Timeout values without named variables
- Array indices without explanation

### Dead Code Indicators
- Commented-out code blocks (>3 lines)
- Functions with no callers
- Unreachable code after return statements
- Unused imports

### Complexity Indicators
- Functions with >5 parameters
- Nesting depth >3 levels
- Files with >10 imports
- Functions >50 lines

### Security Debt
- Hardcoded URLs or API endpoints
- Missing input validation on API routes
- Unparameterized database queries
- Missing rate limiting on public endpoints
