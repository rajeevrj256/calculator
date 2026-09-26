/**
 * The "look" — colour grading and lens-style effects applied over a whole
 * video, the way a grade sits at the top of a timeline in a real editor.
 *
 * Kept as plain data so it can be stored in the layout file, tweaked live in
 * the canvas editor, and read back identically at render time. Nothing here
 * depends on React.
 */

export type GradeId =
  | 'none'
  | 'clean'
  | 'cinematic'
  | 'warm'
  | 'cool'
  | 'vivid'
  | 'noir'
  | 'vintage';

/** Spelled out rather than borrowed from React, so this file stays UI-free. */
export type BlendMode = 'soft-light' | 'overlay' | 'multiply' | 'screen' | 'normal';

export type Grade = {
  id: GradeId;
  label: string;
  /** Short description shown under the swatch in the editor. */
  note: string;
  /** CSS filter applied to the whole frame. */
  filter: string;
  /** Optional colour wash composited over the frame. */
  wash?: {color: string; opacity: number; blend: BlendMode};
};

export const GRADES: Record<GradeId, Grade> = {
  none: {
    id: 'none',
    label: 'None',
    note: 'Ungraded',
    filter: 'none',
  },
  clean: {
    id: 'clean',
    label: 'Clean',
    note: 'Neutral, slight lift',
    filter: 'contrast(1.04) saturate(1.02) brightness(1.01)',
  },
  cinematic: {
    id: 'cinematic',
    label: 'Cinematic',
    note: 'Teal shadows, crushed blacks',
    filter: 'contrast(1.16) saturate(0.92) brightness(0.96)',
    wash: {color: '#0d2b3e', opacity: 0.16, blend: 'soft-light'},
  },
  warm: {
    id: 'warm',
    label: 'Warm',
    note: 'Golden, friendly',
    filter: 'contrast(1.06) saturate(1.12) brightness(1.02) sepia(0.12)',
    wash: {color: '#ff9b3d', opacity: 0.1, blend: 'soft-light'},
  },
  cool: {
    id: 'cool',
    label: 'Cool',
    note: 'Blue, editorial',
    filter: 'contrast(1.08) saturate(0.96) brightness(0.99)',
    wash: {color: '#3d7bff', opacity: 0.12, blend: 'soft-light'},
  },
  vivid: {
    id: 'vivid',
    label: 'Vivid',
    note: 'Punchy, social-first',
    filter: 'contrast(1.14) saturate(1.3) brightness(1.03)',
  },
  noir: {
    id: 'noir',
    label: 'Noir',
    note: 'High-contrast mono',
    filter: 'grayscale(1) contrast(1.3) brightness(0.97)',
  },
  vintage: {
    id: 'vintage',
    label: 'Vintage',
    note: 'Faded, warm highlights',
    filter: 'contrast(0.94) saturate(0.82) brightness(1.04) sepia(0.3)',
    wash: {color: '#d8b48a', opacity: 0.16, blend: 'soft-light'},
  },
};

export const GRADE_IDS = Object.keys(GRADES) as GradeId[];

/** A crop, expressed the way an editor's crop tool behaves. */
export type Crop = {
  /** 1 = fit the frame. Above 1 pushes in. */
  zoom: number;
  /** Focal offset, -1 (left/top) .. 1 (right/bottom), applied after zoom. */
  x: number;
  y: number;
};

export const DEFAULT_CROP: Crop = {zoom: 1, x: 0, y: 0};

export type Look = {
  grade: GradeId;
  /** Manual trims on top of the grade preset. 1 = unchanged. */
  brightness: number;
  contrast: number;
  saturate: number;
  /** 0 = off. Pixels of blur — small values only, this is a look not a defocus. */
  blur: number;
  /** 0 = off, 1 = heavy. Darkened corners. */
  vignette: number;
  /** 0 = off, 1 = heavy. Film grain. */
  grain: number;

  /**
   * Reframing, applied to the whole picture.
   *
   * This is the crop tool. When the same video is cut for 16:9 and 9:16, the
   * subject rarely lands in the middle of both — `zoom` pushes in and
   * `panX`/`panY` slide the visible window, which is exactly what a crop
   * rectangle does, expressed as a transform so it composes with any Ken
   * Burns move already running underneath.
   */
  zoom: number;
  /** Pan as a percentage of the frame, -50 .. 50. */
  panX: number;
  panY: number;
};

export const DEFAULT_LOOK: Look = {
  grade: 'none',
  brightness: 1,
  contrast: 1,
  saturate: 1,
  blur: 0,
  vignette: 0,
  grain: 0,
  zoom: 1,
  panX: 0,
  panY: 0,
};

/**
 * Combine a grade preset with the manual trims into one CSS filter string.
 * Order matters: the preset establishes the look, the trims adjust it.
 */
export const lookToFilter = (look: Look): string => {
  const grade = GRADES[look.grade] ?? GRADES.none;
  const parts: string[] = [];

  if (grade.filter && grade.filter !== 'none') parts.push(grade.filter);
  if (look.brightness !== 1) parts.push(`brightness(${look.brightness})`);
  if (look.contrast !== 1) parts.push(`contrast(${look.contrast})`);
  if (look.saturate !== 1) parts.push(`saturate(${look.saturate})`);
  if (look.blur > 0) parts.push(`blur(${look.blur}px)`);

  return parts.length ? parts.join(' ') : 'none';
};

/** Merge a stored partial look over the defaults, tolerating older saved data. */
export const normaliseLook = (stored: unknown): Look => {
  if (!stored || typeof stored !== 'object') return DEFAULT_LOOK;
  const s = stored as Partial<Look>;
  const grade = s.grade && GRADES[s.grade] ? s.grade : DEFAULT_LOOK.grade;
  const num = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return {
    grade,
    brightness: num(s.brightness, 1),
    contrast: num(s.contrast, 1),
    saturate: num(s.saturate, 1),
    blur: num(s.blur, 0),
    vignette: num(s.vignette, 0),
    grain: num(s.grain, 0),
    // Guard the zoom: a stored 0 (or a negative) would collapse the picture to
    // nothing with no obvious way back from the UI.
    zoom: Math.max(0.2, num(s.zoom, 1)),
    panX: num(s.panX, 0),
    panY: num(s.panY, 0),
  };
};

/** True when the reframe is doing nothing, so the transform can be skipped. */
export const isIdentityReframe = (look: Look) =>
  look.zoom === 1 && look.panX === 0 && look.panY === 0;

/**
 * Turn a crop into the CSS an <Img> needs.
 *
 * objectPosition maps -1..1 onto 0%..100%, which is what "move the crop
 * window" means for an image already covering the frame. The zoom rides on
 * top as a transform so it composes with any Ken Burns push already running.
 */
export const cropToStyle = (crop: Crop) => ({
  objectFit: 'cover' as const,
  objectPosition: `${((crop.x + 1) / 2) * 100}% ${((crop.y + 1) / 2) * 100}%`,
  transform: `scale(${crop.zoom})`,
});
