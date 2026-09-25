import {Easing, interpolate, spring} from 'remotion';

/**
 * Shared motion language. Every scene builds its animation from these so the
 * whole video moves the same way: wind-up → overshoot → settle on the way in,
 * continuous subtle life while holding, a clean eased exit before the cut.
 */

/** Entrance with natural overshoot and settle. Never linear. */
export const enterSpring = ({
  frame,
  fps,
  delay = 0,
  duration = 14,
}: {
  frame: number;
  fps: number;
  delay?: number;
  duration?: number;
}) =>
  spring({
    frame: frame - delay,
    fps,
    config: {damping: 13, mass: 0.7, stiffness: 110},
    durationInFrames: duration,
  });

/** Softer entrance for large blocks of text, where overshoot reads as wobble. */
export const enterSmooth = ({
  frame,
  fps,
  delay = 0,
  duration = 14,
}: {
  frame: number;
  fps: number;
  delay?: number;
  duration?: number;
}) =>
  spring({
    frame: frame - delay,
    fps,
    config: {damping: 200},
    durationInFrames: duration,
  });

/**
 * Anticipation: dips slightly the *wrong* way before travelling to its mark.
 * Feed it a 0→1 progress value; get back a 0→1 value that winds up first.
 */
export const anticipate = (progress: number) =>
  interpolate(progress, [0, 0.22, 1], [0, -0.09, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** Eased exit, resolving exactly on the scene's final frame. */
export const exitProgress = (frame: number, duration: number, exitFrames: number) =>
  interpolate(frame, [duration - exitFrames, duration - 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });

/** Gentle vertical drift so a held graphic never sits perfectly still. */
export const float = (frame: number, amplitude = 6, periodFrames = 110) =>
  Math.sin((frame / periodFrames) * Math.PI * 2) * amplitude;

/** 0→1→0 pulse for glows and indicator dots. */
export const glowPulse = (frame: number, periodFrames = 70) =>
  0.5 + 0.5 * Math.sin((frame / periodFrames) * Math.PI * 2);

/** Slow push-in on photographs (Ken Burns) — keeps stills alive during a hold. */
export const kenBurns = (frame: number, duration: number, from = 1, to = 1.09) =>
  interpolate(frame, [0, duration], [from, to], {extrapolateRight: 'clamp'});

/**
 * Position of a light sweep across an element, as a percentage, looping.
 * Use as the x-offset of a translucent linear-gradient overlay.
 */
export const shineSweep = (frame: number, periodFrames = 150) =>
  interpolate(frame % periodFrames, [0, periodFrames], [-130, 230]);

/**
 * Shrinks long strings so text never overflows its container.
 * Not a true measurement — a character-count heuristic, which is enough when
 * the copy is known and only varies a little.
 */
export const fitFontSize = (
  text: string,
  {base, min, comfortable}: {base: number; min: number; comfortable: number},
) => {
  if (text.length <= comfortable) return base;
  const scaled = base * (comfortable / text.length) ** 0.55;
  return Math.max(min, Math.round(scaled));
};

/** Brief celebration on a key number: pop past 1, settle back. */
export const payoffPop = ({frame, fps, delay}: {frame: number; fps: number; delay: number}) => {
  const s = spring({
    frame: frame - delay,
    fps,
    config: {damping: 9, mass: 0.5, stiffness: 140},
    durationInFrames: 16,
  });
  return interpolate(s, [0, 1], [0.6, 1]);
};
