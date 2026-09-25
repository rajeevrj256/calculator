import {z} from 'zod';
import {zColor} from '@remotion/zod-types';

export const upiMdrSchema = z.object({
  // Facts (defaults come from facts.ts — change them there, not here)
  effectiveDate: z.string(),
  standardRateLabel: z.string(),
  merchantFreeThreshold: z.number(),
  exampleAmount: z.number(),
  exampleMdr: z.number(),
  capAmount: z.number(),
  capThreshold: z.number(),
  smallMerchantMonthlyLimit: z.number(),
  specialCategoryFlatFee: z.number(),

  // Photographs — paths inside public/. Empty string renders a placeholder.
  imageScanQr: z.string(),
  imageMerchantCounter: z.string(),
  imageStreetVendor: z.string(),
  imageCashlessPay: z.string(),

  // Narration (audio/vo-1..9.wav) is real and generated — see components/Sfx.tsx
  enableAudio: z.boolean(),
  // Whoosh/tap/success/music cues are wired but no files exist for them yet;
  // this stays false until you drop real SFX/music into public/audio/.
  enableSfx: z.boolean(),

  // Upload extras. These sit above the colour grade, because a watermark or a
  // progress bar belongs to the upload rather than to the photography.
  /** Thin progress bar — holds retention through the last seconds on Shorts. */
  showProgressBar: z.boolean(),
  /** Your handle, e.g. "@yourchannel". Empty string hides it. */
  watermarkText: z.string(),
  /** Studio-only overlay marking where platform UI will cover the frame. */
  showSafeAreas: z.boolean(),

  // Brand
  backgroundColor: zColor(),
  accentColor: zColor(),
  successColor: zColor(),
  warningColor: zColor(),
  textColor: zColor(),

  /**
   * Every line of on-screen copy, editable from the Studio's right-hand props
   * panel without touching code. Grouped so the panel shows one collapsible
   * "copy" section rather than 20 loose fields.
   *
   * Note this is the *on-screen* text only — the narration is baked into the
   * .wav files, so editing a line here changes what's read on screen but not
   * what's spoken. Re-run scripts/generate-vo-one.ps1 to change the voice.
   */
  copy: z.object({
    s1Tagline: z.string(),
    s2Label: z.string(),
    s2Headline: z.string(),
    s2Question: z.string(),
    s3Line1: z.string(),
    s3Line2: z.string(),
    s4Headline: z.string(),
    s4RowFriend: z.string(),
    s5Label: z.string(),
    s5Headline: z.string(),
    s5Tail: z.string(),
    s6Label: z.string(),
    s7Label: z.string(),
    s7Headline: z.string(),
    s8Label: z.string(),
    s8Headline: z.string(),
    s8Tail: z.string(),
    s9Pill: z.string(),
    s9Line1: z.string(),
    s9Line2: z.string(),
    s9Line2Accent: z.string(),
  }),
});

export type UpiMdrProps = z.infer<typeof upiMdrSchema>;

/** Every scene receives the full prop set plus how many frames it owns. */
export type SceneProps = UpiMdrProps & {duration: number};
