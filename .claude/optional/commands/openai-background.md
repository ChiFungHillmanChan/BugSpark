# OpenAI Responses Background Pattern

Standardize how to run long-running OpenAI operations without holding HTTP requests using background processing and response ID retrieval.

## Purpose

Avoid platform timeouts (e.g., Azure App Service idle timeout) by using the Responses API with `background: true` and retrieving results later via response ID.

## Scope

- All server-side features that call OpenAI models and may exceed platform timeouts
- Next.js App Router (server routes/actions)

## Guidelines

### 1. Use Responses API with `background: true`

```typescript
const response = await openai.responses.create({
  model: AI_MODELS.OPENAI_GPT_5,
  input: [
    {
      type: 'message',
      role: 'user',
      content: [{ type: 'input_text', text: userContent }]
    }
  ],
  text: {
    format: {
      type: 'json_schema',
      name: 'response_schema',
      schema: yourJsonSchema,
      strict: true
    }
  },
  reasoning: { effort: 'high' },
  background: true, // CRITICAL: Enable background processing
});
```

### 2. Persist Response ID and Return 202

```typescript
// Create a durable job record with status and OpenAI response ID
await prisma.job.create({
  data: {
    status: 'IN_PROGRESS',
    openaiResponseId: response.id,
    inputJson: JSON.stringify(inputData), // Don't store sensitive data like base64 images
  }
});

// Return 202 Accepted immediately
return NextResponse.json({ jobId: job.id }, { status: 202 });
```

### 3. Poll for Results

```typescript
// Polling endpoint or background worker
const result = await openai.responses.retrieve(openaiResponseId);

if (result.status === 'completed') {
  // Extract output
  const output = result.output_text ?? extractFromOutput(result.output);
  const data = JSON.parse(output);
  const usage = result.usage;

  // Update job record
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      resultJson: JSON.stringify({ result: data, usage }),
    }
  });
} else if (result.status === 'in_progress' || result.status === 'queued') {
  // Still processing
  return { status: 'IN_PROGRESS' };
} else {
  // Failed
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'FAILED',
      errorJson: JSON.stringify({ error: `status_${result.status}` }),
    }
  });
}
```

### 4. Structured Outputs

- Use `text.format.type = 'json_schema'` with `strict: true`
- Parse `response.output_text` or extract from `response.output` messages

### 5. Token Accounting

- Deduct tokens/credits at job creation
- Use `response.usage` (input/output/total tokens) to compute actual cost after completion

### 6. Error Handling

- Validate inputs and return 4xx for expected errors
- Let unexpected errors bubble to framework-level handler
- Do not mask errors; include actionable metadata in logs

### 7. Observability

Add structured logs for:
- Job creation
- OpenAI create OK
- Polling retrieval
- Completion/failure
- Durations

Exclude sensitive data from logs.

## Complete Example

```typescript
// POST /api/long-running-task
export async function POST(request: Request) {
  const { content, options } = await request.json();

  // Validate input
  if (!content) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 });
  }

  const openai = await createOpenAIClient();

  // Create background job
  const response = await openai.responses.create({
    model: AI_MODELS.OPENAI_GPT_5,
    input: [
      {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: content }]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'task_result',
        schema: taskResultSchema,
        strict: true
      }
    },
    reasoning: { effort: 'high' },
    background: true,
  });

  // Persist job
  const job = await prisma.job.create({
    data: {
      status: 'IN_PROGRESS',
      openaiResponseId: response.id,
      userId: session.user.id,
    }
  });

  // Return immediately
  return NextResponse.json({ jobId: job.id }, { status: 202 });
}

// GET /api/long-running-task/[jobId]
export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (job.status === 'COMPLETED') {
    return NextResponse.json({ status: 'COMPLETED', result: JSON.parse(job.resultJson!) });
  }

  if (job.status === 'FAILED') {
    return NextResponse.json({ status: 'FAILED', error: JSON.parse(job.errorJson!) });
  }

  // Poll OpenAI
  const openai = await createOpenAIClient();
  const response = await openai.responses.retrieve(job.openaiResponseId);

  if (response.status === 'completed') {
    const result = JSON.parse(response.output_text!);
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', resultJson: JSON.stringify(result) }
    });
    return NextResponse.json({ status: 'COMPLETED', result });
  }

  if (response.status === 'in_progress' || response.status === 'queued') {
    return NextResponse.json({ status: 'IN_PROGRESS' });
  }

  // Failed
  await prisma.job.update({
    where: { id: jobId },
    data: { status: 'FAILED', errorJson: JSON.stringify({ status: response.status }) }
  });
  return NextResponse.json({ status: 'FAILED', error: response.status });
}
```
