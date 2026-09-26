import React from 'react';
import {interpolate, Series, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {zColor} from '@remotion/zod-types';
import {C, NUMBERS, seconds} from './upi-numbers/config';
import {Layer} from '../layout/Layer';
import {
  S1OneTap,
  S2Everyday,
  S3Volume,
  S4Value,
  S5PerSecond,
  S6Growth,
  S7Close,
  NumScene,
} from './upi-numbers/scenes';

export const upiByNumbersSchema = z.object({
  month: z.string(),
  transactionsBillion: z.number(),
  valueLakhCrore: z.number(),
  perDayMillion: z.number(),
  perSecond: z.number(),
  yoyVolumePercent: z.number(),
  yoyValuePercent: z.number(),
  backgroundColor: zColor(),
  accentColor: zColor(),
});

export type UpiByNumbersProps = z.infer<typeof upiByNumbersSchema>;

export const upiByNumbersDefaults: UpiByNumbersProps = {
  month: NUMBERS.month,
  transactionsBillion: NUMBERS.transactionsBillion,
  valueLakhCrore: NUMBERS.valueLakhCrore,
  perDayMillion: NUMBERS.perDayMillion,
  perSecond: NUMBERS.perSecond,
  yoyVolumePercent: NUMBERS.yoyVolumePercent,
  yoyValuePercent: NUMBERS.yoyValuePercent,
  backgroundColor: C.bg,
  accentColor: C.cyan,
};

const SCENES: {Component: NumScene; duration: number}[] = [
  {Component: S1OneTap, duration: seconds(4.5)},
  {Component: S2Everyday, duration: seconds(5.5)},
  {Component: S3Volume, duration: seconds(5.5)},
  {Component: S4Value, duration: seconds(5.5)},
  {Component: S5PerSecond, duration: seconds(5.5)},
  {Component: S6Growth, duration: seconds(5.5)},
  {Component: S7Close, duration: seconds(5.5)},
];

const DISSOLVE = 7;

export const UPI_NUMBERS_DURATION = SCENES.reduce((sum, s) => sum + s.duration, 0);

const Dissolve: React.FC<{duration: number; isFirst: boolean; isLast: boolean; children: React.ReactNode}> = ({
  duration,
  isFirst,
  isLast,
  children,
}) => {
  const frame = useCurrentFrame();
  const fadeIn = isFirst
    ? 1
    : interpolate(frame, [0, DISSOLVE], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = isLast
    ? 1
    : interpolate(frame, [duration - DISSOLVE, duration - 1], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
  return <Layer name="dissolve" style={{opacity: fadeIn * fadeOut}}>{children}</Layer>;
};

export const UpiByNumbers: React.FC<UpiByNumbersProps> = ({backgroundColor}) => {
  return (
    <Layer name="upi-by-numbers" style={{backgroundColor}}>
      <Series>
        {SCENES.map(({Component, duration}, i) => (
          <Series.Sequence key={i} durationInFrames={duration} name={`Beat ${i + 1}`}>
            <Dissolve duration={duration} isFirst={i === 0} isLast={i === SCENES.length - 1}>
              <Component duration={duration} />
            </Dissolve>
          </Series.Sequence>
        ))}
      </Series>
    </Layer>
  );
};
