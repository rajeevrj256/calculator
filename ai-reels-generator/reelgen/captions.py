"""Bold, word-by-word highlighted captions — the "sticky" subtitle style used by
most viral Reels/Shorts. Rendered with Pillow, so no ImageMagick is needed."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from .voice import Word

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]

TEXT_COLOR = (255, 255, 255, 255)
HIGHLIGHT_COLOR = (255, 214, 10, 255)
STROKE_COLOR = (0, 0, 0, 255)


@lru_cache(maxsize=8)
def load_font(size: int, preferred: str = "") -> ImageFont.FreeTypeFont:
    for path in ([preferred] if preferred else []) + FONT_CANDIDATES:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


@dataclass
class CaptionFrame:
    image: np.ndarray  # RGBA
    start: float
    end: float


def group_words(words: list[Word], max_words: int = 3, max_chars: int = 16) -> list[list[Word]]:
    """Split the word stream into short on-screen chunks, breaking after punctuation."""
    groups: list[list[Word]] = []
    current: list[Word] = []
    for word in words:
        current_len = sum(len(w.text) + 1 for w in current)
        if current and (len(current) >= max_words or current_len + len(word.text) > max_chars):
            groups.append(current)
            current = []
        current.append(word)
        if word.text[-1:] in ".!?,;:":
            groups.append(current)
            current = []
    if current:
        groups.append(current)
    return groups


def render_chunk(words: list[str], active: int, max_width: int, font_size: int, font_path: str = "") -> np.ndarray:
    """Render one caption chunk with the `active` word highlighted, wrapping if needed."""
    font = load_font(font_size, font_path)
    stroke = max(4, font_size // 12)
    space = font.getlength(" ")

    # Greedy line wrapping.
    lines: list[list[int]] = [[]]
    width = 0.0
    for i, w in enumerate(words):
        w_len = font.getlength(w)
        if lines[-1] and width + space + w_len > max_width:
            lines.append([])
            width = 0.0
        width += (space if lines[-1] else 0) + w_len
        lines[-1].append(i)

    line_h = int(font_size * 1.25)
    img_h = line_h * len(lines) + stroke * 2
    img = Image.new("RGBA", (max_width + stroke * 2, img_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for row, idxs in enumerate(lines):
        line_w = sum(font.getlength(words[i]) for i in idxs) + space * (len(idxs) - 1)
        x = (img.width - line_w) / 2
        y = stroke + row * line_h
        for i in idxs:
            color = HIGHLIGHT_COLOR if i == active else TEXT_COLOR
            draw.text((x, y), words[i], font=font, fill=color, stroke_width=stroke, stroke_fill=STROKE_COLOR)
            x += font.getlength(words[i]) + space
    return np.array(img)


def build_captions(words: list[Word], offset: float, scene_end: float, max_width: int,
                   font_size: int = 92, font_path: str = "") -> list[CaptionFrame]:
    """One caption image per spoken word; each stays until the next word starts."""
    frames: list[CaptionFrame] = []
    groups = group_words(words)
    for g_idx, group in enumerate(groups):
        texts = [w.text.upper() for w in group]
        next_group_start = groups[g_idx + 1][0].start if g_idx + 1 < len(groups) else None
        for i, word in enumerate(group):
            if i + 1 < len(group):
                end = group[i + 1].start
            elif next_group_start is not None:
                end = next_group_start
            else:
                end = scene_end - offset
            if end <= word.start:
                continue
            frames.append(CaptionFrame(
                image=render_chunk(texts, i, max_width, font_size, font_path),
                start=offset + word.start,
                end=offset + end,
            ))
    return frames


def render_title(text: str, max_width: int, font_size: int = 78, font_path: str = "") -> np.ndarray:
    """Hook title shown at the top of the first scene: dark rounded box, white text."""
    font = load_font(font_size, font_path)
    words = text.upper().split()
    lines, current = [], ""
    for w in words:
        trial = f"{current} {w}".strip()
        if current and font.getlength(trial) > max_width - 80:
            lines.append(current)
            current = w
        else:
            current = trial
    lines.append(current)

    line_h = int(font_size * 1.2)
    pad = 36
    box_w = int(max(font.getlength(line) for line in lines)) + pad * 2
    box_h = line_h * len(lines) + pad * 2
    img = Image.new("RGBA", (box_w, box_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([0, 0, box_w - 1, box_h - 1], radius=28, fill=(0, 0, 0, 190))
    for row, line in enumerate(lines):
        x = (box_w - font.getlength(line)) / 2
        draw.text((x, pad + row * line_h), line, font=font, fill=HIGHLIGHT_COLOR if row == 0 else TEXT_COLOR)
    return np.array(img)
