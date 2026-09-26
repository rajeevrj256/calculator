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
import {COLORS, px, seconds, TITLE_SAFE} from '../canvas';
import {FONT_FAMILY} from '../fonts';
import {Layer} from '../layout/Layer';

export const titleCardSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  backgroundColor: zColor(),
  textColor: zColor(),
});

export type TitleCardProps = z.infer<typeof titleCardSchema>;

export const titleCardDefaults: TitleCardProps = {
  title: 'Title Card',
  subtitle: 'Edit these props live in the Studio sidebar',
  backgroundColor: COLORS.background,
  textColor: COLORS.text,
};

export const TITLE_CARD_DURATION = seconds(4);

const ENTER = seconds(0.9);
const EXIT = seconds(0.7);

export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  subtitle,
  backgroundColor,
  textColor,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // Enter: spring so it settles instead of snapping.
  const enter = spring({frame, fps, config: {damping: 200}, durationInFrames: ENTER});

  // Exit: eased fade + drift, finishing exactly on the last frame.
  const exit = interpolate(
    frame,
    [durationInFrames - EXIT, durationInFrames - 1],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.cubic),
    },
  );

  const opacity = enter * (1 - exit);
  const translateY = interpolate(enter, [0, 1], [px(40), 0]) + exit * px(-24);

  // Subtitle trails the title slightly.
  const subEnter = spring({
    frame: frame - seconds(0.25),
    fps,
    config: {damping: 200},
    durationInFrames: ENTER,
  });

  return (
    <Layer name="title-card"
      style={{
        backgroundColor,
        fontFamily: FONT_FAMILY,
        justifyContent: 'center',
        alignItems: 'center',
        padding: `${TITLE_SAFE * 100}%`,
        textAlign: 'center',
      }}
    >
      <div style={{opacity, transform: `translateY(${translateY}px)`}}>
        <h1
          style={{
            margin: 0,
            color: textColor,
            fontSize: px(96),
            fontWeight: 700,
            letterSpacing: px(-2),
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: `${px(24)}px 0 0`,
            color: textColor,
            opacity: subEnter * 0.65,
            fontSize: px(32),
            fontWeight: 400,
          }}
        >
          {subtitle}
        </p>
      </div>
    </Layer>
  );
};
