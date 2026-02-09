---
name: plan-first
description: Enforces plan-before-implement discipline. Guides through exploration, design, review, implementation, and verification phases for non-trivial tasks.
---

# Plan-First Development

## When to Use

Use this skill BEFORE implementing anything non-trivial:
- Task touches more than 2-3 files
- Multiple valid approaches exist
- Requirements are ambiguous
- Architectural decisions needed
- Unfamiliar code area

## The 5-Phase Process

### Phase 1: Explore (READ before you write)

Before proposing any changes:

1. **Identify affected files** - List every file that will change
2. **Read the code** - Understand current patterns and conventions
3. **Map dependencies** - What imports what? What breaks if X changes?
4. **Check tests** - What test coverage exists?
5. **Review history** - Why is it structured this way? (`git log --oneline <file>`)

**Output:** File list + architecture understanding

### Phase 2: Design (Outline the approach)

Write a plan covering:

```markdown
## Task: [description]

### Affected Files
- [file1] - [what changes]
- [file2] - [what changes]

### New Files (if any)
- [file] - [purpose]

### Approach
[1-3 sentences describing the strategy]

### Edge Cases
- [case 1]
- [case 2]

### Tests
- [test to add/update]

### Risks
- [potential issue and mitigation]
```

### Phase 3: Review (Get sign-off)

Present the plan to the user:
- Highlight trade-offs
- Flag ambiguous requirements
- Confirm approach matches expectations
- **Do NOT start coding until approved**

### Phase 4: Implement (Execute systematically)

Follow the approved plan:
- One logical change at a time
- Test after each change
- Commit at logical checkpoints
- Don't deviate without re-approval

### Phase 5: Verify (Confirm it works)

- Run full test suite
- Run type checker / linter
- Run build
- Review the diff for accidental changes
- Verify key behaviors

## Anti-Patterns to Catch

| Thought | Response |
|---------|----------|
| "This is simple, just code it" | Simple tasks become complex. Plan anyway. |
| "I know this codebase" | Read the current state. Code changes. |
| "Planning is overhead" | Rework is worse overhead. |
| "I'll figure it out as I go" | That's how you end up reverting. |
| "The user wants it fast" | Fast + wrong = slower than planned + right. |

## When to Skip

Only skip for truly trivial tasks:
- Single-line fixes (typos, obvious bugs)
- Adding a single well-defined function
- Extremely specific user instructions
- Pure research (no code changes)
