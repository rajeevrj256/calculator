import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, SCENE_GLOW, WIDTH} from '../theme';
import {anticipate, enterSpring, enterSmooth, exitProgress, float, glowPulse} from '../motion';
import {QuestionIcon} from '../icons';
import {Backdrop} from '../components/Backdrop';
import {Sfx, Narration} from '../components/Sfx';
import {Layer} from '../components/Layer';
import {EditableCanvas, EditableBox} from '../../../editor/EditableCanvas';
import {useFrameLayout} from '../../../layout/useFrameLayout';
import {SceneProps} from '../types';
import {FONT_FAMILY} from '../../../fonts';

// MISCONCEPTION — VO: "Some headlines make it sound like UPI is becoming a
// paid app." This is the only beat that uses red.
const EXIT = 13;
const GLOW = SCENE_GLOW[2];

export const Scene3Misconception: React.FC<SceneProps> = ({
  duration,
  warningColor,
  textColor,
  enableAudio,
  enableSfx,
  copy,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const iconRaw = enterSpring({frame, fps, delay: 2, duration: 18});
  const iconIn = anticipate(iconRaw);
  const l1 = enterSmooth({frame, fps, delay: 18, duration: 14});
  const l2 = enterSmooth({frame, fps, delay: 30, duration: 14});

  const exit = exitProgress(frame, duration, EXIT);
  const drift = float(frame, 7, 90);
  const ring = glowPulse(frame, 52);

  const L = useFrameLayout();
  const rCluster = L.isVerticalMaster
    ? {x: 90, y: 620, width: L.width - 180, height: 500}
    : L.centerBox(L.px(900), L.px(500));

  return (
    <Layer name="scene-3-misconception" style={{fontFamily: FONT_FAMILY}}>
      <Backdrop glowColor={GLOW} duration={duration} intensity={0.8} />
      <Narration enabled={enableAudio} scene={3} />
      <Sfx enabled={enableSfx} cue="whoosh" at={2} />

      <EditableCanvas>
      <EditableBox id="scene3.cluster" rect={rCluster} style={{opacity: 1 - exit}}>
      <div
        style={{
          transform: `translateY(${drift + exit * -46}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 56,
          textAlign: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        <div
          style={{
            opacity: interpolate(iconRaw, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}),
            transform: `scale(${0.4 + iconIn * 0.6})`,
            width: 132,
            height: 132,
            borderRadius: '50%',
            border: `4px solid ${warningColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 ${30 + ring * 46}px rgba(224,82,74,${0.32 + ring * 0.3})`,
          }}
        >
          <QuestionIcon size={60} color={warningColor} />
        </div>

        {/* One idea, two lines — nothing else competes for attention. */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
          <div
            style={{
              opacity: l1,
              transform: `translateY(${interpolate(l1, [0, 1], [26, 0])}px)`,
              color: textColor,
              fontSize: 76,
              fontWeight: 900,
              letterSpacing: -2,
              lineHeight: 1.15,
            }}
          >
            {copy.s3Line1}
          </div>
          <div
            style={{
              opacity: l2,
              transform: `translateY(${interpolate(l2, [0, 1], [26, 0])}px)`,
              color: warningColor,
              fontSize: 76,
              fontWeight: 900,
              letterSpacing: -2,
              lineHeight: 1.15,
              textShadow: `0 0 ${24 + ring * 30}px rgba(224,82,74,0.45)`,
            }}
          >
            {copy.s3Line2}
          </div>
        </div>
      </div>
      </EditableBox>
      </EditableCanvas>
    </Layer>
  );
};
