# Claude Code Best-Practice Template

A framework-agnostic, reusable template for Claude Code projects. Based on best practices from Boris Cherny (Claude Code founder) and official Anthropic documentation.

## What's Included

| Component | Count | Purpose |
|-----------|-------|---------|
| CLAUDE.md | 1 | Self-improving project instructions with universal coding standards |
| Agents | 8 | Universal agents (code-reviewer, security-tester, refactorer, etc.) |
| Commands | 11 | Slash commands for common workflows |
| Skills | 8 | Specialized skill modules with reference docs |
| Hooks | 5 | Automated session start, formatting, notifications, protection |
| Optional | 35 | Framework-specific agents, commands, and skills ready to add |

## Quick Start

1. **Clone this template** into your project's `.claude/` directory
2. **Run setup**: Follow `.claude/SETUP.md` for customization
3. **Start coding**: `claude` in your project root

## Core Philosophy

This template follows 5 principles from Boris Cherny's Claude Code practices:

1. **Self-improving CLAUDE.md** - Instructions update themselves when Claude learns from corrections
2. **Plan-first development** - Explore, design, review, implement, verify
3. **Parallel workflows** - Git worktrees for concurrent Claude Code sessions
4. **Verification-driven development** - Test and build after every change
5. **Opus 4.5 with extended thinking** - Use the best model with plan mode for complex tasks

## Template Structure

```
.claude/
  CLAUDE.md                 # Project instructions (customize this)
  SETUP.md                  # Step-by-step customization guide
  PHILOSOPHY.md             # Design principles behind this template
  settings.json             # Permissions and environment config
  settings.local.json       # Hooks, plugins, local overrides

  agents/                   # 8 universal agent profiles
    code-reviewer.md
    code-refactorer.md
    expert-search-specialist.md
    background-task-runner.md
    unit-test-generator.md
    git-committor.md
    security-tester.md
    test-validator.md

  commands/                 # 11 slash commands
    core-rules.md           # Core programming principles
    typescript-rules.md     # TypeScript best practices
    error-handling.md       # Error handling patterns
    security-rules.md       # Security and credentials
    code-cleanup.md         # Code quality detection
    style-guide.md          # Visual design rules
    troubleshooting.md      # Common issues and fixes
    techdebt.md             # Tech debt scanner
    worktree-workflow.md    # Git worktree guide
    plan-mode.md            # Plan-first discipline
    framework-rules.md      # Framework rule templates

  skills/                   # 8 skill modules
    code-reviewer/          # Code review with references
    eslint-fixer/           # Lint error resolution
    production-code-standards/  # Production quality enforcement
    security-guidance/      # Security review and audit
    techdebt-scanner/       # Automated debt detection
    worktree-manager/       # Parallel workflow management
    context-dump/           # External context import
    plan-first/             # Plan-before-implement

  hooks/                    # 5 automated hooks
    session-start.sh        # Environment setup
    task-notify.sh          # File change notifications
    test-runner.sh          # Test file detection
    auto-format.sh          # Auto-format on save
    protected-files.sh      # Block edits to protected files

  optional/                 # 35 framework-specific components
    agents/                 # 15 specialized agents
    commands/               # 15 framework-specific commands
    skills/                 # 5 specialized skill modules
    README.md               # Index of all optional components

  scripts/
    validate-template.sh    # Template validation
```

## Customization

See `.claude/SETUP.md` for the full customization guide. The key steps:

1. Update `CLAUDE.md` - Fill in project-specific placeholders
2. Configure `settings.json` - Adjust permissions for your package manager
3. Add framework rules - Copy from `commands/framework-rules.md`
4. Enable optional components - Copy from `.claude/optional/`
5. Customize hooks - Uncomment framework-specific lines in `session-start.sh`

## License

MIT
