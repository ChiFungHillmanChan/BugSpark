# Phase 1: Critical Fixes

Do these immediately. These are security fixes, unlocking already-built features, and adding basic notification infrastructure.

## Tasks

| # | Task | Priority | Files Affected |
|---|------|----------|---------------|
| 1.1 | [Security vulnerability fixes](./1.1-security-fixes.md) | CRITICAL | 4 routers, 2 services, widget |
| 1.2 | [Unlock Linear integration](./1.2-unlock-linear.md) | HIGH | pricing-data.ts, comparison table |
| 1.3 | [Open AI analysis to Team plan](./1.3-open-ai-analysis.md) | HIGH | analysis router, dependencies |
| 1.4 | [AI auto-triage on submit](./1.4-ai-auto-triage.md) | HIGH | reports router, analysis service, task queue |
| 1.5 | [Email notification system](./1.5-email-notifications.md) | HIGH | new service, templates, report/comment routers |

## Dependencies

```
1.1 Security Fixes (no dependencies)
1.2 Unlock Linear (no dependencies)
1.3 Open AI Analysis (no dependencies)
1.4 AI Auto-triage ──depends on──> 1.3 (AI must be accessible)
1.5 Email Notifications (no dependencies)
```

## Estimated Infrastructure Impact

- No new services required
- Resend (email) already configured
- Anthropic API usage will increase when AI is opened to Team plan
