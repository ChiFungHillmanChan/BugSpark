# Template Philosophy

The design principles behind this Claude Code template, drawn from Boris Cherny's practices and official Anthropic documentation.

## 5 Core Principles

### 1. Self-Improving CLAUDE.md

The most important file in any Claude Code project is `CLAUDE.md`. This template treats it as a living document:

- When Claude makes a mistake, it adds a correction to CLAUDE.md
- When the user teaches a new pattern, it gets recorded
- Over time, the instructions become perfectly tailored to your project
- No two projects end up with the same CLAUDE.md

**Key insight:** The best project instructions are written collaboratively between you and Claude over time, not authored once and forgotten.

### 2. Plan-First Development

For non-trivial tasks, always plan before implementing:

```
Explore -> Design -> Review -> Implement -> Verify
```

This prevents:
- Wasted work from wrong assumptions
- Having to revert large changes
- Misunderstanding requirements
- Missing edge cases

The template enforces this through the `plan-first` skill and `plan-mode` command.

### 3. Parallel Workflows with Git Worktrees

Claude Code works best when focused on one task. For parallel work:

- Use git worktrees to create isolated directories
- Each worktree runs its own Claude Code session
- Independent tasks proceed simultaneously
- Merge when complete

This is Boris Cherny's top productivity recommendation for Claude Code power users.

### 4. Verification-Driven Development

Every change must be verified before moving on:

- Run tests after each extraction
- Run type checker after each refactor
- Run build before committing
- Never trust "it should work" - prove it works

The template enforces this through the `test-validator` agent and hooks that notify when test files change.

### 5. Use the Best Model with Thinking

For complex tasks:
- Use Opus 4.5 (the most capable model)
- Enable extended thinking for architectural decisions
- Use plan mode to get sign-off before implementation
- Reserve fast models (Haiku, Sonnet) for simple operations

The template configures agents with appropriate model selections: Opus for complex work, Sonnet for validation, Haiku for git operations.

## Design Decisions

### Why Framework-Agnostic?

A template that only works with Next.js helps Next.js developers but alienates everyone else. By making the core universal and keeping framework-specific content optional:

- The same template works for any tech stack
- Teams can share a common baseline
- Framework rules are easy to add via the `framework-rules` command
- Optional components prevent bloat

### Why 300-Line File Limit?

Industry practice (Apple, Microsoft, Amazon) shows that files over 300 lines become hard to:
- Understand at a glance
- Review in PRs
- Test in isolation
- Refactor safely

The 300-line limit forces good architecture through small, focused modules.

### Why 8 Agents (Not 23)?

More agents = more confusion about which to use. The 8 universal agents cover the core development workflow:

1. **code-reviewer** - Quality gate
2. **security-tester** - Security gate
3. **unit-test-generator** - Test creation
4. **test-validator** - Test execution
5. **code-refactorer** - Safe code changes
6. **git-committor** - Clean git history
7. **expert-search-specialist** - Finding information
8. **background-task-runner** - Long operations

Specialized agents (AI engineer, database specialist, UI engineer) are available in `optional/` for projects that need them.

### Why Hooks?

Hooks automate what humans forget:
- **session-start**: Consistent environment setup
- **task-notify**: Awareness of file changes
- **test-runner**: Reminder to test after modifying test files
- **auto-format**: Consistent formatting without manual effort
- **protected-files**: Prevent accidental secrets exposure
- **Stop hook**: CLAUDE.md self-improvement reminder

## Sources

- Boris Cherny's Claude Code practices (Anthropic engineering blog)
- Anthropic official Claude Code documentation
- Conventional Commits specification
- OWASP Top 10 security standards
- Industry engineering practices (Google, Apple, Microsoft, Amazon)
