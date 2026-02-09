# Rules Authoring Guide

Conventions and best practices for creating new rules in this codebase.

## Rule Numbering & Naming Conventions

For Cursor rules (`.cursor/rules/`):

- **01. Core Rules**: Apply to entire codebase (security, architecture, error handling). Prefix: `01.`
- **02. Framework-Specific Rules**: Technology/framework guidance (Next.js, React, Prisma). Prefix: `02.`
- **03. UI/UX Rules**: User interface, styling, accessibility. Prefix: `03.`
- **98. One-Time Operations**: On-demand or remediation operations. Prefix: `98.`
- **99. Program Execution Rules**: Scripts, commands, programmatic actions. Prefix: `99.`

Use kebab-case for filenames: `01.core-rules.mdc`, `02.next-js-rule.mdc`

For Claude Code commands (`.claude/commands/`):
- Use descriptive kebab-case names: `typescript-rules.md`, `file-splitting.md`
- No numeric prefixes needed

## When to Create a New Rule

- Introducing new architectural, process, or coding standard
- Adding new framework, tool, or major feature
- Needing one-time or on-demand operation (migration, refactor)
- Introducing new class of scripts or programmatic actions

## Rule Structure

Each rule should include:

### 1. Title
Clear, descriptive heading

### 2. Purpose
What the rule governs and why it exists

### 3. Scope
Where and when the rule applies

### 4. Guidelines/Steps
Actionable, step-by-step instructions or principles

### 5. Examples (Optional)
Concrete examples or scenarios

### 6. References (Optional)
Links to related rules or files

## Referencing Other Rules

**Cursor format:**
```markdown
[filename.ext](mdc:filename.ext)
```

**Claude Code format:**
```markdown
See `.claude/commands/related-rule.md`
```

## Best Practices

- Write in clear, concise language
- Use numbered or bulleted lists for steps
- Keep rules focused - split large rules if needed
- Update rules when processes change
- Add change log section for major updates

## Example Rule Structure

```markdown
# Example Rule Title

## Purpose
Describes what this rule governs and why.

## Scope
Where and when this rule applies.

## Guidelines
1. Step one
2. Step two

## Examples
[Code examples if applicable]

## References
- Related rule 1
- Related rule 2
```

## Additional Notes

- Place Cursor rules in `.cursor/rules/` directory
- Place Claude commands in `.claude/commands/` directory
- Review existing rules for style before authoring new ones
- Update `readme/cursor-rules-guide.md` when creating/updating Cursor rules

## Always-Apply vs On-Demand Rules

### Always-Apply Rules (Cursor)
Set `alwaysApply: true` in frontmatter for rules that should always be enforced:
- Core programming principles
- Error handling guidelines
- Security rules
- Search/structure requirements

### Always-Apply Rules (Claude Code)
Include directly in `CLAUDE.md` for rules that should always be enforced.

### On-Demand Rules
Both Cursor (`.mdc`) and Claude (`.md`) command files for rules invoked when needed:
- Framework-specific patterns
- One-time operations
- Feature-specific guidelines
