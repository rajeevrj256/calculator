@echo off
rem Starts everything in this repo, each in its own window:
rem   1. Reel Studio      - automatic Reels/Shorts maker  -> http://localhost:8765 (phone: see its window)
rem   2. Remotion Studio  - hand-built motion graphics    -> http://localhost:3000
rem   3. Layout server    - saves canvas edits made in Remotion Studio (port 3999)
rem First run installs everything (a few minutes). Close a window to stop that part.
cd /d "%~dp0"

where node >nul 2>nul || (
  echo Node.js is missing. Install Node.js LTS from https://nodejs.org, then run this again.
  pause
  exit /b 1
)

if not exist remotion-studio\node_modules (
  echo First run: installing Remotion Studio, takes a few minutes...
  pushd remotion-studio
  call npm install --no-audit --no-fund --loglevel=error
  popd
)

start "Reel Studio" cmd /k ai-reels-generator\start.bat
start "Remotion Studio" /d remotion-studio cmd /k npm run studio
start "Layout server" /d remotion-studio cmd /k npm run layout-server

echo.
echo Starting... Reel Studio opens at http://localhost:8765 in a few seconds.
timeout /t 8 >nul
start "" http://localhost:8765
