---
name: context-dump
description: Import external context (GitHub issues, Slack threads, Linear tickets, design docs) into .claude/context/ for Claude Code to reference during development sessions.
---

# Context Dump

## Purpose

Import context from external tools into `.claude/context/` so Claude Code can reference it during development. This bridges the gap between task management tools and your coding environment.

## When to Use

- Starting work on a GitHub issue or PR
- Implementing a feature described in a Linear/Jira ticket
- Following up on a Slack/Discord discussion
- Working from a design document or spec

## Directory Structure

```
.claude/
  context/
    github-issue-123.md    # GitHub issue details
    slack-thread-auth.md   # Slack discussion summary
    design-spec-v2.md      # Design document
    linear-PROJ-456.md     # Linear ticket details
```

## Import Patterns

### From GitHub Issues

```bash
# Using gh CLI
gh issue view 123 > .claude/context/github-issue-123.md
gh pr view 456 > .claude/context/github-pr-456.md
gh issue view 123 --comments >> .claude/context/github-issue-123.md
```

### From Linear/Jira

Copy the ticket details and save:
```bash
# Manual: paste ticket content
cat > .claude/context/linear-PROJ-456.md << 'EOF'
# PROJ-456: Implement user authentication

## Description
[paste ticket description]

## Acceptance Criteria
- [ ] [criteria from ticket]

## Discussion Notes
[paste relevant comments]
EOF
```

### From Slack/Discord

Summarize the relevant discussion:
```bash
cat > .claude/context/slack-auth-discussion.md << 'EOF'
# Auth Discussion (2024-01-15)

## Key Decisions
- Use JWT for API auth
- Session cookies for web app
- Refresh tokens expire after 7 days

## Open Questions
- Rate limiting strategy TBD
EOF
```

### From Design Documents

```bash
# Copy or link relevant specs
cp path/to/design-spec.md .claude/context/design-spec.md
```

## Usage in Claude Code

Once context is imported, reference it in your prompts:
```
See .claude/context/github-issue-123.md for the full requirements.
Implement the feature described in .claude/context/design-spec.md.
```

## Cleanup

Remove context files when work is complete:
```bash
rm .claude/context/github-issue-123.md
```

Add `.claude/context/` to `.gitignore` if context files contain sensitive information.

## Best Practices

1. **Keep context focused** - Only import what's relevant to current work
2. **Summarize long threads** - Don't dump entire Slack histories
3. **Include acceptance criteria** - Makes it clear when work is done
4. **Clean up after merge** - Remove stale context files
5. **Don't commit secrets** - Review context files before committing
