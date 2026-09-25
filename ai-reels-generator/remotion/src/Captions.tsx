import React from 'react';
import {Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CaptionGroup} from './types';
import {COLORS, FONT, OUTLINE, clamp, exitProgress} from './theme';
import {Layer} from './Layer';

// Bold word-by-word captions: each chunk of 1-3 words sits in the same spot,
// every word pops in the moment it is spoken, and the word being said is yellow.

const TOP = '58%'; // clear of the graphics above and the platform UI in the bottom 20%
const MAX_WIDTH = 880; // inside the title-safe area

export const Captions: React.FC<{groups: CaptionGroup[]}> = ({groups}) => {
  const {fps} = useVideoConfig();
  return (
    <Layer name="captions">
      {groups.map((g, i) => {
        const from = Math.round(g.start * fps);
        const frames = Math.max(1, Math.round(g.end * fps) - from);
        return (
          <Sequence key={i} name={`caption ${i + 1}`} from={from} durationInFrames={frames}>
            <Chunk group={g} frames={frames} />
          </Sequence>
        );
      })}
    </Layer>
  );
};

// Font size that keeps the longest word on one line, so words never break mid-word.
const chunkSize = (words: string[]) => {
  const longest = Math.max(...words.map((w) => w.length), 1);
  const total = words.join(' ').length;
  const byWord = Math.floor(MAX_WIDTH / (longest * 0.74));
  return Math.max(56, Math.min(total <= 10 ? 112 : 100, byWord));
};

const Chunk: React.FC<{group: CaptionGroup; frames: number}> = ({group, frames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = group.start + frame / fps; // absolute time, like the word timings
  const size = chunkSize(group.words.map((w) => w.text));
  const exit = frames > 8 ? exitProgress(frame, frames, 3) : 0;

  return (
    <div
      style={{
        position: 'absolute',
        top: TOP,
        left: (1080 - MAX_WIDTH) / 2,
        width: MAX_WIDTH,
        textWrap: 'balance', // even lines, no lone word on the last one
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.12,
        textTransform: 'uppercase',
        textAlign: 'center',
        opacity: 1 - exit,
        transform: `scale(${1 - 0.08 * exit})`,
      }}
    >
      {group.words.map((w, i) => {
        const next = group.words[i + 1];
        // Stay highlighted until the next word starts, so the colour never flickers off between words.
        const active = t >= w.start && (next ? t < next.start : true);
        const pop = spring({
          frame: frame - Math.round((w.start - group.start) * fps),
          fps,
          config: {damping: 11, mass: 0.5, stiffness: 220},
        });
        return (
          <React.Fragment key={i}>
            {i > 0 ? ' ' : null}
            <span
              style={{
                display: 'inline-block',
                margin: `0 ${Math.round(size * 0.07)}px`, // room for the active word to grow without touching its neighbours
                color: active ? COLORS.accent : COLORS.text,
                textShadow: OUTLINE,
                opacity: interpolate(pop, [0, 0.35], [0, 1], clamp), // 0 until the word is spoken
                transform: `translateY(${(1 - Math.min(pop, 1)) * 26}px) scale(${(0.55 + 0.45 * pop) * (active ? 1.05 : 1)})`,
              }}
            >
              {w.text}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};
