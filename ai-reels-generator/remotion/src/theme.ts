import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/noto-sans-devanagari/800.css';
import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';

export const COLORS = {
  accent: '#FFD60A',
  up: '#3DDC84',
  down: '#FF5A5F',
  text: '#FFFFFF',
  ink: '#0B0B0F',
  card: 'rgba(10, 10, 16, 0.80)',
};

// Montserrat for Latin text, Noto Sans Devanagari for Hindi.
export const FONT = '"Montserrat", "Noto Sans Devanagari", sans-serif';

// Thick black outline + soft drop shadow so text reads on any footage.
export const OUTLINE = [
  '0 0 3px #000',
  '5px 5px 0 #000',
  '-5px -5px 0 #000',
  '5px -5px 0 #000',
  '-5px 5px 0 #000',
  '0 5px 0 #000',
  '0 -5px 0 #000',
  '5px 0 0 #000',
  '-5px 0 0 #000',
  '0 10px 28px rgba(0,0,0,0.55)',
].join(', ');

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Hold every frame until the fonts are ready, so no frame renders in a fallback font.
export const useFonts = () => {
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => {
    Promise.all(
      ['900 80px Montserrat', '800 40px Montserrat', '800 40px "Noto Sans Devanagari"'].map((f) => document.fonts.load(f)),
    )
      .catch(() => undefined)
      .finally(() => continueRender(handle));
  }, [handle]);
};

// Largest font size (up to `max`) that fits `text` on one line within `width` px.
export const fitSize = (text: string, max: number, width: number) =>
  Math.min(max, Math.floor(width / (Math.max(text.length, 1) * 0.66)));

type ParsedNumber = {prefix: string; value: number; decimals: number; suffix: string; grouping: boolean; indian: boolean};

// "₹1,52,670" -> {prefix: "₹", value: 152670, ...} so the number can count up.
export const parseNumber = (s: string): ParsedNumber | null => {
  const m = s.match(/^(.*?)(-?\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const raw = m[2];
  return {
    prefix: m[1],
    value: parseFloat(raw.replace(/,/g, '')),
    decimals: raw.includes('.') ? raw.split('.')[1].length : 0,
    suffix: m[3],
    grouping: raw.includes(','),
    indian: /₹|rs\.?|lakh|crore/i.test(s) || /\d,\d\d,\d{3}/.test(raw),
  };
};

export const formatNumber = (n: number, p: ParsedNumber) =>
  p.prefix +
  n.toLocaleString(p.indian ? 'en-IN' : 'en-US', {
    minimumFractionDigits: p.decimals,
    maximumFractionDigits: p.decimals,
    useGrouping: p.grouping,
  }) +
  p.suffix;
