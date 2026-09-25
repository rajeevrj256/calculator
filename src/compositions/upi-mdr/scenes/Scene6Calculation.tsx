import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, SAFE_SIDE, SAFE_TOP, SCENE_GLOW, WIDTH} from '../theme';
import {EditableCanvas, EditableBox} from '../../../editor/EditableCanvas';
import {useFrameLayout} from '../../../layout/useFrameLayout';
import {enterSpring, enterSmooth, exitProgress, float, glowPulse, payoffPop} from '../motion';
import {Backdrop} from '../components/Backdrop';
import {Shine} from '../components/Shine';
import {Sfx, Narration} from '../components/Sfx';
import {Layer} from '../components/Layer';
import {wordFrame} from '../audio/captions';
import {SceneProps} from '../types';
import {FONT_FAMILY} from '../../../fonts';

// EXAMPLE — VO: "On an eligible 5,000 rupee payment, 0.4 percent works out to
// 20 rupees. Capped at 300 rupees, even above 75,000."
// "Eligible" is load-bearing: this is not a fee on every ₹5,000 payment.
const EXIT = 15;
const GLOW = SCENE_GLOW[5];

export const Scene6Calculation: React.FC<SceneProps> = ({
  duration,
  exampleAmount,
  standardRateLabel,
  exampleMdr,
  capAmount,
  capThreshold,
  accentColor,
  successColor,
  textColor,
  enableAudio,
  enableSfx,
  copy,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const kickIn = enterSmooth({frame, fps, delay: 6, duration: 12});
  const amountIn = enterSpring({frame, fps, delay: 30, duration: 16});
  const rateIn = enterSmooth({frame, fps, delay: 50, duration: 14});

  // The result lands exactly when the narrator says "20" — not a guess.
  const RESULT_AT = wordFrame(6, '20', fps) ?? 130;
  const CAP_AT = Math.max(RESULT_AT + 40, (wordFrame(6, 'Capped', fps) ?? 182) - 8);

  const count = interpolate(frame, [RESULT_AT, RESULT_AT + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - (1 - t) ** 3,
  });
  const shown = Math.round(exampleMdr * count);
  const resultOpacity = interpolate(frame, [RESULT_AT, RESULT_AT + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pop = payoffPop({frame, fps, delay: RESULT_AT + 14});
  const celebrate = interpolate(frame, [RESULT_AT + 14, RESULT_AT + 46], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const capIn = enterSpring({frame, fps, delay: CAP_AT, duration: 18});

  const exit = exitProgress(frame, duration, EXIT);
  const drift = float(frame, 5, 104);

  const L = useFrameLayout();
  const rLabel = L.isVerticalMaster
    ? {x: L.content.x, y: L.safe.top, width: L.content.width, height: 70}
    : L.top(L.px(70));
  const rSum = L.isVerticalMaster
    ? {x: L.content.x, y: 580, width: L.content.width, height: 440}
    : L.centerBox(L.content.width, L.px(440));
  const rCap = L.isVerticalMaster
    ? {x: L.content.x, y: 1400, width: L.content.width, height: 190}
    : L.bottom(L.px(190));

  return (
    <Layer name="scene-6-calculation" style={{fontFamily: FONT_FAMILY}}>
      <Backdrop glowColor={GLOW} duration={duration} />
      <Narration enabled={enableAudio} scene={6} />
      <Sfx enabled={enableSfx} cue="whoosh" at={2} />
      <Sfx enabled={enableSfx} cue="impact" at={RESULT_AT + 14} />

      <EditableCanvas>
        <EditableBox
          id="scene6.label"
          rect={rLabel}
          style={{opacity: 1 - exit}}
        >
          <div
            style={{
              width: '100%',
              opacity: kickIn,
              color: successColor,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: 'uppercase',
              textAlign: 'center',
              transform: `translateY(${drift + exit * -44}px)`,
            }}
          >
            {copy.s6Label}
          </div>
        </EditableBox>

        {/* The sum is the hero: stacked so each number is huge in frame. */}
        <EditableBox
          id="scene6.sum"
          rect={rSum}
          style={{opacity: 1 - exit}}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              transform: `translateY(${drift + exit * -44}px)`,
            }}
          >
            <div
              style={{
                opacity: amountIn,
                transform: `scale(${0.86 + amountIn * 0.14})`,
                color: textColor,
                fontSize: 118,
                fontWeight: 900,
                letterSpacing: -4,
              }}
            >
              ₹{exampleAmount.toLocaleString('en-IN')}
            </div>
            <div
              style={{
                opacity: rateIn,
                color: accentColor,
                fontSize: 54,
                fontWeight: 800,
                letterSpacing: 1,
              }}
            >
              × {standardRateLabel}
            </div>
            <div
              style={{
                opacity: resultOpacity,
                transform: `scale(${pop})`,
                color: successColor,
                fontSize: 140,
                fontWeight: 900,
                letterSpacing: -5,
                marginTop: 8,
                textShadow: `0 0 ${26 + celebrate * 62}px rgba(47,191,106,${0.35 + celebrate * 0.5})`,
              }}
            >
              ₹{shown}
            </div>
          </div>
        </EditableBox>

        <EditableBox
          id="scene6.cap"
          rect={rCap}
          style={{opacity: 1 - exit}}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              transform: `translateY(${drift + exit * -44}px)`,
            }}
          >
            <div
              style={{
                position: 'relative',
                opacity: capIn,
                transform: `translateY(${interpolate(capIn, [0, 1], [34, 0])}px)`,
                backgroundColor: 'rgba(21,27,38,0.94)',
                border: `1px solid ${COLORS.border}`,
                borderRadius: 26,
                padding: '30px 48px',
                textAlign: 'center',
                overflow: 'hidden',
                boxShadow: `0 18px 50px rgba(0,0,0,0.55), 0 0 ${16 + glowPulse(frame, 95) * 22}px rgba(47,191,106,0.16)`,
              }}
            >
              <Shine periodFrames={185} />
              <div style={{color: COLORS.textMuted, fontSize: 26}}>
                Even on ₹{capThreshold.toLocaleString('en-IN')} or more
              </div>
              <div style={{color: textColor, fontSize: 48, fontWeight: 900, marginTop: 8}}>
                Capped at ₹{capAmount}
              </div>
            </div>
          </div>
        </EditableBox>
      </EditableCanvas>
    </Layer>
  );
};
