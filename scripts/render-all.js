#!/usr/bin/env node
/**
 * Render one video in every delivery shape, plus a thumbnail still.
 *
 *   node scripts/render-all.js                    # all shapes of UpiMdrVideo
 *   node scripts/render-all.js UpiMdrVideo        # same, explicit
 *   node scripts/render-all.js UpiMdrVideo 9x16   # just one shape
 *   node scripts/render-all.js --thumb            # thumbnail stills only
 *
 * Renders run one after another rather than in parallel on purpose: Remotion
 * already uses every core for a single render, so running four at once makes
 * each one roughly four times slower and risks running the machine out of
 * memory on the 1920x1080 pass.
 */

const {spawnSync} = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.join(__dirname, '..');
const ENTRY = 'src/index.ts';
const OUT = path.join(ROOT, 'out');

// Mirrors src/formats.ts. Kept as plain data here because this script runs in
// Node, before any TypeScript is compiled.
const FORMATS = [
  {id: 'landscape', alias: '16x9', label: 'YouTube / X / LinkedIn', w: 1920, h: 1080},
  {id: 'vertical', alias: '9x16', label: 'Shorts / Reels / TikTok', w: 1080, h: 1920},
  {id: 'portrait', alias: '4x5', label: 'Instagram feed', w: 1080, h: 1350},
  {id: 'square', alias: '1x1', label: 'Instagram / LinkedIn square', w: 1080, h: 1080},
];

const args = process.argv.slice(2);
const thumbsOnly = args.includes('--thumb');
const positional = args.filter((a) => !a.startsWith('--'));
const baseId = positional[0] || 'UpiMdrVideo';
const only = positional[1];

const selected = only
  ? FORMATS.filter((f) => f.id === only || f.alias === only)
  : FORMATS;

if (selected.length === 0) {
  console.error(
    `Unknown format "${only}". Use one of: ${FORMATS.map((f) => `${f.id} (${f.alias})`).join(', ')}`,
  );
  process.exit(1);
}

fs.mkdirSync(OUT, {recursive: true});

const run = (label, cmdArgs) => {
  process.stdout.write(`\n[1m${label}[0m\n`);
  const res = spawnSync('npx', ['remotion', ...cmdArgs], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
  });
  if (res.status !== 0) {
    console.error(`[31mFailed: ${label}[0m`);
    return false;
  }
  return true;
};

const outputsPerFormat = thumbsOnly ? 1 : 2;
console.log(
  `\n[1m${baseId}[0m → ${selected.length} format(s), ` +
    `${selected.length * outputsPerFormat} file(s) into out/\n` +
    selected.map((f) => `  · ${f.alias.padEnd(5)} ${f.w}x${f.h}  ${f.label}`).join('\n') +
    (thumbsOnly
      ? '\n'
      : '\n\nFull renders run one at a time (Remotion already uses every core for' +
        '\none render). A ~78s 1080p clip takes several minutes each — progress' +
        '\nbars below are Remotion, not this script.\n'),
);

const results = [];

for (const f of selected) {
  const compId = `${baseId}-${f.id}`;

  if (!thumbsOnly) {
    const outFile = path.join('out', `${baseId}-${f.alias}.mp4`);
    const ok = run(
      `Rendering ${f.alias} (${f.w}x${f.h}) — ${f.label}`,
      [
        'render',
        ENTRY,
        compId,
        outFile,
        '--codec=h264',
        // crf 18 is visually lossless at these sizes and still uploads fast.
        '--crf=18',
        // Deliberately NOT --log=error. A 78-second 1920x1080 render takes
        // many minutes, and at the 'error' level Remotion prints nothing at
        // all while it works — the terminal shows one heading and then sits
        // there, which is indistinguishable from a hang. The default level
        // prints the bundling and frame-by-frame progress bars.
      ],
    );
    results.push({what: outFile, ok});
  }

  // A cover frame for each shape. Frame 850 sits mid-scene-4, where the
  // headline and both rows are on screen — a readable still rather than a
  // mid-transition blur.
  const thumbFile = path.join('out', `${baseId}-${f.alias}-thumb.png`);
  const okThumb = run(`Thumbnail ${f.alias}`, [
    'still',
    ENTRY,
    compId,
    thumbFile,
    '--frame=850',
  ]);
  results.push({what: thumbFile, ok: okThumb});
}

console.log('\n[1mSummary[0m');
for (const r of results) {
  console.log(`  ${r.ok ? '[32m✓[0m' : '[31m✗[0m'} ${r.what}`);
}

const failed = results.filter((r) => !r.ok).length;
if (failed > 0) {
  console.error(`\n${failed} output(s) failed.`);
  process.exit(1);
}
console.log(`\nAll done — files are in ${OUT}`);
