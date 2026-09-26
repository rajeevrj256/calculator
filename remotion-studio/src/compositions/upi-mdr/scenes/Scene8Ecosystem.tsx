import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, SAFE_SIDE, SAFE_TOP, SCENE_GLOW, WIDTH} from '../theme';
import {EditableCanvas, EditableBox} from '../../../editor/EditableCanvas';
import {useFrameLayout} from '../../../layout/useFrameLayout';
import {enterSpring, enterSmooth, exitProgress, float, glowPulse} from '../motion';
import {BankIcon, AppIcon, ShieldIcon} from '../icons';
import {FullBleed} from '../components/FullBleed';
import {Shine} from '../components/Shine';
import {Sfx, Narration} from '../components/Sfx';
import {Layer} from '../components/Layer';
import {wordFrame} from '../audio/captions';
import {SceneProps} from '../types';
import {FONT_FAMILY} from '../../../fonts';

// WHY IT MATTERS — VO: "Why charge anything? Running UPI costs money.
// Servers, security, fraud checks on every tap. You never see the charge."
const EXIT = 15;
const GLOW = SCENE_GLOW[7];

// One word from the narration per row — each row lights up as its word plays.
const rows = [
  {Icon: BankIcon, label: 'Banks settle every payment', word: 'servers'},
  {Icon: AppIcon, label: 'Apps build and run the rails', word: 'security'},
  {Icon: ShieldIcon, label: 'Fraud checks on every tap', word: 'fraud'},
];

export const Scene8Ecosystem: React.FC<SceneProps> = ({
  duration,
  imageCashlessPay,
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
  const neverFrame = wordFrame(8, 'never', fps);
  const tailIn = enterSmooth({frame, fps, delay: neverFrame !== null ? neverFrame - 10 : 220, duration: 16});

  const exit = exitProgress(frame, duration, EXIT);
  const drift = float(frame, 5, 114);

  const L = useFrameLayout();
  const rHeadline = L.isVerticalMaster
    ? {x: L.content.x, y: L.safe.top, width: L.content.width, height: 320}
    : L.inA(L.px(320));
  const rRows = L.isVerticalMaster
    ? {x: L.content.x, y: 1090, width: L.content.width, height: 510}
    : L.inB(L.px(510));

  return (
    <Layer name="scene-8-ecosystem" style={{fontFamily: FONT_FAMILY}}>
      <FullBleed src={imageCashlessPay} duration={duration} dim={0.66} position="50% 50%" />
      <Narration enabled={enableAudio} scene={8} />
      <Sfx enabled={enableSfx} cue="whoosh" at={2} />

      <EditableCanvas>
        <EditableBox
          id="scene8.headline"
          rect={rHeadline}
          style={{opacity: 1 - exit}}
        >
          <div style={{width: '100%', transform: `translateY(${drift + exit * -44}px)`}}>
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
              {copy.s8Label}
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
                whiteSpace: 'pre-line',
              }}
            >
              {copy.s8Headline}
            </div>
          </div>
        </EditableBox>

        <EditableBox
          id="scene8.rows"
          rect={rRows}
          style={{opacity: 1 - exit}}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              transform: `translateY(${drift + exit * -44}px)`,
            }}
          >
            {rows.map(({Icon, label, word}, i) => {
              const wf = wordFrame(8, word, fps);
              const delay = wf !== null ? Math.max(0, wf - 6) : 52 + i * 30;
              const enter = enterSpring({frame, fps, delay, duration: 16});
              const spokenNow = wf !== null && frame >= wf && frame < wf + 24;
              return (
                <div
                  key={label}
                  style={{
                    position: 'relative',
                    opacity: enter,
                    transform: `translateX(${interpolate(enter, [0, 1], [-56, 0])}px)`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 22,
                    backgroundColor: 'rgba(21,27,38,0.94)',
                    border: `1px solid ${spokenNow ? accentColor : COLORS.border}`,
                    borderRadius: 22,
                    padding: '24px 28px',
                    overflow: 'hidden',
                    boxShadow: spokenNow
                      ? '0 16px 42px rgba(0,0,0,0.55), 0 0 22px rgba(79,124,247,0.4)'
                      : '0 16px 42px rgba(0,0,0,0.55)',
                  }}
                >
                  <Shine periodFrames={200} />
                  <div
                    style={{
                      width: 62,
                      height: 62,
                      flexShrink: 0,
                      borderRadius: 18,
                      backgroundColor: COLORS.surfaceAlt,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 ${10 + glowPulse(frame + i * 22, 95) * 16}px rgba(79,124,247,0.3)`,
                    }}
                  >
                    <Icon size={30} color={accentColor} />
                  </div>
                  <div style={{color: textColor, fontSize: 31, fontWeight: 600}}>{label}</div>
                </div>
              );
            })}

            <div
              style={{
                opacity: tailIn,
                transform: `translateY(${interpolate(tailIn, [0, 1], [18, 0])}px)`,
                color: COLORS.textMuted,
                fontSize: 30,
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              {copy.s8Tail}
            </div>
          </div>
        </EditableBox>
      </EditableCanvas>
    </Layer>
  );
};
