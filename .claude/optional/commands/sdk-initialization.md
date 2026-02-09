# SDK Client Initialization Guide

Standard pattern for initializing SDK clients that depend on environment variables.

## Purpose

Prevent build-time errors caused by accessing environment variables at module level. Ensure secure, runtime-only credential access.

## Scope

Applies to any SDK or library requiring API keys, connection strings, or environment variables.

## Service File Structure

Create dedicated service files in `app/services/[sdk-name].ts`:

```typescript
'use server';

import { SomeSDKClient } from 'some-sdk-package';

export async function createSomeSDKClient() {
  const apiKey = process.env.SOME_SDK_API_KEY;

  if (!apiKey) {
    throw new Error('SOME_SDK_API_KEY environment variable is required');
  }

  return new SomeSDKClient({ apiKey });
}

export async function getSomeSDKConfig() {
  const config = process.env.SOME_SDK_CONFIG;

  if (!config) {
    throw new Error('SOME_SDK_CONFIG environment variable is required');
  }

  return config;
}
```

## Required Elements

Every SDK service file must include:

1. **`'use server'` directive** at top of file
2. **Async factory functions** - all exports must be async
3. **Runtime environment variable access** - never at module level
4. **Proper error handling** - clear error messages for missing variables
5. **Descriptive function names** - use `create[SDKName]Client()` pattern

## Consumer Code Pattern

```typescript
// WRONG: Module-level client (causes build errors)
import { someSDKClient } from '@/lib/some-sdk';

// CORRECT: Runtime client creation
import { createSomeSDKClient } from '@/app/services/some-sdk';

export async function someAPIRoute() {
  const client = await createSomeSDKClient();
  const result = await client.someMethod();
  return result;
}
```

## Common SDK Patterns

### OpenAI Pattern
```typescript
'use server';
import OpenAI from 'openai';

export async function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAI({ apiKey });
}
```

### Azure Blob Storage Pattern
```typescript
'use server';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

export async function createAzureBlobClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable is required');
  }
  return BlobServiceClient.fromConnectionString(connectionString);
}

export async function getAzureStorageContainerName(): Promise<string> {
  return process.env.AZURE_STORAGE_CONTAINER_NAME || 'submissions';
}
```

### Database Connection Pattern
```typescript
'use server';
import { DatabaseClient } from 'database-sdk';

export async function createDatabaseClient() {
  const connectionString = process.env.DATABASE_URL;
  const username = process.env.DATABASE_USERNAME;
  const password = process.env.DATABASE_PASSWORD;

  if (!connectionString || !username || !password) {
    throw new Error('Database environment variables required: DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD');
  }

  return new DatabaseClient({ connectionString, username, password });
}
```

## Migration Checklist

When refactoring existing module-level SDK initialization:

- [ ] Create new service file in `app/services/[sdk-name].ts`
- [ ] Add `'use server'` directive
- [ ] Move environment variable access into async functions
- [ ] Add proper error handling for missing variables
- [ ] Update all consuming code to use `await createClient()`
- [ ] Remove module-level client initialization
- [ ] Test build process (no environment variable errors)
- [ ] Update imports throughout codebase

## Benefits

- **Build Safety**: Prevents build failures when env vars aren't available
- **Security**: Ensures credentials are only accessed server-side at runtime
- **Flexibility**: Allows different configurations per environment
- **Maintainability**: Centralizes SDK configuration in service layer
- **Testability**: Makes it easier to mock clients in tests
