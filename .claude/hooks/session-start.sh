#!/bin/bash
# Auto-setup development environment variables
# SessionStart hook

if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export NODE_ENV=development' >> "$CLAUDE_ENV_FILE"

  # [PROJECT: Uncomment and customize for your framework]
  # echo 'export PRISMA_HIDE_UPDATE_MESSAGE=1' >> "$CLAUDE_ENV_FILE"
  # echo 'export NEXT_TELEMETRY_DISABLED=1' >> "$CLAUDE_ENV_FILE"
  # echo 'export DJANGO_SETTINGS_MODULE=config.settings.dev' >> "$CLAUDE_ENV_FILE"
  # echo 'export FLASK_ENV=development' >> "$CLAUDE_ENV_FILE"
  # echo 'export PYTHONDONTWRITEBYTECODE=1' >> "$CLAUDE_ENV_FILE"
fi

exit 0
