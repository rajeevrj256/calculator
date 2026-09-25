#!/usr/bin/env bash
# Start Reel Studio on macOS / Linux. First run installs everything.
set -e
cd "$(dirname "$0")"
if [ ! -d .venv ]; then
  echo "First run: setting up (takes a minute)..."
  python3 -m venv .venv
  .venv/bin/pip install -q --upgrade pip
  .venv/bin/pip install -q -r requirements.txt
fi
[ -f .env ] || cp .env.example .env
command -v claude >/dev/null || echo "Note: Claude Code not found. Install it (https://claude.com/claude-code) and run 'claude' once to log in, or put ANTHROPIC_API_KEY in .env."
exec .venv/bin/python -m reelgen serve "$@"
