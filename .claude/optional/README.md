# Optional Components

Pre-built agents, commands, and skills for specific use cases. Copy the ones you need into the active directories.

## How to Use

```bash
# Add an agent
cp .claude/optional/agents/ui-engineer.md .claude/agents/

# Add a command
cp .claude/optional/commands/nextjs-rules.md .claude/commands/

# Add a skill (copy entire directory)
cp -r .claude/optional/skills/backend-engineer .claude/skills/
```

---

## Agents (15)

| Agent | Use Case |
|-------|----------|
| `accessibility-tester.md` | WCAG compliance and accessibility auditing |
| `ai-engineer.md` | AI model integration, RAG systems, prompt engineering |
| `code-breakdown-planner.md` | Analyze large files and plan refactoring |
| `data-research-analyst.md` | Data analysis, pattern recognition, research |
| `database-specialist.md` | Database design, query optimization, migrations |
| `devops-engineer.md` | CI/CD, Docker, Kubernetes, infrastructure |
| `e2e-tester.md` | End-to-end testing with Playwright/Cypress |
| `nextjs-fullstack.md` | Next.js specific full-stack development |
| `performance-engineer.md` | Performance profiling and optimization |
| `qa-tester.md` | Quality assurance and test planning |
| `refactor-orchestrator.md` | Coordinate multi-file refactoring workflows |
| `senior-backend-engineer.md` | Backend architecture and API design |
| `ui-engineer.md` | React component development and frontend |
| `ui-visual-designer.md` | Visual design, design systems, accessibility |
| `websocket-architect.md` | Real-time communication and WebSocket systems |

## Commands (15)

| Command | Use Case |
|---------|----------|
| `ai-prompting.md` | AI API usage patterns and prompt templates |
| `bootstrap-project.md` | Project scaffolding and initialization |
| `component-creation.md` | Component architecture patterns |
| `create-rules.md` | Creating new CLAUDE.md rules |
| `database-prisma.md` | Prisma ORM usage and patterns |
| `docker-deployment.md` | Docker and deployment configuration |
| `file-splitting.md` | Large file refactoring strategies |
| `i18n-localization.md` | Internationalization patterns |
| `nextjs-rules.md` | Next.js 15 specific patterns |
| `openai-background.md` | OpenAI background task patterns |
| `readme-docs.md` | Documentation writing |
| `sdk-initialization.md` | SDK factory function patterns |
| `state-management.md` | State management (Zustand, Redux, etc.) |
| `structure-file.md` | Function/component registry management |
| `sync-translations.md` | Translation file synchronization |

## Skills (5)

| Skill | Use Case |
|-------|----------|
| `backend-engineer/` | API routes, server actions, database operations |
| `chrome-devtools/` | Browser debugging with Chrome DevTools MCP |
| `code-breakdown/` | File analysis and extraction planning |
| `software-architecture/` | System design and architectural decisions |
| `webapp-testing/` | Web application testing with Playwright |
