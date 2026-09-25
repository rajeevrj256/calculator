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

export const kineticTextSchema = z.object({
  text: z.string(),
  wordStaggerFrames: z.number().int().min(0).max(30),
  backgroundColor: zColor(),
  textColor: zColor(),
});

export type KineticTextProps = z.infer<typeof kineticTextSchema>;

export const kineticTextDefaults: KineticTextProps = {
  text: 'Words arrive one at a time',
  wordStaggerFrames: 4,
  backgroundColor: COLORS.background,
  textColor: COLORS.text,
};

export const KINETIC_TEXT_DURATION = seconds(4.5);

const ENTER = seconds(0.7);
const EXIT = seconds(0.6);

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  wordStaggerFrames,
  backgroundColor,
  textColor,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const words = text.split(' ').filter(Boolean);

  // One shared exit so every word leaves together — a staggered exit on a short
  // clip tends to still be animating when the composition ends.
  const exit = interpolate(
    frame,
    [durationInFrames - EXIT, durationInFrames - 1],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.in(Easing.quad),
    },
  );

  return (
    <Layer name="kinetic-text"
      style={{
        backgroundColor,
        fontFamily: FONT_FAMILY,
        justifyContent: 'center',
        alignItems: 'center',
        padding: `${TITLE_SAFE * 100}%`,
      }}
    >
      {/* Sound effect example — drop a file in public/ and uncomment.
          A <Sequence from={...}> offsets when it starts playing.

          <Sequence from={seconds(0.2)}>
            <Audio src={staticFile('audio/whoosh.mp3')} volume={0.6} />
          </Sequence>
      */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: `0 ${px(18)}px`,
          opacity: 1 - exit,
          transform: `translateY(${exit * px(-30)}px)`,
        }}
      >
        {words.map((word, i) => {
          const enter = spring({
            frame: frame - i * wordStaggerFrames,
            fps,
            config: {damping: 14, mass: 0.6},
            durationInFrames: ENTER,
          });

          return (
            <span
              key={`${word}-${i}`}
              style={{
                display: 'inline-block',
                color: textColor,
                fontSize: px(84),
                fontWeight: 700,
                lineHeight: 1.2,
                opacity: enter,
                transform: `translateY(${interpolate(enter, [0, 1], [px(50), 0])}px)`,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </Layer>
  );
};
