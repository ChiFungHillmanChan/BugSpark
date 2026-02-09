# Function README Documentation Rule

Guidelines for creating and maintaining documentation for functions, hooks, services, and server actions.

## Purpose

Ensure maintainability, discoverability, and knowledge transfer by creating README files for significant functions in the `readme/` folder.

## File Location & Naming

### Organized Folder Structure

Place documentation in appropriate subdirectory within `readme/`:

- **`readme/features/`** - Core platform features (assignments, exams, classes)
- **`readme/infrastructure/`** - Core system infrastructure (auth, permissions, i18n)
- **`readme/ui-components/`** - UI/UX components and interface elements
- **`readme/azure/`** - Azure cloud services and integrations
- **`readme/development/`** - Development tools, structure docs, build processes
- **`readme/mobile/`** - Mobile-specific documentation (Flutter/Dart)

### Naming Conventions

- Use kebab-case with `.md` extension (e.g., `user-profile-service.md`)
- Include service/component type when helpful (e.g., `azure-blob-storage-functions.md`)

### Folder Selection Guidelines

- **Features**: User-facing functionality and business logic
- **Infrastructure**: Foundational systems supporting multiple features
- **UI Components**: Reusable interface elements and design system
- **Cloud Services**: External service integrations (Azure, GCP, AWS)
- **Development**: Build tools, project structure, coding standards

## Feature Organization Rules

**Only massively big features (system-level) deserve their own folders.**

### System-Level Features (deserve own folders):
- Complete feature ecosystems with multiple sub-components
- Features that could be standalone products or major modules
- Examples: `assignment-system`, `exam-system`, `class-management`

### Minor Features (group under system-level):
- Single-purpose functionality or enhancements
- Sub-features that extend existing systems
- Examples: `image-upload-feature` → under relevant system, `grade-export` → under `assignment-system`

### Decision Framework:
1. Is this a complete system with multiple interconnected components? → Own folder
2. Does this extend or enhance an existing system? → Group under that system
3. Is this a standalone utility? → Group under most relevant system
4. When in doubt → Ask for guidance

## When to Create/Update

- After implementing or refactoring a function
- Based on summary of development session including key decisions and tradeoffs
- Update if function is significantly changed

## Content Guidelines

Each README should include:

### 1. Title
The function or feature name as heading

### 2. Purpose
Concise summary of what it does and why it exists

### 3. Usage
Example usage including parameters, return values, edge cases

### 4. Design & Implementation Notes
Key design decisions, tradeoffs, rationale

### 5. Dependencies
Important dependencies (libraries, other functions, env variables)

### 6. Testing & Validation
How the function is tested, known limitations

### 7. Change Log
Major changes or refactors with dates

## Example Structure

```markdown
# User Profile Service

## Purpose
Fetches and returns user profile from database, including roles and permissions.

## Usage
```ts
const profile = await getUserProfile(userId);
```
- **Parameters:** `userId` (string) - User's unique identifier
- **Returns:** `UserProfile | null`
- Throws if user does not exist

## Design & Implementation Notes
- Uses Prisma for database access
- Handles both system and organization roles

## Dependencies
- `@prisma/client`
- Environment variable: `DATABASE_URL`

## Testing & Validation
- Unit tests in `app/utils/__tests__/getUserProfile.test.ts`
- Validated against seed data in development

## Change Log
- 2024-05-01: Initial implementation
- 2024-06-10: Refactored to support organization roles
```

## Scripts and Documentation Location

### Temporary/Utility Scripts
- Place in `scripts/debug/` directory at project root
- Scripts should NOT be at root or in feature directories
- Name clearly: `fix-db-image-urls.js`, `prepare-migrations.js`

### Documentation Files
- Place in `readme/` directory at project root
- Do not place at root or in feature directories

## Additional Notes

- These READMEs are for internal documentation and onboarding
- If function is trivial, a short README with title and one-sentence purpose suffices
- For complex features, link to related documentation
- When unsure about folder placement: Is this user-facing (features), foundational (infrastructure), or external (cloud services)?
