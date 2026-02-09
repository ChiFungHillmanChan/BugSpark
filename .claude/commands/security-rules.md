# Security Rules

Security best practices and credential handling.

## Never Write Credentials to Source Code

### Core Principle
Credentials (API keys, secrets, passwords, private keys) must NEVER be written directly into source code or committed to the repository.

### Guidelines

1. **Never Write Credentials in Code**
   - Do NOT hardcode any credentials in source files, configs, or scripts
   - Do NOT include example credentials or placeholders in comments

2. **Environment Variables**
   - ALWAYS use environment variables to access credentials at runtime
   - NEVER include actual values in source files

3. **Guiding Users**
   When credentials are required, provide clear instructions:
   1. Sign up for the required service
   2. Generate/download API key from provider's dashboard
   3. Add to `.env.local` or equivalent
   4. Do NOT commit if it contains secrets
   5. Restart application to load new variables

4. **.env and Secrets Files**
   - Ensure `.env`, `.env.local`, and secrets files are in `.gitignore`
   - Provide `env.example` with variable names, but NEVER with real/fake secrets

5. **Code Review and Automation**
   - Reviewers MUST reject any code that includes credentials
   - Use automated checks to scan for secret leaks

## Runtime SDK Initialization

Wrap SDK clients in async factory functions to prevent build-time credential access:

```typescript
export async function createClient() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API_KEY environment variable is required');
  }
  return new Client({ apiKey });
}
```

## Input Validation

- Validate ALL user inputs at system boundaries
- Use schema validation (Zod, Joi, Pydantic, etc.)
- Sanitize HTML output to prevent XSS
- Never expose sensitive data in responses

## Common Anti-Patterns to Avoid

### WRONG: Module-level credential access
```typescript
// Causes build errors when env vars aren't available
const API_KEY = process.env.SECRET_KEY;
const client = new Client({ apiKey: API_KEY });
```

### WRONG: Hardcoded credentials
```typescript
const apiKey = 'sk-abc123...'; // NEVER do this
```

### CORRECT: Runtime access via factory
```typescript
export async function createClient() {
  const apiKey = process.env.SECRET_KEY;
  if (!apiKey) throw new Error('SECRET_KEY required');
  return new Client({ apiKey });
}
```

## Client-Server Separation

- NEVER expose system prompts or internal configuration to the client
- Server-side files handle sensitive configs
- Use API endpoints to get configured sessions without exposing internals
