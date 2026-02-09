# Automatic Cleanup Detection

Patterns to detect and fix common code quality issues.

## Detection Patterns & Fixes

### Infinite Loop Detection

**Detect When:**
- Functions with dependencies that aren't memoized
- Object literals recreated in dependency tracking
- Circular references between modules

**Fix Pattern:**
Memoize functions used as dependencies, stabilize object references.

### State Management Issues

**Detect When:**
- Excessive parameter passing (5+ parameters)
- Data drilling through 3+ layers
- Complex interdependent state logic

**Fix Pattern:**
Use a state management solution (context, store, service) to avoid prop drilling.

### Module Size Violations

**Detect When:**
- Modules exceeding 300 lines
- Classes/modules with multiple unrelated responsibilities

**Fix Pattern:**
Split into focused modules using extraction patterns. One responsibility per file.

### Resource Leak Detection

**Detect When:**
- Setup functions without cleanup return
- Event listeners added without removal
- Connections opened without cleanup
- Subscriptions without unsubscribe

**Fix Pattern:**
```typescript
function setupService() {
  const subscription = dataSource.subscribe(callback);
  return () => { // Cleanup
    subscription.unsubscribe();
  };
}
```

### Type Safety Issues

**Detect When:**
- Usage of untyped parameters
- Missing null checks before property access
- Using `||` incorrectly for default values

**Fix Pattern:**
```typescript
// DETECTED:
const value = data.field || 'default'; // Wrong for 0 or ''

// FIX:
const value = data.field ?? 'default'; // Correct for nullish
```

### Race Condition Patterns

**Detect When:**
- State updates after async operations without validation
- Event processing without connection status checks
- Stale state access in async callbacks

**Fix Pattern:**
Add defensive checks for connection/component state before processing async results.

## Priority Levels

1. **Critical**: Infinite loops, memory leaks, race conditions
2. **Warning**: Module size, parameter drilling, type safety
3. **Info**: Code organization, documentation suggestions

## Quick Reference

| Issue | Detection | Fix |
|-------|-----------|-----|
| Infinite loop | Function in deps without memoization | Memoize the function |
| Prop drilling | 5+ params or 3+ levels | Use state management |
| Large file | >300 lines | Split into modules |
| Memory leak | Setup without cleanup | Return cleanup function |
| Type unsafe | any, missing guards | Add proper types |
| Race condition | No status check | Add defensive checks |
