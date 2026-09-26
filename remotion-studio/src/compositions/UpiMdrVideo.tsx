import React from 'react';
import {interpolate, Series, useCurrentFrame} from 'remotion';
import {FPS} from './upi-mdr/theme';
import {audioDurationFrames} from './upi-mdr/audio/captions';
import {upiMdrSchema, UpiMdrProps, SceneProps} from './upi-mdr/types';
import {MusicBed} from './upi-mdr/components/Sfx';
import {Layer} from './upi-mdr/components/Layer';
import {useLook} from '../editor/EditableCanvas';
import {GradeLayer} from '../effects/GradeLayer';
import {ProgressBar, SafeAreaGuides, Watermark} from '../overlays/Overlays';
import {Scene1Hook} from './upi-mdr/scenes/Scene1Hook';
import {Scene2Surprise} from './upi-mdr/scenes/Scene2Surprise';
import {Scene3Misconception} from './upi-mdr/scenes/Scene3Misconception';
import {Scene4Correction} from './upi-mdr/scenes/Scene4Correction';
import {Scene5MdrVsTax} from './upi-mdr/scenes/Scene5MdrVsTax';
import {Scene6Calculation} from './upi-mdr/scenes/Scene6Calculation';
import {Scene7Exceptions} from './upi-mdr/scenes/Scene7Exceptions';
import {Scene8Ecosystem} from './upi-mdr/scenes/Scene8Ecosystem';
import {Scene9Conclusion} from './upi-mdr/scenes/Scene9Conclusion';

export {upiMdrSchema};

/**
 * Every value below is a plain literal on purpose — Remotion Studio's
 * "Save default props" can only rewrite plain literals in this object; a
 * single computed reference (e.g. `VERIFIED_FACTS.x` or `COLORS.x`) makes it
 * fail to extract the *entire* object, which is why editing anything in the
 * Props panel previously couldn't be saved to disk.
 *
 * These numbers were fact-checked against NPCI/Finance Ministry sources (see
 * upi-mdr/facts.ts, which is kept as the documented research record — it's no
 * longer imported here, so update both places if a figure is revised).
 * Editing them via the Studio's Props panel now persists to this file and
 * is a real, deliberate factual claim once saved — same as any other edit.
 */
export const upiMdrDefaults: UpiMdrProps = {
  effectiveDate: 'October 15, 2026',
  standardRateLabel: '0.4%',
  merchantFreeThreshold: 2000,
  exampleAmount: 5000,
  exampleMdr: 20,
  capAmount: 300,
  capThreshold: 75000,
  smallMerchantMonthlyLimit: 100000,
  specialCategoryFlatFee: 5,

  imageScanQr: 'images/scan-qr.jpg',
  imageMerchantCounter: 'images/merchant-counter.jpg',
  imageStreetVendor: 'images/street-vendor.jpg',
  imageCashlessPay: 'images/cashless-pay.jpg',

  // Real narration exists in public/audio/vo-1..9.wav (Windows SAPI — see
  // scripts/generate-vo-one.ps1). Flip to false to preview silent/faster.
  enableAudio: true,
  // No whoosh/tap/success/music files exist yet — leave off until they do.
  enableSfx: false,
  showProgressBar: true,
  watermarkText: '',
  showSafeAreas: false,

  backgroundColor: '#0b0f18',
  accentColor: '#4f7cf7',
  successColor: '#2fbf6a',
  warningColor: '#e0524a',
  textColor: '#f5f7fa',

  copy: {
    s1Tagline: 'Two seconds. No fee.',
    s2Label: 'UPI UPDATE',
    s2Headline: 'A new rule is making headlines',
    s2Question: 'So — is UPI still free?',
    s3Line1: 'Is UPI becoming',
    s3Line2: 'a paid app?',
    s4Headline: 'A fee applies only above',
    s4RowFriend: 'Paying a friend',
    s5Label: 'Merchant Discount Rate',
    s5Headline: 'MDR is not a tax',
    s5Tail: 'Not collected by the government.',
    s6Label: 'On an eligible merchant payment',
    s7Label: 'Who stays free',
    s7Headline: 'Small vendors\npay nothing',
    s8Label: 'Why charge at all',
    s8Headline: 'Running UPI\ncosts money',
    s8Tail: 'You never see the charge.',
    s9Pill: 'Still free for almost everyone',
    s9Line1: 'Same UPI. New question.',
    s9Line2: 'Who should pay',
    s9Line2Accent: 'for free?',
  },
};

