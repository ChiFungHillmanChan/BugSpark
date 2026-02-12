# Phase 2: Core Features

These are the features that small companies consider dealbreakers. Without Jira and Slack, many teams will not adopt BugSpark regardless of other features.

## Tasks

| # | Task | Priority | Complexity |
|---|------|----------|-----------|
| 2.1 | [Jira integration (2-way sync)](./2.1-jira-integration.md) | HIGH | Medium-High |
| 2.2 | [Slack & Discord notifications](./2.2-slack-discord.md) | HIGH | Medium |
| 2.3 | [GitHub bidirectional sync](./2.3-github-bidirectional-sync.md) | MEDIUM | Medium |
| 2.4 | [Chrome browser extension](./2.4-browser-extension.md) | MEDIUM | High |
| 2.5 | [New pricing tier (Pro plan)](./2.5-pro-pricing-tier.md) | MEDIUM | Low |

## Dependencies

```
2.1 Jira Integration (no dependencies, but builds on existing integration pattern)
2.2 Slack & Discord ──depends on──> Phase 1.5 (notification infrastructure)
2.3 GitHub Bidirectional ──builds on──> existing GitHub integration
2.4 Browser Extension (independent, but shares widget core code)
2.5 Pro Pricing Tier (no dependencies, but should align with feature gates)
```

## Infrastructure Impact

- Jira: No new services, uses Jira REST API + incoming webhooks
- Slack: Slack App registration needed (free), or simple Incoming Webhooks
- Discord: Discord Webhook URL (free)
- Browser Extension: Chrome Web Store developer account ($5 one-time)
- Pro tier: Pricing page update + plan enforcement logic
