import {Config} from '@remotion/cli/config';

// Defaults for `npx remotion render`. Every one of these can be overridden
// per-render with a CLI flag, which is what the transparent-export command does.
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(null); // null = use all available cores

// Without this, Studio's "click element → open in editor" falls back to
// asking Windows which known editor process is *currently running* — it
// silently fails if VS Code isn't already open, which looks identical to a
// real bug. Pinning the editor explicitly skips that flaky detection and
// uses VS Code's real install path directly, every time, in every browser
// window pointed at this project.
Config.setDefaultEditor('vscode');
