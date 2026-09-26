import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, SAFE_SIDE, SAFE_TOP, SCENE_GLOW, WIDTH} from '../theme';
import {EditableCanvas, EditableBox} from '../../../editor/EditableCanvas';
import {useFrameLayout} from '../../../layout/useFrameLayout';
import {enterSpring, enterSmooth, exitProgress, float, glowPulse} from '../motion';
import {BankIcon, AppIcon} from '../icons';
import {FullBleed} from '../components/FullBleed';
import {Shine} from '../components/Shine';
import {Sfx, Narration} from '../components/Sfx';
import {Layer} from '../components/Layer';
import {wordFrame} from '../audio/captions';
import {SceneProps} from '../types';
import {FONT_FAMILY} from '../../../fonts';

// EXPLANATION — VO: "This fee is called MDR — Merchant Discount Rate. It's not
// a tax. It's a fee inside the merchant payment system, shared between banks
// and payment apps that run the infrastructure."
const EXIT = 15;
const GLOW = SCENE_GLOW[4];

/** A vertical downward connector that draws itself in, with an arrowhead. */
const Connector: React.FC<{progress: number; color: string; height: number}> = ({progress, color, height}) => (
  <div style={{width: 3, height, position: 'relative', display: 'flex', justifyContent: 'center'}}>
    <div
      style={{
        width: 3,
        height: `${progress * 100}%`,
        background: `linear-gradient(to bottom, ${color}, rgba(79,124,247,0.15))`,
        borderRadius: 2,
      }}
    />
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      style={{
        position: 'absolute',
        top: `calc(${progress * 100}% - 10px)`,
        opacity: progress > 0.05 ? 1 : 0,
      }}
    >
      <path d="M6 10l6 6 6-6" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

/** A full-width step in the flow — big enough to fill the frame's height. */
const FlowStep: React.FC<{
  icon: React.ReactNode;
  label: string;
  detail: string;
  enter: number;
  filled: boolean;
  fromSide: 'left' | 'right';
  frame: number;
  glowSeed: number;
}> = ({icon, label, detail, enter, filled, fromSide, frame, glowSeed}) => (
  <div
    style={{
      position: 'relative',
      opacity: enter,
      transform: `translateX(${interpolate(enter, [0, 1], [fromSide === 'left' ? -70 : 70, 0])}px) scale(${
        0.9 + enter * 0.1
      })`,
      display: 'flex',
      alignItems: 'center',
      gap: 26,
      width: '100%',
      backgroundColor: 'rgba(21,27,38,0.95)',
      border: `1px solid ${COLORS.border}`,
      borderRadius: 26,
      padding: '28px 30px',
      overflow: 'hidden',
      boxShadow: '0 18px 46px rgba(0,0,0,0.6)',
    }}
  >
    <Shine periodFrames={190} />
    <div
      style={{
        width: 84,
        height: 84,
        flexShrink: 0,
        borderRadius: 22,
        backgroundColor: filled ? COLORS.accent : COLORS.surfaceAlt,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: filled
          ? `0 0 ${16 + glowPulse(frame + glowSeed, 90) * 22}px rgba(79,124,247,0.5)`
          : 'none',
      }}
    >
      {icon}
    </div>
    <div>
      <div style={{color: COLORS.text, fontSize: 34, fontWeight: 700}}>{label}</div>
      <div style={{color: COLORS.textMuted, fontSize: 22, marginTop: 4}}>{detail}</div>
    </div>
  </div>
);

export const Scene5MdrVsTax: React.FC<SceneProps> = ({
  duration,
  imageMerchantCounter,
  accentColor,
  textColor,
  enableAudio,
  enableSfx,
  copy,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const kickIn = enterSmooth({frame, fps, delay: 6, duration: 12});
  const headIn = enterSmooth({frame, fps, delay: 14, duration: 16});

  // Each icon is synced to the real word in the narration, not a guessed
  // delay: it settles in ~8 frames *before* the word lands, so it's already
  // sharp on screen the moment the narrator says "banks" / "apps" — the
  // reveal anticipates the beat instead of lagging behind it.
  const bankWordFrame = wordFrame(5, 'banks', fps);
  const appsWordFrame = wordFrame(5, 'apps', fps);
  const n1Delay = 44; // "Merchant pays" has no matching word — MDR intro line
  const n2Delay = bankWordFrame !== null ? Math.max(n1Delay + 30, bankWordFrame - 8) : 90;
  const n3Delay = appsWordFrame !== null ? Math.max(n2Delay + 30, appsWordFrame - 8) : 130;

  const n1 = enterSpring({frame, fps, delay: n1Delay, duration: 15});
  const c1 = interpolate(frame, [n1Delay + 14, n2Delay - 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const n2 = enterSpring({frame, fps, delay: n2Delay, duration: 15});
  const c2 = interpolate(frame, [n2Delay + 14, n3Delay - 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const n3 = enterSpring({frame, fps, delay: n3Delay, duration: 15});

  const exit = exitProgress(frame, duration, EXIT);
  const drift = float(frame, 5, 112);

  const L = useFrameLayout();
  const rHeader = L.isVerticalMaster
    ? {x: L.content.x, y: L.safe.top, width: L.content.width, height: 220}
    : L.top(L.px(220));
  const rFlow = L.isVerticalMaster
    ? {x: L.content.x, y: 600, width: L.content.width, height: 560}
    : L.centerBox(L.px(920), L.px(560));
  const rTail = L.isVerticalMaster
    ? {x: L.content.x, y: 1690, width: L.content.width, height: 110}
    : L.bottom(L.px(110));

  return (
    <Layer name="scene-5-mdr-vs-tax" style={{fontFamily: FONT_FAMILY}}>
      <FullBleed src={imageMerchantCounter} duration={duration} dim={0.72} position="50% 30%" />
      <Narration enabled={enableAudio} scene={5} />
      <Sfx enabled={enableSfx} cue="whoosh" at={2} />
      <Sfx enabled={enableSfx} cue="tap" at={n2Delay} />
      <Sfx enabled={enableSfx} cue="tap" at={n3Delay} />

      <EditableCanvas>
        <EditableBox
          id="scene5.header"
          rect={rHeader}
          style={{opacity: 1 - exit}}
        >
          <div
            style={{
              width: '100%',
              textAlign: 'center',
              transform: `translateY(${drift + exit * -44}px)`,
            }}
          >
            <div
              style={{
                opacity: kickIn,
                color: accentColor,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: 'uppercase',
              }}
            >
              {copy.s5Label}
            </div>
            <div
              style={{
                opacity: headIn,
                transform: `translateY(${interpolate(headIn, [0, 1], [20, 0])}px)`,
                color: textColor,
                fontSize: 66,
                fontWeight: 900,
                letterSpacing: -1.5,
                marginTop: 16,
                textShadow: '0 4px 26px rgba(0,0,0,0.85)',
              }}
            >
              {copy.s5Headline}
            </div>
          </div>
        </EditableBox>

        {/* The flow owns the whole middle of the frame instead of one
            cramped row — this is the space that used to sit empty. */}
        <EditableBox
          id="scene5.flow"
          rect={rFlow}
          style={{opacity: 1 - exit}}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 0,
              transform: `translateY(${drift + exit * -44}px)`,
            }}
          >
            <FlowStep
              icon={<span style={{color: textColor, fontSize: 36, fontWeight: 800}}>₹</span>}
              label="Merchant pays"
              detail="On an eligible payment"
              enter={n1}
              filled={false}
              fromSide="left"
              frame={frame}
              glowSeed={0}
            />
            <div style={{display: 'flex', justifyContent: 'center'}}>
              <Connector progress={c1} color={accentColor} height={56} />
            </div>
            <FlowStep
              icon={<BankIcon size={40} color="#fff" />}
              label="Banks"
              detail="Settle the transaction"
              enter={n2}
              filled
              fromSide="right"
              frame={frame}
              glowSeed={24}
            />
            <div style={{display: 'flex', justifyContent: 'center'}}>
              <Connector progress={c2} color={accentColor} height={56} />
            </div>
            <FlowStep
              icon={<AppIcon size={40} color="#fff" />}
              label="Payment apps"
              detail="Run the infrastructure"
              enter={n3}
              filled
              fromSide="left"
              frame={frame}
              glowSeed={48}
            />
          </div>
        </EditableBox>

        <EditableBox
          id="scene5.tail"
          rect={rTail}
          style={{opacity: 1 - exit}}
        >
          <div style={{width: '100%', color: COLORS.textMuted, fontSize: 30, textAlign: 'center'}}>
            {copy.s5Tail}
          </div>
        </EditableBox>
      </EditableCanvas>
    </Layer>
  );
};
