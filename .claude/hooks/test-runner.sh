#!/bin/bash
# Notify when test files are modified
# PostToolUse hook for Write|Edit tools on test files

FILE_PATH=$(jq -r '.tool_input.file_path // ""')

if [[ "$FILE_PATH" == *.test.* ]] || [[ "$FILE_PATH" == *.spec.* ]]; then
  osascript -e "display notification \"Test file modified\" with title \"Claude: Test Runner\""
  # Output system message to remind about running tests
  echo '{"systemMessage": "Test file modified. Consider running: pnpm test '"$FILE_PATH"'"}'
fi

exit 0
