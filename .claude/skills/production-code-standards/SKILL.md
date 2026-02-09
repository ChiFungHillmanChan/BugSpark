---
name: production-code-standards
description: Use when writing ANY code - enforces industry-standard practices, 300 line file limits, mandatory reuse analysis, cost-effective implementation, and production-ready quality. Use BEFORE creating new files, functions, or components.
---

# Production Code Standards

## Required Rules

**CRITICAL: Before writing any code, load these project rules using the Skill tool:**
- `core-rules` - SRP, DRY, module size limits
- `typescript-rules` - Type safety, no `any`, nullish coalescing (if TypeScript)
- `error-handling` - Error propagation, no eslint-disable, no ts-ignore
- `security-rules` - Credential handling, input validation, env var patterns

These rules are MANDATORY for all code in this project.

## The Iron Rule

**Best practice over "make it work".** Every line of code must be production-ready from the start.

## Core Standards

### 1. File Size Limits (Strict)

| Type | Max Lines | Action if Exceeded |
|------|-----------|-------------------|
| Components | 200 | Split immediately |
| Utilities/Helpers | 150 | Extract to modules |
| API Routes/Handlers | 200 | Extract handlers |
| Services | 300 | Decompose by domain |
| Types/Interfaces | 200 | Group by domain |

### 2. Mandatory Reuse Analysis

**Before creating ANY new code:**
1. Search the codebase for existing similar logic
2. Check shared utility directories (lib/, utils/, helpers/)
3. If similar code exists, extract a shared function first
4. Document new shared utilities for team discovery

### 3. Cost-Effective Implementation

Choose the simplest solution that works. Questions before adding a dependency:
1. Can native APIs solve this?
2. Is the bundle size justified?
3. Will this need maintenance?
4. Does existing code already handle this?

### 4. Production-Ready Checklist

Every piece of code MUST have:
- [ ] **Type Safety**: No `any`, use `unknown` + type guards (TypeScript)
- [ ] **Error Handling**: Meaningful errors, proper propagation
- [ ] **Null Safety**: Use `??` not `||`, check before access
- [ ] **Input Validation**: Validate at boundaries
- [ ] **Consistent Naming**: Follow project conventions
- [ ] **No Magic Values**: Use constants
- [ ] **No Dead Code**: Remove unused imports/variables

## Red Flags - STOP Immediately

| Thought | Reality |
|---------|---------|
| "I'll refactor later" | Write it right the first time |
| "This is just a quick fix" | Quick fixes become tech debt |
| "It works, ship it" | Working != production-ready |
| "This file is getting long but..." | Split it NOW |
| "I need a new utility for this" | Did you check existing code? |

## Reference Documentation

- Reuse analysis patterns: `references/reuse-analysis.md`
- File organization: `references/file-organization.md`
- Cost effectiveness: `references/cost-effectiveness.md`
