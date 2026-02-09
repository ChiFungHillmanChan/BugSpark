# Error Handling Rules

Guidelines for robust, observable, and maintainable error handling.

## Core Principles

### 1. Never Catch Errors Prematurely
- Do NOT catch errors unless you can handle them meaningfully
- Avoid empty catch blocks or blocks that suppress errors without logging
- Let errors propagate to a level where they can be logged/handled globally
- NEVER mask real errors with generic "Internal server error" messages

### 2. Always Log Errors
- All unhandled errors must be logged with sufficient context
- Include: error message, stack trace, request/user info
- Use your project's logging solution (Application Insights, Sentry, Datadog, console, etc.)

### 3. API Endpoint Error Handling
- Let database errors, external API failures, and service errors propagate
- Only catch expected validation errors (invalid JWT, missing fields)
- Framework-level handlers will log with proper context

## Examples

### INCORRECT - Error Masking

```typescript
// BAD: Masks real errors, prevents debugging
try {
  const result = await externalService.call(params);
  return { success: true, data: result };
} catch (error) {
  console.error('Error:', error);
  return { error: 'Internal server error' }; // Generic, unhelpful
}
```

### CORRECT - Let Errors Propagate

```typescript
// GOOD: Validate input, let service errors bubble up
const { text, targetLanguage } = await request.json();
if (!text || !targetLanguage) {
  return Response.json(
    { error: 'Text and target language are required' },
    { status: 400 }
  );
}

// Service errors propagate to framework handler
const result = await translationService.translate(text, targetLanguage);
return Response.json({ success: true, data: result });
```

### CORRECT - Specific Error Handling

```typescript
// GOOD: Handle specific expected errors, let unexpected propagate
try {
  decoded = jwt.verify(token, JWT_SECRET);
} catch (jwtError) {
  // Expected error - invalid/expired token
  return { success: false, error: 'Invalid or expired token', status: 401 };
}
// Other errors propagate automatically
```

## Build Error Resolution

### NEVER Use Lint Disables
- **Forbidden:** `// eslint-disable-next-line`
- **Forbidden:** `// eslint-disable`
- **Forbidden:** `/* eslint-disable */`

### NEVER Use Type Suppressions
- **Forbidden:** `// @ts-ignore`
- **Forbidden:** `// @ts-expect-error` (except in specific test scenarios)
- **Forbidden:** `any` type in controlled code

### Fix Root Causes
- Address the underlying type safety or code quality issue
- Understand WHY the error exists before fixing
- Ensure the fix improves code quality
