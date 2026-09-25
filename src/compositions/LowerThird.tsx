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

export const lowerThirdSchema = z.object({
  name: z.string(),
  role: z.string(),
  barColor: zColor(),
  panelColor: zColor(),
  textColor: zColor(),
  showBackdrop: z.boolean(),
});

export type LowerThirdProps = z.infer<typeof lowerThirdSchema>;

export const lowerThirdDefaults: LowerThirdProps = {
  name: 'Jane Doe',
  role: 'Motion Designer',
  barColor: COLORS.accent,
  panelColor: COLORS.surface,
  textColor: COLORS.text,
  showBackdrop: true,
};

export const LOWER_THIRD_DURATION = seconds(5);

const ENTER = seconds(0.8);
const EXIT = seconds(0.6);

export const LowerThird: React.FC<LowerThirdProps> = ({
  name,
  role,
  barColor,
  panelColor,
  textColor,
  showBackdrop,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // Wipe the panel open, then close it again before the composition ends.
  const open = spring({frame, fps, config: {damping: 200}, durationInFrames: ENTER});
  const close = interpolate(
    frame,
    [durationInFrames - EXIT, durationInFrames - 1],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.cubic),
    },
  );
  const reveal = open * (1 - close);

  // Text slides in behind the leading edge of the panel.
  const textIn = spring({
    frame: frame - seconds(0.2),
    fps,
    config: {damping: 200},
    durationInFrames: ENTER,
  });
  const textOpacity = textIn * (1 - close);
  const textX = interpolate(textIn, [0, 1], [px(-30), 0]);

  return (
    <Layer name="lower-third"
      style={{
        // Transparent unless you ask for the checkerboard-friendly backdrop,
        // so this composition can also be exported as a ProRes 4444 overlay.
        backgroundColor: showBackdrop ? COLORS.background : 'transparent',
        fontFamily: FONT_FAMILY,
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        padding: `${ACTION_SAFE * 100}%`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          // A clip wipes the panel open left-to-right without ever scaling
          // (and therefore distorting) the text inside it.
          clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0 round ${px(6)}px)`,
        }}
      >
        <div style={{width: px(8), backgroundColor: barColor}} />
        <div
          style={{
            backgroundColor: panelColor,
            padding: `${px(24)}px ${px(40)}px`,
          }}
        >
          <div
            style={{
              opacity: textOpacity,
              transform: `translateX(${textX}px)`,
              whiteSpace: 'nowrap',
            }}
          >
            <div
              style={{
                color: textColor,
                fontSize: px(48),
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              {name}
            </div>
            <div
              style={{
                color: textColor,
                opacity: 0.6,
                fontSize: px(26),
                fontWeight: 400,
                marginTop: px(6),
              }}
            >
              {role}
            </div>
          </div>
        </div>
      </div>
    </Layer>
  );
};
