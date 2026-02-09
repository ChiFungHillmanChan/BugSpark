# Extraction Patterns

## Pattern Selection Guide

| Code Pattern | Extraction Strategy | New File Location |
|--------------|--------------------|--------------------|
| Related utility functions | Utility module | `lib/[domain]-utils.ts` |
| React component sections | Sub-components | `components/[parent]/` |
| Type definitions | Types file | `types/[domain].ts` |
| Constants block | Constants file | `lib/constants/[domain].ts` |
| Business logic | Service class | `services/[domain]-service.ts` |
| Custom hook logic | Hook file | `hooks/use-[name].ts` |
| API handlers | Handler modules | `api/[route]/handlers/` |

## Pattern 1: Extract Utility Functions

### Before
```typescript
// big-module.ts (1200 lines)
export function processData(data: Data) { /* 50 lines */ }
export function validateData(data: Data) { /* 30 lines */ }
export function transformData(data: Data) { /* 40 lines */ }
export function formatData(data: Data) { /* 25 lines */ }
// ... 1000+ more lines of other logic
```

### After
```typescript
// data-utils.ts (145 lines)
export function processData(data: Data) { /* 50 lines */ }
export function validateData(data: Data) { /* 30 lines */ }
export function transformData(data: Data) { /* 40 lines */ }
export function formatData(data: Data) { /* 25 lines */ }

// big-module.ts (1055 lines - still needs more extraction)
import { processData, validateData } from './data-utils';
```

### Extraction Steps
1. Create `data-utils.ts`
2. Move functions with their dependencies
3. Add exports in new file
4. Update imports in original
5. Update any external consumers
6. Run `pnpm vitest run`

## Pattern 2: Extract Sub-Components

### Before
```typescript
// BigComponent.tsx (1500 lines)
export function BigComponent() {
  // Header logic (100 lines)
  // Sidebar logic (200 lines)
  // Main content logic (400 lines)
  // Footer logic (100 lines)

  return (
    <div>
      {/* Header JSX (50 lines) */}
      {/* Sidebar JSX (100 lines) */}
      {/* Main JSX (200 lines) */}
      {/* Footer JSX (50 lines) */}
    </div>
  );
}
```

### After
```
big-component/
├── index.tsx (80 lines) - Composition
├── BigComponentHeader.tsx (150 lines)
├── BigComponentSidebar.tsx (300 lines)
├── BigComponentMain.tsx (600 lines) - may need further split
├── BigComponentFooter.tsx (150 lines)
└── use-big-component.ts (200 lines) - shared state/logic
```

### Extraction Steps
1. Create directory structure
2. Extract shared hook first (state management)
3. Extract smallest component (Footer)
4. Run tests
5. Extract next component (Header)
6. Run tests
7. Continue until original is composition only

## Pattern 3: Extract Types

### Before
```typescript
// service.ts (1100 lines)
interface UserData { /* 20 lines */ }
interface UserPreferences { /* 15 lines */ }
interface UserSession { /* 25 lines */ }
type UserRole = 'admin' | 'user' | 'guest';
type UserStatus = 'active' | 'inactive' | 'pending';

export class UserService {
  // ... 1000+ lines of implementation
}
```

### After
```typescript
// types/user.ts (60 lines)
export interface UserData { /* 20 lines */ }
export interface UserPreferences { /* 15 lines */ }
export interface UserSession { /* 25 lines */ }
export type UserRole = 'admin' | 'user' | 'guest';
export type UserStatus = 'active' | 'inactive' | 'pending';

// service.ts (1040 lines)
import type { UserData, UserPreferences, UserSession } from '@/types/user';
```

## Pattern 4: Extract API Handlers

### Before
```typescript
// route.ts (1200 lines)
export async function GET(req: Request) { /* 300 lines */ }
export async function POST(req: Request) { /* 400 lines */ }
export async function PUT(req: Request) { /* 300 lines */ }
export async function DELETE(req: Request) { /* 200 lines */ }
```

### After
```
api/resource/
├── route.ts (60 lines) - routing only
├── handlers/
│   ├── get.ts (300 lines)
│   ├── post.ts (400 lines) - may need split
│   ├── put.ts (300 lines)
│   └── delete.ts (200 lines)
├── schemas.ts (80 lines) - validation
└── types.ts (50 lines)
```

## Pattern 5: Extract Business Logic

### Before
```typescript
// component.tsx (1400 lines)
export function ComplexComponent() {
  // Data fetching (100 lines)
  // Business calculations (300 lines)
  // State transformations (200 lines)
  // Event handlers (200 lines)
  // Render logic (600 lines)
}
```

### After
```typescript
// use-complex-data.ts (100 lines)
export function useComplexData() { /* data fetching */ }

// complex-calculations.ts (300 lines)
export function calculateMetrics() { /* business logic */ }
export function computeTotals() { /* more logic */ }

// component.tsx (800 lines) - still large, continue extraction
import { useComplexData } from './use-complex-data';
import { calculateMetrics } from './complex-calculations';
```

## Dependency Preservation

### Rule: Keep Dependencies Together

```typescript
// WRONG: Split dependent functions
// file-a.ts
function helper() { return 42; }

// file-b.ts
function main() { return helper() + 1; } // Broken!

// RIGHT: Move together or create explicit import
// helpers.ts
export function helper() { return 42; }

// main.ts
import { helper } from './helpers';
export function main() { return helper() + 1; }
```

### Circular Dependency Prevention

Before extraction, map dependencies:
```bash
# Find what this function calls
grep -A 20 "function targetFunc" file.ts | grep -E "^\s+\w+\("

# Find what calls this function
grep "targetFunc(" file.ts
```

If extraction would create circular import:
1. Extract both to same file
2. Or create a third file for shared logic
3. Never proceed with circular dependency

## Naming Conventions

| Original | Extracted | Pattern |
|----------|-----------|---------|
| `BigComponent.tsx` | `BigComponentHeader.tsx` | Prefix with parent |
| `service.ts` | `service-utils.ts` | Suffix by purpose |
| `route.ts` | `handlers/get.ts` | Directory by type |
| Any file | `types/[domain].ts` | Domain-based types |
