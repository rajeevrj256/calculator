#!/usr/bin/env bash
# Starts everything in this repo (macOS / Linux). Ctrl+C stops all of it.
#   1. Reel Studio      - automatic Reels/Shorts maker  -> http://localhost:8765
#   2. Remotion Studio  - hand-built motion graphics    -> http://localhost:3000
#   3. Layout server    - saves canvas edits made in Remotion Studio (port 3999)
# First run installs everything (a few minutes). Logs go to logs/.
set -e
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Node.js is missing: install Node.js LTS from https://nodejs.org"; exit 1; }
mkdir -p logs

if [ ! -d remotion-studio/node_modules ]; then
  echo "First run: installing Remotion Studio (takes a few minutes)..."
  (cd remotion-studio && npm install --no-audit --no-fund --loglevel=error)
fi

pids=()
trap 'echo; echo "Stopping..."; kill "${pids[@]}" 2>/dev/null; wait 2>/dev/null' EXIT INT TERM

./ai-reels-generator/start.sh > logs/reel-studio.log 2>&1 & pids+=($!)
(cd remotion-studio && npm run studio) > logs/remotion-studio.log 2>&1 & pids+=($!)
(cd remotion-studio && npm run layout-server) > logs/layout-server.log 2>&1 & pids+=($!)

echo "Starting (first run installs Reel Studio too, so it can take a few minutes)..."
until curl -s -o /dev/null http://localhost:8765/ 2>/dev/null; do
  sleep 2
  kill -0 "${pids[0]}" 2>/dev/null || { echo "Reel Studio stopped; see logs/reel-studio.log"; exit 1; }
done
sed -n '/Reel Studio is running/,/Videos are saved/p' logs/reel-studio.log
echo "  Remotion Studio:   http://localhost:3000"
echo "  Logs: logs/   Press Ctrl+C to stop everything."
wait
