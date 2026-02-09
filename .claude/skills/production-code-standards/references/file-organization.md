# File Organization & Size Management

## Line Limits (Strict)

| File Type | Soft Limit | Hard Limit | Action |
|-----------|------------|------------|--------|
| React Components | 150 | 200 | Split sub-components |
| Utility Modules | 100 | 150 | Extract by domain |
| API Routes | 150 | 200 | Extract handlers |
| Service Classes | 200 | 300 | Decompose services |
| Type Definitions | 150 | 200 | Group by entity |
| Hook Files | 100 | 150 | One hook per file |

**Line counting excludes:** Comments, blank lines, import statements

## Splitting Strategies

### Component Splitting

**Before (400+ lines):**
```
UserDashboard.tsx
├── Header logic
├── Sidebar logic
├── Main content
├── Footer logic
└── All state management
```

**After (each <200 lines):**
```
user-dashboard/
├── index.tsx (50 lines) - Composition
├── DashboardHeader.tsx (80 lines)
├── DashboardSidebar.tsx (100 lines)
├── DashboardContent.tsx (120 lines)
├── DashboardFooter.tsx (60 lines)
└── use-dashboard.ts (80 lines) - Shared state
```

### Utility Splitting

**Before:**
```typescript
// utils.ts (500+ lines)
export function formatDate() {}
export function formatCurrency() {}
export function validateEmail() {}
export function validatePhone() {}
export function parseQueryString() {}
export function buildQueryString() {}
```

**After:**
```
lib/
├── utils/
│   ├── index.ts (re-exports)
│   ├── date-utils.ts (50 lines)
│   ├── currency-utils.ts (40 lines)
│   ├── validation-utils.ts (60 lines)
│   └── url-utils.ts (50 lines)
```

### API Route Splitting

**Before:**
```typescript
// route.ts (400+ lines)
export async function GET() { /* 150 lines */ }
export async function POST() { /* 200 lines */ }
export async function DELETE() { /* 50 lines */ }
```

**After:**
```
api/resource/
├── route.ts (50 lines) - Method routing
├── handlers/
│   ├── get-handler.ts (150 lines)
│   ├── post-handler.ts (200 lines)
│   └── delete-handler.ts (50 lines)
└── schemas.ts (40 lines) - Validation schemas
```

## Directory Structure Patterns

### Feature-Based (Recommended)
```
features/
├── user-management/
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── utils/
├── billing/
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── utils/
```

### Layer-Based
```
server/
├── app/
│   ├── components/ (all components)
│   ├── hooks/ (all hooks)
│   ├── types/ (all types)
│   └── services/ (all services)
```

## Extraction Checklist

When a file exceeds limits:

1. **Identify logical sections**
   - [ ] Group related functions
   - [ ] Identify standalone utilities
   - [ ] Find component boundaries

2. **Plan extraction**
   - [ ] Max 3-4 new files per extraction
   - [ ] Maintain clear dependencies
   - [ ] Preserve public API

3. **Execute extraction**
   - [ ] Extract one group at a time
   - [ ] Update imports immediately
   - [ ] Run tests after each extraction

4. **Verify**
   - [ ] All files under limit
   - [ ] No circular dependencies
   - [ ] Tests still pass

## Common Extraction Patterns

### Extract Hook
```typescript
// Before: Component with complex state
function Dashboard() {
  const [data, setData] = useState();
  const [loading, setLoading] = useState();
  const [error, setError] = useState();
  // 50+ lines of state logic
}

// After: Dedicated hook
function useDashboardData() {
  // All state logic here
  return { data, loading, error, refetch };
}

function Dashboard() {
  const { data, loading, error } = useDashboardData();
}
```

### Extract Sub-Component
```typescript
// Before: Monolithic render
function Form() {
  return (
    <form>
      {/* 100 lines of header */}
      {/* 200 lines of fields */}
      {/* 50 lines of footer */}
    </form>
  );
}

// After: Composed components
function Form() {
  return (
    <form>
      <FormHeader />
      <FormFields />
      <FormFooter />
    </form>
  );
}
```

### Extract Handler
```typescript
// Before: Fat API route
export async function POST(req: Request) {
  // 200 lines of logic
}

// After: Thin route + handler
import { handleCreateUser } from './handlers/create-user';

export async function POST(req: Request) {
  return handleCreateUser(req);
}
```

## Monitoring

```bash
# Check file sizes
find server/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -n

# Find files over limit
find server/ -name "*.ts" -exec sh -c 'wc -l "$1" | awk "\$1 > 200 {print}"' _ {} \;
```
