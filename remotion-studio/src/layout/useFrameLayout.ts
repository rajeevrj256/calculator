import {useVideoConfig} from 'remotion';
import {Format, formatForSize} from '../formats';

export type Rect = {x: number; y: number; width: number; height: number};

/**
 * Turns the current frame size into a layout a scene can build against,
 * without any scene knowing which platform it's being rendered for.
 *
 * The problem this solves: a 9:16 frame has 1920px of height to stack things
 * in, a 16:9 frame has 1080px. A layout that stacks a headline above three
 * rows fits comfortably in the first and overflows the second. Scaling
 * everything down to fit would make the type unreadable, which defeats the
 * point of a separate landscape cut.
 *
 * So instead of scaling, the layout *rearranges*: the `a` and `b` slots stack
 * vertically in tall frames and sit side by side in wide ones. A scene asks
 * for "block a" and "block b" and gets the right arrangement for the shape it
 * happens to be rendering at. That one idea covers most of this project's
 * scenes, which are nearly all "a headline, and some supporting rows".
 */
export type FrameLayout = {
  width: number;
  height: number;
  fps: number;
  format: Format;

  isLandscape: boolean;
  isVertical: boolean;
  isSquare: boolean;
  isPortrait: boolean;
  /**
   * Exactly the 1080x1920 master, not merely a tall frame.
   *
   * Scenes keep their hand-tuned absolute positions for the master and fall
   * back to layout slots everywhere else. That distinction matters: 4:5 is
   * also "vertical" by aspect, but it's 1350px tall, so a block hand-placed
   * at y=1290 for a 1920px frame runs straight off the bottom of it.
   */
  isVerticalMaster: boolean;
  /** True when `a`/`b` sit side by side rather than stacked. */
  isTwoColumn: boolean;

  /** Safe-area insets in pixels, already resolved from the format fractions. */
  safe: {top: number; bottom: number; side: number};
  /** The rectangle inside the safe area that content may use. */
  content: Rect;

  /**
   * Type scale. Every format in this project shares a 1080px short edge, so
   * this is 1 for all of them — it exists so an off-spec size (a 4K master, a
   * 720p proxy) still produces proportional type instead of tiny or giant text.
   */
  u: number;
  /** Scale a design-time pixel value (authored against a 1080 short edge). */
  px: (atShortEdge1080: number) => number;

  /** Full frame, ignoring safe areas — for backgrounds and scrims. */
  full: Rect;
  /** Full-width band at the top of the safe area. */
  top: (height: number) => Rect;
  /** Full-width band at the bottom of the safe area. */
  bottom: (height: number) => Rect;
  /** Centred block of a given height, spanning the content width. */
  center: (height: number) => Rect;
  /**
   * Centred block of a given width and height, clamped to the content width.
   * For cards that shouldn't stretch edge to edge on a wide frame.
   */
  centerBox: (width: number, height: number) => Rect;
  /** Primary block: upper half when stacked, left column when two-column. */
  a: Rect;
  /** Secondary block: lower half when stacked, right column when two-column. */
  b: Rect;

  /**
   * A fixed-height block inside slot `a` / `b`.
   *
   * In a wide frame the column is the full content height, so a short block
   * pinned to its top leaves the bottom half of the screen empty and the
   * composition reads top-heavy. Centring it in the column is what makes a
   * landscape cut look composed rather than like a vertical one with the
   * bottom chopped off. When stacked, the slot is already the right height
   * and position, so the block simply sits at its top.
   */
  inA: (height: number) => Rect;
  inB: (height: number) => Rect;
};

export const useFrameLayout = (): FrameLayout => {
  const {width, height, fps} = useVideoConfig();
  const format = formatForSize(width, height);

  const isLandscape = width / height > 1.2;
  const isVertical = width / height < 0.85;
  const isSquare = !isLandscape && !isVertical && Math.abs(width - height) < 1;
  const isPortrait = !isLandscape && !isVertical && !isSquare;

  // Side by side only when there is genuinely more width than height to work
  // with. A 4:5 frame is nominally "portrait" but far too narrow to column.
  const isTwoColumn = isLandscape;

  const safe = {
    top: Math.round(height * format.safe.top),
    bottom: Math.round(height * format.safe.bottom),
    side: Math.round(width * format.safe.side),
  };

  const content: Rect = {
    x: safe.side,
    y: safe.top,
    width: width - safe.side * 2,
    height: height - safe.top - safe.bottom,
  };

  const u = Math.min(width, height) / 1080;
  const px = (v: number) => v * u;

  let a: Rect;
  let b: Rect;

  if (isTwoColumn) {
    const gutter = Math.round(width * 0.045);
    const colWidth = (content.width - gutter) / 2;
    a = {x: content.x, y: content.y, width: colWidth, height: content.height};
    b = {
      x: content.x + colWidth + gutter,
      y: content.y,
      width: colWidth,
      height: content.height,
    };
  } else {
    // Stacked. The lower block gets more room because it usually holds the
    // supporting rows, and it is anchored to the bottom of the safe area so
    // it stays clear of platform UI whatever the frame height.
    const topShare = isVertical ? 0.36 : 0.4;
    const bottomShare = isVertical ? 0.44 : 0.46;
    const aHeight = content.height * topShare;
    const bHeight = content.height * bottomShare;
    a = {x: content.x, y: content.y, width: content.width, height: aHeight};
    b = {
      x: content.x,
      y: content.y + content.height - bHeight,
      width: content.width,
      height: bHeight,
    };
  }

  return {
    width,
    height,
    fps,
    format,
    isLandscape,
    isVertical,
    isSquare,
    isPortrait,
    isVerticalMaster: width === 1080 && height === 1920,
    isTwoColumn,
    safe,
    content,
    u,
    px,
    full: {x: 0, y: 0, width, height},
    top: (h: number) => ({x: content.x, y: content.y, width: content.width, height: h}),
    bottom: (h: number) => ({
      x: content.x,
      y: content.y + content.height - h,
      width: content.width,
      height: h,
    }),
    center: (h: number) => ({
      x: content.x,
      y: (height - h) / 2,
      width: content.width,
      height: h,
    }),
    centerBox: (w: number, h: number) => {
      const cw = Math.min(w, content.width);
      return {x: (width - cw) / 2, y: (height - h) / 2, width: cw, height: h};
    },
    a,
    b,
    inA: (h: number) => inSlot(a, h, isTwoColumn),
    inB: (h: number) => inSlot(b, h, isTwoColumn),
  };
};

const inSlot = (slot: Rect, h: number, centred: boolean): Rect => ({
  x: slot.x,
  y: centred ? slot.y + (slot.height - h) / 2 : slot.y,
  width: slot.width,
  height: h,
});
