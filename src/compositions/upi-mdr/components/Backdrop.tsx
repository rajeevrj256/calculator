import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS} from '../theme';
import {glowPulse} from '../motion';
import {Layer} from './Layer';

/**
 * Scene background: flat near-black, a faint grid for depth, and a large soft
 * colour bloom that breathes behind the content. The bloom carries the scene's
 * accent colour, so each beat reads as its own moment without changing layout.
 */
export const Backdrop: React.FC<{
  glowColor: string;
  duration: number;
  /** 0–1, how strong the bloom is. */
  intensity?: number;
  showGrid?: boolean;
}> = ({glowColor, duration, intensity = 1, showGrid = true}) => {
  const frame = useCurrentFrame();

  // Bloom fades up with the scene and breathes gently while it holds.
  const rise = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const settle = interpolate(frame, [duration - 14, duration - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const breathe = 0.82 + glowPulse(frame, 120) * 0.18;
  // Restrained: the bloom should suggest depth, not wash the frame in colour.
  const alpha = 0.15 * intensity * rise * settle * breathe;

  return (
    <Layer name="backdrop" style={{backgroundColor: COLORS.background}}>
      {showGrid ? (
        <Layer
          name="backdrop-grid"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)',
            backgroundSize: '76px 76px',
            maskImage: 'radial-gradient(ellipse at 50% 45%, black 10%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, black 10%, transparent 72%)',
          }}
        />
      ) : null}

      <Layer
        name="backdrop-bloom"
        style={{
          background: `radial-gradient(ellipse 70% 42% at 50% 46%, ${glowColor} 0%, transparent 68%)`,
          opacity: alpha,
        }}
      />
    </Layer>
  );
};
