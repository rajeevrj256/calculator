"""End-to-end run: trends -> script -> voice -> visuals -> video -> notify."""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path

from .config import Config
from .notifier import notify
from .script_writer import ReelScript, write_script
from .trends import collect_trends, load_history, save_history
from .video import render_video
from .visuals import fetch_backgrounds
from .voice import synthesize_scenes

log = logging.getLogger(__name__)


def slugify(text: str, max_len: int = 40) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:max_len] or "reel"


def run_once(cfg: Config, topic: str | None = None) -> dict:
    history_path = cfg.output_dir / "history.json"

    if topic:
        from .trends import Trend
        candidates = [Trend(title=topic, source="manual")]
    else:
        candidates = collect_trends(cfg.geo, load_history(history_path))
    log.info("%d candidate topics", len(candidates))

    script: ReelScript = write_script(cfg, candidates)
    source = next((c.source for c in candidates if c.title.lower() == script.topic.lower()), "unknown")

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    run_dir = cfg.output_dir / f"{stamp}-{slugify(script.topic)}"
    run_dir.mkdir(parents=True, exist_ok=True)
    (run_dir / "script.json").write_text(script.model_dump_json(indent=2), encoding="utf-8")

    scenes = synthesize_scenes([s.narration for s in script.scenes], cfg.voice, run_dir / "audio")
    backgrounds = fetch_backgrounds([s.visual_query for s in script.scenes], cfg.pexels_api_key,
                                    cfg.width, cfg.height, run_dir / "backgrounds")
    rendered = render_video(script.title, scenes, backgrounds, cfg, run_dir / "reel.mp4")

    report = {
        "topic": script.topic,
        "topic_source": source,
        "why_chosen": script.why_chosen,
        "title": script.title,
        "youtube_title": script.youtube_title,
        "caption": script.caption,
        "hashtags": [h.lstrip("#") for h in script.hashtags],
        "narration": " ".join(s.narration for s in script.scenes),
        "created_at": stamp,
        **rendered,
    }
    (run_dir / "report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    save_history(history_path, script.topic)

    notify(report, cfg.telegram_bot_token, cfg.telegram_chat_id)
    return report


def run(cfg: Config, count: int = 1, topic: str | None = None) -> list[dict]:
    reports = []
    for i in range(count):
        log.info("=== Video %d/%d ===", i + 1, count)
        try:
            reports.append(run_once(cfg, topic))
        except Exception:
            log.exception("Video %d failed", i + 1)
    return reports
