import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, SAFE_SIDE, SCENE_GLOW, WIDTH} from '../theme';
import {enterSpring, enterSmooth, exitProgress, float, glowPulse} from '../motion';
import {FullBleed} from '../components/FullBleed';
import {Shine} from '../components/Shine';
import {Sfx, Narration} from '../components/Sfx';
import {Layer} from '../components/Layer';
import {EditableCanvas, EditableBox} from '../../../editor/EditableCanvas';
import {useFrameLayout} from '../../../layout/useFrameLayout';
import {SceneProps} from '../types';
import {FONT_FAMILY} from '../../../fonts';

// SURPRISE — VO: "But this month, a new UPI update has people asking one
// question: is UPI still free?"
const EXIT = 14;
const GLOW = SCENE_GLOW[1];

export const Scene2Surprise: React.FC<SceneProps> = ({
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

  const cardIn = enterSpring({frame, fps, delay: 4, duration: 20});
  const tagIn = enterSmooth({frame, fps, delay: 16, duration: 10});
  const headlineIn = enterSmooth({frame, fps, delay: 22, duration: 14});

  // Second beat, deliberately later: the question the news provokes.
  const qIn = enterSmooth({frame, fps, delay: 86, duration: 16});
  const underline = interpolate(frame, [102, 124], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const exit = exitProgress(frame, duration, EXIT);
  const drift = float(frame, 6, 100);

  const L = useFrameLayout();
  const rHeadline = L.isVerticalMaster
    ? {x: L.content.x, y: 800, width: L.content.width, height: 260}
    : L.inA(L.px(260));
  const rQuestion = L.isVerticalMaster
    ? {x: L.content.x, y: 1400, width: L.content.width, height: 160}
    : L.inB(L.px(160));

  return (
    <Layer name="scene-2-surprise" style={{fontFamily: FONT_FAMILY}}>
      <FullBleed src={imageMerchantCounter} duration={duration} dim={0.66} position="50% 40%" />
      <Narration enabled={enableAudio} scene={2} />
      <Sfx enabled={enableSfx} cue="notification" at={4} />

      <EditableCanvas>
        <EditableBox
          id="scene2.headlineCard"
          rect={rHeadline}
          style={{opacity: 1 - exit}}
        >
          <div
            style={{
              position: 'relative',
              opacity: cardIn,
              transform: `translateY(${interpolate(cardIn, [0, 1], [-90, 0]) + drift + exit * -70}px)`,
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              backgroundColor: 'rgba(21,27,38,0.95)',
              borderRadius: 30,
              padding: '44px 42px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              border: `1px solid ${COLORS.border}`,
              borderLeft: `5px solid ${accentColor}`,
              overflow: 'hidden',
              boxShadow: `0 26px 76px rgba(0,0,0,0.7), 0 0 ${28 + glowPulse(frame, 80) * 32}px rgba(79,124,247,0.2)`,
            }}
          >
            <Shine />
            <div
              style={{
                opacity: tagIn,
                transform: `translateX(${interpolate(tagIn, [0, 1], [-18, 0])}px)`,
                color: accentColor,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 4,
              }}
            >
              {copy.s2Label}
            </div>
            <div
              style={{
                opacity: headlineIn,
                transform: `translateY(${interpolate(headlineIn, [0, 1], [16, 0])}px)`,
                color: textColor,
                fontSize: 48,
                fontWeight: 800,
                lineHeight: 1.25,
                letterSpacing: -0.5,
              }}
            >
              {copy.s2Headline}
            </div>
          </div>
        </EditableBox>

        <EditableBox
          id="scene2.questionLine"
          rect={rQuestion}
          style={{opacity: (1 - exit) * qIn}}
        >
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%'}}>
            <div
              style={{
                transform: `translateY(${interpolate(qIn, [0, 1], [24, 0])}px)`,
                color: textColor,
                fontSize: 52,
                fontWeight: 800,
                textAlign: 'center',
                textShadow: '0 4px 26px rgba(0,0,0,0.85)',
              }}
            >
              {copy.s2Question}
            </div>
            <div style={{width: `${underline * 320}px`, height: 3, backgroundColor: accentColor, borderRadius: 2}} />
          </div>
        </EditableBox>
      </EditableCanvas>
    </Layer>
  );
};
