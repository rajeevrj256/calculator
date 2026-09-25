import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {COLORS} from '../theme';
import {kenBurns} from '../motion';

/**
 * A photograph with a slow push-in and an optional darkening scrim.
 *
 * `src` is a path inside public/ (e.g. "images/scan-qr.jpg"). Passing an empty
 * string renders a neutral placeholder instead of crashing, so the composition
 * looks right both before and after real assets are dropped in.
 */
export const Photo: React.FC<{
  src: string;
  duration: number;
  width: number | string;
  height: number | string;
  radius?: number;
  /** 0 = no scrim, 1 = fully dark. Raise it when text sits on top. */
  scrim?: number;
  zoomFrom?: number;
  zoomTo?: number;
  style?: React.CSSProperties;
}> = ({src, duration, width, height, radius = 28, scrim = 0, zoomFrom, zoomTo, style}) => {
  const frame = useCurrentFrame();
  const scale = kenBurns(frame, duration, zoomFrom, zoomTo);

  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: COLORS.surface,
        flexShrink: 0,
        ...style,
      }}
    >
      {src ? (
        <Img
          src={staticFile(src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${scale})`,
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: COLORS.textMuted,
            fontSize: 24,
            backgroundColor: COLORS.surfaceAlt,
          }}
        >
          image
        </div>
      )}
      {scrim > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to top, rgba(10,14,26,${scrim}) 0%, rgba(10,14,26,${
              scrim * 0.55
            }) 55%, rgba(10,14,26,${scrim * 0.25}) 100%)`,
          }}
        />
      ) : null}
    </div>
  );
};
