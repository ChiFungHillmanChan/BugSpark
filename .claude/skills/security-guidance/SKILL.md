---
name: security-guidance
description: Use when implementing security features, reviewing for vulnerabilities, handling credentials, or auditing security.
---

# Security Guidance

## Required Rules

**CRITICAL: Before any security work, load these project rules using the Skill tool:**
- `security-rules` - Credential handling, env var patterns, input validation
- `error-handling` - Error propagation (don't mask errors with generic messages)

These rules define the security standards for ALL code in this project.

## Security Review Areas

### 1. Credential Management
- No hardcoded secrets in source code
- Environment variables accessed at runtime via factory functions
- .env files in .gitignore
- env.example with names only, no values

### 2. Input Validation
- All user input validated at system boundaries
- Schema validation (Zod, Joi, Pydantic, etc.)
- Parameterized queries for database operations
- HTML output sanitized to prevent XSS

### 3. Authentication & Authorization
- Proper session management
- Authorization checks on every protected route
- Secure cookie attributes (httpOnly, secure, sameSite)
- Token expiration and rotation

### 4. API Security
- Rate limiting on public endpoints
- CORS properly configured
- Error messages don't leak internal details
- Security headers configured

## Reference Documentation

- Architecture patterns: `references/security_architecture_patterns.md`
- Penetration testing: `references/penetration_testing_guide.md`
- Cryptography: `references/cryptography_implementation.md`

## Scripts

```bash
python scripts/threat_modeler.py <project-path>
python scripts/security_auditor.py <target-path> [--verbose]
python scripts/pentest_automator.py [arguments]
```
