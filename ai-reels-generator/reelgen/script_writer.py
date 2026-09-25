"""Use Claude to pick the best trending topic and write a short-form video script."""

from __future__ import annotations

import logging

import anthropic
from pydantic import BaseModel, Field

from .config import Config
from .trends import Trend, trends_as_json

log = logging.getLogger(__name__)


class Scene(BaseModel):
    narration: str = Field(description="What the voiceover says in this scene. 1-2 short spoken sentences.")
    visual_query: str = Field(description="2-4 word English stock-footage search query that matches this scene visually, e.g. 'city night traffic'.")


class ReelScript(BaseModel):
    topic: str = Field(description="The trending topic you chose, exactly as given in the candidate list.")
    why_chosen: str = Field(description="One sentence on why this topic will perform well as a short video.")
    title: str = Field(description="Punchy on-screen title shown during the hook, max 6 words.")
    scenes: list[Scene] = Field(description="Scenes in order. The first scene is the hook.")
    caption: str = Field(description="Instagram/YouTube caption, 1-3 lines, may include emojis.")
    hashtags: list[str] = Field(description="8-15 relevant hashtags without the # sign.")
    youtube_title: str = Field(description="YouTube Shorts title, max 90 characters, ends with #shorts.")


SYSTEM_PROMPT = """You are a head writer for a faceless short-form video channel that posts \
Instagram Reels and YouTube Shorts. Your videos are "sticky": viewers stop scrolling in the \
first second and watch to the end.

How you write:
- Scene 1 is the hook: a bold claim, a surprising number, or a question that opens a curiosity \
gap. Never start with greetings or "In this video".
- Every following scene adds a new fact, twist, or payoff. Short spoken sentences, no filler.
- Keep the open loop until near the end, then pay it off.
- The last scene is a quick call to action (follow / comment) that ties back to the topic.
- Write for the ear: it is read aloud by a text-to-speech voice, so avoid abbreviations, \
URLs, emojis, and symbols in the narration.
- Stay factual. If a trend is a breaking news story you have no reliable details on, explain \
the background people are searching for instead of inventing details.

Choosing a topic:
- Pick the candidate with the broadest appeal that works as a 30-60 second explainer.
- Skip tragedies, deaths, violence, explicit content, and divisive political fights.
- Evergreen candidates are fallbacks; prefer a real trend when a good one exists."""


def write_script(cfg: Config, candidates: list[Trend]) -> ReelScript:
    client = anthropic.Anthropic()
    niche = f"\nChannel niche: {cfg.niche}. Prefer topics that fit it." if cfg.niche else ""
    words = int(cfg.target_seconds * 2.5)  # ~150 spoken words per minute
    prompt = (
        f"Candidate topics trending right now (region {cfg.geo}):\n{trends_as_json(candidates)}\n"
        f"{niche}\n"
        f"Pick one topic and write the video.\n"
        f"- Narration language: {cfg.language} (visual_query always in English).\n"
        f"- Target length: about {cfg.target_seconds} seconds, roughly {words} spoken words in total.\n"
        f"- 6 to 9 scenes."
    )

    response = client.messages.parse(
        model=cfg.claude_model,
        max_tokens=16000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
        output_format=ReelScript,
    )
    if response.stop_reason == "refusal" or response.parsed_output is None:
        raise RuntimeError(f"Claude did not return a script (stop_reason={response.stop_reason})")

    script = response.parsed_output
    log.info("Chosen topic: %s (%s)", script.topic, script.why_chosen)
    return script
