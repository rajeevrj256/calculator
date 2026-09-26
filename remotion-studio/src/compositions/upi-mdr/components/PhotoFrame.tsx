import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {COLORS} from '../theme';
import {kenBurns, glowPulse} from '../motion';
import {Shine} from './Shine';

/**
 * A photograph presented as a *designed object*, not a flat backdrop: rounded
 * frame, hairline border, colour bloom behind it, and a grade that pulls the
 * image toward the scene's accent so stock footage sits inside the palette
 * instead of fighting it.
 *
 * `src` is a path inside public/. An empty string renders a labelled
 * placeholder, so layouts stay correct before real assets arrive.
 */
export const PhotoFrame: React.FC<{
  src: string;
  duration: number;
  width: number;
  height: number;
  glowColor: string;
  radius?: number;
  /**
   * How strongly the image is pulled toward glowColor. Defaults to 0: this is a
   * news explainer, and a tinted photograph reads as a stylised filter, which
   * costs credibility. Accent colour belongs on type and UI, not on reality.
   */
  tint?: number;
  caption?: string;
  captionColor?: string;
  style?: React.CSSProperties;
}> = ({
  src,
  duration,
  width,
  height,
  glowColor,
  radius = 30,
  tint = 0,
  caption,
  captionColor,
  style,
}) => {
  const frame = useCurrentFrame();
  const scale = kenBurns(frame, duration, 1, 1.1);
  const bloom = 0.5 + glowPulse(frame, 130) * 0.5;

  return (
    <div style={{position: 'relative', width, height, flexShrink: 0, ...style}}>
      {/* Colour bloom bleeding out from behind the frame. */}
      <div
        style={{
          position: 'absolute',
          inset: -18,
          borderRadius: radius + 18,
          background: glowColor,
          filter: 'blur(40px)',
          // Kept low on purpose — a strong halo reads as a lightbox and makes
          // documentary photography look staged.
          opacity: 0.09 + bloom * 0.05,
        }}
      />

      <div
        style={{
          position: 'relative',
          width,
          height,
          borderRadius: radius,
          overflow: 'hidden',
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.surface,
          boxShadow: '0 26px 70px rgba(0,0,0,0.6)',
        }}
      >
        {src ? (
          <Img
            src={staticFile(src)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${scale})`,
              // A light grade only: enough to sit in a dark layout and carry
              // white text, not enough to look filtered.
              filter: 'saturate(0.92) contrast(1.04) brightness(0.88)',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: COLORS.surfaceAlt,
              color: COLORS.textMuted,
              fontSize: 22,
              letterSpacing: 2,
            }}
          >
            IMAGE
          </div>
        )}

        {/* Accent tint, so the photo belongs to this scene's colour. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: glowColor,
            mixBlendMode: 'color',
            opacity: tint,
          }}
        />
        {/* Deepen the corners so the frame reads as glass, not a sticker. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 50% 40%, transparent 52%, rgba(0,0,0,0.42) 100%)',
          }}
        />

        <Shine periodFrames={200} opacity={0.06} />

        {/* Glass highlight along the top edge. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '12%',
            right: '12%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
          }}
        />

        {caption ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              padding: '54px 26px 20px',
              background: 'linear-gradient(to top, rgba(6,6,8,0.92), transparent)',
              color: captionColor ?? COLORS.text,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 0.4,
            }}
          >
            {caption}
          </div>
        ) : null}
      </div>
    </div>
  );
};
