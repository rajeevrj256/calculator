import React from 'react';
import {useCurrentFrame} from 'remotion';
import {shineSweep} from '../motion';

/**
 * A slow band of light travelling across a card. One tasteful accent that keeps
 * a held graphic feeling alive without adding clutter.
 * Drop it inside a container with `overflow: hidden` and `position: relative`.
 */
export const Shine: React.FC<{periodFrames?: number; opacity?: number}> = ({
  periodFrames = 170,
  opacity = 0.07,
}) => {
  const frame = useCurrentFrame();
  const x = shineSweep(frame, periodFrames);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `linear-gradient(105deg, transparent ${x - 18}%, rgba(255,255,255,${opacity}) ${x}%, transparent ${
          x + 18
        }%)`,
      }}
    />
  );
};
