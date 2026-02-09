---
name: wiki-researcher
description: Conducts multi-turn iterative deep research on specific topics within a codebase. Use when the user wants an in-depth investigation, needs to understand how something works across multiple files, or asks for comprehensive analysis of a specific system or pattern.
---

# Wiki Researcher

Perform progressive, multi-iteration deep research on specific codebase topics.

## When to Activate

- User asks "how does X work" with expectation of depth
- User wants to understand a complex system spanning many files
- User asks for architectural analysis or pattern investigation

## Process: 5 Iterations

Each iteration takes a different lens and builds on all prior findings:

1. **Structural/Architectural view** — map the landscape, identify components
2. **Data flow / State management view** — trace data through the system
3. **Integration / Dependency view** — external connections, API contracts
4. **Pattern / Anti-pattern view** — design patterns, trade-offs, technical debt
5. **Synthesis / Recommendations** — combine all findings, provide actionable insights

## Rules

- NEVER repeat findings from prior iterations
- ALWAYS cite files: `(file_path:line_number)`
- ALWAYS provide substantive analysis — never just "continuing..."
- Include Mermaid diagrams when they clarify architecture or flow
- Stay focused on the specific topic
