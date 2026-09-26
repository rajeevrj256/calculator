# Motion Graphics — Remotion Starter

Programmatic motion graphics in React. Design in the browser, render to files you can
drop straight into Premiere, Resolve, Final Cut or any other editor.

The look here is deliberately plain — neutral greys, one font, no styling opinions.
It's a working skeleton, not a finished style.

## Preview

```bash
npm run studio
```

Opens Remotion Studio at http://localhost:3000. Pick a composition in the left sidebar,
scrub the timeline, and edit props live in the right-hand panel (the controls are
generated from each composition's zod schema).

## Canvas settings

Resolution and frame rate live in one place: [`src/canvas.ts`](src/canvas.ts).

```ts
export const RESOLUTION = RESOLUTIONS.fullHd; // → RESOLUTIONS.uhd4k for 4K
export const FPS = 30;                        // → 60
```

Every composition inherits these. Two helpers keep things resolution-independent:

- `seconds(1.5)` — converts seconds to frames, so timings survive an fps change.
- `px(96)` — you design in 1080p pixels, it scales to whatever resolution is set.

Use them instead of hardcoded frame counts and font sizes, and switching to 4K/60 is a
two-line edit.

## Project structure

```
src/
  index.ts              entry point — registers the root
  Root.tsx              registers every composition (id, size, fps, schema, props)
  canvas.ts             resolution, fps, palette, safe areas, helpers
  fonts.ts              Google font loading
  compositions/         one file per graphic
public/                 fonts, images, audio — reached via staticFile()
out/                    renders (gitignored)
```

## Starter compositions

| id | What it is |
|---|---|
| `TitleCard` | Centred title + subtitle. Spring in, eased fade out. |
| `LowerThird` | Name/role panel that wipes open and closed. Set `showBackdrop: false` to export it as a transparent overlay. |
| `KineticText` | Words spring in one at a time, then leave together. |
| `OverlayBadge` | Corner badge on a **transparent** background — the alpha-channel example. |

Each one has a zod schema plus `defaultProps`, and a full enter *and* exit, so nothing
pops on the first frame or gets cut off mid-animation.

## Adding a new graphic

1. Create `src/compositions/MyGraphic.tsx`:

```tsx
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing} from 'remotion';
import {z} from 'zod';
import {zColor} from '@remotion/zod-types';
import {px, seconds} from '../canvas';

export const myGraphicSchema = z.object({
  text: z.string(),
  color: zColor(),
});

export type MyGraphicProps = z.infer<typeof myGraphicSchema>;

export const myGraphicDefaults: MyGraphicProps = {
  text: 'Hello',
  color: '#f5f5f7',
};

export const MY_GRAPHIC_DURATION = seconds(3);

export const MyGraphic: React.FC<MyGraphicProps> = ({text, color}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const enter = spring({frame, fps, config: {damping: 200}, durationInFrames: seconds(0.8)});
  const exit = interpolate(frame, [durationInFrames - seconds(0.5), durationInFrames - 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{opacity: enter * (1 - exit)}}>
      <h1 style={{color, fontSize: px(80)}}>{text}</h1>
    </AbsoluteFill>
  );
};
```

2. Register it in [`src/Root.tsx`](src/Root.tsx):

```tsx
<Composition
  id="MyGraphic"                       // this is what you pass to `remotion render`
  component={MyGraphic}
  durationInFrames={MY_GRAPHIC_DURATION}
  {...CANVAS}                          // width, height, fps from canvas.ts
  schema={myGraphicSchema}
  defaultProps={myGraphicDefaults}
/>
```

It appears in the Studio immediately — no restart needed.

## Rendering

Replace `<id>` with a composition id (`TitleCard`, `LowerThird`, …).

**MP4** — the general-purpose export:

```bash
npx remotion render <id> out/<id>.mp4 --codec=h264 --crf=18
```

`--crf` is quality: lower is better, 18 is visually lossless, 23 is the default.

**Transparent ProRes 4444** — for overlays with a real alpha channel:

```bash
npx remotion render <id> out/<id>.mov --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png
```

All four flags matter: `prores` + `4444` gives you a codec that *can* store alpha,
`yuva444p10le` is the pixel format that actually keeps it, and `--image-format=png`
makes Remotion capture frames with transparency instead of flattening them to JPEG.
The composition also has to be transparent — no `backgroundColor` on the root
`AbsoluteFill`. See [`OverlayBadge.tsx`](src/compositions/OverlayBadge.tsx).

**PNG sequence** — maximum compatibility, per-frame alpha:

```bash
npx remotion render <id> out/<id>/frame-%04d.png --image-format=png
```

**Overriding props at render time** (handy for batching):

```bash
npx remotion render TitleCard out/ep01.mp4 --props='{"title":"Episode One"}'
```

**Rendering a single frame** as a still:

```bash
npx remotion still <id> out/<id>.png --frame=30
```

## Fonts and audio

A Google font is loaded in [`src/fonts.ts`](src/fonts.ts) — change the import path to
swap it:

```ts
import {loadFont} from '@remotion/google-fonts/Poppins';
```

Weights and subsets are narrowed there on purpose; loading the full family costs
~120 network requests on every render.

For a sound effect, drop the file in `public/audio/` and reference it with
`staticFile()`. Wrapping it in a `<Sequence>` controls *when* it starts:

```tsx
import {Audio, Sequence, staticFile} from 'remotion';
import {seconds} from '../canvas';

<Sequence from={seconds(0.2)}>
  <Audio src={staticFile('audio/whoosh.mp3')} volume={0.6} />
</Sequence>
```

There's a commented example in
[`KineticText.tsx`](src/compositions/KineticText.tsx). Audio is included in MP4
renders; ProRes and PNG-sequence exports are picture-only, so bring the audio into your
editor separately.

## Example: a fact-checked news explainer (`UpiMdrVideo`)

`src/compositions/UpiMdrVideo.tsx` is a complete 9-scene, 9:16, 74-second explainer
built on this starter — a working example of a real short-form deliverable, not a toy.
It's a fixed-format video (not resolution-flexible like the other four), so it keeps
its own design system in `src/compositions/upi-mdr/` instead of reading `canvas.ts`:

```
src/compositions/upi-mdr/
  facts.ts        every number/date used on screen, plus source notes — edit this,
                   not the scene files, when a figure changes
  theme.ts         1080×1920 @30fps, colors, safe areas, exit-curve helper
  icons.tsx        hand-drawn inline SVG icons (bank, shield, train, …) — no external
                   image files, transparent by construction
  types.ts         the zod schema shared by every scene
  scenes/           one file per scene, Scene1Hook.tsx … Scene9Conclusion.tsx
```

Render it like any other composition:

```bash
npx remotion render UpiMdrVideo out/UpiMdrVideo.mp4 --codec=h264 --crf=18
```

### `UpiByNumbers` — the companion scale story

`src/compositions/UpiByNumbers.tsx` (37s, 9:16) is a deliberately different
format: no photography, no cards, numbers as the hero. Where `UpiMdrVideo`
explains *what changed*, this one explains *why it costs anything to run* —
by showing the scale. Its config and seven beats live in
`src/compositions/upi-numbers/`. It shares the motion helpers in
`upi-mdr/motion.ts` so both videos move the same way, but keeps its own palette
(cyan/lime data accents) and layout language.

```bash
npx remotion render UpiByNumbers out/UpiByNumbers.mp4 --codec=h264 --crf=18
```

**Audio is not included.** No music or SFX file ships in this repo — inventing or
bundling copyrighted audio wasn't an option. Each scene's voiceover line and suggested
SFX are documented in the storyboard (see conversation history / your saved copy of it);
the cleanest way to add narration is to drop 9 timed audio files in `public/audio/` and
add one `<Sequence>` + `<Audio>` per scene inside `UpiMdrVideo.tsx`, using the same
`seconds()` offsets already used for each `Series.Sequence`.

If a fact in `facts.ts` changes before publishing (e.g. the government amends the
framework), update it there once — every scene re-renders with the new number
automatically, since nothing is hardcoded a second time.

## One video, every platform (`src/formats.ts`)

`UpiMdrVideo` is registered once per delivery shape, so the Studio sidebar
lists:

| Composition | Size | Ratio | Goes to |
| --- | --- | --- | --- |
| `UpiMdrVideo-landscape` | 1920×1080 | 16:9 | YouTube, X, LinkedIn, Facebook |
| `UpiMdrVideo-vertical` | 1080×1920 | 9:16 | YouTube Shorts, Instagram Reels, TikTok |
| `UpiMdrVideo-portrait` | 1080×1350 | 4:5 | Instagram feed, Facebook feed |
| `UpiMdrVideo-square` | 1080×1080 | 1:1 | Instagram, LinkedIn, Facebook |

Shorts, Reels and TikTok are all 1080×1920, so they share one render rather
than three identical ones.

**Export everything, including cover stills, with one command:**

```bash
npm run render:all
```

Or one shape at a time — `npm run render:16x9`, `render:9x16`, `render:4x5`,
`render:1x1` — and `npm run thumbnails` for cover frames only. For a 4K
YouTube master, add `--scale=2` to the landscape render.

### How one scene fits four shapes (`src/layout/useFrameLayout.ts`)

A 9:16 frame has 1920px of height to stack things in; 16:9 has 1080. A layout
that stacks a headline above three rows fits the first and overflows the
second, and scaling it down to fit just makes the type unreadable.

So the layout **rearranges instead of scaling**: the `a` and `b` slots stack
vertically in a tall frame and sit side by side in a wide one. A scene asks for
"block a" and "block b" and gets the right arrangement for whatever shape it's
rendering at.

The hand-tuned 9:16 positions are kept exactly as they were — each scene reads
`L.isVertical ? <the original numbers> : <a layout slot>`, so reframing for
landscape can never disturb the vertical master.

Safe areas come from the format too: the vertical shapes reserve the bottom
22% where the caption, handle and action rail sit, landscape only needs 10%.

## Look, grade and crop (`src/effects/`)

A grading stack sits above the whole video, the way it does at the top of a
timeline in a real editor. Open the **Look** and **Crop** tabs in the canvas
editor:

- **Grade presets** — Clean, Cinematic, Warm, Cool, Vivid, Noir, Vintage.
- **Adjust** — brightness, contrast, saturation, blur, vignette, film grain.
- **Crop / reframe** — zoom and pan, for when the subject doesn't land in the
  middle of every shape.

The grade is keyed on the video's base id, so it's **shared across all four
formats** — colour once, export everywhere. Position is per-format, because
that genuinely differs.

Grain is a baked noise tile that's *moved* per frame rather than regenerated:
`feTurbulence` is a per-pixel shader and re-running it across 2,300 frames is
genuinely slow, while shifting a tile reads the same and costs nothing.

## Upload extras (`src/overlays/`)

Toggled from the Studio props panel:

- **`showProgressBar`** — a thin progress bar. On short-form it tells a viewer
  the clip is nearly over, which holds retention through the last seconds.
  Sits at the top on vertical formats, since the bottom is under platform UI.
- **`watermarkText`** — your handle, placed inside the safe area.
- **`showSafeAreas`** — Studio-only guides marking where each platform's UI
  will cover the frame. The commonest way to ruin a vertical video is putting
  text where Instagram's caption will sit: invisible in the Studio, obvious
  once it's live.

## Editing layouts on the canvas (`src/editor/`)

Drag, resize and delete elements directly on the preview, instead of editing
coordinates in code. It works in any composition, not just this one.

**To use it:**

1. Run the Studio and the layout server side by side — the server is what makes
   edits survive a reload:

   ```bash
   npm run studio
   ```

   ```bash
   npm run layout-server
   ```

2. **Turn off Remotion's "Outlines" button** in the toolbar above the canvas.
   This matters. While Outlines is on, Studio draws an invisible overlay across
   every element with `pointerEvents: 'all'`, which swallows every click on the
   canvas — dragging silently does nothing, and a double-click gets read as
   "open this element's source file" instead. The editor detects this and shows
   a red warning on the canvas when it's blocked, so you're never left guessing.
3. Click the **⚙ Editor** tab on the right edge of the window to open the
   panel, then **Enter edit mode**.

   The panel is portalled outside the composition, so it never scales with the
   preview and its text stays crisp at any zoom. **Drag it by its header** to
   move it — Studio's own Inspector also docks to the right, so a fixed
   position would cover whichever one you needed. Use **⇤** / **⇥** to snap it
   to either edge and **×** to collapse it back to the tab. Position, open
   state and active tab are all remembered, and a position saved on a larger
   monitor is clamped back on screen rather than stranding the panel
   out of reach.
4. Click an element to select it, then drag its body to move it, drag a corner
   or edge handle to resize, or press <kbd>Delete</kbd> to remove it.
   <kbd>Esc</kbd> deselects.

Edits are written to `src/editor/layout.json`, keyed as
`${compositionId}.${elementId}`, and Remotion hot-reloads them like any other
source change. Renders read that same file, so what you arrange is what you
export. The editor UI itself is gated on `getRemotionEnvironment().isStudio`, so
none of it can ever appear in an exported video.

**To make a new composition editable:**

```tsx
<EditableCanvas compositionId="MyNewVideo" compositionWidth={1920}>
  <EditableBox id="scene1.title" rect={{x: 100, y: 100, width: 800, height: 200}}>
    ...your content...
  </EditableBox>
</EditableCanvas>
```

`rect` is the design-time default; once an element is moved, the saved override
wins. `id` only needs to be unique within its `compositionId`.

## Windows / OneDrive patches (`scripts/patch-remotion-windows.js`)

This project sits at a path with a space in it, inside OneDrive. Both break
Remotion on Windows in ways that look like unrelated bugs, so `postinstall`
patches two files in `node_modules` and prints what it did:

- **"Could not open the file in the editor."** Remotion checks every path
  against an anti-RCE whitelist before handing it to `cmd.exe`. That whitelist
  rejects spaces, so the request failed before an editor was ever launched. The
  patch tests the path with spaces swapped for underscores; every genuinely
  dangerous character is still rejected.
- **`EPERM: operation not permitted, symlink ...\public\...`** Every render
  copies `public/` to a temp dir, symlinking anything Node reports as a symlink.
  Inside OneDrive every file is a reparse point, which Node reports as a
  symlink — and creating real symlinks on Windows needs elevation, so renders
  died before starting. Marking files "always keep on this device" does *not*
  help; OneDrive keeps the reparse-point flag even when fully downloaded. The
  patch falls back to copying when the symlink can't be made.

If a future Remotion upgrade moves that code, the script fails loudly with the
file to re-check rather than silently doing nothing.

## Tips

- **Keep text in the title-safe area.** `TITLE_SAFE` (10% inset) and `ACTION_SAFE` (5%)
  are in `canvas.ts`. Text outside it gets cropped on some displays and collides with
  platform UI on social video.
- **Always give an animation a full enter and an exit.** If something is still moving on
  the last frame, it looks like a cut in an editor. Anchor exits to
  `durationInFrames - 1` rather than a fixed number, so they stay correct when you change
  a clip's length.
- **Trim leading silence on sound effects.** Most library SFX have 50–200ms of dead air
  at the head, which pushes the hit out of sync with the visual. Trim the file, or
  compensate with a negative offset on the `<Sequence from={...}>`.
- **Render a still first.** `npx remotion still` is much faster than a full render when
  you just want to check a frame.
- **Spring for entrances, `Easing.in` for exits.** Springs settle naturally on the way
  in; a spring on the way out tends to overshoot off-screen and look loose.
