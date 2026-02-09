# Large File Splitting Rules

One-time remediation process for splitting large, monolithic files.

## When to Apply

- File exceeds 400 lines and is difficult to navigate
- File contains unrelated logic, repeated code, or multiple responsibilities
- File is a "god file" or "dumping ground" for features

## Critical Success Factors

**MOST IMPORTANT:** The main component must be completely rewritten to use extracted hooks and components. Simply extracting code without integrating it results in duplicate logic and massive file sizes.

## Component Extraction Principles

### 1. Extract by Concern, Not Location
- Group related functionality (user management, class management, bulk operations)
- Each extracted component handles ONE specific domain
- Avoid extracting arbitrary UI sections without their related logic

### 2. Always Create Standalone Components
- Never create locally implemented components within the main file
- Each component should be self-contained with its own file
- Components accept props and manage their own internal state

### 3. Custom Hooks Must Encapsulate Complete Logic
- Extract ALL related state and functions into the hook
- Main component ONLY calls hook functions, never duplicates them
- Hooks return everything needed: state, handlers, loading states, errors

## Split Process

### 1. Analyze the File
- Identify all logical sections, features, or domains
- List major functions, classes, components, repeated code blocks
- Note dependencies between sections
- Map which UI sections belong with which business logic

### 2. Plan the Split by Domain
- Group related logic into cohesive domains (by feature, not location)
- Plan extraction order: Types → Constants → Utils → Hooks → Components → Main
- Maximum 3-4 new files (not 10)
- Identify which components are standalone vs. need integration

### 3. Execute the Split

**Phase 1: Foundation**
- Extract types and interfaces (`types.ts`)
- Extract constants and configuration (`constants.ts`)
- Extract pure utility functions (`utils.tsx`)

**Phase 2: Business Logic**
- Create custom hooks with complete state management
- Each hook encapsulates ALL related operations for its domain
- Hooks handle their own data fetching, error states, loading states

**Phase 3: UI Components**
- Extract complex UI sections as standalone components
- Components are completely self-contained
- Pass data and handlers via props

**Phase 4: Main Component Rewrite (CRITICAL)**
- **Completely rewrite** the main component from scratch
- Import and use extracted hooks (don't duplicate)
- Import and use extracted components (don't reimplement)
- Remove ALL duplicate state declarations and function implementations

### 4. Integration Validation
- Verify main component uses hooks properly
- Ensure extracted components are truly standalone
- Check no business logic remains in main component
- Confirm main component is dramatically smaller (~400 lines max)

## Common Pitfalls

### FAILED Split Patterns

**Extracting Without Integration:**
```typescript
// BAD: Hook exists but main component duplicates
const userManagement = useUserManagement();
const [users, setUsers] = useState([]); // Duplicate!
const handleCreateUser = async () => { /* duplicate */ };
```

**Locally Implemented Components:**
```typescript
// BAD: Component defined inside main
function SchoolUsersManagement() {
  const BulkImportSection = () => <div>...</div>; // Extract!
}
```

**Incomplete Hook Extraction:**
```typescript
// BAD: Hook only has some functions
const { users } = useUserManagement();
const handleUserEdit = () => { /* should be in hook */ };
```

### SUCCESSFUL Split Patterns

**Complete Hook Integration:**
```typescript
// GOOD: Main component only uses hook
const userManagement = useUserManagement(schoolId);
return (
  <UsersList
    users={userManagement.users}
    onEditUser={userManagement.handleEditUser}
    loading={userManagement.loading}
  />
);
```

**Standalone Components:**
```typescript
// GOOD: Component is self-contained
<BulkImportDialog
  isOpen={bulkImport.isOpen}
  onClose={bulkImport.close}
  onImport={bulkImport.handleImport}
/>
```

**Clean Main Component:**
```typescript
// GOOD: Main is primarily composition
export default function SchoolUsersManagement({ school }) {
  const userManagement = useUserManagement(school.id);
  const classManagement = useClassManagement(school.id);

  return (
    <div>
      <UsersList {...userManagement} />
      <ClassesList {...classManagement} />
    </div>
  );
}
```

## Example Workflow

**Before:**
- `SchoolUsersManagement.tsx` (2219 lines): user mgmt, class mgmt, bulk import, UI, utilities, state

**After:**
- `types.ts` (interfaces)
- `constants.ts` (configuration)
- `utils.tsx` (pure utilities)
- `hooks/useUserManagement.ts` (user state & operations)
- `hooks/useClassManagement.ts` (class state & operations)
- `hooks/useBulkImport.ts` (bulk import logic)
- `components/BulkImportDialog.tsx` (standalone UI)
- `components/UsersList.tsx` (standalone UI)
- `components/ClassesList.tsx` (standalone UI)
- `SchoolUsersManagement.tsx` (~400 lines: composition only)
- `README.md` (documentation)

## Success Metrics

- [ ] Main component reduced to ~400 lines or less
- [ ] No duplicate state or function implementations
- [ ] Each extracted file has single, clear responsibility
- [ ] Extracted components are completely standalone
- [ ] Custom hooks encapsulate complete domain logic
- [ ] All functionality works exactly as before
