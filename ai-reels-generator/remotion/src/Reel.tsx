import React from 'react';
import {Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {ReelProps} from './types';
import {COLORS, clamp, useFonts} from './theme';
import {Layer} from './Layer';
import {Background} from './Background';
import {GraphicView} from './Graphics';
import {HookTitle} from './HookTitle';
import {Captions} from './Captions';

// The whole video: footage, one graphic per scene (when the script has one),
// the hook title, word-by-word captions, a progress bar, narration, music and
// sound effects. Every time comes from the props in seconds.

const TITLE_SECONDS = 2.6;
const MIN_GRAPHIC_SECONDS = 1.4; // shorter than this and it can't finish animating
const GRAPHIC_DELAY = 4; // frames after the cut, so the flash lands first

export const Reel: React.FC<ReelProps> = ({title, scenes, cuts, captions, music, sfx}) => {
  useFonts();
  const {fps, durationInFrames} = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  const titleFrames = f(Math.min(TITLE_SECONDS, scenes[0]?.duration ?? TITLE_SECONDS));

  // A graphic fills its scene; in the first scene it waits for the hook title to leave.
  const graphics = scenes.flatMap((s, i) => {
    if (!s.graphic || s.graphic.type === 'none') return [];
    const from = Math.max(f(s.start) + GRAPHIC_DELAY, i === 0 ? titleFrames : 0);
    const frames = f(s.start + s.duration) - from;
    return frames >= f(MIN_GRAPHIC_SECONDS) ? [{from, frames, graphic: s.graphic, scene: i}] : [];
  });

  return (
    <Layer name="reel" style={{backgroundColor: COLORS.ink}}>
      <Background cuts={cuts} sceneStarts={scenes.map((s) => s.start)} />

      {graphics.map(({from, frames, graphic, scene}) => (
        <Sequence key={scene} name={`graphic scene ${scene + 1}`} from={from} durationInFrames={frames}>
          <GraphicView g={graphic} frames={frames} />
        </Sequence>
      ))}

      {title ? (
        <Sequence name="hook title" durationInFrames={titleFrames}>
          <HookTitle text={title} frames={titleFrames} />
        </Sequence>
      ) : null}

      <Captions groups={captions} />
      <ProgressBar total={durationInFrames} />

      {scenes.map((s, i) =>
        s.audio ? (
          // No durationInFrames: the voice always plays to its natural end.
          <Sequence key={i} name={`voice ${i + 1}`} from={f(s.start)}>
            <Html5Audio src={staticFile(s.audio)} />
          </Sequence>
        ) : null,
      )}

      {music ? (
        <Html5Audio
          src={staticFile(music)}
          loop
          loopVolumeCurveBehavior="extend"
          // Sits well under the voice; fades in and out instead of cutting.
          volume={(frame) =>
            interpolate(frame, [0, 15, durationInFrames - 45, durationInFrames], [0, 0.12, 0.12, 0], clamp)
          }
        />
      ) : null}

      {sfx ? (
        <>
          <Sequence name="sfx whoosh (title)" durationInFrames={f(1)}>
            <Html5Audio src={staticFile(sfx.whoosh)} volume={0.22} />
          </Sequence>
          {scenes.slice(1).map((s, i) => (
            // Starts a few frames early so the swell peaks on the cut.
            <Sequence
              key={`w${i}`}
              name={`sfx whoosh ${i + 2}`}
              from={Math.max(0, f(s.start) - 3)}
              durationInFrames={f(1)}
            >
              <Html5Audio src={staticFile(sfx.whoosh)} volume={0.28} />
            </Sequence>
          ))}
          {graphics.map(({from, scene}) => (
            <Sequence key={`p${scene}`} name={`sfx pop ${scene + 1}`} from={from + 3} durationInFrames={f(0.5)}>
              <Html5Audio src={staticFile(sfx.pop)} volume={0.35} />
            </Sequence>
          ))}
        </>
      ) : null}
    </Layer>
  );
};

// Thin yellow bar along the top edge with a glowing head. Top, not bottom: on
// Reels/Shorts the bottom of the frame sits under the platform's caption and
// buttons (same rule as the "claude code remotion" explainer project).
const ProgressBar: React.FC<{total: number}> = ({total}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, total - 1], [0, 1], clamp);
  const enter = interpolate(frame, [0, 10], [0, 1], clamp);
  return (
    <Layer name="progress-bar">
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: 12,
          width: `${progress * 100}%`,
          background: COLORS.accent,
          opacity: enter,
          boxShadow: `0 0 18px rgba(255,214,10,0.7)`,
          borderTopRightRadius: 6,
          borderBottomRightRadius: 6,
        }}
      />
    </Layer>
  );
};
