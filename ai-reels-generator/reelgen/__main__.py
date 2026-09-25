"""CLI entry point.

    python -m reelgen                  generate 1 video now
    python -m reelgen --count 3        generate 3 videos
    python -m reelgen --topic "..."    generate about a specific topic
    python -m reelgen serve            start the local app (PC + phone)
"""

from __future__ import annotations

import argparse
import logging
import sys

from .config import Config, load_settings


def main() -> int:
    parser = argparse.ArgumentParser(description="Auto-generate Instagram Reels / YouTube Shorts from trending topics.")
    parser.add_argument("command", nargs="?", default="generate", choices=["generate", "serve"],
                        help="generate videos now (default) or start the local app")
    parser.add_argument("--count", type=int, default=1, help="how many videos to generate (default 1)")
    parser.add_argument("--topic", help="skip trend discovery and use this topic")
    parser.add_argument("--geo", help="country code for Google Trends, e.g. IN, US (default REEL_GEO or IN)")
    parser.add_argument("--language", help="narration language, e.g. English, Hindi")
    parser.add_argument("--voice", help="edge-tts voice, e.g. en-US-AndrewNeural, hi-IN-MadhurNeural")
    parser.add_argument("--seconds", type=int, help="target video length in seconds")
    parser.add_argument("--ai", choices=["auto", "claude-code", "api"], help="how to reach Claude")
    parser.add_argument("--port", type=int, help="port for the local app (default 8765)")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    cfg = load_settings(Config())
    for arg, attr in (("geo", "geo"), ("language", "language"), ("voice", "voice"),
                      ("seconds", "target_seconds"), ("ai", "ai_backend"), ("port", "port")):
        if getattr(args, arg):
            setattr(cfg, attr, getattr(args, arg))

    if args.command == "serve":
        from .server import serve

        serve(cfg)
        return 0

    from .pipeline import run

    reports = run(cfg, count=args.count, topic=args.topic)
    return 0 if len(reports) == args.count else 1


if __name__ == "__main__":
    sys.exit(main())
