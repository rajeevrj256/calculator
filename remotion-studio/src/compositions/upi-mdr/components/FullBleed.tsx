import {colorKey} from '@remotion/effects/color-key';
import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {COLORS} from '../theme';
import {kenBurns} from '../motion';
import {Layer} from './Layer';

/**
 * A photograph filling the entire 1080×1920 frame, with gradient scrims so
 * headline type stays legible over it.
 *
 * The push-in is deliberately small (1 → 1.06 across a whole scene). The brief
 * asks for minimal camera movement, so this is just enough to stop a still
 * photograph from reading as a frozen frame.
 */
export const FullBleed: React.FC<{
  src: string;
  duration: number;
  /** Overall darkening, 0–1. Raise it when a lot of text sits on top. */
  dim?: number;
  /** Extra darkening at the top and bottom, where headlines and captions sit. */
  topScrim?: number;
  bottomScrim?: number;
  /** Focal point of the crop, e.g. '50% 35%' to favour faces. */
  position?: string;
}> = ({src, duration, dim = 0.45, topScrim = 0.85, bottomScrim = 0.95, position = '50% 50%'}) => {
  const frame = useCurrentFrame();
  const scale = kenBurns(frame, duration, 1, 1.06);

  // Photograph settles in rather than cutting in hard.
  const reveal = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <Layer name="photo-background" style={{backgroundColor: COLORS.background, overflow: 'hidden'}}>
      {src ? (
        <Img
          src={staticFile(src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: position,
            transform: `scale(${scale * (1.02 - reveal * 0.02)})`,
            opacity: reveal,
            filter: 'saturate(0.9) contrast(1.05) brightness(0.92)',
          }}
          effects={[colorKey({
            similarity: 0.45
          })]}
        />
      ) : (
        <Layer
          name="image-placeholder"
          style={{
            backgroundColor: COLORS.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.textMuted,
            fontSize: 26,
            letterSpacing: 3,
          }}
        >
          IMAGE
        </Layer>
      )}

      <Layer name="dim-overlay" style={{backgroundColor: COLORS.background, opacity: dim}} />

      {/* Falls off hard below ~55% so supporting rows and labels always have
          contrast, however busy the photograph is underneath them. */}
      <Layer
        name="gradient-scrim"
        style={{
          background: `linear-gradient(to bottom, rgba(11,15,24,${topScrim}) 0%, rgba(11,15,24,0.12) 30%, rgba(11,15,24,0.32) 55%, rgba(11,15,24,0.78) 76%, rgba(11,15,24,${bottomScrim}) 100%)`,
        }}
      />
    </Layer>
  );
};
