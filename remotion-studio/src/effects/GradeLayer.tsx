import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Layer} from '../layout/Layer';
import {GRADES, Look, lookToFilter, isIdentityReframe} from './look';

/**
 * A static film-grain tile, generated once as an SVG data URI.
 *
 * feTurbulence is the only way to get real noise in CSS, but re-running it
 * every frame is genuinely slow — it's a per-pixel shader, and a render
 * evaluates it 2,300 times. So the noise is baked once here and *moved*
 * instead: shifting the tile by a pseudo-random offset each frame reads as
 * grain crawling, at the cost of a background-position change.
 */
const GRAIN_TILE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
     <filter id="n">
       <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
       <feColorMatrix type="saturate" values="0"/>
     </filter>
     <rect width="180" height="180" filter="url(#n)"/>
   </svg>`,
)}")`;

const Grain: React.FC<{amount: number}> = ({amount}) => {
  const frame = useCurrentFrame();
  // Deterministic per frame, so a re-render produces an identical video.
  const ox = (frame * 37) % 180;
  const oy = (frame * 71) % 180;

  return (
    <Layer
      name="film-grain"
      style={{
        backgroundImage: GRAIN_TILE,
        backgroundRepeat: 'repeat',
        backgroundPosition: `${ox}px ${oy}px`,
        // Grain should live in the midtones, not wash out the blacks.
        mixBlendMode: 'overlay',
        opacity: amount * 0.42,
        pointerEvents: 'none',
      }}
    />
  );
};

const Vignette: React.FC<{amount: number}> = ({amount}) => (
  <Layer
    name="vignette"
    style={{
      background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 42%, rgba(0,0,0,${
        amount * 0.82
      }) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

/**
 * Wraps a whole video and applies the grade.
 *
 * The CSS filter goes on a wrapper around the children rather than on an
 * overlay, because a filter only affects what it contains — an overlay can
 * tint but cannot change contrast or saturation of what's underneath. The
 * wash, vignette and grain then composite *on top* of the already-graded
 * image, which is the order a real grading stack uses.
 */
export const GradeLayer: React.FC<{look: Look; children: React.ReactNode}> = ({look, children}) => {
  const filter = lookToFilter(look);
  const grade = GRADES[look.grade] ?? GRADES.none;

  // The reframe scales and slides the picture. `overflow: hidden` on the
  // outer fill is what turns that into a crop rather than content spilling
  // past the frame edge.
  const reframe = isIdentityReframe(look)
    ? undefined
    : `scale(${look.zoom}) translate(${look.panX}%, ${look.panY}%)`;

  return (
    <Layer name="graded-picture" style={{overflow: 'hidden'}}>
      <Layer
        name="grade"
        style={{
          filter: filter === 'none' ? undefined : filter,
          transform: reframe,
        }}
      >
        {children}
      </Layer>

      {grade.wash ? (
        <Layer
          name="colour-wash"
          style={{
            backgroundColor: grade.wash.color,
            opacity: grade.wash.opacity,
            mixBlendMode: grade.wash.blend,
            pointerEvents: 'none',
          }}
        />
      ) : null}

      {look.vignette > 0 ? <Vignette amount={look.vignette} /> : null}
      {look.grain > 0 ? <Grain amount={look.grain} /> : null}
    </Layer>
  );
};
