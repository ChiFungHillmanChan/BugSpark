# AI Prompting & API Rules

Guidelines for working with AI services (OpenAI, Gemini, Anthropic).

## File Storage

- Prompts must be kept in the `prompts` folder
- Write prompts as `.txt` files
- Use `app/services/load-prompts.ts` to load prompt files

## Server-Side Prompt Handling

Files with `'use server'` directive can ONLY export async functions, never objects or constants:

```typescript
// CORRECT - server-side function that loads prompts
'use server';
export async function createAgentConfigs(): Promise<AgentConfig[]> {
  const prompt = await loadPromptFile('agent-prompt.txt');
  return [{ name: 'agent', instructions: prompt }];
}

// WRONG - exporting objects from 'use server' file
'use server';
export const agentConfigs = [{ name: 'agent', instructions: 'prompt' }];
```

## Client-Server Separation

- **NEVER expose system prompts to the client** - security vulnerability
- Create separate `.client.ts` files for client-side metadata (names, descriptions)
- Server-side files handle actual prompt loading and sensitive configurations

## AI Model Usage (CRITICAL)

All AI model identifiers are centralized in `lib/ai-models.ts`. **NEVER hardcode model strings.**

```typescript
import { AI_MODELS } from '@/lib/ai-models';

// CORRECT
const response = await openai.responses.create({ model: AI_MODELS.OPENAI_GPT_4_1 });

// WRONG - Never do this
const response = await openai.responses.create({ model: 'gpt-4.1' });
```

## OpenAI Response API (CRITICAL)

**ALWAYS use Response API (`openai.responses.create()`) instead of Chat Completions API.**

```typescript
// CORRECT - Modern Response API approach
const response = await openai.responses.create({
  model: AI_MODELS.OPENAI_GPT_4_1,
  input: [
    {
      type: 'message',
      role: 'system',
      content: [{ type: 'input_text', text: systemPrompt }]
    },
    {
      type: 'message',
      role: 'user',
      content: [{ type: 'input_text', text: userMessage }]
    }
  ],
  text: {
    format: {
      type: 'json_schema',
      name: 'response_schema',
      schema: yourJsonSchema,
      strict: true
    }
  }
});

// Check response status
if (response.status !== 'completed') {
  throw new Error(`Response not completed. Status: ${response.status}`);
}

// Extract content
const outputMessage = response.output.find(item => item.type === 'message');
const textContent = outputMessage.content.find(item => item.type === 'output_text');
```

## Structured Outputs

Use `text.format.json_schema` with `strict: true`:

```typescript
text: {
  format: {
    type: 'json_schema',
    name: 'analysis_result',
    schema: yourJsonSchema,
    strict: true
  }
}
```

## Multi-modal Support

```typescript
// Multi-modal input with Response API
{
  type: 'message',
  role: 'user',
  content: [
    { type: 'input_text', text: 'Analyze this image' },
    {
      type: 'input_image',
      image_url: `data:image/jpeg;base64,${base64Image}`,
      detail: 'high'
    }
  ]
}
```

## Background Processing Pattern

For long-running operations, use background mode:

```typescript
const response = await openai.responses.create({
  model: AI_MODELS.OPENAI_GPT_5,
  input: [{ role: 'user', content }],
  text: { format: { type: 'json_schema', name, schema, strict: true } },
  reasoning: { effort: 'high' },
  background: true,
});

// Persist response ID, return 202
await jobs.create({ status: 'IN_PROGRESS', openaiResponseId: response.id });
return { status: 202, jobId };

// Later: Poll for results
const result = await openai.responses.retrieve(openaiResponseId);
if (result.status === 'completed') {
  // Process result
}
```

## SDK Initialization

Wrap SDK clients in async factory functions:

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

## Quota Error Handling (Gemini/Gamma)

```typescript
import { handleQuotaError, createQuotaErrorResponse, isGeminiQuotaError } from '@/lib/ai-model-status';

try {
  const response = await gemini.models.generateContent({ /* ... */ });
} catch (err) {
  if (err instanceof Error && isGeminiQuotaError(err)) {
    const quotaError = handleQuotaError(err, AI_MODELS.GEMINI_3_PRO_PREVIEW, 'gemini');
    if (quotaError) {
      return NextResponse.json(createQuotaErrorResponse(quotaError), { status: 429 });
    }
  }
  throw err;
}
```

## Error Handling for Prompts

You can assume `loadPromptFile` will never fail - do NOT wrap it in try-catch:

```typescript
// CORRECT
const systemPrompt = await loadPromptFile('agent-prompt.txt');

// WRONG - unnecessary try-catch
try {
  systemPrompt = await loadPromptFile('agent-prompt.txt');
} catch (error) {
  systemPrompt = 'fallback'; // Don't do this
}
```
