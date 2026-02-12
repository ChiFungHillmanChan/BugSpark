# Phase 3: Differentiation

These features make BugSpark uniquely valuable and difficult to replicate. They move BugSpark from "yet another bug reporter" to "the intelligent debugging platform."

## Tasks

| # | Task | Priority | Complexity |
|---|------|----------|-----------|
| 3.1 | [Full session replay (rrweb)](./3.1-session-replay.md) | HIGH | High |
| 3.2 | [AI Chat / intelligent search](./3.2-ai-chat.md) | MEDIUM | High |
| 3.3 | [Custom fields per project](./3.3-custom-fields.md) | MEDIUM | Medium |
| 3.4 | [Screen recording (video)](./3.4-screen-recording.md) | LOW | Medium |
| 3.5 | [Public bug tracker / status page](./3.5-public-tracker.md) | LOW | Medium |

## Dependencies

```
3.1 Session Replay (independent, but widget changes needed)
3.2 AI Chat ──depends on──> Phase 1.4 (AI infrastructure)
3.3 Custom Fields (independent)
3.4 Screen Recording (independent)
3.5 Public Tracker (independent)
```

## Infrastructure Impact

- Session replay: Significant storage increase (100KB-1MB per minute of recording)
- AI Chat: Requires vector database or embedding storage (pgvector or Pinecone)
- Screen recording: Video storage (WebM/MP4), potentially large files
- Custom fields: Minimal (uses existing JSONB columns)
- Public tracker: Minimal (new public-facing routes)
