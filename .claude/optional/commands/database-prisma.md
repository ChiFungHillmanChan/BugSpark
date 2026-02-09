# Database & Prisma Rules

Rules for database operations and Prisma ORM usage.

## Prisma Configuration

- ALWAYS use Prisma for database operations
- Edit BOTH `schema.dev.prisma` AND `schema.prod.prisma` when modifying schema
- Use `pnpm db:dev:migrate` for migrations (NOT default `prisma migration`)
- `schema.dev.prisma` uses SQLite for local development
- `schema.prod.prisma` uses MS SQL Server for production

## CRITICAL: Use Prisma Generated Types

### NEVER Create Manual Interfaces

```typescript
// WRONG: Manual interface that duplicates Prisma models
interface User {
  id: string;
  email: string;
  firstName: string;
}

// CORRECT: Import Prisma's generated types
import type { User, Assignment, ExamQuestion } from '@prisma/client';

export async function createUser(userData: Partial<User>): Promise<User> {
  return await prisma.user.create({ data: userData });
}

// Export Prisma types for reuse
export type { User, Assignment } from '@prisma/client';
```

## Why Prisma Handles Types Automatically

1. **Automatic Generation**: Types generated from schema automatically
2. **Always Up-to-Date**: Regenerated on migrations
3. **Null vs Undefined**: Correctly handled based on schema
4. **Relation Types**: Complex relations properly typed
5. **Field Constraints**: All constraints reflected in types

## Migration Workflow

```bash
# 1. Edit schema files
# 2. Run migration (regenerates types automatically)
pnpm db:dev:migrate

# 3. Types now available in @prisma/client
# 4. No manual interface creation needed!
```

## Type Safety Best Practices

1. **Import Types**: Always from `@prisma/client`
2. **Use Partial<T>**: For update operations
3. **Use Pick<T, K>**: For specific fields
4. **Use Omit<T, K>**: For creation data without auto-generated fields
5. **Trust Prisma**: Let it handle null/undefined, relations, constraints

## Correct Usage Examples

```typescript
// Server Actions with Prisma Types
import type { Exam, ExamQuestion } from '@prisma/client';

export async function updateExam(
  id: string,
  data: Partial<Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Exam> {
  return await prisma.exam.update({
    where: { id },
    data
  });
}

// Component Props with Prisma Types
interface ExamFormProps {
  exam: Exam & {
    questions?: ExamQuestion[];
  };
}

// API Responses with Prisma Types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

## When to Create Manual Interfaces

**ONLY for:**
- External API responses (not from your database)
- Complex computed/derived data not stored in database
- Form-specific validation schemas (but based on Prisma types)

## CRUD Operations Best Practices

### Create vs Update Field Handling

**Create Operations:**
- Accept `undefined` or empty values for optional fields
- Provide sensible defaults for required fields

**Update Operations:**
- Distinguish between "not provided" (`undefined`) and "intentionally cleared" (`''`)
- Only update fields explicitly provided

```typescript
// CORRECT: Update operation respects user intent
export async function updateEntity(data: UpdateEntityData) {
  const updatePayload: Record<string, unknown> = {};

  // Only update fields that are explicitly provided
  if (data.title !== undefined) updatePayload.title = data.title;
  if (data.description !== undefined) updatePayload.description = data.description || null;

  return await database.update({
    where: { id: data.id },
    data: updatePayload
  });
}
```
