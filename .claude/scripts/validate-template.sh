#!/bin/bash
# Validate Claude Code template structure
# Run: bash .claude/scripts/validate-template.sh

CLAUDE_DIR=".claude"
PASS=0
FAIL=0
WARN=0

pass() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "  FAIL: $1"; FAIL=$((FAIL + 1)); }
warn() { echo "  WARN: $1"; WARN=$((WARN + 1)); }

echo "===== Claude Code Template Validation ====="
echo ""

# --- Core Files ---
echo "## Core Files"

if [ -f "$CLAUDE_DIR/CLAUDE.md" ] && [ -s "$CLAUDE_DIR/CLAUDE.md" ]; then
  pass "CLAUDE.md exists and is non-empty"
else
  fail "CLAUDE.md missing or empty"
fi

if [ -f "$CLAUDE_DIR/settings.json" ]; then
  if python3 -c "import json; json.load(open('$CLAUDE_DIR/settings.json'))" 2>/dev/null; then
    pass "settings.json is valid JSON"
  else
    fail "settings.json is not valid JSON"
  fi
else
  fail "settings.json missing"
fi

if [ -f "$CLAUDE_DIR/settings.local.json" ]; then
  if python3 -c "import json; json.load(open('$CLAUDE_DIR/settings.local.json'))" 2>/dev/null; then
    pass "settings.local.json is valid JSON"
  else
    fail "settings.local.json is not valid JSON"
  fi
else
  fail "settings.local.json missing"
fi

if [ -f "$CLAUDE_DIR/SETUP.md" ]; then
  pass "SETUP.md exists"
else
  warn "SETUP.md missing"
fi

if [ -f "$CLAUDE_DIR/PHILOSOPHY.md" ]; then
  pass "PHILOSOPHY.md exists"
else
  warn "PHILOSOPHY.md missing"
fi

echo ""

# --- Hooks ---
echo "## Hooks"

HOOK_COUNT=0
for hook in session-start.sh task-notify.sh test-runner.sh auto-format.sh protected-files.sh; do
  if [ -f "$CLAUDE_DIR/hooks/$hook" ]; then
    if [ -x "$CLAUDE_DIR/hooks/$hook" ]; then
      pass "$hook exists and is executable"
    else
      warn "$hook exists but is NOT executable"
    fi
    HOOK_COUNT=$((HOOK_COUNT + 1))
  else
    warn "$hook missing"
  fi
done

if [ "$HOOK_COUNT" -ge 3 ]; then
  pass "Hook count ($HOOK_COUNT) in expected range (3-5)"
else
  fail "Hook count ($HOOK_COUNT) below minimum (3)"
fi

echo ""

# --- Agents ---
echo "## Agents"

AGENT_COUNT=$(ls "$CLAUDE_DIR/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$AGENT_COUNT" -ge 5 ] && [ "$AGENT_COUNT" -le 15 ]; then
  pass "Agent count ($AGENT_COUNT) in expected range (5-15)"
else
  warn "Agent count ($AGENT_COUNT) outside expected range (5-15)"
fi

for agent in code-reviewer.md security-tester.md unit-test-generator.md test-validator.md; do
  if [ -f "$CLAUDE_DIR/agents/$agent" ]; then
    pass "Core agent $agent exists"
  else
    fail "Core agent $agent missing"
  fi
done

echo ""

# --- Commands ---
echo "## Commands"

COMMAND_COUNT=$(ls "$CLAUDE_DIR/commands/"*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$COMMAND_COUNT" -ge 7 ] && [ "$COMMAND_COUNT" -le 20 ]; then
  pass "Command count ($COMMAND_COUNT) in expected range (7-20)"
else
  warn "Command count ($COMMAND_COUNT) outside expected range (7-20)"
fi

for cmd in core-rules.md error-handling.md security-rules.md techdebt.md; do
  if [ -f "$CLAUDE_DIR/commands/$cmd" ]; then
    pass "Core command $cmd exists"
  else
    fail "Core command $cmd missing"
  fi
done

echo ""

# --- Skills ---
echo "## Skills"

SKILL_COUNT=$(ls -d "$CLAUDE_DIR/skills/"*/ 2>/dev/null | wc -l | tr -d ' ')
if [ "$SKILL_COUNT" -ge 4 ] && [ "$SKILL_COUNT" -le 15 ]; then
  pass "Skill count ($SKILL_COUNT) in expected range (4-15)"
else
  warn "Skill count ($SKILL_COUNT) outside expected range (4-15)"
fi

for skill in code-reviewer production-code-standards security-guidance plan-first; do
  if [ -f "$CLAUDE_DIR/skills/$skill/SKILL.md" ]; then
    pass "Core skill $skill exists"
  else
    fail "Core skill $skill missing"
  fi
done

echo ""

# --- Optional Directory ---
echo "## Optional Directory"

if [ -d "$CLAUDE_DIR/optional" ]; then
  pass "Optional directory exists"

  OPT_AGENTS=$(ls "$CLAUDE_DIR/optional/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')
  OPT_COMMANDS=$(ls "$CLAUDE_DIR/optional/commands/"*.md 2>/dev/null | wc -l | tr -d ' ')
  OPT_SKILLS=$(ls -d "$CLAUDE_DIR/optional/skills/"*/ 2>/dev/null | wc -l | tr -d ' ')

  if [ "$OPT_AGENTS" -gt 0 ]; then
    pass "Optional agents: $OPT_AGENTS"
  else
    warn "No optional agents found"
  fi

  if [ "$OPT_COMMANDS" -gt 0 ]; then
    pass "Optional commands: $OPT_COMMANDS"
  else
    warn "No optional commands found"
  fi

  if [ "$OPT_SKILLS" -gt 0 ]; then
    pass "Optional skills: $OPT_SKILLS"
  else
    warn "No optional skills found"
  fi

  if [ -f "$CLAUDE_DIR/optional/README.md" ]; then
    pass "Optional README.md exists"
  else
    warn "Optional README.md missing"
  fi
else
  fail "Optional directory missing"
fi

echo ""

# --- Summary ---
echo "===== SUMMARY ====="
echo "  PASS: $PASS"
echo "  WARN: $WARN"
echo "  FAIL: $FAIL"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo "RESULT: Template is valid"
  exit 0
else
  echo "RESULT: Template has $FAIL failure(s) - please fix"
  exit 1
fi
