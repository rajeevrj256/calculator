// OneDrive fix for Remotion renders on Windows (runs on `postinstall`).
//
// Every render copies the public dir (here: the video's working folder) into
// a temp bundle, and Remotion symlinks any entry that Node reports as a
// symbolic link. Inside OneDrive every file is a reparse point, which Node
// reports as a symlink, so Remotion tries to create real symlinks — that needs
// admin rights or Developer Mode on Windows, and the render dies with
// "EPERM: operation not permitted, symlink ...". Marking files "always keep on
// this device" does not help.
//
// Fix: if the symlink can't be made, copy the file instead. Real symlinks on a
// normal filesystem still take the symlink path exactly as before.
//
// Run `node scripts/patch-remotion-windows.js` to apply by hand.

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'node_modules/@remotion/bundler/dist/copy-dir.js');
const find = 'await node_fs_1.default.promises.symlink(realpath, destPath);';
const replace =
  'await node_fs_1.default.promises.symlink(realpath, destPath).catch(() => node_fs_1.default.promises.copyFile(srcPath, destPath));';

if (!fs.existsSync(file)) {
  console.log('[patch-remotion] skip: @remotion/bundler not installed');
} else {
  const source = fs.readFileSync(file, 'utf8');
  if (source.includes(replace)) {
    console.log('[patch-remotion] already applied');
  } else if (!source.includes(find)) {
    // Remotion changed this code upstream. Say so loudly: a silent no-op reads
    // as "renders randomly fail with EPERM inside OneDrive".
    console.error(
      `\n${'='.repeat(70)}\n[patch-remotion] COULD NOT APPLY the OneDrive symlink fix\n  file: ${file}\n` +
        '  Remotion likely changed this code. Renders from a OneDrive folder may\n' +
        '  fail with "EPERM ... symlink"; set REEL_OUTPUT_DIR outside OneDrive.\n' +
        `${'='.repeat(70)}\n`,
    );
  } else {
    fs.writeFileSync(file, source.split(find).join(replace), 'utf8');
    console.log('[patch-remotion] applied: copy OneDrive reparse points instead of symlinking them');
  }
}

// Exit 0 even on failure: a non-zero postinstall fails the whole npm install
// over what is only a local workaround. The banner above is the signal.
process.exit(0);
