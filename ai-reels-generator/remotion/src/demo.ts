import type {CaptionGroup, Cut, Graphic, ReelProps, Scene} from './types';

// Sample props for Remotion Studio (`npm run studio`), so the Reel can be
// previewed without running the Python pipeline. No media: backgrounds use the
// gradient placeholder and there is no audio. Word timings are estimated.
//
// Figures are UN population estimates: 1 billion around 1804, 2.5 billion in
// 1950, 8 billion on 15 Nov 2022, and a projected peak of about 10.3 billion
// in the mid-2080s (World Population Prospects 2024).

const FPS = 30;
const SECONDS_PER_WORD = 0.34;
const PAD = 0.25;

const none: Graphic = {type: 'none', headline: '', label: '', points: []};

const SCRIPT: {narration: string; graphic: Graphic}[] = [
  {narration: 'There are eight billion of us now, and most of that happened really recently.', graphic: none},
  {
    narration: 'It took all of human history to reach one billion, around eighteen oh four.',
    graphic: {type: 'keyword', headline: '1 billion', label: 'Around 1804', points: []},
  },
  {
    narration: 'Then it doubled, and doubled again. We hit eight billion in twenty twenty two.',
    graphic: {
      type: 'chart',
      headline: '8x',
      label: 'World population',
      points: [
        {label: '1804', value: 1, display: '1B'},
        {label: '1927', value: 2, display: '2B'},
        {label: '1974', value: 4, display: '4B'},
        {label: '1999', value: 6, display: '6B'},
        {label: '2022', value: 8, display: '8B'},
      ],
    },
  },
  {
    narration: 'In nineteen fifty there were only about two and a half billion people.',
    graphic: {
      type: 'compare',
      headline: 'More than 3x',
      label: 'People on Earth',
      points: [
        {label: '1950', value: 2.5, display: '2.5B'},
        {label: '2022', value: 8, display: '8B'},
      ],
    },
  },
  {
    narration: 'But growth is slowing. The UN expects a peak around ten point three billion.',
    graphic: {type: 'stat', headline: '10.3 billion', label: 'Projected peak, mid-2080s', points: []},
  },
  {narration: 'Follow for part two, on where all those people actually live.', graphic: none},
];

const build = (): ReelProps => {
  const scenes: Scene[] = [];
  const cuts: Cut[] = [];
  const captions: CaptionGroup[] = [];
  let t = 0;
  SCRIPT.forEach(({narration, graphic}, i) => {
    const words = narration.split(' ');
    const duration = words.length * SECONDS_PER_WORD + PAD;
    scenes.push({start: t, duration, audio: null, graphic});
    const half = duration / 2;
    for (let j = 0; j < 2; j++) {
      cuts.push({
        src: '',
        start: t + j * half,
        duration: half,
        offset: 0,
        length: null,
        punchIn: (i + j) % 2 === 1,
        image: false,
      });
    }
    for (let k = 0; k < words.length; k += 3) {
      const chunk = words.slice(k, k + 3).map((w, n) => {
        const start = t + 0.05 + (k + n) * SECONDS_PER_WORD;
        return {text: w, start, end: start + SECONDS_PER_WORD * 0.9};
      });
      const next = k + 3 < words.length ? t + 0.05 + (k + 3) * SECONDS_PER_WORD : t + duration;
      captions.push({start: chunk[0].start, end: next, words: chunk});
    }
    t += duration;
  });
  return {title: '8 billion of us', fps: FPS, duration: t, scenes, cuts, captions, music: null, sfx: null};
};

export const demoProps: ReelProps = build();
