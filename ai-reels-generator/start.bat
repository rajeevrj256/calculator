@echo off
rem Start Reel Studio on Windows. First run installs everything.
cd /d "%~dp0"
if not exist .venv (
  echo First run: setting up, takes a minute...
  py -3 -m venv .venv || python -m venv .venv
  .venv\Scripts\python -m pip install -q --upgrade pip
  .venv\Scripts\python -m pip install -q -r requirements.txt
)
if not exist .env copy .env.example .env >nul
where claude >nul 2>nul || echo Note: Claude Code not found. Install it from https://claude.com/claude-code and run "claude" once to log in, or put ANTHROPIC_API_KEY in .env.
.venv\Scripts\python -m reelgen serve %*
pause
