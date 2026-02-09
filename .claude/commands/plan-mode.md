# Plan-First Development

Discipline for approaching non-trivial tasks with planning before implementation.

## When to Plan

Plan first when ANY of these apply:
- Task touches more than 2-3 files
- Multiple valid implementation approaches exist
- Requirements are ambiguous
- Task involves architectural decisions
- You're unfamiliar with the affected code

## The 5-Phase Process

### Phase 1: Explore

Read the relevant code before proposing changes:
- Identify all files that will be affected
- Understand existing patterns and conventions
- Map dependencies between components
- Note any existing tests

**Output:** List of affected files, current architecture understanding

### Phase 2: Design

Outline the implementation approach:
- What changes are needed in each file
- What new files need to be created
- What patterns to follow (matching existing code)
- What edge cases to handle
- What tests to add or update

**Output:** Written plan with specific file changes

### Phase 3: Review

Get user sign-off before implementing:
- Present the plan clearly
- Highlight any trade-offs or decisions
- Ask about ambiguous requirements
- Confirm the approach matches expectations

**Output:** User approval to proceed

### Phase 4: Implement

Execute the plan systematically:
- Follow the approved plan step by step
- Test after each significant change
- Commit at logical checkpoints
- Don't deviate from the plan without re-approval

**Output:** Working code matching the plan

### Phase 5: Verify

Confirm everything works:
- Run the full test suite
- Run type checker / linter
- Run build
- Manually verify key behaviors if applicable
- Review the diff for accidental changes

**Output:** Verification results

## Anti-Patterns

| Thought | Reality |
|---------|---------|
| "This is simple, I'll just code it" | Simple tasks become complex. Plan anyway. |
| "I know this codebase well enough" | Read the current state. Code changes. |
| "Planning is overhead" | Rework from wrong assumptions is worse. |
| "I'll figure it out as I go" | That's how you end up reverting. |
| "The user wants it fast" | Fast + wrong = slower than planned + right. |

## Quick Plan Template

```
## Task: [description]

### Affected Files
- [file1] - [what changes]
- [file2] - [what changes]

### New Files
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

## When to Skip Planning

Only skip for truly trivial tasks:
- Single-line fixes (typos, obvious bugs)
- Adding a single well-defined function
- Tasks where the user gave extremely specific instructions
- Pure research/exploration (no code changes)
