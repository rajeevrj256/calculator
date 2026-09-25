import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../theme';
import {CAPTIONS} from '../audio/captions';
import {FONT_FAMILY} from '../../../fonts';

/**
 * Karaoke-style caption bar: the word being spoken right now lights up in the
 * accent colour, spoken words stay dim-bright, unspoken words stay muted.
 * Timing comes from real word-level offsets captured during TTS synthesis
 * (see audio/captions.ts) — this is driven by the actual narration, not a
 * guessed reading speed.
 */
export const Captions: React.FC<{
  scene: number;
  accentColor: string;
  textColor: string;
  enabled: boolean;
}> = ({scene, accentColor, textColor, enabled}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!enabled) return null;

  const data = CAPTIONS[scene];
  if (!data) return null;

  const nowMs = (frame / fps) * 1000;

  return (
    <div
      style={{
        fontFamily: FONT_FAMILY,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0 14px',
        maxWidth: 880,
        textAlign: 'center',
      }}
    >
      {data.words.map((w, i) => {
        const active = nowMs >= w.startMs && nowMs < w.endMs;
        const spoken = nowMs >= w.endMs;
        return (
          <span
            key={i}
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: active ? accentColor : textColor,
              opacity: active ? 1 : spoken ? 0.55 : 0.3,
              transform: active ? 'scale(1.08)' : 'scale(1)',
              transition: 'none',
              textShadow: active ? `0 0 22px ${accentColor}88` : 'none',
              display: 'inline-block',
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
