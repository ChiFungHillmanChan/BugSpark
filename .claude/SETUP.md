# Setup Guide

Step-by-step customization of this Claude Code template for your project.

## Step 1: Update CLAUDE.md

Open `.claude/CLAUDE.md` and fill in the placeholders:

### Quick Reference Table
Replace the placeholder values:
```markdown
| Tech stack | "Next.js 15, Prisma, TailwindCSS" |
| Package manager | "pnpm" |
| Source directory | "src/" |
| Test directory | "tests/" |
```

### Essential Commands
Uncomment and update the commands section with your actual commands:
```bash
pnpm run dev        # Your dev command
pnpm run build      # Your build command
pnpm test           # Your test command
```

### Framework-Specific Rules
Uncomment or add framework rules. See `commands/framework-rules.md` for templates covering Next.js, Django, FastAPI, React Native, Flask, and Go.

### Commit Scopes
Add your project-specific scopes:
```markdown
<!-- [PROJECT: Add your scopes here] -->
| api | API route changes |
| ui | UI component changes |
| db | Database changes |
```

## Step 2: Configure settings.json

Update permissions for your project structure:

### Edit Paths
Replace generic paths with your actual source directories:
```json
"Edit(src/**)",      -> "Edit(server/**)",
"Edit(lib/**)",      -> "Edit(server/lib/**)",
"Edit(app/**)",      -> "Edit(server/app/**)",
```

### Package Manager Commands
Add your package manager to the allow list:
```json
"Bash(pnpm:*)",
"Bash(pnpm run build:*)",
"Bash(pnpm run dev:*)",
```

### Build/Lint Commands
Add your project's build and lint commands:
```json
"Bash(npx tsc:*)",
"Bash(npx next lint:*)",
```

## Step 3: Configure settings.local.json

### Permissions
Add framework-specific tool permissions:
```json
"Bash(pnpm prisma generate:*)",
"Bash(npx playwright test:*)",
```

### Hooks
The template includes 5 hooks. Customize as needed:
- **session-start.sh**: Uncomment framework-specific env vars
- **protected-files.sh**: Add your protected file patterns
- **auto-format.sh**: Works automatically for common formatters

### Plugins
Enable/disable plugins for your needs:
```json
"enabledPlugins": {
  "code-review@claude-plugins-official": true,
  "stripe@claude-plugins-official": true  // Add if using Stripe
}
```

## Step 4: Add Optional Components

Browse `.claude/optional/README.md` for available components.

### Common Additions by Stack

**Next.js / React:**
```bash
cp .claude/optional/agents/ui-engineer.md .claude/agents/
cp .claude/optional/agents/nextjs-fullstack.md .claude/agents/
cp .claude/optional/commands/nextjs-rules.md .claude/commands/
cp .claude/optional/commands/component-creation.md .claude/commands/
cp .claude/optional/commands/state-management.md .claude/commands/
```

**Backend-heavy (Django, FastAPI, Express):**
```bash
cp .claude/optional/agents/senior-backend-engineer.md .claude/agents/
cp .claude/optional/agents/database-specialist.md .claude/agents/
cp -r .claude/optional/skills/backend-engineer .claude/skills/
cp .claude/optional/commands/database-prisma.md .claude/commands/
```

**AI-focused:**
```bash
cp .claude/optional/agents/ai-engineer.md .claude/agents/
cp .claude/optional/commands/ai-prompting.md .claude/commands/
cp .claude/optional/commands/sdk-initialization.md .claude/commands/
```

## Step 5: Set Up Worktree Aliases (Optional)

Add to `~/.zshrc` or `~/.bashrc`:
```bash
za() {
  local branch="$1"
  local dir="../$(basename $(pwd))-${branch//\//-}"
  git worktree add -b "$branch" "$dir" && cd "$dir" && claude
}
zb() {
  local branch="$1"
  local dir="../$(basename $(pwd))-${branch//\//-}"
  cd "$dir" && claude
}
zc() {
  local branch="$1"
  local dir="../$(basename $(pwd))-${branch//\//-}"
  git worktree remove "$dir" && git branch -d "$branch"
}
```

## Step 6: Validate

Run the validation script:
```bash
bash .claude/scripts/validate-template.sh
```

This checks:
- CLAUDE.md exists and is non-empty
- Settings files are valid JSON
- Hook scripts are executable
- Agent/command/skill counts are in expected range
- Optional directory is populated

## Maintenance

### Self-Improving Instructions
The CLAUDE.md file has a "Lessons Learned" section. When Claude makes a mistake:
1. Claude adds the correction to CLAUDE.md
2. The mistake never happens again
3. Your instructions get better over time

### Periodic Review
- Run `/techdebt` monthly to check code health
- Review CLAUDE.md quarterly for stale instructions
- Update optional components as your stack evolves
