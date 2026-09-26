import React from 'react';
import {
  Easing,
  Img,
  Loop,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {Cut, Transition} from './types';
import {clamp} from './theme';
import {Layer} from './Layer';

// Stock footage cut every few seconds like an editor would: alternate cuts
// punch in tighter, every cut keeps a slow push so nothing sits still, a white
// flash marks each new scene, and a dark gradient keeps text readable on top.

export type SceneTransition = {start: number; type: Transition};

export const Background: React.FC<{cuts: Cut[]; transitions: SceneTransition[]}> = ({cuts, transitions}) => {
  const {fps} = useVideoConfig();
  return (
    <Layer name="background" style={{backgroundColor: '#0B0B0F', overflow: 'hidden'}}>
      {cuts.map((cut, i) => {
        // Frame edges from absolute times, so neighbouring cuts meet with no gap or overlap.
        const from = Math.round(cut.start * fps);
        const frames = Math.max(1, Math.round((cut.start + cut.duration) * fps) - from);
        // The first cut of a scene carries that scene's entrance.
        const enter = transitions.find((t) => Math.abs(t.start - cut.start) < 0.02)?.type ?? 'none';
        return (
          <Sequence key={i} name={`cut ${i + 1}`} from={from} durationInFrames={frames}>
            <CutView cut={cut} index={i} frames={frames} enter={enter} />
          </Sequence>
        );
      })}
      <Layer
        name="dark-gradient"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.18) 28%, rgba(0,0,0,0.22) 48%, rgba(0,0,0,0.6) 72%, rgba(0,0,0,0.78) 100%)',
        }}
      />
      <Vignette />
      <Grain />
      {transitions.map((t, i) =>
        t.type === 'flash' ? (
          <Sequence key={i} name={`flash ${i + 1}`} from={Math.round(t.start * fps)} durationInFrames={10}>
            <Flash />
          </Sequence>
        ) : t.type === 'glitch' ? (
          <Sequence key={i} name={`glitch ${i + 1}`} from={Math.round(t.start * fps)} durationInFrames={GLITCH_FRAMES}>
            <GlitchBars />
          </Sequence>
        ) : null,
      )}
    </Layer>
  );
};

const CutView: React.FC<{cut: Cut; index: number; frames: number; enter: Transition}> = ({cut, index, frames, enter}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Punch-in: snaps ~14% tighter in a few frames with a little overshoot.
  // Other cuts ease in from slightly wide. Both keep a slow push while they hold.
  const snap = spring({frame, fps, config: {damping: 12, mass: 0.4, stiffness: 260}});
  const base = cut.punchIn ? 1 + 0.14 * snap : 1.06 - 0.04 * snap;
  const push = interpolate(frame, [0, frames], [0, 0.035], clamp);
  const style: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    ...entrance(enter, frame, base + push),
  };

  if (!cut.src) return <Placeholder index={index} style={style} />;
  if (cut.image) return <Img src={staticFile(cut.src)} style={style} />;

  const video = (trimBefore: number) => (
    <OffthreadVideo src={staticFile(cut.src)} trimBefore={trimBefore} muted style={style} />
  );
  // A clip shorter than the cut loops instead of freezing on its last frame.
  if (cut.length !== null && cut.length - cut.offset < cut.duration) {
    return <Loop durationInFrames={Math.max(1, Math.floor(cut.length * fps))}>{video(0)}</Loop>;
  }
  return video(Math.round(cut.offset * fps));
};

// ---- Scene entrances. Each has its own look (and its own sound, see Reel.tsx),
// so scene changes don't all feel the same. Claude picks them per scene.
const GLITCH_FRAMES = 8;

// A cheap deterministic "random" in [-1, 1], so every render is identical.
const jitter = (n: number) => {
  const f = Math.sin(n * 12.9898) * 43758.5453;
  return (f - Math.floor(f)) * 2 - 1;
};

