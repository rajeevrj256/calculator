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
import type {Cut} from './types';
import {clamp} from './theme';
import {Layer} from './Layer';

// Stock footage cut every few seconds like an editor would: alternate cuts
// punch in tighter, every cut keeps a slow push so nothing sits still, a white
// flash marks each new scene, and a dark gradient keeps text readable on top.

export const Background: React.FC<{cuts: Cut[]; sceneStarts: number[]}> = ({cuts, sceneStarts}) => {
  const {fps} = useVideoConfig();
  return (
    <Layer name="background" style={{backgroundColor: '#0B0B0F', overflow: 'hidden'}}>
      {cuts.map((cut, i) => {
        // Frame edges from absolute times, so neighbouring cuts meet with no gap or overlap.
        const from = Math.round(cut.start * fps);
        const frames = Math.max(1, Math.round((cut.start + cut.duration) * fps) - from);
        return (
          <Sequence key={i} name={`cut ${i + 1}`} from={from} durationInFrames={frames}>
            <CutView cut={cut} index={i} frames={frames} />
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
      {sceneStarts.slice(1).map((t, i) => (
        <Sequence key={i} name={`flash ${i + 2}`} from={Math.round(t * fps)} durationInFrames={10}>
          <Flash />
        </Sequence>
      ))}
    </Layer>
  );
};

const CutView: React.FC<{cut: Cut; index: number; frames: number}> = ({cut, index, frames}) => {
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
    transform: `scale(${base + push})`,
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
