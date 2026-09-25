import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {enterSpring} from '../motion';

/**
 * A cursor that travels in, presses with a ripple, then leaves — so a demoed
 * tap reads as a real action rather than a state change.
 *
 * Timings are relative to the scene: it arrives at `arriveAt`, taps at `tapAt`.
 */
export const Cursor: React.FC<{
  from: {x: number; y: number};
  to: {x: number; y: number};
  arriveAt: number;
  tapAt: number;
  leaveAt: number;
  color?: string;
}> = ({from, to, arriveAt, tapAt, leaveAt, color = '#ffffff'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const travel = enterSpring({frame, fps, delay: arriveAt, duration: 18});
  const x = interpolate(travel, [0, 1], [from.x, to.x]);
  const y = interpolate(travel, [0, 1], [from.y, to.y]);

  // Press: dip in, come back.
  const press = interpolate(frame, [tapAt, tapAt + 3, tapAt + 9], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Ripple expands and fades from the tap point.
  const ripple = interpolate(frame, [tapAt, tapAt + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const leave = interpolate(frame, [leaveAt, leaveAt + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(frame, [arriveAt, arriveAt + 5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }) * (1 - leave);

  if (frame < arriveAt) return null;

  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity, pointerEvents: 'none'}}>
      {ripple > 0 && ripple < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 20 + ripple * 90,
            height: 20 + ripple * 90,
            marginLeft: -(20 + ripple * 90) / 2,
            marginTop: -(20 + ripple * 90) / 2,
            borderRadius: '50%',
            border: `3px solid ${color}`,
            opacity: (1 - ripple) * 0.7,
          }}
        />
      ) : null}
      <svg
        width={40}
        height={40}
        viewBox="0 0 24 24"
        style={{
          position: 'absolute',
          left: x,
          top: y,
          transform: `scale(${1 - press * 0.18}) translate(${press * 2}px, ${press * 2}px)`,
          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))',
        }}
      >
        <path d="M5 3l14 8.5-6.2 1.6L9.8 19z" fill={color} stroke="#0a0e1a" strokeWidth={1.2} strokeLinejoin="round" />
      </svg>
    </div>
  );
};
