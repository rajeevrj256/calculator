import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, NUMBERS, SAFE_SIDE, seconds} from './config';
import {enterSpring, enterSmooth, exitProgress, float, glowPulse, payoffPop} from '../upi-mdr/motion';
import {FONT_FAMILY} from '../../fonts';
import {Layer} from '../../layout/Layer';

/**
 * The seven beats live in one file because each is a single idea — a number and
 * its caption. Splitting them would be more ceremony than content.
 */

export type NumScene = React.FC<{duration: number}>;

const frameStyle: React.CSSProperties = {
  fontFamily: FONT_FAMILY,
  backgroundColor: C.bg,
  justifyContent: 'center',
  alignItems: 'center',
  padding: `0 ${SAFE_SIDE}px`,
};

/** Small tracked label above a statistic. */
const Kicker: React.FC<{children: React.ReactNode; color?: string; opacity?: number}> = ({
  children,
  color = C.cyan,
  opacity = 1,
}) => (
  <div style={{color, fontSize: 24, fontWeight: 700, letterSpacing: 5, textTransform: 'uppercase', opacity}}>
    {children}
  </div>
);

/** Hairline rule that draws itself open from the centre. */
const Rule: React.FC<{progress: number; color?: string}> = ({progress, color = C.line}) => (
  <div style={{width: `${progress * 100}%`, maxWidth: 560, height: 1, backgroundColor: color}} />
);

// ── 1 ─────────────────────────────────────────────────────────────────────
// Start from the smallest possible unit: one payment.
export const S1OneTap: NumScene = ({duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const exit = exitProgress(frame, duration, 12);

  const dot = enterSpring({frame, fps, delay: 4, duration: 16});
  const textIn = enterSmooth({frame, fps, delay: 20, duration: 14});

  return (
    <Layer name="s1-one-tap" style={frameStyle}>
      <div style={{opacity: 1 - exit, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 70}}>
        <div style={{position: 'relative', width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {/* Three rings leaving the tap point, staggered. */}
          {[0, 1, 2].map((i) => {
            const r = interpolate(frame - 10 - i * 14, [0, 52], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            if (r <= 0) return null;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: 60 + r * 200,
                  height: 60 + r * 200,
                  borderRadius: '50%',
                  border: `2px solid ${C.cyan}`,
                  opacity: (1 - r) * 0.55,
                }}
              />
            );
          })}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: C.cyan,
              transform: `scale(${dot})`,
              boxShadow: `0 0 ${24 + glowPulse(frame, 50) * 30}px rgba(53,208,196,0.7)`,
            }}
          />
        </div>

        <div style={{opacity: textIn, transform: `translateY(${interpolate(textIn, [0, 1], [20, 0])}px)`, textAlign: 'center'}}>
          <div style={{color: C.ink, fontSize: 64, fontWeight: 800, letterSpacing: -1}}>One tap.</div>
          <div style={{color: C.dim, fontSize: 30, marginTop: 14}}>A single UPI payment.</div>
        </div>
      </div>
    </Layer>
  );
};

// ── 2 ─────────────────────────────────────────────────────────────────────
// Now multiply it: the grid fills in a wave so scale is felt, not just read.
export const S2Everyday: NumScene = ({duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const exit = exitProgress(frame, duration, 12);

  const cols = 14;
  const rows = 10;
  const textIn = enterSmooth({frame, fps, delay: 42, duration: 14});

  return (
    <Layer name="s2-everyday" style={frameStyle}>
      <div style={{opacity: 1 - exit, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 60}}>
        <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 18}}>
          {Array.from({length: cols * rows}).map((_, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            // Diagonal wave so the fill reads as spreading, not random.
            const delay = 4 + (col + row) * 1.6;
            const on = interpolate(frame - delay, [0, 8], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <div
                key={i}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: C.cyan,
                  opacity: on * 0.85,
                  transform: `scale(${0.4 + on * 0.6})`,
                }}
              />
            );
          })}
        </div>

        <div style={{opacity: textIn, transform: `translateY(${interpolate(textIn, [0, 1], [20, 0])}px)`, textAlign: 'center'}}>
          <Kicker>Every single day</Kicker>
          <div style={{color: C.ink, fontSize: 74, fontWeight: 900, letterSpacing: -2, marginTop: 14}}>
            {NUMBERS.perDayMillion} million
          </div>
          <div style={{color: C.dim, fontSize: 28, marginTop: 8}}>payments move through UPI</div>
        </div>
      </div>
    </Layer>
  );
};

