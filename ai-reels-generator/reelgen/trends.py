"""Collect trending topics from public sources.

Every source is best-effort: a failing source is logged and skipped, and an
evergreen list guarantees the pipeline always has something to work with.
"""

from __future__ import annotations

import json
import logging
import random
import xml.etree.ElementTree as ET
from dataclasses import asdict, dataclass
from pathlib import Path

import requests

log = logging.getLogger(__name__)

USER_AGENT = "Mozilla/5.0 (compatible; reelgen/0.1; +https://github.com/rajeevrj256/calculator)"
HT_NS = {"ht": "https://trends.google.com/trending/rss"}

EVERGREEN_TOPICS = [
    "Mind-blowing facts about the human brain",
    "Psychology tricks that make people like you",
    "Money habits that quietly make you rich",
    "Space facts that sound fake but are true",
    "Ancient inventions that were ahead of their time",
    "Productivity hacks backed by science",
    "Animals with unbelievable superpowers",
    "Everyday things you've been using wrong",
]


@dataclass
class Trend:
    title: str
    source: str
    traffic: str = ""
    context: str = ""


def google_trends(geo: str, limit: int = 15) -> list[Trend]:
    """Daily trending searches from the public Google Trends RSS feed."""
    url = f"https://trends.google.com/trending/rss?geo={geo}"
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=20)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)
    trends = []
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        if not title:
            continue
        headlines = [n.findtext("ht:news_item_title", default="", namespaces=HT_NS)
                     for n in item.findall("ht:news_item", HT_NS)]
        trends.append(Trend(
            title=title,
            source=f"google_trends:{geo}",
            traffic=item.findtext("ht:approx_traffic", default="", namespaces=HT_NS),
            context=" | ".join(h.strip() for h in headlines if h)[:400],
        ))
        if len(trends) >= limit:
            break
    return trends


def reddit_popular(limit: int = 15) -> list[Trend]:
    """Top posts of the day on r/popular (safe-for-work only)."""
    url = f"https://www.reddit.com/r/popular/top.json?t=day&limit={limit * 2}"
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=20)
    resp.raise_for_status()
    trends = []
    for child in resp.json().get("data", {}).get("children", []):
        post = child.get("data", {})
        if post.get("over_18") or post.get("stickied"):
            continue
        trends.append(Trend(
            title=post.get("title", "").strip(),
            source=f"reddit:r/{post.get('subreddit', 'popular')}",
            traffic=f"{post.get('ups', 0)} upvotes",
        ))
        if len(trends) >= limit:
            break
    return trends


def load_history(path: Path) -> list[str]:
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return []


def save_history(path: Path, topic: str, keep: int = 200) -> None:
    history = load_history(path)
    history.append(topic)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(history[-keep:], indent=2, ensure_ascii=False), encoding="utf-8")


def collect_trends(geo: str, history: list[str]) -> list[Trend]:
    """Gather candidates from all sources, dropping topics already used."""
    candidates: list[Trend] = []
    for name, fetch in (("Google Trends", lambda: google_trends(geo)), ("Reddit", reddit_popular)):
        try:
            found = fetch()
            log.info("%s: %d topics", name, len(found))
            candidates.extend(found)
        except Exception as exc:  # network errors, blocked, bad XML...
            log.warning("%s unavailable: %s", name, exc)

    used = {h.lower() for h in history}
    candidates = [t for t in candidates if t.title and t.title.lower() not in used]

    evergreen = [t for t in EVERGREEN_TOPICS if t.lower() not in used] or EVERGREEN_TOPICS
    random.shuffle(evergreen)
    candidates.extend(Trend(title=t, source="evergreen") for t in evergreen[:3])
    return candidates


def trends_as_json(trends: list[Trend]) -> str:
    return json.dumps([asdict(t) for t in trends], indent=1, ensure_ascii=False)
