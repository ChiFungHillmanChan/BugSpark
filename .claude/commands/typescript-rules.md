# TypeScript & JavaScript Rules

Best practices for TypeScript and JavaScript development.

> **Note**: Skip this command if your project does not use TypeScript/JavaScript.

## Variable Usage
- ALWAYS use `const` for variables that aren't reassigned
- Use `let` only for variables that will be reassigned
- NEVER use `var`

## Nullish Coalescing
- ALWAYS use `??` instead of `||` for default values
- `||` can incorrectly treat `0`, `''`, and `false` as falsy

## TypeScript Best Practices

### Strict Type Safety - No `any` in Controlled Code
- **NEVER use `any`** in internal code we control
- Define proper interfaces or type aliases for all data structures
- Use generics where appropriate
- NEVER use `// @ts-ignore` or `// eslint-disable-next-line`
- Create utility types for complex transformations

### Strategic Use of `unknown`
Only use `unknown` when the type genuinely cannot be known at compile time:
- External API responses from third-party services
- Data from third-party libraries without TypeScript definitions
- User input where structure is truly unpredictable

**NEVER use `unknown` as a lazy alternative to proper typing.**

### Proper Type Verification for `unknown`
When `unknown` is used, implement proper type guards or validation:

```typescript
if (!isValidUserResponse(response)) {
  throw new Error(
    `Unexpected API response structure from /api/users. ` +
    `Expected UserResponse but received: ${JSON.stringify(response)}.`
  );
}
```

### Maintain Consistent Type Signatures
- Ensure function parameter and return types are consistent
- Use the same type definitions for similar data structures
- Extract shared types to dedicated type files

### Prefer Explicit Types
- Explicitly type function parameters and returns
- Document complex types with comments

## React Hooks Rules (if applicable)

### useEffect Dependencies
- ALWAYS include all variables from outer scope used inside effects
- Use ESLint rule `react-hooks/exhaustive-deps`
- Wrap functions in `useCallback` when used as dependencies
- Wrap objects/arrays in `useMemo` when used as dependencies

### Hook Guidelines
- State setters from `useState` are stable - don't include in deps
- Refs from `useRef` don't trigger re-renders
- Never update state unconditionally in useEffect
- Return memoized functions from custom hooks
- Use "use" prefix for all custom hooks

## Component Best Practices (if applicable)
- Split large components into smaller, focused ones
- Keep component files under 300 lines
- Extract complex logic into custom hooks
