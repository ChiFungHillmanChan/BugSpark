# Next.js 15 Rules

Implementation guidance for Next.js 15 projects in this codebase.

## Version Requirements
- ALWAYS use Next.js v15
- Use `pnpm` for package management
- For shadcn-ui: `pnpm dlx shadcn` (library already installed)

## Route Parameters (CRITICAL)

In Next.js 15, route parameters are asynchronous and MUST be awaited:

```typescript
// CORRECT - await params
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // use id...
}

// WRONG - don't destructure directly
export async function GET(request: Request, { params: { id } }: Props) { }
```

## Environment Variables (CRITICAL)

### NEVER Access at Module Level

```typescript
// WRONG: Causes build errors
const API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// CORRECT: Wrap in async server functions
'use server';

export async function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAI({ apiKey });
}
```

### Why This Pattern
- Build-time vs Runtime: Next.js evaluates module-level code during build
- Docker/CI Environments: Build environments often lack production env vars
- Security: Prevents credential exposure in client-side bundles

## Server Actions

- Prefer server actions over API routes for data operations
- Place server actions in `app/actions/` directory, organized by domain
- Add `'use server'` directive at top of files containing server actions
- Use consistent response formats (success flag, data, error information)

## External Images

### Use Regular `<img>` for External/CDN Images

```typescript
// WRONG: Next.js Image with external URLs causes 400 errors
import Image from 'next/image';
<Image src="https://cdn.example.com/image.png" alt="..." />

// CORRECT: Direct loading from external sources
<img
  src="https://cdn.example.com/image.png"
  alt="..."
  className="absolute inset-0 w-full h-full object-contain"
/>
```

### When to Use Each
- **Next.js `<Image>`**: Images in `public/` folder, images you control
- **Regular `<img>`**: Azure Blob, AWS S3, third-party CDNs, AI-generated images

## useCallback Patterns

### Auto-connect Pattern
```typescript
const connectToService = useCallback(async () => {
  if (status !== "DISCONNECTED") return;
  // connection logic
}, [status, otherDependencies]);

useEffect(() => {
  if (shouldAutoConnect && settingsLoaded) {
    const timeoutId = setTimeout(() => connectToService(), 500);
    return () => clearTimeout(timeoutId);
  }
}, [shouldAutoConnect, settingsLoaded, connectToService]);
```

### Debounced Updates Pattern
```typescript
const updateSettings = useCallback(() => {
  // update logic
}, [setting1, setting2]);

useEffect(() => {
  if (isConnected) {
    const timeoutId = setTimeout(() => updateSettings(), 300);
    return () => clearTimeout(timeoutId);
  }
}, [setting1, setting2, isConnected, updateSettings]);
```

## Viewport Configuration
- Use the `viewport` export instead of including in `metadata` object

## Error Handling
- Use Microsoft Application Insights for logging
- Let errors propagate to framework-level handlers
