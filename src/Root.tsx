import React from 'react';
import {Composition} from 'remotion';
import {CANVAS} from './canvas';
import {
  TitleCard,
  titleCardSchema,
  titleCardDefaults,
  TITLE_CARD_DURATION,
} from './compositions/TitleCard';
import {
  LowerThird,
  lowerThirdSchema,
  lowerThirdDefaults,
  LOWER_THIRD_DURATION,
} from './compositions/LowerThird';
import {
  KineticText,
  kineticTextSchema,
  kineticTextDefaults,
  KINETIC_TEXT_DURATION,
} from './compositions/KineticText';
import {
  OverlayBadge,
  overlayBadgeSchema,
  overlayBadgeDefaults,
  OVERLAY_BADGE_DURATION,
} from './compositions/OverlayBadge';
import {
  UpiMdrVideo,
  upiMdrSchema,
  upiMdrDefaults,
  UPI_MDR_DURATION,
} from './compositions/UpiMdrVideo';
import {WIDTH as UPI_MDR_WIDTH, HEIGHT as UPI_MDR_HEIGHT, FPS as UPI_MDR_FPS} from './compositions/upi-mdr/theme';
import {
  UpiByNumbers,
  upiByNumbersSchema,
  upiByNumbersDefaults,
  UPI_NUMBERS_DURATION,
} from './compositions/UpiByNumbers';
import {WIDTH as NUM_W, HEIGHT as NUM_H, FPS as NUM_FPS} from './compositions/upi-numbers/config';
import {FORMATS, FORMAT_IDS, formatCompositionId} from './formats';

/**
 * Every graphic is registered here. The `id` is what you pass to
 * `npx remotion render <id>`.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TitleCard"
        component={TitleCard}
        durationInFrames={TITLE_CARD_DURATION}
        {...CANVAS}
        schema={titleCardSchema}
        defaultProps={titleCardDefaults}
      />
      <Composition
        id="LowerThird"
        component={LowerThird}
        durationInFrames={LOWER_THIRD_DURATION}
        {...CANVAS}
        schema={lowerThirdSchema}
        defaultProps={lowerThirdDefaults}
      />
      <Composition
        id="KineticText"
        component={KineticText}
        durationInFrames={KINETIC_TEXT_DURATION}
        {...CANVAS}
        schema={kineticTextSchema}
        defaultProps={kineticTextDefaults}
      />
      <Composition
        id="OverlayBadge"
        component={OverlayBadge}
        durationInFrames={OVERLAY_BADGE_DURATION}
        {...CANVAS}
        schema={overlayBadgeSchema}
        defaultProps={overlayBadgeDefaults}
      />
      <Composition
        id="UpiMdrVideo"
        component={UpiMdrVideo}
        durationInFrames={UPI_MDR_DURATION}
        width={UPI_MDR_WIDTH}
        height={UPI_MDR_HEIGHT}
        fps={UPI_MDR_FPS}
        schema={upiMdrSchema}
        // Inlined on purpose, not `defaultProps={upiMdrDefaults}`: Remotion
        // Studio's "Save default props" codemod only understands an object
        // literal written directly in this JSX attribute — a reference to an
        // imported variable (however literal its own contents) can't be
        // statically resolved, which is why edits in the Props panel
        // couldn't be saved before this. Keep this in sync with
        // upiMdrDefaults in UpiMdrVideo.tsx (used by UpiMdrVideo1 below) if
        // you change one, change both — or better, just edit here via the
        // Studio, which keeps this copy authoritative.
        defaultProps={{"effectiveDate":"October 15, 2026","standardRateLabel":"0.4%","merchantFreeThreshold":2000,"exampleAmount":5000,"exampleMdr":20,"capAmount":300,"capThreshold":75000,"smallMerchantMonthlyLimit":100000,"specialCategoryFlatFee":5,"imageScanQr":"images/scan-qr.jpg","imageMerchantCounter":"images/merchant-counter.jpg","imageStreetVendor":"images/street-vendor.jpg","imageCashlessPay":"images/cashless-pay.jpg","enableAudio":true,"enableSfx":false,"showProgressBar":true,"watermarkText":"","showSafeAreas":false,"backgroundColor":"#0b0f18","accentColor":"#4f7cf7","successColor":"#2fbf6a","warningColor":"#e0524a","textColor":"#f5f7fa","copy":{"s1Tagline":"Two seconds. No fee.","s2Label":"UPI UPDATE","s2Headline":"A new rule is making headlines","s2Question":"So — is UPI still free?","s3Line1":"Is UPI becoming","s3Line2":"a paid app?","s4Headline":"A fee applies only above","s4RowFriend":"Paying a friend","s5Label":"Merchant Discount Rate","s5Headline":"MDR is not a tax","s5Tail":"Not collected by the government.","s6Label":"On an eligible merchant payment","s7Label":"Who stays free","s7Headline":"Small vendors\npay nothing","s8Label":"Why charge at all","s8Headline":"Running UPI\ncosts money","s8Tail":"You never see the charge.","s9Pill":"Still free for almost everyone","s9Line1":"Same UPI. New question.","s9Line2":"Who should pay","s9Line2Accent":"for free?"}}}
      />
      {/* The same video in every shape a platform asks for.
          Each is its own composition, so each keeps its own saved arrangement
          — reframing the 9:16 cut never disturbs the 16:9 one — while the
          colour grade is shared, keyed on the base id. */}
      {FORMAT_IDS.map((formatId) => {
        const f = FORMATS[formatId];
        return (
          <Composition
            key={formatId}
            id={formatCompositionId('UpiMdrVideo', formatId)}
            component={UpiMdrVideo}
            durationInFrames={UPI_MDR_DURATION}
            width={f.width}
            height={f.height}
            fps={UPI_MDR_FPS}
            schema={upiMdrSchema}
            defaultProps={upiMdrDefaults}
          />
        );
      })}
      <Composition
        id="UpiByNumbers"
        component={UpiByNumbers}
        durationInFrames={UPI_NUMBERS_DURATION}
        width={NUM_W}
        height={NUM_H}
        fps={NUM_FPS}
        schema={upiByNumbersSchema}
        defaultProps={upiByNumbersDefaults}
      />
    </>
  );
};
