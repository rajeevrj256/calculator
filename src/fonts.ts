import {loadFont} from '@remotion/google-fonts/Inter';

// Swap Inter for any Google font by changing the import path, e.g.
//   import {loadFont} from '@remotion/google-fonts/Poppins';
// Remotion waits for the font before rendering a frame, so text never flashes.
// Narrowing weights and subsets keeps renders fast — loading everything costs
// ~120 network requests per render.
const {fontFamily} = loadFont('normal', {
  weights: ['400', '600', '700'],
  subsets: ['latin'],
});

export const FONT_FAMILY = fontFamily;
