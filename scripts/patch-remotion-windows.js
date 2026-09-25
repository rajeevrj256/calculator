// Two Windows/OneDrive-specific Remotion patches
// ===============================================
// This project lives at "...\OneDrive\Desktop\claude code remotion". That
// path has two properties Remotion doesn't handle on Windows: it contains a
// space, and it sits inside OneDrive. Each breaks a different feature, and
// both look like unrelated mystery bugs. Re-applied on `postinstall` so a
// reinstall doesn't silently bring them back.
//
// Run `node scripts/patch-remotion-windows.js` to apply by hand.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

/**
 * PATCH 1 — "Could not open the file in the editor."
 *
 * Remotion validates every path against WINDOWS_FILE_NAME_WHITELIST before
 * handing it to cmd.exe, because cmd.exe is vulnerable to RCE through
 * filenames containing shell metacharacters (`&`, `|`, `^`, ...). That
 * whitelist allows letters, digits, periods, dashes, slashes and underscores
 * — but NOT the space character.
 *
 * So every "open in editor" request (clicking an element on the canvas,
 * double-clicking an outline, the inspector's file link) failed the check and
 * the Studio reported a broken editor integration. The editor was never even
 * launched.
 *
 * Fix: run the whitelist against the path with spaces swapped for
 * underscores. A space is not a shell metacharacter — it cannot inject a
 * command, only split arguments, and Node quotes arguments containing spaces
 * when it builds the cmd.exe command line. Every genuinely dangerous
 * character is still rejected exactly as before, and the real, unmodified
 * filename is what gets passed to spawn().
 */
const editorPatch = {
  name: 'open-in-editor: allow spaces in the project path',
  file: path.join(
    root,
    'node_modules/@remotion/studio-server/dist/helpers/open-in-editor.js',
  ),
  find: 'WINDOWS_FILE_NAME_WHITELIST.test(fileName.trim())',
  replace:
    "WINDOWS_FILE_NAME_WHITELIST.test(fileName.trim().split(' ').join('_'))",
};

/**
 * PATCH 2 — "EPERM: operation not permitted, symlink ...\public\..."
 *
 * Every render bundles `public/` by copying it to a temp dir. copyDir()
 * symlinks any entry where `entry.isSymbolicLink()` is true.
 *
 * Inside OneDrive, every file is a reparse point (that's how Files On-Demand
 * works), and Node reports a reparse point as a symbolic link. So Remotion
 * tries to create a real symlink for each asset — and creating symlinks on
 * Windows requires elevation or Developer Mode, so it throws EPERM and the
 * render dies before it starts. Marking the files "always keep on this
 * device" does NOT help: OneDrive keeps the reparse-point flag even on fully
 * downloaded files.
 *
 * Fix: if creating the symlink fails, copy the file instead. Copying reads
 * straight through the placeholder, which is what we actually want for a
 * self-contained render bundle. Real symlinks on a normal filesystem still
 * take the symlink path exactly as before — the fallback only fires when
 * the symlink genuinely can't be made.
 */
const symlinkPatch = {
  name: 'bundler: copy OneDrive reparse points instead of symlinking them',
  file: path.join(root, 'node_modules/@remotion/bundler/dist/copy-dir.js'),
  find: 'await node_fs_1.default.promises.symlink(realpath, destPath);',
  replace:
    'await node_fs_1.default.promises.symlink(realpath, destPath).catch(() => node_fs_1.default.promises.copyFile(srcPath, destPath));',
};

let failed = false;

for (const patch of [editorPatch, symlinkPatch]) {
  if (!fs.existsSync(patch.file)) {
    console.log(`[patch-remotion] skip (not installed): ${patch.name}`);
    continue;
  }

  const source = fs.readFileSync(patch.file, 'utf8');

  if (source.includes(patch.replace)) {
    console.log(`[patch-remotion] already applied: ${patch.name}`);
    continue;
  }

  if (!source.includes(patch.find)) {
    // Remotion changed this code upstream. Say so unmissably — a silent no-op
    // reads as "the bug came back on its own" and costs a debugging session.
    console.error(
      `\n${'='.repeat(70)}\n` +
        `[patch-remotion] COULD NOT APPLY: ${patch.name}\n` +
        `  file: ${patch.file}\n` +
        '  Remotion likely changed this code in an upgrade.\n' +
        '  Expect the matching bug to return — see "Traps" in CLAUDE.md:\n' +
        '    · open-in-editor patch  -> "Could not open the file in the editor"\n' +
        '    · bundler symlink patch -> EPERM symlink ...\\public\\... on render\n' +
        `${'='.repeat(70)}\n`,
    );
    failed = true;
    continue;
  }

  fs.writeFileSync(patch.file, source.split(patch.find).join(patch.replace), 'utf8');
  console.log(`[patch-remotion] applied: ${patch.name}`);
}

// Exit 0 even on failure, deliberately. This runs as `postinstall`, and a
// non-zero exit there fails the whole `npm install` — leaving node_modules
// half-configured and blocking everything, over what is only an optional
// local workaround. The banner above is the signal; this is not fatal.
process.exit(0);
