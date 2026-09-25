/**
 * Delivery formats.
 *
 * One video, several shapes. Rather than registering a composition per
 * platform (Shorts, Reels and TikTok are all 1080x1920 — three identical
 * renders), formats are defined by *shape*, and each shape lists the
 * platforms it serves. Four shapes cover every mainstream upload target.
 *
 * Every shape shares a 1080px short edge, so type sizes stay constant across
 * all of them — a 62px headline reads the same on YouTube and on Reels. What
 * changes between shapes is the amount of room above and below, which is a
 * layout problem, handled by `useFrameLayout` in src/layout/useFrameLayout.ts.
 */

export type FormatId = 'landscape' | 'vertical' | 'portrait' | 'square';

export type Format = {
  id: FormatId;
  /** Shown in the Studio sidebar and the editor's format badge. */
  label: string;
  width: number;
  height: number;
  aspectLabel: string;
  /** Where this shape is meant to be uploaded. */
  platforms: string[];
  /**
   * Fractions of the frame to keep clear of text.
   *
   * `bottom` is the important one: on Shorts/Reels/TikTok the caption, handle
   * and action rail cover roughly the bottom fifth of the screen, so anything
   * placed there is unreadable in the feed even though it looks fine in the
   * Studio. Landscape has no such overlay and only needs a modest margin.
   */
  safe: {top: number; bottom: number; side: number};
};

export const FORMATS: Record<FormatId, Format> = {
  landscape: {
    id: 'landscape',
    label: 'Landscape 16:9',
    width: 1920,
    height: 1080,
    aspectLabel: '16:9',
    platforms: ['YouTube', 'X / Twitter', 'LinkedIn', 'Facebook'],
    safe: {top: 0.08, bottom: 0.1, side: 0.06},
  },
  vertical: {
    id: 'vertical',
    label: 'Vertical 9:16',
    width: 1080,
    height: 1920,
    aspectLabel: '9:16',
    platforms: ['YouTube Shorts', 'Instagram Reels', 'TikTok'],
    safe: {top: 0.09, bottom: 0.22, side: 0.08},
  },
  portrait: {
    id: 'portrait',
    label: 'Portrait 4:5',
    width: 1080,
    height: 1350,
    aspectLabel: '4:5',
    platforms: ['Instagram feed', 'Facebook feed'],
    safe: {top: 0.08, bottom: 0.14, side: 0.07},
  },
  square: {
    id: 'square',
    label: 'Square 1:1',
    width: 1080,
    height: 1080,
    aspectLabel: '1:1',
    platforms: ['Instagram feed', 'LinkedIn', 'Facebook'],
    safe: {top: 0.08, bottom: 0.1, side: 0.07},
  },
};

export const FORMAT_IDS = Object.keys(FORMATS) as FormatId[];

/**
 * Composition id for one video in one shape, e.g. `UpiMdrVideo-vertical`.
 * The base id alone stays registered as the vertical master, so existing
 * render commands and saved layouts keep working.
 */
export const formatCompositionId = (baseId: string, format: FormatId) =>
  `${baseId}-${format}`;

/** Look a format up by frame size — used when only dimensions are known. */
export const formatForSize = (width: number, height: number): Format => {
  const match = FORMAT_IDS.map((id) => FORMATS[id]).find(
    (f) => f.width === width && f.height === height,
  );
  if (match) return match;

  // An unregistered size (someone rendered at 4K, or a starter composition).
  // Classify by aspect so layout still behaves sensibly.
  const ratio = width / height;
  if (ratio > 1.2) return FORMATS.landscape;
  if (ratio < 0.85) return FORMATS.vertical;
  return FORMATS.square;
};
