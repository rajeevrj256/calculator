import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT, clamp, exitProgress, float, shineSweep} from './theme';
import {Layer} from './Layer';

// The on-screen hook for the first seconds: a dark card that winds up, springs
// in and settles, words cascading in a few frames apart. While it holds, a light
// travels around its border; then it lifts away before the first scene ends.

const CARD_WIDTH = 1080 * 0.86;
const PAD = 44;

// Big enough to read at a glance, small enough that the longest word fits one
// line and the whole title fits in about two lines.
const titleSize = (words: string[]) => {
  const inner = CARD_WIDTH - PAD * 2;
  const chars = words.join(' ').length;
  const longest = Math.max(...words.map((w) => w.length), 1);
  return Math.floor(Math.max(60, Math.min(112, (2 * inner) / (0.72 * chars), inner / (0.76 * longest))));
};

// One word gets the accent colour: the first one with a digit, else the last word.
const accentIndex = (words: string[]) => {
  const n = words.findIndex((w) => /\d/.test(w));
  return n >= 0 ? n : words.length - 1;
};

export const HookTitle: React.FC<{text: string; frames: number}> = ({text, frames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  const size = titleSize(words);
  const accent = accentIndex(words);

  // Anticipation: dip slightly smaller before springing past full size.
  const enter = spring({frame: frame - 3, fps, config: {damping: 12, mass: 0.6, stiffness: 150}});
  const windUp = interpolate(frame, [0, 3], [0, 1], clamp);
  const scale = frame < 3 ? 0.9 - 0.04 * windUp : 0.86 + 0.14 * enter;
  const exit = exitProgress(frame, frames, 9);
  const angle = (frame * 5) % 360;
  const shine = shineSweep(frame, 90);

  return (
    <Layer name="hook-title" style={{fontFamily: FONT}}>
      <div
        style={{
          position: 'absolute',
          top: '11%',
          left: (1080 - CARD_WIDTH) / 2,
          width: CARD_WIDTH,
          padding: 4,
          borderRadius: 40,
          // Border light: a bright arc on a conic gradient, rotating around the card.
          background: `conic-gradient(from ${angle}deg, rgba(255,214,10,0) 0deg, rgba(255,214,10,0) 250deg, ${COLORS.accent} 320deg, rgba(255,255,255,0.9) 340deg, rgba(255,214,10,0) 360deg)`,
          boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 ${30 + 10 * Math.sin(frame / 8)}px rgba(255,214,10,0.18)`,
          opacity: Math.min(1, enter * 1.4) * (1 - exit),
          transform: `translateY(${(1 - enter) * -50 + float(frame, 4, 90) - 40 * exit}px) scale(${scale * (1 - 0.06 * exit)})`,
        }}
      >
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 36,
            background: 'rgba(10, 10, 16, 0.88)',
            padding: `${PAD * 0.8}px ${PAD}px`,
            textWrap: 'balance', // even lines, no lone word on the last one
            fontSize: size,
            fontWeight: 900,
            lineHeight: 1.1,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {words.map((w, i) => {
            const s = spring({frame: frame - 6 - i * 3, fps, config: {damping: 13, mass: 0.6, stiffness: 160}});
            return (
              <React.Fragment key={i}>
                {i > 0 ? ' ' : null}
                <span
                  style={{
                    display: 'inline-block',
                    color: i === accent ? COLORS.accent : COLORS.text,
                    opacity: interpolate(s, [0, 0.4], [0, 1], clamp),
                    transform: `translateY(${(1 - s) * 34}px)`,
                  }}
                >
                  {w}
                </span>
              </React.Fragment>
            );
          })}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `linear-gradient(105deg, transparent ${shine - 16}%, rgba(255,255,255,0.08) ${shine}%, transparent ${shine + 16}%)`,
            }}
          />
        </div>
      </div>
    </Layer>
  );
};
