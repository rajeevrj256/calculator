import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, SAFE_SIDE, SAFE_TOP, SCENE_GLOW, WIDTH} from '../theme';
import {EditableCanvas, EditableBox} from '../../../editor/EditableCanvas';
import {useFrameLayout} from '../../../layout/useFrameLayout';
import {enterSpring, enterSmooth, exitProgress, float, glowPulse} from '../motion';
import {TrainIcon, PhoneCallIcon, ShieldIcon, FuelIcon} from '../icons';
import {FullBleed} from '../components/FullBleed';
import {Sfx, Narration} from '../components/Sfx';
import {Layer} from '../components/Layer';
import {wordFrame} from '../audio/captions';
import {SceneProps} from '../types';
import {FONT_FAMILY} from '../../../fonts';

// EXCEPTIONS — VO: "Small vendors stay free, up to 1 lakh a month. Railways,
// telecom, insurance, and fuel pay a flat 5 rupees instead."
// Kept deliberately sparse: the photograph carries the small-vendor idea, so
// the copy is one headline plus one qualifying line.
const EXIT = 15;
const GLOW = SCENE_GLOW[6];
const STAGGER = 20; // fallback spacing if a word can't be found in the audio

const categories = [
  {Icon: TrainIcon, label: 'Railways', word: 'railways'},
  {Icon: PhoneCallIcon, label: 'Telecom', word: 'telecom'},
  {Icon: ShieldIcon, label: 'Insurance', word: 'insurance'},
  {Icon: FuelIcon, label: 'Fuel', word: 'fuel'},
];

export const Scene7Exceptions: React.FC<SceneProps> = ({
  duration,
  imageStreetVendor,
  smallMerchantMonthlyLimit,
  specialCategoryFlatFee,
  successColor,
  textColor,
  enableAudio,
  enableSfx,
  copy,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const kickIn = enterSmooth({frame, fps, delay: 6, duration: 12});
  const headIn = enterSmooth({frame, fps, delay: 14, duration: 16});
  const limitIn = enterSpring({frame, fps, delay: 44, duration: 16});
  const rowLabelStart = wordFrame(7, 'railways', fps);
  const rowLabelIn = enterSmooth({frame, fps, delay: rowLabelStart !== null ? rowLabelStart - 30 : 120, duration: 14});

  const exit = exitProgress(frame, duration, EXIT);
  const drift = float(frame, 5, 110);
  const lakhs = smallMerchantMonthlyLimit / 100000;

  const L = useFrameLayout();
  const rHeadline = L.isVerticalMaster
    ? {x: L.content.x, y: L.safe.top, width: L.content.width, height: 440}
    : L.inA(L.px(440));
  const rCats = L.isVerticalMaster
    ? {x: L.content.x, y: 1270, width: L.content.width, height: 330}
    : L.inB(L.px(330));

  return (
    <Layer name="scene-7-exceptions" style={{fontFamily: FONT_FAMILY}}>
      <FullBleed src={imageStreetVendor} duration={duration} dim={0.5} position="50% 42%" />
      <Narration enabled={enableAudio} scene={7} />
      <Sfx enabled={enableSfx} cue="whoosh" at={2} />

      <EditableCanvas>
        <EditableBox
          id="scene7.headline"
          rect={rHeadline}
          style={{opacity: 1 - exit}}
        >
          <div style={{width: '100%', transform: `translateY(${drift + exit * -44}px)`}}>
            <div
              style={{
                opacity: kickIn,
                color: successColor,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: 'uppercase',
              }}
            >
              {copy.s7Label}
            </div>
            <div
              style={{
                opacity: headIn,
                transform: `translateY(${interpolate(headIn, [0, 1], [20, 0])}px)`,
                color: textColor,
                fontSize: 62,
                fontWeight: 900,
                lineHeight: 1.18,
                letterSpacing: -1.5,
                marginTop: 16,
                textShadow: '0 4px 28px rgba(0,0,0,0.9)',
                // Editable copy keeps its line break: a newline in the props
                // panel renders as one here.
                whiteSpace: 'pre-line',
              }}
            >
              {copy.s7Headline}
            </div>

            <div
              style={{
                opacity: limitIn,
                transform: `translateY(${interpolate(limitIn, [0, 1], [18, 0])}px) scale(${0.9 + limitIn * 0.1})`,
                display: 'inline-flex',
                alignItems: 'center',
                marginTop: 28,
                backgroundColor: 'rgba(47,191,106,0.16)',
                border: `1px solid ${successColor}`,
                color: successColor,
                borderRadius: 999,
                padding: '14px 28px',
                fontSize: 28,
                fontWeight: 700,
                boxShadow: `0 0 ${14 + glowPulse(frame, 80) * 20}px rgba(47,191,106,0.35)`,
              }}
            >
              Up to ₹{lakhs} lakh a month
            </div>
          </div>
        </EditableBox>

        <EditableBox
          id="scene7.categories"
          rect={rCats}
          style={{opacity: 1 - exit}}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
              transform: `translateY(${drift + exit * -44}px)`,
            }}
          >
            <div
              style={{
                opacity: rowLabelIn,
                color: COLORS.textMuted,
                fontSize: 28,
                fontWeight: 600,
                textShadow: '0 2px 16px rgba(0,0,0,0.9)',
              }}
            >
              Flat ₹{specialCategoryFlatFee} instead of the standard rate
            </div>
            <div style={{display: 'flex', gap: 18, justifyContent: 'space-between'}}>
              {categories.map(({Icon, label, word}, i) => {
                // Each icon settles in ~6 frames before its own word is spoken —
                // synced to the real narration, not an evenly-spaced guess.
                const wf = wordFrame(7, word, fps);
                const delay = wf !== null ? Math.max(0, wf - 6) : (rowLabelStart ?? 120) + 12 + i * STAGGER;
                const enter = enterSpring({frame, fps, delay, duration: 15});
                // A brief highlight ring while its word is actively spoken.
                const spokenNow = wf !== null && frame >= wf && frame < wf + 22;
                return (
                  <div
                    key={label}
                    style={{
                      opacity: enter,
                      transform: `translateY(${interpolate(enter, [0, 1], [30, 0])}px) scale(${0.84 + enter * 0.16})`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 26,
                        backgroundColor: 'rgba(21,27,38,0.94)',
                        border: `1px solid ${spokenNow ? successColor : COLORS.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: spokenNow ? `0 0 24px rgba(47,191,106,0.55)` : 'none',
                      }}
                    >
                      <Icon size={44} color={successColor} />
                    </div>
                    <div style={{color: textColor, fontSize: 22, fontWeight: 600}}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </EditableBox>
      </EditableCanvas>
    </Layer>
  );
};
