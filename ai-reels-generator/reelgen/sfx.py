"""Short sound effects for the edit, synthesised on the fly so there are no audio
files to ship or license.

- whoosh: a soft swell of filtered air for scene changes and the hook title.
- pop: a quick, rounded blip for when a graphic lands.

Neither has leading silence: sound starts on the first sample, so each hit lands
exactly on the frame it's placed at.
"""

from __future__ import annotations

import wave
from pathlib import Path

import numpy as np

RATE = 44100


def _write(path: Path, samples: np.ndarray, peak: float = 0.5) -> Path:
    samples = samples / (np.abs(samples).max() or 1.0) * peak  # peak at -6 dBFS: no clipping
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes((samples * 32767).astype(np.int16).tobytes())
    return path


def _whoosh(duration: float = 0.42, peak_at: float = 0.25) -> np.ndarray:
    n = int(RATE * duration)
    x = np.arange(n) / n
    noise = np.random.default_rng(7).standard_normal(n)
    # A low-pass filter that opens up and closes again: air rushing past.
    cutoff = 250 + 3200 * np.sin(np.pi * x) ** 2
    alpha = 1 - np.exp(-2 * np.pi * cutoff / RATE)
    out = np.empty(n)
    y = 0.0
    for i in range(n):
        y += alpha[i] * (noise[i] - y)
        out[i] = y
    # Starts audible (no dead air before the swell), peaks at `peak_at`, then trails off.
    envelope = np.where(x < peak_at, 0.15 + 0.85 * (x / peak_at) ** 1.5, np.exp(-(x - peak_at) * 7))
    return out * envelope


def _pop(duration: float = 0.12) -> np.ndarray:
    t = np.arange(int(RATE * duration)) / RATE
    freq = 600 + 800 * np.exp(-t * 60)  # quick downward pitch bend
    tone = np.sin(2 * np.pi * np.cumsum(freq) / RATE)
    envelope = np.minimum(t / 0.002, 1) * np.exp(-t * 38)
    return tone * envelope


def write_sfx(out_dir: Path) -> dict[str, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    return {
        "whoosh": _write(out_dir / "whoosh.wav", _whoosh()),
        "pop": _write(out_dir / "pop.wav", _pop(), peak=0.45),
    }
