#!/bin/bash
# Visual-only notification on file writes/edits (no sound)
# PostToolUse hook for Write|Edit tools

TOOL_NAME=$(jq -r '.tool_name // "Unknown"')
FILE_PATH=$(jq -r '.tool_input.file_path // ""')

if [ -n "$FILE_PATH" ]; then
  FILENAME=$(basename "$FILE_PATH")
  osascript -e "display notification \"$FILENAME\" with title \"Claude: $TOOL_NAME\""
fi

exit 0
