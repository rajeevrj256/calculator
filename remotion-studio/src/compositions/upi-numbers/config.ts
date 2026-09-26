/**
 * "UPI By The Numbers" — a scale story, and a deliberate contrast to the MDR
 * explainer: no photography, no cards, numbers as the hero. The visual language
 * is closer to a data terminal than a news package.
 *
 * Every figure is NPCI's reported August 2026 data (see facts.ts in upi-mdr for
 * the source list — same reporting). The per-second figure is the only derived
 * number and is marked approximate on screen, because it is arithmetic on the
 * daily figure rather than a separately published statistic.
 */

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;

export const seconds = (s: number) => Math.round(s * FPS);

export const NUMBERS = {
  month: 'August 2026',
  transactionsBillion: 24.51,
  valueLakhCrore: 29.82,
  perDayMillion: 791,
  perDayValueCrore: 96205,
  yoyVolumePercent: 22,
  yoyValuePercent: 20,
  /** 791,000,000 ÷ 86,400 ≈ 9,155. Derived, so it is labelled "about". */
  perSecond: 9155,
} as const;

export const C = {
  bg: '#07070a',
  ink: '#f4f4f6',
  dim: '#71717f',
  line: 'rgba(255,255,255,0.10)',
  cyan: '#35d0c4', // data accent — distinct from the MDR video's blue
  lime: '#9fe64f',
  amber: '#f0a43c',
} as const;

export const SAFE_SIDE = WIDTH * 0.09;
