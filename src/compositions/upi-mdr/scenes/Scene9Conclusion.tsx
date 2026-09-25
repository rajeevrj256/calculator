import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, SAFE_SIDE, SCENE_GLOW, WIDTH} from '../theme';
import {EditableCanvas, EditableBox} from '../../../editor/EditableCanvas';
import {useFrameLayout} from '../../../layout/useFrameLayout';
import {enterSpring, enterSmooth, float, glowPulse} from '../motion';
import {CheckIcon} from '../icons';
import {Backdrop} from '../components/Backdrop';
import {Sfx, Narration} from '../components/Sfx';
import {Layer} from '../components/Layer';
import {wordFrame} from '../audio/captions';
import {SceneProps} from '../types';
import {FONT_FAMILY} from '../../../fonts';

// CONCLUSION — VO: "For almost everyone, UPI is exactly as free as before.
// So, who should pay for free?"
// Ends on an open question, not a prediction about what businesses will do.
const GLOW = SCENE_GLOW[8];
const FADE = 22;

export const Scene9Conclusion: React.FC<SceneProps> = ({
  duration,
  accentColor,
  successColor,
  textColor,
  enableAudio,
  enableSfx,
  copy,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const pillIn = enterSpring({frame, fps, delay: 6, duration: 18});
  const line1 = enterSmooth({frame, fps, delay: 30, duration: 16});
  // "Who should pay for free?" lands exactly as the narrator says "who".
  const whoFrame = wordFrame(9, 'who', fps);
  const line2Delay = whoFrame !== null ? Math.max(50, whoFrame - 10) : 62;
  const line2 = enterSmooth({frame, fps, delay: line2Delay, duration: 18});
  const ruleIn = interpolate(frame, [line2Delay - 8, line2Delay + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fade = interpolate(frame, [duration - FADE, duration - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const drift = float(frame, 5, 122);

  const L = useFrameLayout();
  const rCluster = L.isVerticalMaster
    ? {x: L.content.x, y: 620, width: L.content.width, height: 680}
    : L.centerBox(L.content.width, L.px(680));

  return (
    <Layer name="scene-9-conclusion" style={{fontFamily: FONT_FAMILY}}>
      <Backdrop glowColor={GLOW} duration={duration} />
      <Narration enabled={enableAudio} scene={9} />
      <Sfx enabled={enableSfx} cue="whoosh" at={2} />

      <EditableCanvas>
        <EditableBox
          id="scene9.cluster"
          rect={rCluster}
          style={{opacity: fade}}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `translateY(${drift}px)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 40,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                opacity: pillIn,
                transform: `scale(${0.84 + pillIn * 0.16})`,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                backgroundColor: 'rgba(47,191,106,0.14)',
                border: `1px solid ${successColor}`,
                color: successColor,
                borderRadius: 999,
                padding: '16px 30px',
                fontSize: 28,
                fontWeight: 700,
                boxShadow: `0 0 ${14 + glowPulse(frame, 85) * 22}px rgba(47,191,106,0.3)`,
              }}
            >
              <CheckIcon size={24} color={successColor} />
              {copy.s9Pill}
            </div>

            <div
              style={{
                opacity: line1,
                transform: `translateY(${interpolate(line1, [0, 1], [24, 0])}px)`,
                color: COLORS.textMuted,
                fontSize: 40,
                fontWeight: 500,
              }}
            >
              {copy.s9Line1}
            </div>

            <div style={{width: `${ruleIn * 300}px`, height: 2, backgroundColor: COLORS.border}} />

            <div
              style={{
                opacity: line2,
                transform: `translateY(${interpolate(line2, [0, 1], [28, 0])}px)`,
                color: textColor,
                fontSize: 72,
                fontWeight: 900,
                lineHeight: 1.2,
                letterSpacing: -2,
              }}
            >
              {copy.s9Line2}
              <br />
              <span
                style={{
                  color: accentColor,
                  textShadow: `0 0 ${26 + glowPulse(frame, 100) * 30}px rgba(79,124,247,0.45)`,
                }}
              >
                {copy.s9Line2Accent}
              </span>
            </div>
          </div>
        </EditableBox>
      </EditableCanvas>
    </Layer>
  );
};
