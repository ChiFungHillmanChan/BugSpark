# Safety Testing for Code Breakdown

## Principle

**Tests are the safety net.** No extraction proceeds without passing tests. No test failure is ignored.

## Pre-Extraction Requirements

### Step 1: Verify Existing Tests

```bash
# Find existing tests
find . -name "*.test.ts" -o -name "*.spec.ts" | xargs grep -l "filename"

# Run tests for target file
pnpm vitest run path/to/file.test.ts

# Check coverage
pnpm vitest run --coverage path/to/file.test.ts
```

### Step 2: Coverage Thresholds

| Coverage Type | Minimum | Recommended |
|---------------|---------|-------------|
| Functions | 80% | 95% |
| Lines | 70% | 90% |
| Branches | 60% | 80% |

If below thresholds, generate tests BEFORE extraction.

### Step 3: Generate Missing Tests

```typescript
// Characterization test template
import { describe, it, expect } from 'vitest';
import { functionToExtract } from './original-file';

describe('functionToExtract - Characterization', () => {
  it('captures current behavior with typical input', () => {
    const result = functionToExtract(typicalInput);
    expect(result).toMatchSnapshot();
  });

  it('captures current behavior with edge case', () => {
    const result = functionToExtract(edgeCaseInput);
    expect(result).toMatchSnapshot();
  });

  it('handles null/undefined gracefully', () => {
    expect(() => functionToExtract(null)).not.toThrow();
  });

  it('returns expected type', () => {
    const result = functionToExtract(validInput);
    expect(typeof result).toBe('expected_type');
  });
});
```

## During Extraction

### Test After Every Step

```bash
# After EACH extraction step
pnpm vitest run

# If any test fails
git checkout -- .
git clean -fd
# STOP - do not continue
```

### What Counts as a Step

| Action | Is a Step? | Run Tests? |
|--------|------------|------------|
| Create new file | Yes | Yes |
| Move function | Yes | Yes |
| Update import | No (part of move) | - |
| Update external consumer | Yes | Yes |
| Rename export | Yes | Yes |

## Test Failure Protocol

### Immediate Response

```bash
# 1. DO NOT fix the code
# 2. DO NOT modify tests
# 3. Capture the failure
pnpm vitest run 2>&1 | tee test-failure.log

# 4. Revert all changes
git checkout -- .
git clean -fd
```

### Failure Report Template

```markdown
## Extraction Test Failure

**Extraction Step:** [N] - [description]
**Time:** [timestamp]

### Failed Test
- File: [test file path]
- Test: [test name]
- Error: [error message]

### Stack Trace
```
[paste stack trace]
```

### Analysis
- **Root Cause Hypothesis:** [your analysis]
- **Affected Code:** [file:line]
- **Dependency Issue?:** [yes/no - explain]

### Recommendations
1. [First recommendation]
2. [Second recommendation]

### Files Changed Before Failure
- [list files modified]
```

## Post-Extraction Validation

### Full Test Suite

After all extractions complete:
```bash
# Run full test suite
pnpm vitest run

# Run with coverage
pnpm vitest run --coverage

# Verify no coverage regression
# Compare before/after coverage reports
```

### Import Verification

```bash
# Verify no broken imports
pnpm tsc --noEmit

# Check for unused exports
npx ts-prune
```

### Performance Validation

```bash
# Build to check bundle impact
pnpm run build

# Compare bundle sizes before/after
# No significant increase expected for refactor
```

## Test Categories

### Must Pass (Blocking)

| Test Type | Purpose |
|-----------|---------|
| Unit tests | Function behavior |
| Integration tests | Component interaction |
| Type checks | TypeScript validity |

### Should Pass (Warning)

| Test Type | Purpose |
|-----------|---------|
| E2E tests | Full flow verification |
| Performance tests | No regression |
| Lint checks | Code style |

## Vitest Commands Reference

```bash
# Run all tests
pnpm vitest run

# Run specific test file
pnpm vitest run path/to/file.test.ts

# Run tests matching pattern
pnpm vitest run -t "pattern"

# Watch mode (during development)
pnpm vitest

# With coverage
pnpm vitest run --coverage

# Verbose output
pnpm vitest run --reporter=verbose
```

## Common Test Failures After Extraction

| Failure | Cause | Fix |
|---------|-------|-----|
| Import not found | Path changed | Update import path |
| Export not found | Not re-exported | Add to index.ts |
| Type mismatch | Generic lost | Preserve type params |
| Mock not working | Path changed | Update mock path |
| Snapshot mismatch | Output changed | Investigate - may be bug |

## Snapshot Handling

### During Extraction
- **DO NOT** update snapshots
- Snapshot changes indicate behavior change
- Behavior changes during refactor = BUG

### After Extraction Complete
```bash
# Only if intentional format change (e.g., path in output)
pnpm vitest run --update
```
