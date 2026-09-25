import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, SAFE_SIDE, SAFE_TOP, SCENE_GLOW, WIDTH} from '../theme';
import {EditableCanvas, EditableBox} from '../../../editor/EditableCanvas';
import {useFrameLayout} from '../../../layout/useFrameLayout';
import {enterSpring, enterSmooth, exitProgress, float, glowPulse} from '../motion';
import {CheckIcon} from '../icons';
import {FullBleed} from '../components/FullBleed';
import {Shine} from '../components/Shine';
import {Sfx, Narration} from '../components/Sfx';
import {Layer} from '../components/Layer';
import {SceneProps} from '../types';
import {FONT_FAMILY} from '../../../fonts';

// CORRECTION — VO: "Here's what actually changed. From October 15, a small fee
// applies — but only to certain merchant payments above ₹2,000. Paying a
// friend? Still free. Everyday small payments? Still free."
const EXIT = 15;
const GLOW = SCENE_GLOW[3];

const FreeRow: React.FC<{
  label: string;
  enter: number;
  successColor: string;
  textColor: string;
  frame: number;
  offset: number;
}> = ({label, enter, successColor, textColor, frame, offset}) => (
  <div
    style={{
      position: 'relative',
      opacity: enter,
      transform: `translateX(${interpolate(enter, [0, 1], [-64, 0])}px)`,
      display: 'flex',
      alignItems: 'center',
      gap: 22,
      backgroundColor: 'rgba(21,27,38,0.94)',
      border: `1px solid ${COLORS.border}`,
      borderRadius: 24,
      padding: '30px 32px',
      width: '100%',
      overflow: 'hidden',
      boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
    }}
  >
    <Shine periodFrames={190} />
    <div
      style={{
        width: 62,
        height: 62,
        flexShrink: 0,
        borderRadius: 18,
        backgroundColor: successColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 ${16 + glowPulse(frame + offset, 70) * 22}px rgba(47,191,106,0.5)`,
      }}
    >
      <CheckIcon size={30} color="#fff" />
    </div>
    <div style={{color: textColor, fontSize: 34, fontWeight: 600}}>{label}</div>
    <div style={{marginLeft: 'auto', color: successColor, fontSize: 24, fontWeight: 800, letterSpacing: 2}}>
      FREE
    </div>
  </div>
);

export const Scene4Correction: React.FC<SceneProps> = ({
  duration,
  imageCashlessPay,
  effectiveDate,
  merchantFreeThreshold,
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
  // This scene's audio (12.15s) runs long relative to the others, so the two
  // rows are spread further apart — the narration reaches "still free" on the
  // second phrase well after the first, and the reveal should track that.
  const row1 = enterSpring({frame, fps, delay: 90, duration: 16});
  const row2 = enterSpring({frame, fps, delay: 150, duration: 16});

  const exit = exitProgress(frame, duration, EXIT);
  const drift = float(frame, 5, 108);
  const threshold = merchantFreeThreshold.toLocaleString('en-IN');

  const L = useFrameLayout();
  const rHeadline = L.isVerticalMaster
    ? {x: L.content.x, y: L.safe.top, width: L.content.width, height: 240}
    : L.inA(L.px(240));
  const rRows = L.isVerticalMaster
    ? {x: L.content.x, y: 1290, width: L.content.width, height: 290}
    : L.inB(L.px(290));

  return (
    <Layer name="scene-4-correction" style={{fontFamily: FONT_FAMILY}}>
      <FullBleed src={imageCashlessPay} duration={duration} dim={0.62} position="50% 45%" />
      <Narration enabled={enableAudio} scene={4} />
      <Sfx enabled={enableSfx} cue="whoosh" at={2} />
      <Sfx enabled={enableSfx} cue="tap" at={90} />
      <Sfx enabled={enableSfx} cue="tap" at={150} />

      <EditableCanvas>
        <EditableBox
          id="scene4.headline"
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
              From {effectiveDate}
            </div>
            <div
              style={{
                opacity: headIn,
                transform: `translateY(${interpolate(headIn, [0, 1], [20, 0])}px)`,
                color: textColor,
                fontSize: 58,
                fontWeight: 900,
                lineHeight: 1.2,
                letterSpacing: -1.5,
                marginTop: 16,
                textShadow: '0 4px 26px rgba(0,0,0,0.8)',
              }}
            >
              {copy.s4Headline} ₹{threshold}
            </div>
          </div>
        </EditableBox>

        <EditableBox
          id="scene4.rows"
          rect={rRows}
          style={{opacity: 1 - exit}}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              transform: `translateY(${drift + exit * -44}px)`,
            }}
          >
            <FreeRow
              label={copy.s4RowFriend}
              enter={row1}
              successColor={successColor}
              textColor={textColor}
              frame={frame}
              offset={0}
            />
            <FreeRow
              label={`Payments up to ₹${threshold}`}
              enter={row2}
              successColor={successColor}
              textColor={textColor}
              frame={frame}
              offset={26}
            />
          </div>
        </EditableBox>
      </EditableCanvas>
    </Layer>
  );
};
