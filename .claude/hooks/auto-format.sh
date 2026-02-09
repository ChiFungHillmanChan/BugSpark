#!/bin/bash
# Auto-format files after Write|Edit tool use
# PostToolUse hook for Write|Edit tools

FILE_PATH=$(jq -r '.tool_input.file_path // ""')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Get file extension
EXT="${FILE_PATH##*.}"

case "$EXT" in
  ts|tsx|js|jsx|json|css|scss|html|md)
    # Format with Prettier if available
    if command -v npx &> /dev/null && [ -f "node_modules/.bin/prettier" ]; then
      npx prettier --write "$FILE_PATH" 2>/dev/null
    fi
    ;;
  py)
    # Format with Black if available
    if command -v black &> /dev/null; then
      black --quiet "$FILE_PATH" 2>/dev/null
    fi
    ;;
  go)
    # Format with gofmt
    if command -v gofmt &> /dev/null; then
      gofmt -w "$FILE_PATH" 2>/dev/null
    fi
    ;;
  rs)
    # Format with rustfmt
    if command -v rustfmt &> /dev/null; then
      rustfmt "$FILE_PATH" 2>/dev/null
    fi
    ;;
esac

exit 0
