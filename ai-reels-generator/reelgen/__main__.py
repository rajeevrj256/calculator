"""CLI entry point: `python -m reelgen [--count N] [--topic "..."]`."""

from __future__ import annotations

import argparse
import logging
import sys

from .config import Config
from .pipeline import run


def main() -> int:
    parser = argparse.ArgumentParser(description="Auto-generate Instagram Reels / YouTube Shorts from trending topics.")
    parser.add_argument("--count", type=int, default=1, help="how many videos to generate (default 1)")
    parser.add_argument("--topic", help="skip trend discovery and use this topic")
    parser.add_argument("--geo", help="country code for Google Trends, e.g. IN, US (default REEL_GEO or IN)")
    parser.add_argument("--language", help="narration language, e.g. English, Hindi")
    parser.add_argument("--voice", help="edge-tts voice, e.g. en-US-AndrewNeural, hi-IN-MadhurNeural")
    parser.add_argument("--seconds", type=int, help="target video length in seconds")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    cfg = Config()
    if args.geo:
        cfg.geo = args.geo
    if args.language:
        cfg.language = args.language
    if args.voice:
        cfg.voice = args.voice
    if args.seconds:
        cfg.target_seconds = args.seconds

    reports = run(cfg, count=args.count, topic=args.topic)
    return 0 if len(reports) == args.count else 1


if __name__ == "__main__":
    sys.exit(main())
