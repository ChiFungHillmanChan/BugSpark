# Skills Index

**470 skills** installed from 22 sources. Skills are auto-discovered by Claude Code via SKILL.md frontmatter.

## Naming Convention

Skills are prefixed by source to avoid conflicts: `{vendor}--{skill-name}`

## Sources

| Prefix | Source | Count | Description |
|--------|--------|-------|-------------|
| *(none)* | Template Core | 8 | Code review, security, linting, planning, worktrees |
| `anthropic--` | [anthropics/skills](https://github.com/anthropics/skills) | 16 | Official: docs, design, MCP builder, testing |
| `ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | 1 | 50+ styles, 97 palettes, 9 stacks |
| `planning-with-files` | [OthmanAdi/planning-with-files](https://github.com/OthmanAdi/planning-with-files) | 1 | Manus-style persistent markdown planning |
| `context-eng--` | [muratcankoylan/Agent-Skills-for-Context-Engineering](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) | 14 | Context optimization, multi-agent, memory |
| `obsidian--` | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | 3 | Obsidian markdown, JSON canvas, bases |
| `scientific--` | [K-Dense-AI/claude-scientific-skills](https://github.com/K-Dense-AI/claude-scientific-skills) | 145 | 140+ scientific tools and databases |
| `dev-browser` | [SawyerHood/dev-browser](https://github.com/SawyerHood/dev-browser) | 1 | Browser control with Chrome extension |
| `playwright-skill` | [lackeyjb/playwright-skill](https://github.com/lackeyjb/playwright-skill) | 1 | Browser automation with Playwright |
| `trailofbits--` | [trailofbits/skills](https://github.com/trailofbits/skills) | 49 | Security: fuzzing, static analysis, auditing |
| `vercel--` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | 5 | React, Next.js, web design patterns |
| `cloudflare--` | [cloudflare/skills](https://github.com/cloudflare/skills) | 8 | Workers, Durable Objects, MCP, AI agents |
| `supabase--` | [supabase/agent-skills](https://github.com/supabase/agent-skills) | 1 | PostgreSQL best practices |
| `stripe--` | [stripe/ai](https://github.com/stripe/ai) | 2 | Payment integration patterns |
| `expo--` | [expo/skills](https://github.com/expo/skills) | 9 | React Native, deployment, Tailwind |
| `sentry--` | [getsentry/skills](https://github.com/getsentry/skills) | 14 | Code review, Django, PR workflows |
| `better-auth--` | [better-auth/skills](https://github.com/better-auth/skills) | 2 | Authentication patterns |
| `neon--` | [neondatabase/agent-skills](https://github.com/neondatabase/agent-skills) | 1 | Neon Postgres best practices |
| `hashicorp--` | [hashicorp/agent-skills](https://github.com/hashicorp/agent-skills) | 13 | Terraform, Packer infrastructure |
| `remotion--` | [remotion-dev/skills](https://github.com/remotion-dev/skills) | 1 | Programmatic video creation |
| `microsoft--` | [microsoft/skills](https://github.com/microsoft/skills) | 137 | Azure SDKs, AI services, M365 agents |
| `sanity--` | [sanity-io/agent-toolkit](https://github.com/sanity-io/agent-toolkit) | 4 | CMS, SEO, content modeling |
| `wordpress--` | [WordPress/agent-skills](https://github.com/WordPress/agent-skills) | 13 | Blocks, plugins, REST API, themes |
| `fal--` | [fal-ai-community/skills](https://github.com/fal-ai-community/skills) | 6 | AI image/audio/video generation |
| `google--` | [google-labs-code/stitch-skills](https://github.com/google-labs-code/stitch-skills) | 6 | Design-to-code, shadcn, Remotion |
| `huggingface--` | [huggingface/skills](https://github.com/huggingface/skills) | 9 | ML model training, datasets, evaluation |

## How Skills Work

Claude automatically scans `SKILL.md` frontmatter to decide when to load a skill. No manual configuration needed -- just clone this template and all skills are ready.

## Customizing for Your Project

**Remove skills you don't need** to reduce noise. For example:
- Frontend-only project? Remove `scientific--*`, `hashicorp--*`, `wordpress--*`
- Not using Azure? Remove `microsoft--azure-*`
- Not doing security audits? Remove `trailofbits--*`

```bash
# Example: remove all scientific skills
rm -rf .claude/skills/scientific--*

# Example: keep only core + vercel + stripe
ls .claude/skills/ | grep -E '^(anthropic|microsoft|scientific|hashicorp|wordpress|obsidian|fal|expo|sentry|cloudflare|google|huggingface|sanity|remotion|neon|better-auth|trailofbits)--' | xargs -I{} rm -rf .claude/skills/{}
```

## Updating Skills

Skills are copied from upstream repos at install time. To update:

```bash
# Re-run the install script
bash .claude/scripts/install-community-skills.sh
```
