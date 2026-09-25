"""Text-to-speech voiceover with word-level timings (for the animated captions).

Uses Microsoft Edge's neural voices through the free `edge-tts` package — no API
key needed. List voices with: `edge-tts --list-voices`.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from pathlib import Path

import edge_tts

TICKS_PER_SECOND = 10_000_000  # edge-tts reports offsets in 100 ns units


@dataclass
class Word:
    text: str
    start: float  # seconds, relative to the start of its scene audio
    end: float


@dataclass
class SceneAudio:
    path: Path
    words: list[Word]


async def _synthesize(text: str, voice: str, rate: str, out_path: Path) -> list[Word]:
    communicate = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    words: list[Word] = []
    with open(out_path, "wb") as fh:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                fh.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / TICKS_PER_SECOND
                words.append(Word(chunk["text"], start, start + chunk["duration"] / TICKS_PER_SECOND))
    return words


def synthesize_scenes(narrations: list[str], voice: str, out_dir: Path, rate: str = "+8%") -> list[SceneAudio]:
    """Render one audio file per scene so each scene's duration follows its voiceover."""
    out_dir.mkdir(parents=True, exist_ok=True)
    results = []
    for i, text in enumerate(narrations):
        path = out_dir / f"scene_{i:02d}.mp3"
        words = asyncio.run(_synthesize(text, voice, rate, path))
        results.append(SceneAudio(path, words))
    return results
