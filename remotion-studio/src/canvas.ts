/**
 * Every composition reads its size and frame rate from here.
 * Change RESOLUTION / FPS once and the whole project follows.
 */

export const RESOLUTIONS = {
  hd: {width: 1280, height: 720},
  fullHd: {width: 1920, height: 1080},
  uhd4k: {width: 3840, height: 2160},
  vertical: {width: 1080, height: 1920},
  square: {width: 1080, height: 1080},
} as const;

// ---- The two knobs ----------------------------------------------------
export const RESOLUTION = RESOLUTIONS.fullHd; // e.g. RESOLUTIONS.uhd4k
export const FPS = 30; // e.g. 60
// -----------------------------------------------------------------------

export const CANVAS = {
  width: RESOLUTION.width,
  height: RESOLUTION.height,
  fps: FPS,
} as const;

/** Seconds -> frames at the current FPS. Use this instead of hardcoding frames
 *  so timings stay correct when you switch to 60fps. */
export const seconds = (s: number) => Math.round(s * FPS);

/** Scale factor vs. a 1080p design. Multiply font sizes / padding by this so
 *  layouts look identical at 720p or 4K. */
export const scale = RESOLUTION.height / 1080;

/** Design in 1080p pixels, render at any resolution. */
export const px = (valueAt1080p: number) => valueAt1080p * scale;

/** Broadcast-style safe areas, as a fraction of the frame.
 *  Keep readable text inside TITLE_SAFE. */
export const TITLE_SAFE = 0.1; // 10% inset on each edge
export const ACTION_SAFE = 0.05; // 5% inset on each edge

/** Neutral palette — intentionally plain. Replace with your own. */
export const COLORS = {
  background: '#0e0e10',
  surface: '#1b1b1f',
  text: '#f5f5f7',
  textMuted: '#a1a1aa',
  accent: '#6b7280',
} as const;
