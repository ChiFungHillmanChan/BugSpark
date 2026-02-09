---
name: code-reviewer
description: Use when reviewing code changes, PRs, or ensuring code quality. Checks type safety, security, error handling, and project conventions.
---

# Code Reviewer

## Required Rules

**CRITICAL: Before any code review, load these project rules using the Skill tool:**
- `core-rules` - SRP, module size, search-before-creating
- `typescript-rules` - Type safety, no `any`, hook patterns (if TypeScript)
- `error-handling` - Error propagation, no eslint-disable, no ts-ignore
- `security-rules` - Credential handling, input validation
- `code-cleanup` - Anti-patterns detection, resource leaks

These rules define ALL criteria for code review in this project.

## Review Process

### 1. Understand the Change
- Read the diff to understand what changed
- Identify the purpose (feature, fix, refactor)
- Check which files are affected

### 2. Check Against Standards
- Files under 300 lines
- No code duplication
- Descriptive variable names
- No `any` types (TypeScript)
- No eslint-disable or ts-ignore
- Proper error handling

### 3. Security Review
- No hardcoded credentials
- Input validation at boundaries
- No injection vulnerabilities
- Proper authorization checks

### 4. Architecture Review
- Single responsibility per module
- Proper abstraction levels
- No circular dependencies
- Clean import graph

## Reference Documentation

- Review checklist: `references/code_review_checklist.md`
- Coding standards: `references/coding_standards.md`
- Common anti-patterns: `references/common_antipatterns.md`

## Output Format

Prioritize findings by severity:
1. **Critical** - Security vulnerabilities, data loss risks
2. **High** - Type safety issues, error handling gaps
3. **Medium** - Code quality, naming, duplication
4. **Low** - Style, organization suggestions
