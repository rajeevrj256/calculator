# Project context for Claude

Remotion motion-graphics project. The main deliverable is `UpiMdrVideo`, a
fact-checked vertical news explainer about India's UPI MDR rule change,
rendered in four delivery shapes. There are also four small starter
compositions (TitleCard, LowerThird, KineticText, OverlayBadge) and a second
video, `UpiByNumbers`.

Read `README.md` for the full feature tour. This file is the short version
plus the things that are **not** obvious from the code and that have each cost
a debugging session already.

## Commands

```bash
npm run studio          # Remotion Studio on :3000
npm run layout-server   # MUST also be running for canvas edits to persist (:3999)
npm run render:all      # all 4 formats + cover stills into out/
npm run typecheck
```

`npm run layout-server` is not optional during editing. Without it the canvas
editor still moves things on screen, but every save silently fails.

## Architecture

- `src/formats.ts` — the four delivery shapes (16:9, 9:16, 4:5, 1:1) and their
  safe areas. `Root.tsx` registers `UpiMdrVideo-<format>` for each.
- `src/layout/useFrameLayout.ts` — the responsive layout engine. Slots `a`/`b`
  **stack** in tall frames and sit **side by side** in wide ones. Scenes ask
  for a slot; they never branch on pixel sizes themselves.
- `src/layout/Layer.tsx` — the named full-frame layer. Use this, never
  `AbsoluteFill` (see below).
- `src/editor/` — the click/drag/resize canvas editor, its floating panel, and
  the shared store that persists to `layout.json`.
- `src/effects/` — colour grading, film grain, vignette, reframe/crop.
- `src/overlays/` — progress bar, watermark, safe-area guides.
- `src/compositions/upi-mdr/` — the video: scenes, theme, motion helpers,
  narration timing.

## Traps — read before changing anything

**1. Never use `AbsoluteFill`. Use `Layer` from `src/layout/Layer.tsx`.**
A raw `AbsoluteFill` shows up in the Studio timeline as an unnamed
`<AbsoluteFill>` row, which the user has explicitly and repeatedly asked to be
rid of. `Sequence` already applies absolute-fill layout and accepts `style`, so
`Layer` *is* the layer — don't nest an `AbsoluteFill` inside it, that just adds
a second row.

**2. This project is inside OneDrive, at a path containing a space.**
Both break Remotion on Windows, and `scripts/patch-remotion-windows.js` patches
`node_modules` on `postinstall` to fix them:
- The space fails Remotion's anti-RCE path whitelist, so every "open in editor"
  request dies before an editor is launched.
- OneDrive marks every file a reparse point, which Node reports as a symlink,
  so the bundler tries to create real symlinks for `public/` and renders fail
  with `EPERM`. Pinning files "always keep on this device" does **not** help.

If either symptom returns after an `npm install`, run that script and read its
output — it fails loudly if Remotion moved the code it patches.

**3. Studio's "Outlines" toggle eats every click on the canvas.**
It draws an SVG overlay with `pointerEvents: 'all'` over each element. While
it's on, the canvas editor cannot select or drag anything, and a double-click
is read as "open this element's source". It's Studio chrome, outside our React
tree, so it cannot be out-ranked — it has to be switched off. The editor panel
detects this and says so rather than appearing broken.

**4. `defaultProps` must be an inline object literal to be savable.**
Studio's codemod (`extractStaticDefaultPropValue`) has no `Identifier` case, so
`defaultProps={someVariable}` can never be written back from the Props panel.
Only the base `UpiMdrVideo` composition in `Root.tsx` has the inline literal;
the four format compositions use `upiMdrDefaults` and cannot save.
**Open question the user has not yet answered:** whether to keep that base
composition (it duplicates `-vertical`) or drop it and edit `upiMdrDefaults`
directly. Don't restructure this unprompted.

**5. `isVertical` ≠ `isVerticalMaster`.**
4:5 is "vertical" by aspect but only 1350px tall. Scene code keeps its
hand-tuned absolute positions **only** for `isVerticalMaster` (exactly
1080×1920) and uses layout slots everywhere else. Using `isVertical` there puts
blocks off the bottom of the 4:5 frame.

**6. Editor chrome must be gated on `getRemotionEnvironment().isStudio`.**
Anything drawn unguarded gets burned into the exported video. This has happened
once already. After touching the editor, render a still and *look at it*.

**7. Measuring the canvas scale: use `getBoundingClientRect`, not
`ResizeObserver`.** Studio scales the composition with a CSS transform on an
ancestor, which never changes the layout box — so a ResizeObserver fires once
at mount (before the pane is sized, giving 0) and never again. That stale value
fed `delta / scale` and made dragging appear completely broken.

**8. `layout.json` is editor state, not source.**
Keys are `${compositionId}.${elementId}` (per format, so reframing 9:16 doesn't
disturb 16:9), except the look, which is `${baseId}.__look` (shared across all
formats — grade once, export everywhere). Writes are debounced 350ms because
each one triggers a hot reload.

## Content rules for `UpiMdrVideo`

The figures in it were fact-checked against NPCI / Finance Ministry sources.
`src/compositions/upi-mdr/facts.ts` is kept as the research record, including
`UNVERIFIED_CLAIMS` — a stat that was deliberately **excluded** for mixed
attribution. The user's standing instruction is accuracy over speed: do not
invent or adjust a figure to make a scene work, and stop and ask if a source
can't be confirmed.

Narration in `public/audio/vo-1..9.wav` is real (Windows SAPI, see
`scripts/generate-vo-one.ps1`). Scene durations are derived from the measured
length of each clip, so changing narration means re-measuring.

## Style

The user has global motion-graphics preferences in `~/.claude/CLAUDE.md`
(animation, pacing, readability, export). They apply here too. Beyond that:
they want things verified, not asserted — render a still and check it rather
than claiming something works.
