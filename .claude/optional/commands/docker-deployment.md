# Docker & Deployment Rules

Best practices for Docker containerization and deployment.

## General Guidelines

- Always use multi-stage builds for small, secure images
- Never include secrets or sensitive data in images or build logs
- Tag images with both commit SHA and branch/tag for traceability
- Use `.dockerignore` to exclude unnecessary files from build context
- Keep Dockerfiles readable and well-commented

## CI/CD Integration

- Always build and test Docker images in CI, including for PRs
- Only push images to registry when explicitly requested (workflow dispatch or main branch)
- Ensure images are tested (via `docker run` or integration tests) before deployment
- Authenticate to registry only when push is required
- Avoid leaking secrets in logs or environment variables during CI/CD
- Document workflow-specific requirements (login, conditional push)

## Security

- Use official base images where possible and keep them updated
- Run containers as non-root users unless absolutely necessary
- Minimize the number of layers and installed packages
- Scan images for vulnerabilities regularly

## Azure Deployment

- Always use the Linux version of Azure Web Apps for deployments

## Multi-Stage Build Example

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm && pnpm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

## .dockerignore Example

```
# Dependencies
node_modules
.pnpm-store

# Build artifacts
.next
out
build

# Development files
.git
.gitignore
*.md
*.log

# IDE
.vscode
.idea

# Environment files (contain secrets)
.env
.env.local
.env.*.local

# Test files
__tests__
*.test.ts
*.spec.ts
coverage
```

## Environment Variables in Docker

**NEVER bake secrets into images:**

```dockerfile
# WRONG
ENV OPENAI_API_KEY=sk-abc123

# CORRECT - pass at runtime
CMD ["node", "server.js"]
# Then: docker run -e OPENAI_API_KEY=$OPENAI_API_KEY ...
```

## Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

## Commands

- **Build**: `pnpm run build`
- **OS Preference**: Always use Windows PowerShell commands
- **Package Manager**: Always use pnpm
