import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, SAFE_SIDE, SCENE_GLOW} from '../theme';
import {enterSpring, enterSmooth, exitProgress, float, glowPulse, payoffPop} from '../motion';
import {CheckIcon} from '../icons';
import {FullBleed} from '../components/FullBleed';
import {Cursor} from '../components/Cursor';
import {Shine} from '../components/Shine';
import {Sfx, Narration} from '../components/Sfx';
import {Layer} from '../components/Layer';
import {EditableCanvas, EditableBox} from '../../../editor/EditableCanvas';
import {useFrameLayout} from '../../../layout/useFrameLayout';
import {WIDTH} from '../theme';
import {SceneProps} from '../types';
import {FONT_FAMILY} from '../../../fonts';

// HOOK — VO: "You scan a QR code, type an amount, tap pay. Done in two
// seconds — free, like always."
const EXIT = 16;
const GLOW = SCENE_GLOW[0];

export const Scene1Hook: React.FC<SceneProps> = ({
  duration,
  imageScanQr,
  exampleAmount,
  accentColor,
  successColor,
  textColor,
  enableAudio,
  enableSfx,
  copy,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const cardIn = enterSpring({frame, fps, delay: 14, duration: 20});
  const amountIn = enterSmooth({frame, fps, delay: 34, duration: 12});
  const successPop = payoffPop({frame, fps, delay: 86});
  const successOpacity = interpolate(frame, [86, 94], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Closing line arrives late so the scene keeps giving the eye something.
  const lineIn = enterSmooth({frame, fps, delay: 118, duration: 16});

  const exit = exitProgress(frame, duration, EXIT);
  const drift = float(frame, 7);

  // The 9:16 cut keeps its hand-tuned positions; the other shapes get the
  // equivalent slot from the layout engine. Expressing it this way means
  // reframing for landscape can never disturb the vertical master.
  const L = useFrameLayout();
  const rCard = L.isVerticalMaster
    ? {x: (L.width - 640) / 2, y: 620, width: 640, height: 560}
    : L.centerBox(L.px(640), L.px(560));
  const rCaption = L.isVerticalMaster
    ? {x: L.content.x, y: 1440, width: L.content.width, height: 100}
    : L.bottom(L.px(110));

  return (
    <Layer name="scene-1-hook" style={{fontFamily: FONT_FAMILY}}>
      <FullBleed src={imageScanQr} duration={duration} dim={0.5} position="50% 45%" />
      <Narration enabled={enableAudio} scene={1} />
      <Sfx enabled={enableSfx} cue="whoosh" at={2} />
      <Sfx enabled={enableSfx} cue="tap" at={78} />
      <Sfx enabled={enableSfx} cue="success" at={86} />

      <EditableCanvas>
        <EditableBox id="scene1.paymentCard" rect={rCard} style={{opacity: 1 - exit}}>
        <div
          style={{
            position: 'relative',
            transform: `translateY(${interpolate(cardIn, [0, 1], [70, 0]) + drift + exit * -60}px) scale(${
              0.96 + cardIn * 0.04
            })`,
            opacity: cardIn,
            width: '100%',
            backgroundColor: 'rgba(21,27,38,0.95)',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 34,
            padding: '36px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 22,
            overflow: 'hidden',
            boxShadow: '0 34px 90px rgba(0,0,0,0.75)',
          }}
        >
          <Shine />

          <div
            style={{
              alignSelf: 'flex-start',
              color: COLORS.textMuted,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 3,
            }}
          >
            PAY VIA UPI
          </div>

          <div
            style={{
              opacity: amountIn,
              transform: `translateY(${interpolate(amountIn, [0, 1], [18, 0])}px)`,
              color: textColor,
              fontSize: 88,
              fontWeight: 800,
              letterSpacing: -2,
            }}
          >
            ₹{exampleAmount.toLocaleString('en-IN')}
          </div>

          <div
            style={{
              width: '100%',
              backgroundColor: accentColor,
              borderRadius: 22,
              padding: '26px 0',
              textAlign: 'center',
              color: '#fff',
              fontSize: 34,
              fontWeight: 700,
              boxShadow: `0 0 ${22 + glowPulse(frame) * 26}px rgba(79,124,247,0.5)`,
            }}
          >
            Pay
          </div>

          <div
            style={{
              opacity: successOpacity,
              transform: `scale(${successPop})`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              color: successColor,
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                backgroundColor: successColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 ${18 + glowPulse(frame, 50) * 22}px rgba(47,191,106,0.6)`,
              }}
            >
              <CheckIcon size={26} color="#fff" />
            </div>
            Paid
          </div>
        </div>
        </EditableBox>

        <Cursor from={{x: 900, y: 1620}} to={{x: 560, y: 1180}} arriveAt={52} tapAt={78} leaveAt={106} />

        {/* One line of copy, low in the frame, above the platform UI zone. */}
        <EditableBox
          id="scene1.captionLine"
          rect={rCaption}
          style={{opacity: lineIn * (1 - exit)}}
        >
          <div
            style={{
              transform: `translateY(${interpolate(lineIn, [0, 1], [22, 0])}px)`,
              color: textColor,
              fontSize: 44,
              fontWeight: 700,
              textAlign: 'center',
              textShadow: '0 4px 26px rgba(0,0,0,0.85)',
              width: '100%',
            }}
          >
            {copy.s1Tagline}
          </div>
        </EditableBox>
      </EditableCanvas>
    </Layer>
  );
};
