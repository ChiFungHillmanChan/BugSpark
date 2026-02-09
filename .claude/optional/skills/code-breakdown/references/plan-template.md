# Extraction Plan Template

## How to Use

1. Copy this template
2. Fill in all sections
3. Present to user for approval
4. Only proceed after explicit approval

---

# Extraction Plan: [Filename]

## Overview

| Metric | Value |
|--------|-------|
| File | `[path/to/file.ts]` |
| Current Lines | [X] |
| Target per File | 200-300 |
| Estimated New Files | [N] |
| Risk Level | [Low/Medium/High] |

## Current Structure Analysis

### Logical Sections Identified

| Section | Lines | Extraction Priority |
|---------|-------|---------------------|
| [Section 1 name] | [X] | [1-High/2-Medium/3-Low] |
| [Section 2 name] | [X] | [1-High/2-Medium/3-Low] |
| [Section 3 name] | [X] | [1-High/2-Medium/3-Low] |

### Dependencies Map

```
[Original File]
├── Internal deps: [list functions that call each other]
├── External imports: [list external packages used]
└── External consumers: [list files that import from this]
```

### Public API (Must Preserve)

```typescript
// These exports MUST remain available after extraction
export { functionA, functionB, TypeC, CONSTANT_D };
```

## Test Coverage Status

| Metric | Current | Required | Status |
|--------|---------|----------|--------|
| Function Coverage | [X]% | 80% | [Pass/Fail] |
| Line Coverage | [X]% | 70% | [Pass/Fail] |
| Existing Tests | [N] | - | - |

**Tests to Generate Before Extraction:**
- [ ] [Test description 1]
- [ ] [Test description 2]

## Extraction Steps

### Step 1: [Description]

**Action:** Extract [what] to [new location]

| Detail | Value |
|--------|-------|
| Functions | `[func1, func2, func3]` |
| New File | `[path/to/new-file.ts]` |
| Lines Moved | ~[X] |
| New File Size | ~[Y] lines |

**Import Changes:**
```typescript
// Original file will add:
import { func1, func2 } from './new-file';

// External consumers: no change (re-export from original)
```

**Verification:**
```bash
pnpm vitest run
pnpm tsc --noEmit
```

---

### Step 2: [Description]

**Action:** Extract [what] to [new location]

| Detail | Value |
|--------|-------|
| Functions | `[func4, func5]` |
| New File | `[path/to/another-file.ts]` |
| Lines Moved | ~[X] |
| New File Size | ~[Y] lines |

**Import Changes:**
```typescript
// [describe changes]
```

**Verification:**
```bash
pnpm vitest run
pnpm tsc --noEmit
```

---

### Step 3: [Description]

[Repeat pattern for each step]

---

## Final State

### File Structure After Extraction

```
[directory]/
├── [original-file].ts ([X] lines) - [what remains]
├── [new-file-1].ts ([Y] lines) - [purpose]
├── [new-file-2].ts ([Z] lines) - [purpose]
└── [new-file-3].ts ([W] lines) - [purpose]
```

### Size Verification

| File | Lines | Within Limit? |
|------|-------|---------------|
| [original] | [X] | [Yes/No] |
| [new-1] | [Y] | [Yes/No] |
| [new-2] | [Z] | [Yes/No] |

## Risk Assessment

### High Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| [Area 1] | [Description] | [How to handle] |
| [Area 2] | [Description] | [How to handle] |

### Rollback Strategy

```bash
# If any step fails:
git checkout -- .
git clean -fd

# If committed steps need rollback:
git revert HEAD~[N]..HEAD
```

## Approval

**Review the above plan carefully.**

- [ ] File structure is acceptable
- [ ] Extraction steps are logical
- [ ] Risk mitigations are adequate
- [ ] Test coverage is sufficient

**Approval:** [ ] I approve this extraction plan

---

## Execution Log

*Filled during execution*

| Step | Status | Tests | Commit |
|------|--------|-------|--------|
| 1 | [Pending/Done/Failed] | [Pass/Fail] | [hash] |
| 2 | [Pending/Done/Failed] | [Pass/Fail] | [hash] |
| 3 | [Pending/Done/Failed] | [Pass/Fail] | [hash] |

**Final Status:** [Complete/Aborted at Step N]