/**
 * Each scene's duration is the real, measured length of its narration clip
 * (see audio/captions.ts) plus a short tail for the exit animation — content
 * drives timing here, not a guess at reading speed. Total ~77s, inside the
 * 60–90s brief.
 */
const SCENES: {Component: React.FC<SceneProps>; duration: number}[] = [
  {Component: Scene1Hook, duration: audioDurationFrames(1, FPS)}, // hook
  {Component: Scene2Surprise, duration: audioDurationFrames(2, FPS)}, // surprise
  {Component: Scene3Misconception, duration: audioDurationFrames(3, FPS)}, // misconception
  {Component: Scene4Correction, duration: audioDurationFrames(4, FPS)}, // correction
  // Extra tail: scene 5 syncs its icon reveals to the "banks"/"apps" words,
  // which land close to this clip's measured end — the wider buffer keeps the
  // last icon from being cut off right after it appears.
  {Component: Scene5MdrVsTax, duration: audioDurationFrames(5, FPS, 45)}, // explanation
  {Component: Scene6Calculation, duration: audioDurationFrames(6, FPS)}, // example
  {Component: Scene7Exceptions, duration: audioDurationFrames(7, FPS)}, // exceptions
  {Component: Scene8Ecosystem, duration: audioDurationFrames(8, FPS)}, // why it matters
  {Component: Scene9Conclusion, duration: audioDurationFrames(9, FPS)}, // conclusion
];

const DISSOLVE = 8; // frames of cross-fade at each scene boundary

export const UPI_MDR_DURATION = SCENES.reduce((sum, s) => sum + s.duration, 0);

/** Softens the cut at both ends of a scene so beats dissolve into each other. */
const Dissolve: React.FC<{duration: number; isFirst: boolean; isLast: boolean; children: React.ReactNode}> = ({
  duration,
  isFirst,
  isLast,
  children,
}) => {
  const frame = useCurrentFrame();
  const fadeIn = isFirst
    ? 1
    : interpolate(frame, [0, DISSOLVE], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = isLast
    ? 1
    : interpolate(frame, [duration - DISSOLVE, duration - 1], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  return (
    <Layer name="scene-fade" style={{opacity: fadeIn * fadeOut}}>
      {children}
    </Layer>
  );
};

export const UpiMdrVideo: React.FC<UpiMdrProps> = (props) => {
  // The grade/crop set in the canvas editor. Shared across every delivery
  // format of this video, so it's coloured once and exported everywhere.
  const look = useLook();

  return (
    <Layer name="video-root" style={{backgroundColor: props.backgroundColor}}>
      <MusicBed enabled={props.enableSfx} />

      {/* The grade wraps the scenes rather than overlaying them: a CSS filter
          only affects what it contains, so an overlay could tint but could
          never change contrast or saturation of the picture underneath. */}
      <GradeLayer look={look}>
        <Series>
          {SCENES.map(({Component, duration}, i) => (
            <Series.Sequence key={i} durationInFrames={duration} name={`Scene ${i + 1}`}>
              <Dissolve duration={duration} isFirst={i === 0} isLast={i === SCENES.length - 1}>
                <Component {...props} duration={duration} />
              </Dissolve>
            </Series.Sequence>
          ))}
        </Series>
      </GradeLayer>

      {/* Above the grade — a watermark or progress bar is part of the upload,
          not part of the photography, so it shouldn't be colour-shifted. */}
      {props.showProgressBar ? <ProgressBar color={props.accentColor} /> : null}
      {props.watermarkText ? <Watermark text={props.watermarkText} /> : null}
      {props.showSafeAreas ? <SafeAreaGuides /> : null}
    </Layer>
  );
};
