import React from 'react';
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {zColor} from '@remotion/zod-types';
import {ACTION_SAFE, COLORS, px, seconds} from '../canvas';
import {FONT_FAMILY} from '../fonts';
import {Layer} from '../layout/Layer';

export const overlayBadgeSchema = z.object({
  label: z.string(),
  badgeColor: zColor(),
  textColor: zColor(),
  corner: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
});

export type OverlayBadgeProps = z.infer<typeof overlayBadgeSchema>;

export const overlayBadgeDefaults: OverlayBadgeProps = {
  label: 'LIVE',
  badgeColor: COLORS.surface,
  textColor: COLORS.text,
  corner: 'top-right',
};

export const OVERLAY_BADGE_DURATION = seconds(5);

const ENTER = seconds(0.7);
const EXIT = seconds(0.5);

const CORNERS: Record<
  OverlayBadgeProps['corner'],
  {justifyContent: 'flex-start' | 'flex-end'; alignItems: 'flex-start' | 'flex-end'}
> = {
  'top-left': {justifyContent: 'flex-start', alignItems: 'flex-start'},
  'top-right': {justifyContent: 'flex-start', alignItems: 'flex-end'},
  'bottom-left': {justifyContent: 'flex-end', alignItems: 'flex-start'},
  'bottom-right': {justifyContent: 'flex-end', alignItems: 'flex-end'},
};

export const OverlayBadge: React.FC<OverlayBadgeProps> = ({
  label,
  badgeColor,
  textColor,
  corner,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: {damping: 12, mass: 0.7},
    durationInFrames: ENTER,
  });
  const exit = interpolate(
    frame,
    [durationInFrames - EXIT, durationInFrames - 1],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.back(1.4)),
    },
  );

  const scaleValue = enter * (1 - exit);
  const opacity = interpolate(enter, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  }) * (1 - exit);

  const {justifyContent, alignItems} = CORNERS[corner];

  return (
    // No backgroundColor anywhere in this tree: the frame stays transparent,
    // which is what ProRes 4444 / PNG exports turn into a real alpha channel.
    <Layer name="overlay-badge"
      style={{
        fontFamily: FONT_FAMILY,
        flexDirection: 'column',
        justifyContent,
        alignItems,
        padding: `${ACTION_SAFE * 100}%`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: px(14),
          backgroundColor: badgeColor,
          borderRadius: px(999),
          padding: `${px(16)}px ${px(32)}px`,
          opacity,
          transform: `scale(${scaleValue})`,
        }}
      >
        <div
          style={{
            width: px(16),
            height: px(16),
            borderRadius: '50%',
            backgroundColor: textColor,
            // Slow pulse while the badge is on screen.
            opacity: 0.4 + 0.6 * Math.abs(Math.sin((frame / fps) * Math.PI)),
          }}
        />
        <span
          style={{
            color: textColor,
            fontSize: px(34),
            fontWeight: 600,
            letterSpacing: px(2),
          }}
        >
          {label}
        </span>
      </div>
    </Layer>
  );
};
