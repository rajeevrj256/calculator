"""Runtime configuration, read from environment variables (or a local .env file)."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


def _load_dotenv(path: Path) -> None:
    """Minimal .env loader so the project has no extra dependency for it."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.split(" #", 1)[0]  # allow trailing comments
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


PROJECT_ROOT = Path(__file__).resolve().parent.parent
_load_dotenv(PROJECT_ROOT / ".env")


def _env(name: str, default: str = "") -> str:
    # Empty values (e.g. unset GitHub Actions variables) fall back to the default.
    return os.environ.get(name, "").strip() or default


@dataclass
class Config:
    # Claude writes the script and picks the topic.
    claude_model: str = field(default_factory=lambda: _env("CLAUDE_MODEL", "claude-opus-5"))

    # Stock footage (free key from https://www.pexels.com/api/). Optional:
    # without it the video uses animated gradient backgrounds.
    pexels_api_key: str = field(default_factory=lambda: _env("PEXELS_API_KEY"))

    # Where the "response" goes. Optional: without it the result is only
    # written to output/<run>/report.json and printed.
    telegram_bot_token: str = field(default_factory=lambda: _env("TELEGRAM_BOT_TOKEN"))
    telegram_chat_id: str = field(default_factory=lambda: _env("TELEGRAM_CHAT_ID"))

    # Content settings.
    geo: str = field(default_factory=lambda: _env("REEL_GEO", "IN"))
    language: str = field(default_factory=lambda: _env("REEL_LANGUAGE", "English"))
    voice: str = field(default_factory=lambda: _env("REEL_VOICE", "en-US-AndrewNeural"))
    niche: str = field(default_factory=lambda: _env("REEL_NICHE"))
    target_seconds: int = field(default_factory=lambda: int(_env("REEL_SECONDS", "40")))

    # Video settings (9:16 vertical, what Reels and Shorts expect).
    width: int = 1080
    height: int = 1920
    fps: int = 30

    output_dir: Path = field(default_factory=lambda: Path(_env("REEL_OUTPUT_DIR", str(PROJECT_ROOT / "output"))))
    music_dir: Path = PROJECT_ROOT / "assets" / "music"
    font_path: str = field(default_factory=lambda: _env("REEL_FONT"))
