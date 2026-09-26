import React from 'react';
import {
  getRemotionEnvironment,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';
import {Layer} from '../layout/Layer';
import {useFrameLayout} from '../layout/useFrameLayout';

/**
 * Overlays that sit above the whole video: the things every social upload
 * ends up wanting, kept out of the scene code so any composition can opt in.
 */

/**
 * A thin progress bar across the top or bottom.
 *
 * Worth having on short-form: it tells a viewer the clip is nearly over,
 * which measurably holds retention in the last few seconds — the exact moment
 * people swipe away. Anchored to the top on vertical formats because the
 * bottom is buried under platform UI.
 */
export const ProgressBar: React.FC<{
  color?: string;
  /** Bar thickness in px at a 1080 short edge. */
  thickness?: number;
  position?: 'top' | 'bottom' | 'auto';
  trackOpacity?: number;
}> = ({color = '#4f7cf7', thickness = 8, position = 'auto', trackOpacity = 0.18}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const {px, isVertical} = useFrameLayout();

  const progress = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const side = position === 'auto' ? (isVertical ? 'top' : 'bottom') : position;
  const h = px(thickness);

  return (
    <Layer name="progress-bar" style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          [side]: 0,
          height: h,
          backgroundColor: `rgba(255,255,255,${trackOpacity})`,
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: color,
            boxShadow: `0 0 ${px(14)}px ${color}`,
          }}
        />
      </div>
    </Layer>
  );
};

/**
 * A handle or logo, placed inside the safe area.
 *
 * Deliberately low-contrast: a watermark that competes with the content is
 * worse than none, and platforms down-rank videos that look like reposts of
 * someone else's branded clip.
 */
export const Watermark: React.FC<{
  text?: string;
  /** Path under public/, e.g. 'images/logo.png'. Takes precedence over text. */
  image?: string;
  corner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity?: number;
}> = ({text, image, corner = 'top-right', opacity = 0.62}) => {
  const {safe, px, height, width} = useFrameLayout();
  if (!text && !image) return null;

  const vertical = corner.startsWith('top') ? {top: safe.top * 0.5} : {bottom: safe.bottom * 0.5};
  const horizontal = corner.endsWith('left') ? {left: safe.side} : {right: safe.side};

  return (
    <Layer name="watermark" style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          ...vertical,
          ...horizontal,
          opacity,
          display: 'flex',
          alignItems: 'center',
          gap: px(10),
        }}
      >
        {image ? (
          <Img src={staticFile(image)} style={{height: px(46), width: 'auto'}} />
        ) : (
          <div
            style={{
              color: '#fff',
              fontSize: px(26),
              fontWeight: 700,
              letterSpacing: px(1),
              textShadow: '0 2px 12px rgba(0,0,0,0.8)',
            }}
          >
            {text}
          </div>
        )}
      </div>
    </Layer>
  );
};

/**
 * Dev-only safe-area guides.
 *
 * The single most common way a vertical video gets ruined is putting a line of
 * text where Instagram's caption or TikTok's action rail will sit — invisible
 * in the Studio, obvious once it's live and too late. This draws those zones
 * so the mistake is visible while editing. Gated on `isStudio`, so it can
 * never reach an export.
 */
export const SafeAreaGuides: React.FC<{show?: boolean}> = ({show = true}) => {
  const {isStudio} = getRemotionEnvironment();
  const {safe, width, height, px, format} = useFrameLayout();
  if (!isStudio || !show) return null;

  const band = (style: React.CSSProperties) => (
    <div
      style={{
        position: 'absolute',
        backgroundColor: 'rgba(224,82,74,0.14)',
        ...style,
      }}
    />
  );

  return (
    <Layer name="safe-area-guides" style={{pointerEvents: 'none', zIndex: 9998}}>
      {band({top: 0, left: 0, right: 0, height: safe.top})}
      {band({bottom: 0, left: 0, right: 0, height: safe.bottom})}
      {band({top: 0, bottom: 0, left: 0, width: safe.side})}
      {band({top: 0, bottom: 0, right: 0, width: safe.side})}
      <div
        style={{
          position: 'absolute',
          left: safe.side,
          top: safe.top,
          right: safe.side,
          bottom: safe.bottom,
          border: '2px dashed rgba(79,124,247,0.65)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: safe.side,
          top: safe.top + px(8),
          color: 'rgba(255,255,255,0.75)',
          fontFamily: 'system-ui, sans-serif',
          fontSize: px(20),
          fontWeight: 700,
          letterSpacing: px(1),
        }}
      >
        {format.aspectLabel} · {width}×{height} · safe area
      </div>
    </Layer>
  );
};
