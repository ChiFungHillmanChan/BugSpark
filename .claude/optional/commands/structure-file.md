# Structure File Creation and Maintenance

Guidelines for maintaining the `readme/structure.md` file that documents all functions and components.

## Purpose

Ensure the codebase remains discoverable and maintainable by documenting all functions and components in a single, canonical structure file.

## File Location

The structure file must be located at `readme/structure.md`.

## When to Update

- Whenever a new function, component, hook, or service is created
- Whenever existing functions/components are modified significantly
- Whenever functions/components are removed
- Updates are REQUIRED for all code reviews and PRs

## File Structure

### Tree Diagram

Begin with a tree diagram showing only high-level domains, features, and supported languages:

```
app/
├── actions/
│   └── admin/ (server actions for CRUD admin table)
├── messages/ (multi-lingual translations)
│   ├── en.json
│   ├── zh-TW.json
│   ├── en/ (namespace: admin)
│   └── zh-TW/ (namespace: admin)
├── [locale]/
│   ├── admin/ (the admin page)
...
```

**DO NOT** expand into:
- Individual CRUD files
- Page/component files
- Internal helpers (unless reusable or central to architecture)

### Component/Table Overview

Include a table listing all reusable functions, components, hooks, and services:

| Name | Location | Purpose/Description | Related |
|------|----------|---------------------|---------|
| MainLayout | app/components/MainLayout.tsx | Consistent layout with sticky navbar and responsive sidebar | Navbar, Sidebar, useSidebar |
| Sidebar | app/components/Sidebar.tsx | Responsive sidebar navigation, mobile gestures, admin/user links | MainLayout, LanguageSwitcher |
| ... | ... | ... | ... |

Each entry must include:
- **Name**: The function/component/hook/service name
- **Location**: The file path
- **Purpose/Description**: Brief summary of what it does
- **Related**: Other key modules it interacts with

## Guidelines

### For Translations
- List supported languages and main namespaces
- Example: `en.json`, `zh-TW.json`, `en/admin.json`

### For Service/Action Directories
- Represent as single entry
- Example: `admin/ (server actions for CRUD admin table)`

### For Page Domains
- Represent as single entry
- Example: `admin/ (the admin page)`

### Keep Entries
- Concise and clear
- Focused on maintainability and discoverability

## Automation

Where possible, automate generation and updating of this file using scripts or developer tooling.

## Review Requirements

Reviewers must check that:
- Structure file is updated for any PR that adds/modifies/removes logic
- Structure file is accurate and matches the actual codebase

## Checklist for Contributors

Before submitting a PR:
- [ ] Checked `readme/structure.md` for existing logic
- [ ] Searched the codebase if not found in structure file
- [ ] Only created new logic if no suitable match exists
- [ ] Updated `readme/structure.md` with new function/component
- [ ] Removed deleted entries from `readme/structure.md`
- [ ] Referenced this rule in the PR or code review

## Example Update

When adding a new hook:

```markdown
| Name | Location | Purpose/Description | Related |
|------|----------|---------------------|---------|
| useUserManagement | app/hooks/useUserManagement.ts | Manages user CRUD operations with loading/error states | UsersList, prisma |
```

When removing a component:

1. Delete the row from the table
2. Update any "Related" references in other rows
3. Verify no other documentation references the deleted component
