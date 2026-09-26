import vo1 from './vo-1.json';
import vo2 from './vo-2.json';
import vo3 from './vo-3.json';
import vo4 from './vo-4.json';
import vo5 from './vo-5.json';
import vo6 from './vo-6.json';
import vo7 from './vo-7.json';
import vo8 from './vo-8.json';
import vo9 from './vo-9.json';

/**
 * Word-level timing captured live from Windows SAPI's SpeakProgress event
 * during synthesis (see scripts/generate-vo-one.ps1) — these are the real
 * per-word offsets into each vo-N.wav file, not estimates.
 *
 * SAPI fires a duplicate progress event for some normalized tokens (numbers,
 * abbreviations) — "October 15th" or "2,000" each appear twice, once for the
 * written form and once for the spoken form. We keep the later timestamp,
 * since that consistently lines up with the audible word in testing.
 */

type RawWord = {text: string; startMs: number};
type RawScene = {scene: number; text: string; words: RawWord[]};

export type CaptionWord = {text: string; startMs: number; endMs: number};
export type SceneCaptions = {text: string; words: CaptionWord[]; durationMs: number};

// Measured with `remotion ffprobe` after generation — see conversation notes.
// These drive each scene's duration in UpiMdrVideo.tsx, so audio is never cut.
const DURATIONS_MS: Record<number, number> = {
  1: 6510,
  2: 6040,
  3: 3830,
  4: 12150,
  5: 7730,
  6: 10300,
  7: 8400,
  8: 9640,
  9: 6710,
};

const dedupe = (words: RawWord[]): RawWord[] => {
  const out: RawWord[] = [];
  for (const w of words) {
    const prev = out[out.length - 1];
    if (prev && prev.text === w.text) {
      prev.startMs = w.startMs; // keep the later timestamp for the repeated token
      continue;
    }
    out.push({...w});
  }
  return out;
};

const build = (raw: RawScene): SceneCaptions => {
  const words = dedupe(raw.words);
  const durationMs = DURATIONS_MS[raw.scene];

  // SAPI's AudioPosition is an internal-clock estimate, not a readback of the
  // written WAV — on longer lines it drifts increasingly ahead of the file's
  // real, measured duration (on the 10.3s scene 6 clip, the last word claims
  // to start 2.3s after the audio actually ends). Clamping would just bunch
  // every late word into the final few milliseconds, wrecking the karaoke
  // timing. Instead, rescale every timestamp proportionally so the last word
  // lands at ~90% through the clip, and everything before it redistributes
  // in between — same relative spacing, corrected absolute scale.
  const lastRawStart = words.length > 0 ? words[words.length - 1].startMs : 0;
  const scale = lastRawStart > 0 ? (durationMs * 0.9) / lastRawStart : 1;

  const scaled = words.map((w) => ({text: w.text, startMs: Math.round(w.startMs * scale)}));

  return {
    text: raw.text,
    durationMs,
    words: scaled.map((w, i) => ({
      text: w.text,
      startMs: w.startMs,
      endMs: i + 1 < scaled.length ? scaled[i + 1].startMs : durationMs,
    })),
  };
};

export const CAPTIONS: Record<number, SceneCaptions> = {
  1: build(vo1 as RawScene),
  2: build(vo2 as RawScene),
  3: build(vo3 as RawScene),
  4: build(vo4 as RawScene),
  5: build(vo5 as RawScene),
  6: build(vo6 as RawScene),
  7: build(vo7 as RawScene),
  8: build(vo8 as RawScene),
  9: build(vo9 as RawScene),
};

/** Frame count (at the given fps) for each scene's audio, plus a small tail
 *  buffer so the exit animation always has room after the last word. */
export const audioDurationFrames = (scene: number, fps: number, tailFrames = 20) =>
  Math.round((CAPTIONS[scene].durationMs / 1000) * fps) + tailFrames;

/** Frame at which a given word starts, for triggering something exactly when
 *  it's spoken (e.g. Scene 5's icon reveals). Falls back to null if not found. */
export const wordFrame = (scene: number, matchText: string, fps: number): number | null => {
  const w = CAPTIONS[scene].words.find((word) => word.text.toLowerCase().includes(matchText.toLowerCase()));
  return w ? Math.round((w.startMs / 1000) * fps) : null;
};
