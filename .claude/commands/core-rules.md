# Core Programming Principles

Apply these fundamental programming principles to all code in this project.

## Goal

Create maintainable, reusable, and testable code by adhering to principles of separation of concerns, clear responsibilities, and manageable module size.

## Core Principles

### 1. Single Responsibility Principle (SRP)
- Each module, class, or function should have one primary responsibility
- Example: Instead of one large `DataProcessor`, separate into `DataLoader`, `DataTransformer`, `DataExporter`

### 2. Identify Logical Sections
- Break down complex systems into smaller, self-contained logical sections
- Each section often becomes a candidate for its own module or class

### 3. Extract Domain Logic/State
- When a module becomes responsible for managing significant state and logic related to a specific domain, extract it into a dedicated module or service
- Example: `userSession` state/logic moved to `UserSessionService`

### 4. Shared Constants for API Communications
- ALWAYS use shared constants for API communications
- NEVER use string literals to create coupling between client and server
- Create centralized constant files for error codes, API endpoints, status codes
- Example: Use `ErrorCodes.ACCOUNT_INACTIVE` instead of `'Account is inactive'`

### 5. Limit Module Size
- Keep files and modules under 300 lines
- If a file grows larger, split it using extraction patterns

### 6. Search Before Creating
- Before creating any new function or component, search the codebase for existing implementations
- Check shared utility directories (lib/, utils/, helpers/)
- If you create something new, ensure it's discoverable by the team

## Implementation Checklist

Before writing new code:
- [ ] Searched the codebase for existing similar logic
- [ ] Checked shared utility directories
- [ ] Only created new logic if no suitable match exists
- [ ] New shared logic is placed in a discoverable location

## Anti-Patterns to Avoid

1. **God Objects**: Classes/modules that do too much
2. **String Literals for APIs**: Always use constants
3. **Duplicate Logic**: Always check for existing implementations
4. **Monolithic Files**: Split files over 300 lines
5. **Tight Coupling**: Use dependency injection and interfaces
