# Troubleshooting Guide

Common issues and solutions. Add new entries as you encounter and resolve problems.

## How to Use
- Search for your error message or issue description
- Follow the recommended solution
- If issue not listed, document problem and solution here after resolving

---

## Build Errors: Module-Level Environment Variables

### Problem
Accessing `process.env` at module level causes build failures when env vars aren't available during build.

### Solution
Wrap in async factory functions:

```typescript
// INCORRECT
const API_KEY = process.env.SECRET_KEY; // Runs at build time!
const client = new Client({ apiKey: API_KEY });

// CORRECT
export async function createClient() {
  const apiKey = process.env.SECRET_KEY;
  if (!apiKey) throw new Error('SECRET_KEY required');
  return new Client({ apiKey });
}
```

---

## TypeScript: Missing Type Definitions

### Problem
`Type 'X' is not assignable to type 'Y'` or missing properties.

### Solution
1. Check if using ORM types - import generated types
2. For external APIs, import official type definitions
3. For custom data, define proper interfaces

---

## Infinite Loops in Effect Hooks

### Problem
Component re-renders infinitely, browser becomes unresponsive.

### Solution
Wrap functions in memoization when used as dependencies:

```typescript
// INCORRECT
const loadData = () => { /* ... */ };
useEffect(() => { loadData(); }, [loadData]); // Infinite loop

// CORRECT
const loadData = useCallback(() => { /* ... */ }, [dep1, dep2]);
useEffect(() => { loadData(); }, [loadData]); // Stable reference
```

---

## Import Resolution Failures

### Problem
`Cannot find module` or `Module not found` errors after refactoring.

### Solution
1. Verify the file exists at the expected path
2. Check for typos in import path
3. Verify the export exists in the source file
4. Check for circular dependencies
5. Clear build cache and rebuild

---

## Test Failures After Refactoring

### Problem
Tests fail after moving code to new files.

### Solution
1. Update import paths in test files
2. Check that all exports are preserved
3. Verify mock configurations still match
4. Run type checker to catch import errors early

---

## Reporting New Issues

When you encounter a new recurring issue, add a section with:
- Description of the problem
- Error message (if any)
- Solution or workaround
- Sample code if applicable