/** A statistic presented as the whole frame: kicker, huge figure, footnote. */
const BigStat: React.FC<{
  duration: number;
  kicker: string;
  value: number;
  decimals?: number;
  prefix?: string;
  unit: string;
  footnote: string;
  color: string;
  countFrom?: number;
}> = ({duration, kicker, value, decimals = 2, prefix = '', unit, footnote, color, countFrom = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const exit = exitProgress(frame, duration, 12);

  const kickIn = enterSmooth({frame, fps, delay: 2, duration: 10});
  const start = 14;
  // One continuous ease-out count, never a per-digit tick.
  const p = interpolate(frame, [start, start + 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - (1 - t) ** 3,
  });
  const shown = countFrom + (value - countFrom) * p;
  const pop = payoffPop({frame, fps, delay: start + 30});
  const celebrate = interpolate(frame, [start + 30, start + 62], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const unitIn = enterSpring({frame, fps, delay: start + 30, duration: 14});
  const footIn = enterSmooth({frame, fps, delay: start + 40, duration: 14});
  const ruleIn = interpolate(frame, [start + 36, start + 56], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <Layer name="big-stat" style={frameStyle}>
      <div
        style={{
          opacity: 1 - exit,
          transform: `translateY(${float(frame, 4, 120) + exit * -40}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          textAlign: 'center',
        }}
      >
        <Kicker color={color} opacity={kickIn}>
          {kicker}
        </Kicker>

        <div
          style={{
            color: C.ink,
            fontSize: 150,
            fontWeight: 900,
            letterSpacing: -6,
            lineHeight: 1,
            transform: `scale(${pop})`,
            textShadow: `0 0 ${30 + celebrate * 60}px ${color}55`,
          }}
        >
          {prefix}
          {shown.toLocaleString('en-IN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}
        </div>

        <div
          style={{
            opacity: unitIn,
            transform: `translateY(${interpolate(unitIn, [0, 1], [14, 0])}px)`,
            color,
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: 6,
          }}
        >
          {unit}
        </div>

        <div style={{marginTop: 22, display: 'flex', justifyContent: 'center', width: '100%'}}>
          <Rule progress={ruleIn} />
        </div>

        <div style={{opacity: footIn, color: C.dim, fontSize: 28, marginTop: 18, lineHeight: 1.4}}>{footnote}</div>
      </div>
    </Layer>
  );
};

// ── 3 ─────────────────────────────────────────────────────────────────────
export const S3Volume: NumScene = ({duration}) => (
  <BigStat
    duration={duration}
    kicker={NUMBERS.month}
    value={NUMBERS.transactionsBillion}
    unit="BILLION TRANSACTIONS"
    footnote="UPI's highest month on record"
    color={C.cyan}
  />
);

// ── 4 ─────────────────────────────────────────────────────────────────────
export const S4Value: NumScene = ({duration}) => (
  <BigStat
    duration={duration}
    kicker="Value moved"
    value={NUMBERS.valueLakhCrore}
    prefix="₹"
    unit="LAKH CRORE"
    footnote={`About ₹${NUMBERS.perDayValueCrore.toLocaleString('en-IN')} crore every day`}
    color={C.lime}
  />
);

// ── 5 ─────────────────────────────────────────────────────────────────────
// The number that makes scale visceral: what it looks like per second.
export const S5PerSecond: NumScene = ({duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const exit = exitProgress(frame, duration, 12);

  const kickIn = enterSmooth({frame, fps, delay: 2, duration: 10});
  const p = interpolate(frame, [12, 44], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - (1 - t) ** 3,
  });
  const shown = Math.round(NUMBERS.perSecond * p);
  const footIn = enterSmooth({frame, fps, delay: 50, duration: 14});
  const live = glowPulse(frame, 34);

  return (
    <Layer name="s5-per-second" style={frameStyle}>
      <div
        style={{
          opacity: 1 - exit,
          transform: `translateY(${float(frame, 4, 118) + exit * -40}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22,
          textAlign: 'center',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 12, opacity: kickIn}}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: C.amber,
              opacity: 0.4 + live * 0.6,
              boxShadow: `0 0 ${8 + live * 16}px rgba(240,164,60,0.8)`,
            }}
          />
          <Kicker color={C.amber}>Right now, roughly</Kicker>
        </div>

        <div
          style={{
            color: C.ink,
            fontSize: 168,
            fontWeight: 900,
            letterSpacing: -8,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {shown.toLocaleString('en-IN')}
        </div>

        <div style={{color: C.amber, fontSize: 42, fontWeight: 800, letterSpacing: 5}}>PER SECOND</div>

        <div style={{opacity: footIn, color: C.dim, fontSize: 27, marginTop: 24, lineHeight: 1.45}}>
          Derived from {NUMBERS.perDayMillion} million payments a day
        </div>
      </div>
    </Layer>
  );
};

// ── 6 ─────────────────────────────────────────────────────────────────────
// Growth, shown as two bars rather than a claim.
export const S6Growth: NumScene = ({duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const exit = exitProgress(frame, duration, 12);

  const kickIn = enterSmooth({frame, fps, delay: 2, duration: 10});
  const grow = interpolate(frame, [16, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - (1 - t) ** 3,
  });
  const labelIn = enterSpring({frame, fps, delay: 46, duration: 14});

  const bars = [
    {label: 'Volume', pct: NUMBERS.yoyVolumePercent, color: C.cyan},
    {label: 'Value', pct: NUMBERS.yoyValuePercent, color: C.lime},
  ];

  return (
    <Layer name="s6-growth" style={frameStyle}>
      <div
        style={{
          opacity: 1 - exit,
          transform: `translateY(${exit * -40}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 92,
          width: '100%',
        }}
      >
        <div style={{opacity: kickIn, textAlign: 'center'}}>
          <Kicker>Year on year</Kicker>
          <div style={{color: C.ink, fontSize: 56, fontWeight: 900, letterSpacing: -1.5, marginTop: 14}}>
            Still growing fast
          </div>
        </div>

        {/* Bars are capped well short of the heading so the % labels, which sit
            above each bar, never collide with it. */}
        <div style={{display: 'flex', gap: 46, alignItems: 'flex-end', height: 330}}>
          {bars.map(({label, pct, color}, i) => {
            const h = grow * (pct / 25) * 290;
            return (
              <div key={label} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
                <div
                  style={{
                    opacity: labelIn,
                    transform: `translateY(${interpolate(labelIn, [0, 1], [12, 0])}px)`,
                    color,
                    fontSize: 52,
                    fontWeight: 900,
                  }}
                >
                  +{pct}%
                </div>
                <div
                  style={{
                    width: 150,
                    height: h,
                    borderRadius: 16,
                    background: `linear-gradient(to top, ${color}, ${color}66)`,
                    boxShadow: `0 0 ${16 + glowPulse(frame + i * 30, 90) * 20}px ${color}55`,
                  }}
                />
                <div style={{color: C.dim, fontSize: 28, fontWeight: 600}}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Layer>
  );
};

// ── 7 ─────────────────────────────────────────────────────────────────────
// Land the point the scale was building toward.
export const S7Close: NumScene = ({duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const line1 = enterSmooth({frame, fps, delay: 4, duration: 14});
  const line2 = enterSmooth({frame, fps, delay: 20, duration: 16});
  const srcIn = enterSmooth({frame, fps, delay: 40, duration: 14});
  const fade = interpolate(frame, [duration - 18, duration - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <Layer name="s7-close" style={frameStyle}>
      <div
        style={{
          opacity: fade,
          transform: `translateY(${float(frame, 4, 120)}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
          textAlign: 'center',
        }}
      >
        <div style={{opacity: line1, color: C.dim, fontSize: 36, fontWeight: 500}}>
          Infrastructure this big isn't free to run.
        </div>
        <div
          style={{
            opacity: line2,
            transform: `translateY(${interpolate(line2, [0, 1], [22, 0])}px)`,
            color: C.ink,
            fontSize: 62,
            fontWeight: 900,
            letterSpacing: -1.5,
            lineHeight: 1.25,
            textShadow: `0 0 ${26 + glowPulse(frame, 100) * 26}px rgba(53,208,196,0.35)`,
          }}
        >
          For you, it's still
          <br />
          <span style={{color: C.cyan}}>free to use.</span>
        </div>
        <div style={{opacity: srcIn * 0.75, color: C.dim, fontSize: 22, marginTop: 30, letterSpacing: 1}}>
          Source: NPCI data, {NUMBERS.month}
        </div>
      </div>
    </Layer>
  );
};
