import {Easing, interpolate} from 'remotion';

/**
 * This video is a fixed-format deliverable (9:16 short-form news explainer),
 * not a resizable template like the starter compositions — so it gets its own
 * small design system instead of reading from the global src/canvas.ts.
 */
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;

export const seconds = (s: number) => Math.round(s * FPS);

/**
 * Palette is intentionally narrow, per the brief: UPI-inspired blue, green for
 * payments that stay free, red reserved *only* for the misconception beat, and
 * white type. No other hues — extra colours read as decoration and pull a news
 * explainer toward entertainment.
 */
export const COLORS = {
  background: '#0b0f18', // dark navy-black
  surface: '#151b26',
  surfaceAlt: '#1d2431',
  border: 'rgba(255,255,255,0.10)',
  accent: '#4f7cf7', // UPI-ish blue
  success: '#2fbf6a', // successful / still-free payments
  warning: '#e0524a', // misconception beat only
  text: '#f5f7fa',
  textMuted: '#8d97a8',
} as const;

/** Per-scene accent, drawn only from the three approved hues. */
export const SCENE_GLOW = [
  COLORS.accent, // 1 hook
  COLORS.accent, // 2 surprise
  COLORS.warning, // 3 misconception — the one red beat
  COLORS.success, // 4 correction
  COLORS.accent, // 5 explanation
  COLORS.success, // 6 example
  COLORS.success, // 7 exceptions
  COLORS.accent, // 8 why it matters
  COLORS.accent, // 9 conclusion
] as const;

// Bottom 20% and top ~6% stay clear of text (Shorts/Reels UI safe areas).
export const SAFE_TOP = HEIGHT * 0.09;
export const SAFE_BOTTOM = HEIGHT * 0.22;
export const SAFE_SIDE = WIDTH * 0.08;

/** Standard exit curve: eased fade+drift finishing on the scene's last frame. */
export const exitProgress = (frame: number, duration: number, exitFrames: number) =>
  interpolate(frame, [duration - exitFrames, duration - 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
