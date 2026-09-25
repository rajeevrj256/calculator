// Props the Python pipeline passes to the "Reel" composition (reelgen/video.py).
// All times are in seconds from the start of the video; file paths are relative
// to the render's public dir (the video's working folder).

export type Word = {text: string; start: number; end: number};

export type CaptionGroup = {start: number; end: number; words: Word[]};

export type Cut = {
  src: string; // "" = animated gradient placeholder (no footage available)
  start: number;
  duration: number;
  offset: number; // where to start inside the source clip
  length: number | null; // source clip length, null for still images
  punchIn: boolean;
  image: boolean;
};

export type Point = {label: string; value: number; display: string};

export type Graphic = {
  type: 'none' | 'stat' | 'chart' | 'compare' | 'keyword';
  headline: string;
  label: string;
  points: Point[];
};

export type Scene = {start: number; duration: number; audio: string | null; graphic: Graphic};

export type ReelProps = {
  title: string;
  fps: number;
  duration: number;
  scenes: Scene[];
  cuts: Cut[];
  captions: CaptionGroup[];
  music: string | null;
  // Short sound effects synced to scene changes and graphic entrances; null = silent.
  sfx: {whoosh: string; pop: string} | null;
};
