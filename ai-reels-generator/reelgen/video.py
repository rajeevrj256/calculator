"""Assemble the final 9:16 video: backgrounds + voiceover + captions + music."""

from __future__ import annotations

import logging
import random
from pathlib import Path

import numpy as np
from PIL import Image
from moviepy import (
    AudioFileClip,
    ColorClip,
    CompositeAudioClip,
    CompositeVideoClip,
    ImageClip,
    VideoClip,
    VideoFileClip,
    afx,
    vfx,
)

from .captions import build_captions, render_title
from .config import Config
from .voice import SceneAudio

log = logging.getLogger(__name__)

SCENE_PADDING = 0.2  # seconds of breathing room after each scene's narration
TITLE_SECONDS = 2.8


def _fill_frame(clip, width: int, height: int):
    """Scale to cover the frame, then center-crop to exactly width x height."""
    scale = max(width / clip.w, height / clip.h)
    clip = clip.resized(scale)
    return clip.cropped(x_center=clip.w / 2, y_center=clip.h / 2, width=width, height=height)


def _background(path: Path, duration: float, cfg: Config):
    if path.suffix == ".mp4":
        clip = VideoFileClip(str(path), audio=False)
        clip = _fill_frame(clip, cfg.width, cfg.height)
        if clip.duration < duration:
            clip = clip.with_effects([vfx.Loop(duration=duration)])
        return clip.subclipped(0, duration)
    # Still image: slow Ken Burns zoom so the frame never feels static.
    clip = ImageClip(str(path)).with_duration(duration)
    clip = clip.resized(lambda t: 1 + 0.03 * t)
    return clip.with_position("center")


def _progress_bar(total: float, cfg: Config, height: int = 14):
    def frame(t):
        img = np.zeros((height, cfg.width, 3), dtype=np.uint8)
        img[:, : int(cfg.width * min(t / total, 1.0))] = (255, 214, 10)
        return img

    return VideoClip(frame_function=frame, duration=total).with_position((0, cfg.height - height))


def _music(total: float, cfg: Config):
    tracks = sorted(cfg.music_dir.glob("*.mp3")) if cfg.music_dir.exists() else []
    if not tracks:
        return None
    track = AudioFileClip(str(random.choice(tracks)))
    effects = [afx.MultiplyVolume(0.12), afx.AudioFadeOut(1.5)]
    if track.duration < total:
        effects.insert(0, afx.AudioLoop(duration=total))
    return track.with_effects(effects).subclipped(0, total)


def render_video(title: str, scenes: list[SceneAudio], backgrounds: list[Path], cfg: Config,
                 out_path: Path) -> dict:
    bg_layers, caption_layers, audio_layers = [], [], []
    caption_width = cfg.width - 140
    caption_y = int(cfg.height * 0.60)
    t = 0.0

    for scene, bg_path in zip(scenes, backgrounds):
        voice = AudioFileClip(str(scene.path))
        duration = voice.duration + SCENE_PADDING
        bg_layers.append(_background(bg_path, duration, cfg).with_start(t))
        audio_layers.append(voice.with_start(t))
        for cap in build_captions(scene.words, t, t + duration, caption_width, font_path=cfg.font_path):
            caption_layers.append(
                ImageClip(cap.image)
                .with_start(cap.start)
                .with_duration(cap.end - cap.start)
                .with_position(("center", caption_y - cap.image.shape[0] // 2))
            )
        t += duration

    total = t
    # Darken footage slightly so white captions stay readable on any background.
    dim = ColorClip((cfg.width, cfg.height), color=(0, 0, 0)).with_opacity(0.28).with_duration(total)
    title_img = render_title(title, cfg.width - 120, font_path=cfg.font_path)
    title_clip = (ImageClip(title_img).with_duration(min(TITLE_SECONDS, total))
                  .with_position(("center", int(cfg.height * 0.14))))

    video = CompositeVideoClip(
        bg_layers + [dim] + caption_layers + [title_clip, _progress_bar(total, cfg)],
        size=(cfg.width, cfg.height),
    ).with_duration(total)

    music = _music(total, cfg)
    if music is not None:
        audio_layers.append(music)
    video = video.with_audio(CompositeAudioClip(audio_layers).with_duration(total))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    video.write_videofile(
        str(out_path),
        fps=cfg.fps,
        codec="libx264",
        audio_codec="aac",
        preset="veryfast",
        threads=4,
        ffmpeg_params=["-pix_fmt", "yuv420p", "-movflags", "+faststart", "-crf", "21"],
        logger=None,
    )
    thumb_path = out_path.with_name("thumbnail.jpg")
    Image.fromarray(video.get_frame(min(1.0, total / 2))[:, :, :3].astype("uint8")).save(thumb_path, quality=90)
    video.close()
    log.info("Rendered %s (%.1fs)", out_path, total)
    return {"video": str(out_path), "thumbnail": str(thumb_path), "duration_seconds": round(total, 1)}