const entrance = (type: Transition, frame: number, scale: number): React.CSSProperties => {
  const ease = (len: number, fn = Easing.out(Easing.cubic)) => interpolate(frame, [0, len], [0, 1], {...clamp, easing: fn});
  if (type === 'zoom') {
    // Punch in from a blurred close-up.
    const p = ease(9);
    return {transform: `scale(${scale * (1 + 0.35 * (1 - p))})`, filter: `blur(${10 * (1 - p)}px)`};
  }
  if (type === 'slide') {
    // Whip-pan: the new shot rushes in from the right, smeared, oversized so no edge shows.
    const p = ease(8);
    return {
      // Scaling up by twice the offset keeps the frame covered: no empty strip at the edge.
      transform: `translateX(${30 * (1 - p)}%) scale(${scale * (1 + 0.64 * (1 - p))})`,
      filter: `blur(${14 * (1 - p)}px)`,
    };
  }
  if (type === 'glitch' && frame < GLITCH_FRAMES) {
    // A few frames of jumps, colour shifts and crushed contrast.
    return {
      transform: `translate(${jitter(frame) * 40}px, ${jitter(frame + 7) * 10}px) scale(${scale * 1.06})`,
      filter: `hue-rotate(${Math.round(jitter(frame + 3) * 90)}deg) saturate(2) contrast(1.4)`,
    };
  }
  if (type === 'fade') {
    // Soft dissolve up from dark.
    const p = ease(14, Easing.out(Easing.quad));
    return {transform: `scale(${scale})`, filter: `brightness(${0.15 + 0.85 * p}) blur(${16 * (1 - p)}px)`};
  }
  return {transform: `scale(${scale})`};
};

// Glitch overlay: bright horizontal slices in split RGB colours that jump every frame.
const GlitchBars: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, GLITCH_FRAMES - 1], [1, 0], clamp);
  return (
    <Layer name="glitch-bars" style={{mixBlendMode: 'screen', opacity: fade}}>
      {[0, 1, 2, 3, 4].map((k) => {
        const top = 50 + jitter(frame * 5 + k) * 48;
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: `${jitter(frame + k * 3) * 10}%`,
              width: '100%',
              top: `${top}%`,
              height: 8 + Math.abs(jitter(frame * 3 + k)) * 60,
              background: k % 2 ? 'rgba(0,255,255,0.55)' : 'rgba(255,0,200,0.5)',
            }}
          />
        );
      })}
    </Layer>
  );
};

// Clean fallback when there is no footage: a slow-moving two-tone gradient.
const PALETTES = [
  ['#14143C', '#7828A0'],
  ['#0A2846', '#0096AA'],
  ['#3C0A1E', '#DC5A3C'],
  ['#0F321E', '#28AA6E'],
  ['#1E1E1E', '#5A5A8C'],
];

const Placeholder: React.FC<{index: number; style: React.CSSProperties}> = ({index, style}) => {
  const frame = useCurrentFrame();
  const [a, b] = PALETTES[index % PALETTES.length];
  const angle = 160 + 25 * Math.sin(frame / 45);
  const glowY = 40 + 12 * Math.sin(frame / 60);
  return (
    <div
      style={{
        ...style,
        background: `radial-gradient(ellipse 80% 45% at 50% ${glowY}%, rgba(255,255,255,0.10), transparent 70%), linear-gradient(${angle}deg, ${a}, ${b})`,
      }}
    />
  );
};

// Film look from the "claude code remotion" project's grade (effects/GradeLayer):
// a vignette plus grain. The grain is a noise tile baked once and *moved* each
// frame, because regenerating feTurbulence per frame is slow. It makes stock
// clips from different sources read as one shoot and less like raw stock.
const GRAIN_TILE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
     <filter id="n">
       <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
       <feColorMatrix type="saturate" values="0"/>
     </filter>
     <rect width="180" height="180" filter="url(#n)"/>
   </svg>`,
)}")`;

const Vignette: React.FC = () => (
  <Layer
    name="vignette"
    style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.42) 100%)'}}
  />
);

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Layer
      name="film-grain"
      style={{
        backgroundImage: GRAIN_TILE,
        backgroundRepeat: 'repeat',
        // Deterministic per frame, so re-rendering gives an identical video.
        backgroundPosition: `${(frame * 37) % 180}px ${(frame * 71) % 180}px`,
        mixBlendMode: 'overlay',
        opacity: 0.14,
      }}
    />
  );
};

// White flash on the cut, with a thin streak of light sweeping across it.
const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 9], [0.55, 0], {...clamp, easing: Easing.out(Easing.quad)});
  const streak = interpolate(frame, [0, 9], [-30, 130], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <>
      <Layer name="flash-white" style={{backgroundColor: '#fff', opacity: fade}} />
      <Layer
        name="flash-streak"
        style={{
          background: `linear-gradient(115deg, transparent ${streak - 6}%, rgba(255,255,255,0.85) ${streak}%, transparent ${streak + 6}%)`,
          opacity: fade * 1.6,
        }}
      />
    </>
  );
};
