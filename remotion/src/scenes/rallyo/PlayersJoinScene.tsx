import type React from "react";
import { Img, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { Highlighter, RoughRing, RoughUnderline } from "../../elements/Annotate";
import { CameraRig, rectToTransform, type CameraMove, type CameraTransform } from "../../elements/CameraRig";
import { KineticText } from "../../elements/KineticText";
import { PhoneFrame, phonePlacement } from "../../elements/PhoneFrame";
import { ScreenImage, ScreenSwipe } from "../../elements/ScreenMedia";
import { Stage } from "../../layers/Stage";
import { asset } from "../../lib/assets";
import { displayText, RALLYO_COLORS, uiText, type RallyoColors } from "../../theme/rallyo";

/**
 * S10b · Join + pay: "JOIN, PAY THE HOST." + "GCash or cash." (abs 1110–1215, 105 f). Players spec
 * (briefs/rallyo-players-chapter.md) section 4 S10b. Local frame = abs − 1110. In: `slide` from-right (the
 * `Request to join →` direction). Out: `wipe` from-left (FRONT) at local 90. The camera rects and k values in the list
 * below are the draft-v4 build; the "Draft v5" block after it replaces them (timing and callouts are unchanged).
 *
 * - 0–45   The request sheet as a static `ScreenImage sourceH 4836 boxH 2532 cropY 2304` (the sheet's bottom = the
 *          screen's bottom; window y = page y − 2304). Camera on the pay block: page x 48–1122, y 3840–4400 (window
 *          1536–2096) → frame x 92–890, y 600–1016 (k .743), drifting 1% about the cash note (0–45, linear). In frame:
 *          `How will you pay?`, `₱600 per team`, the preselected `Cash · Pay at the venue` card and the note "Bring ₱600
 *          in cash. The host collects it when you check in." Lower stage: soft focus (σ 12 canvas px + 30% night)
 *          from page y 4405 (window 2101, frame 1020): the footer with the seed host's name (twice) and the
 *          `Send request` band are soft shapes, never readable; the sheet runs to the screen's real bottom at frame
 *          1340 (bezel ≈ 1350). `Send request` is never pressed.
 * - 6 / 8 / 10 / 12  headline `JOIN,` / `PAY THE HOST.` words → landed 21 · 18 / 20 / 22 support words → landed 31.
 * - 24–36  lime-tint Highlighter (multiply) behind note line 1 (page x 93–989, y 4257–4296); 30–39 line 2
 *          `check in.` (page x 91–251, from y 4314; the same band height as line 1).
 * - 45–57  ScreenSwipe from-bottom to the GCash receipt (pay-gcash-receipt.png, sourceH 1200); the camera moves over
 *          the same 12 f to source x 48–1122, y 390–1010 → frame x 92–890, y 610–1071 (k .743). A paper patch over
 *          receipt rows 150–395 hides the when-line (blurred venue + the seed host's name) and the event title while
 *          they streak past in the swipe (both sit above the clip at rest). Lower stage (open item 5):
 *          soft focus from receipt row 1040 (`REQUEST NO.`), and the sheet's own paper carries on under the file's end
 *          (row 1200, frame 1212; the file cannot be served taller, its next rows are the attached receipt image),
 *          soft and deepening from 30% (at `REQUEST NO.`) through 48% (the table's soft foot, under the rail) to 62% night
 *          (craft #3: the rail rests on calm grey, not a bright slab), feathered
 *          out by frame ≈ 1480: the phone's paper screen runs into
 *          the Stage fade, never a hard crop edge or flat night under the table.
 * - 57–105 hold drift 1.5% by local 90 about (491, 840), running on at the same rate under the wipe.
 * - 66–75  night-ink RoughRing (padding 10 px) on `GCash` (source x 373–501, y 674–705).
 * - 75–84  night-ink RoughUnderline under `Confirmed by host` (source x 373–734, y 896–936): the line sits in the
 *          13-row gap between the line's descender (936) and the wrapped `PM` (cap top 950), touching neither.
 * - 90–105 wipe out (transition).
 *
 * Draft v5 (v4 accuracy #2 MAJOR, craft #2): bigger proofs and a lit lower stage. Timing, copy and callout frames are
 * unchanged; only the camera rects, the soft-focus / stroke sizes and the floor reflection change.
 * - Camera A (0–21, the slide lands on it): the same pay block, page x 48–1122, y 3840–4400 → frame x 70–918, y 600–1042
 *   (k .789, was .743). `How will you pay?` and `₱600 per team` ink at x 72–915 (the headline's x 72 left edge), inside
 *   the 65–918 safe box. Drift 1%.
 * - Camera B (punch-in 21–33, ×1.19, while the highlighter draws; the S9 / S10a pattern): the Cash card and the note,
 *   page y 3978–4394 → frame y 598–989, note line 1 ink (page x 93–989) → frame x 72–914 (k .940, note x-height
 *   ≈ 19 px, was ≈ 15; the highlighter band x 68–918). The question + price row dissolves to paper over 24–27
 *   (PRICE_ROW_PATCH) before the push carries it into the top fade; at rest its ink would end at frame ≤ 568. Drift .5%
 *   to 45. The screen's bottom lands at frame ≈ 1404 (bezel ≈ 1426).
 * - Camera R (swipe 45–57, k .94 → .92, almost a pure pan): receipt labels (x 91) → frame x 72, rows 402–980 → frame
 *   y 572–1104 (`GCash` ring and `Confirmed by host` underline x 333–665, x-height ≈ 19 px, was ≈ 15); `PM` ends at
 *   frame 1104, 66 px above the pill. Drift 1.5% by 90 about (491, 960).
 * - Floor reflection (the S3 camera-B pattern): the phone body's bottom 12% mirrors under the bezel at .6 → 0, under the
 *   Stage scrim, so the pay sheet's lower stage is device imagery to ≈ 1500 instead of night from ≈ 1357.
 * - At k .94 the screen spans the canvas width: the Stage side fades go to full night (sideOpacity 1), so the paper
 *   feathers into night at both frame edges (no grey slab at x 0–24 / 1056–1080).
 * - Soft focus keeps its v4 σ in screen units (16.15 su = σ 12 canvas px at k .743): ≥ 12.7 canvas px at every framing,
 *   so the seed host's name in the footer only gets softer. Ring / underline strokes stay 5 canvas px at k .92.
 */

type PlayersJoinSceneProps = {
  /** `JOIN,` (fg). */
  readonly headline1?: string;
  /** `PAY THE HOST.` (lime). */
  readonly headline2?: string;
  /** `GCash or cash.` */
  readonly support?: string;
  /** players/join-request-sheet.png (1170x4836). */
  readonly sheetSrc?: string;
  /** players/pay-gcash-receipt.png (1170x1200). */
  readonly receiptSrc?: string;
  readonly colors?: RallyoColors;
};

const PHONE = phonePlacement(131, 600, 720);

/** Camera A: the pay block, in WINDOW px (page y − 2304): page x 48–1122, y 3840–4400 → frame x 70–918 (k .789). */
const PAY_SOURCE = { x: 48, y: 1536, w: 1074, h: 560 };
const PAY_FRAME = { x: 70, y: 600, w: 848, h: 442 };
/** Camera B k (fit width): source x 93–989 (note line 1 ink) → frame x 72–914. */
const K_CLOSE = 842 / 896;
/** Camera B: the Cash card (page 3978) to the note box's bottom (page 4394), window 1674–2090 → frame y 598–989. */
const NOTE_SOURCE = { x: 93, y: 1674, w: 896, h: 416 };
const NOTE_FRAME = { x: 72, y: 598, w: 842, h: 416 * K_CLOSE };
/**
 * Camera R (k .92): receipt labels (x 91) → frame x 72, rows 402–980 (`PM` ends at 980) → frame y 572–1104. `PM` rests
 * 66 px above the pill, so the rows still settling from below in the swipe's last frames (≈ +50 px at local 54, smear σ
 * ≈ 13 px) stay clear of it; the card's top edge (row 399) sits in the stage's top fade.
 */
const K_RECEIPT = 0.92;
const RECEIPT_SOURCE = { x: 91, y: 402, w: 896, h: 578 };
const RECEIPT_FRAME = { x: 72, y: 572, w: 896 * K_RECEIPT, h: 578 * K_RECEIPT };
/** Question + price row (page y 3884–3970, window 1580–1666): painted paper as the punch-in carries it out through the clip. */
const PRICE_ROW_PATCH = { y: 1580, h: 86 };

/** Uniform push `p` of an existing framing about canvas point (cx, cy). */
const pushFraming = (t: CameraTransform, p: number, cx: number, cy: number): CameraTransform => ({
  scale: t.scale * p,
  translateX: p * t.translateX + (1 - p) * cx,
  translateY: p * t.translateY + (1 - p) * cy,
});

const T_PAY = rectToTransform(PAY_SOURCE, PAY_FRAME, PHONE);
const T_NOTE = rectToTransform(NOTE_SOURCE, NOTE_FRAME, PHONE, "width");
const T_RECEIPT = rectToTransform(RECEIPT_SOURCE, RECEIPT_FRAME, PHONE, "width");

const CAMERA_MOVES: readonly CameraMove[] = [
  { start: 0, end: 0, sourceRect: PAY_SOURCE, frameRect: PAY_FRAME },
  // Camera A hold drift, 1% about the cash note (frame ≈ (491, 960)).
  { start: 0, end: 21, transform: pushFraming(T_PAY, 1.01, 491, 960), ease: "linear" },
  // Punch-in onto the Cash card + note (k .789 → .940) while the highlighter draws (24–36, 30–39).
  { start: 21, end: 33, sourceRect: NOTE_SOURCE, frameRect: NOTE_FRAME, fit: "width" },
  // Camera B hold drift, .5% about the note (frame ≈ (491, 900)).
  { start: 33, end: 45, transform: pushFraming(T_NOTE, 1.005, 491, 900), ease: "linear" },
  // Swipe to the receipt (k .94 → .92, almost a pure pan).
  { start: 45, end: 57, sourceRect: RECEIPT_SOURCE, frameRect: RECEIPT_FRAME, fit: "width" },
  // Receipt hold drift: 1.5% by local 90, the same rate on to 105 (under the wipe), about (491, 960).
  { start: 57, end: 105, transform: pushFraming(T_RECEIPT, 1 + (0.015 * 48) / 33, 491, 960), ease: "linear" },
];

/** Soft-focus σ in screen units: the v4 value (σ 12 canvas px at k .743), ≥ 12.7 canvas px at every v5 framing. */
const SOFT_BLUR_SU = 12 / 0.743;
/**
 * Floor reflection (the S3 camera-B pattern, PublishScene REFLECT): the phone body's bottom 12% (≈ 290 frame px under
 * camera B) mirrors under the bezel at `alpha`, fading to 0, beneath the Stage scrim: a soft grey sheen that carries the
 * device on to ≈ 1500 (its source rows are the soft footer, the soft `Send request` band and the sheet's paper foot).
 */
const REFLECT = { alpha: 0.6, fade: 88 } as const;
const SHEET_CROP_Y = 2304;
/** Window row from which the sheet is soft (page 4405: the footer with the seed host, `Send request`). */
const SHEET_SOFT_Y = 2101;
/**
 * Receipt: paper patch over the when-line (blurred venue + seed host, rows 290–395, the spec's patch) and, above it, the
 * event title (rows 175–244): both sit above the stage clip at rest, but they streak through the frame in the swipe,
 * and the title would name an event other than the ₱600 cash one just shown (open item 6). `Payment receipt` and the
 * close button stay.
 */
const RECEIPT_PATCH = { y: 150, h: 245 };
const RECEIPT_H = 1200;
/** Receipt soft focus from `REQUEST NO.` (row 1040); the paper carries on to row 1560, opaque to 1480. */
const RECEIPT_SOFT = { y: 1040, end: 1560, feather: 80 };
/** Soft copies are drawn this far past both screen edges (then clipped), so their blurred edges stay opaque. */
const BLUR_MARGIN = 80;

const PlayersJoinSceneInner: React.FC<PlayersJoinSceneProps> = ({
  headline1 = "JOIN,",
  headline2 = "PAY THE HOST.",
  support = "GCash or cash.",
  sheetSrc = "rallyo/screens/players/join-request-sheet.png",
  receiptSrc = "rallyo/screens/players/pay-gcash-receipt.png",
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  const receiptSoftH = RECEIPT_SOFT.end - RECEIPT_SOFT.y;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: colors.night }} />
      {/* Side fades to full night: under cameras B and R the screen spans the canvas width (draft v5). */}
      <Stage name="Stage" clipTop={570} sideOpacity={1} color={colors.night}>
        <CameraRig name="Camera" screen={PHONE} moves={CAMERA_MOVES}>
          <PhoneFrame
            name="Phone"
            screenX={131}
            screenY={600}
            screenW={720}
            island={false}
            style={{
              WebkitBoxReflect: `below 0px linear-gradient(180deg, rgba(0, 0, 0, 0) ${REFLECT.fade}%, rgba(0, 0, 0, ${REFLECT.alpha}) 100%)`,
            }}
          >
            <ScreenSwipe
              name="Swipe to receipt"
              at={45}
              frames={12}
              direction="from-bottom"
              before={
                <>
                  <ScreenImage name="Request sheet" src={sheetSrc} sourceH={4836} boxH={2532} cropY={SHEET_CROP_Y} />
                  {/* Draft v5: the question + price row dissolves to its own paper over 24–27, before the punch-in carries
                      it into the stage's top fade (from 27), so no sliced glyphs ride the clip edge. A mask, no new text. */}
                  <Interactive.Div
                    name="Price row patch"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: PRICE_ROW_PATCH.y,
                      width: 1170,
                      height: PRICE_ROW_PATCH.h,
                      backgroundColor: colors.paper,
                      opacity: interpolate(frame, [24, 27], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                    }}
                  />
                  <Interactive.Div
                    name="Sheet soft focus"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: SHEET_SOFT_Y,
                      width: 1170,
                      height: 2532 - SHEET_SOFT_Y,
                      overflow: "hidden",
                      maskImage: "linear-gradient(180deg, transparent 0px, black 24px)",
                    }}
                  >
                    {sheetSrc ? (
                      <div
                        style={{
                          position: "absolute",
                          left: -BLUR_MARGIN,
                          top: -40,
                          width: 1170 + 2 * BLUR_MARGIN,
                          height: 2532 - SHEET_SOFT_Y + 80,
                          overflow: "hidden",
                          // Opaque paper, wider than the screen: the blur's edges never let the sharp footer show through.
                          backgroundColor: colors.paper,
                          filter: `blur(${SOFT_BLUR_SU.toFixed(2)}px)`,
                        }}
                      >
                        <Img
                          name="Sheet footer (soft)"
                          src={asset(sheetSrc)}
                          style={{
                            position: "absolute",
                            left: BLUR_MARGIN,
                            top: 40 - (SHEET_SOFT_Y + SHEET_CROP_Y),
                            width: 1170,
                            height: 4836,
                            maxWidth: "none",
                          }}
                        />
                      </div>
                    ) : null}
                    <Interactive.Div name="Sheet soft tint" style={{ position: "absolute", inset: 0, backgroundColor: colors.night, opacity: 0.3 }} />
                  </Interactive.Div>
                  {/* Cash note (window y = page y − 2304), lime tint multiplied on the white note box. */}
                  <Highlighter name="Highlight cash note line 1" rect={{ x: 93, y: 1953, w: 896, h: 39 }} at={24} frames={12} tone="tint" seed={7} />
                  <Highlighter name="Highlight cash note line 2" rect={{ x: 91, y: 2010, w: 160, h: 39 }} at={30} frames={9} tone="tint" seed={9} />
                </>
              }
              after={
                <>
                  <ScreenImage name="GCash receipt" src={receiptSrc} sourceH={RECEIPT_H} />
                  <Interactive.Div
                    name="Receipt when-line patch"
                    style={{ position: "absolute", left: 0, top: RECEIPT_PATCH.y, width: 1170, height: RECEIPT_PATCH.h, backgroundColor: colors.paper }}
                  />
                  {/* Soft focus from `REQUEST NO.`; the receipt sheet's own paper carries on under the file's end. */}
                  <Interactive.Div
                    name="Receipt soft focus"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: RECEIPT_SOFT.y,
                      width: 1170,
                      height: receiptSoftH,
                      overflow: "hidden",
                      maskImage: `linear-gradient(180deg, transparent 0px, black 24px, black ${receiptSoftH - RECEIPT_SOFT.feather}px, transparent 100%)`,
                    }}
                  >
                    {receiptSrc ? (
                      <div
                        style={{
                          position: "absolute",
                          left: -BLUR_MARGIN,
                          top: -RECEIPT_SOFT.y,
                          width: 1170 + 2 * BLUR_MARGIN,
                          height: RECEIPT_SOFT.end + 60,
                          // Opaque paper, wider than the screen: the blur's edges never turn see-through (the sharp file
                          // under them showed as a bright strip ending in a step at the file's end).
                          backgroundColor: colors.paper,
                          filter: `blur(${SOFT_BLUR_SU.toFixed(2)}px)`,
                        }}
                      >
                        <Img
                          name="Receipt lower (soft)"
                          src={asset(receiptSrc)}
                          style={{ position: "absolute", left: BLUR_MARGIN, top: 0, width: 1170, height: RECEIPT_H, maxWidth: "none" }}
                        />
                      </div>
                    ) : null}
                    <Interactive.Div
                      name="Receipt soft tint"
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `linear-gradient(180deg, rgba(11, 19, 13, 0.3) 0px, rgba(11, 19, 13, 0.3) 24px, rgba(11, 19, 13, 0.48) ${RECEIPT_H - RECEIPT_SOFT.y}px, rgba(11, 19, 13, 0.62) ${receiptSoftH - RECEIPT_SOFT.feather}px, rgba(11, 19, 13, 0.62) 100%)`,
                      }}
                    />
                  </Interactive.Div>
                  <RoughRing
                    name="Ring GCash"
                    rect={{ x: 373, y: 674, w: 128, h: 31 }}
                    at={66}
                    frames={9}
                    tone="ink"
                    strokeWidth={5 / K_RECEIPT}
                    padding={10 / K_RECEIPT}
                    seed={6}
                  />
                  <RoughUnderline
                    name="Underline Confirmed by host"
                    rect={{ x: 373, y: 896, w: 361, h: 40 }}
                    at={75}
                    frames={9}
                    tone="ink"
                    strokeWidth={5 / K_RECEIPT}
                    padding={4}
                    roughness={0.8}
                    seed={8}
                  />
                </>
              }
            />
          </PhoneFrame>
        </CameraRig>
      </Stage>
      <KineticText
        name="Headline line 1"
        from={6}
        text={headline1}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.fg }), position: "absolute", left: 72, top: 296 }}
      />
      <KineticText
        name="Headline line 2"
        from={8}
        text={headline2}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.lime }), position: "absolute", left: 72, top: 377 }}
      />
      <KineticText
        name="Support"
        from={18}
        text={support}
        by="word"
        stagger={2}
        enter={9}
        style={{
          ...uiText(700, { size: 48, color: colors.fg2, lineHeight: 1.25 }),
          position: "absolute",
          left: 72,
          top: 486,
          columnGap: "0.25em",
        }}
      />
    </>
  );
};

const playersJoinSceneSchema = {
  headline1: { type: "string", default: "JOIN,", description: "Headline line 1" },
  headline2: { type: "string", default: "PAY THE HOST.", description: "Headline line 2 (lime)" },
  support: { type: "string", default: "GCash or cash.", description: "Support line" },
  sheetSrc: { type: "asset", assetType: "image", default: "rallyo/screens/players/join-request-sheet.png", description: "Request sheet" },
  receiptSrc: { type: "asset", assetType: "image", default: "rallyo/screens/players/pay-gcash-receipt.png", description: "GCash receipt" },
} as const satisfies InteractivitySchema;

export const PlayersJoinScene = Interactive.create({
  Component: PlayersJoinSceneInner,
  layout: "absolute-fill",
  schema: playersJoinSceneSchema,
});
