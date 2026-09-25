import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../theme';
import {enterSmooth, fitFontSize} from '../motion';
import {FONT_FAMILY} from '../../../fonts';

/**
 * The reference's heading pattern: a small tracked-out uppercase label above a
 * bold headline, entering a few frames apart so the eye reads label → headline.
 */
export const SceneHeading: React.FC<{
  label: string;
  headline: string;
  accent: string;
  delay?: number;
  align?: 'center' | 'left';
  headlineSize?: number;
}> = ({label, headline, accent, delay = 0, align = 'center', headlineSize = 52}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const labelIn = enterSmooth({frame, fps, delay, duration: 10});
  const headIn = enterSmooth({frame, fps, delay: delay + 7, duration: 13});

  const size = fitFontSize(headline, {base: headlineSize, min: 34, comfortable: 34});

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        textAlign: align,
        gap: 14,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          opacity: labelIn,
          transform: `translateY(${interpolate(labelIn, [0, 1], [10, 0])}px)`,
          color: accent,
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          opacity: headIn,
          transform: `translateY(${interpolate(headIn, [0, 1], [18, 0])}px)`,
          color: COLORS.text,
          fontSize: size,
          fontWeight: 800,
          lineHeight: 1.22,
          letterSpacing: -0.5,
          textShadow: '0 4px 24px rgba(0,0,0,0.6)',
        }}
      >
        {headline}
      </div>
    </div>
  );
};
