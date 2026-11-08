import type React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { Highlighter } from "../../elements/Annotate";
import { CameraRig, rectToTransform, type CameraTransform } from "../../elements/CameraRig";
import { ChaosChip } from "../../elements/ChaosChip";
import { KineticText } from "../../elements/KineticText";
import { PhoneFrame, phonePlacement } from "../../elements/PhoneFrame";
import { TapRipple } from "../../elements/Pointer";
import { ScreenImage } from "../../elements/ScreenMedia";
import { Spotlight } from "../../elements/Spotlight";
import { UiTile } from "../../elements/UiTile";
import { Stage } from "../../layers/Stage";
import { displayText, RALLYO_COLORS, type RallyoColors } from "../../theme/rallyo";

/**
 * S5 · Approve + payment "Straight to you" (abs 465–570, 105 f; brief v2.2 section 6 S5, contract 6 + 13).
 *
 * Draft v4 (REVIEW-craft v3 #1, REVIEW-accuracy v3 #5 / #10): ONE phone and ONE camera for the whole scene. The
 * payment sheet that peeks in the lower stage IS the sheet: one camera move carries it from its peek (top edge
 * ≈ y 1300) up to its rest framing over 33–45, so there is no second copy, no dissolve and no double exposure. The
 * card and the sheet sit 535 su apart in the same screen and move as one, so their text never overlaps; the card
 * fades out 33–38, before it reaches the stage clip.
 *
 * Screen layout (su = source px of a 1170-wide phone screen; the phone never changes):
 *  su 0–248      the request card (rookie-cup-requests-safe.png, rows 249+ are night).
 *  su 783–1455   the payment sheet: request-payment-safe.png rows 1836–2508 (offset −1053 su), its paper bottom
 *                margin feathered to night over payment rows 2466–2508 (2 su under the buttons).
 *  su 1580–1829  a soft-focus copy of the requests page (the card: blur + night tint, top feather): the page
 *                behind the sheet, so the device keeps soft imagery under the rail down to ≈ y 1450 (craft #1).
 *
 * Local frames (abs = local + 465):
 *  0       Camera A (k .843): the whole request card (source x 30–1140, y 0–246) → frame x 62–998, y 640–847;
 *          phone x 18–1043, nothing cut at a frame edge. Drift 1.00 → 1.02 (linear) about the Review tap to 33.
 *  3–18    the sheet peeks: fade 3–12 + 160 su rise (EASE.out) to its top at canvas y ≈ 1300; `PAYMENT ₱800`
 *          reads at y ≈ 1356–1392, its lower rows sit in the focus falloff (y ≥ 1404). Draft v4: 6 f earlier than
 *          v3 (9–24), so the lower stage is filled during the slide-in (flat-night band abs 468–475 → 468–469).
 *  2–12    chip slides in (landed 477). 21–34 headline words 21 / 23 / 25 (K1, landed 499).
 *  21–30   Spotlight veil (night 30%, hole = Review) over the request page only (box su 0–783); the peeking sheet
 *          takes the same 30% as a separate dim, so the opener reads as in v3. Both clear with the hand-off.
 *  24      finger dot; 30 TapRipple on `Review` at (490, 722) (below-right of the label) + press .97 30–36.
 *  33–38   request layer (card, press, veil) fades out; the Review ripple fades 33–36 (nothing carries over).
 *  33–45   Camera B (EASE.inOut, 3-sample motion blur, shutter .35; the swipe cue at abs 498): source x 0–1170 from
 *          su 783 → frame x 10, y 600, k .82. inOut, not EASE.out: an ease-out lands slowly onto the rest framing,
 *          which held the button row under the rail for 3–4 frames (abs 500–503); inOut crosses the rail band in the
 *          fast, streaked frames (abs 503–505) and settles above it. The sheet keeps the opener's 30% dim through
 *          the fast part (to 40, clear by 43), so the streak never blooms white.
 *          At rest: paper top 600, `PAYMENT ₱800` 654–688 (₱800 right edge x 912), `Cash at the venue` 734–762,
 *          note lines 847–878 / 897–928, Decline / Approve 1014–1116, paper feathered to night by ≈ 1151, so the
 *          rail (pill 1170–1236) sits on the phone's night screen, 54 px under the buttons and clear of its tray.
 *          Text x 66–912: inside the safe box (x 65–918). k .82 is the largest framing that keeps `₱800` left of
 *          the right rail zone and `PAYMENT` right of the left fade (labels ≈ 17 px x-height, v3 ≈ 15–16). The
 *          phone's left bezel bleeds off-canvas under the 85% side fade (as S6); its right bezel ends at x ≈ 988.
 *          The focus falloff edge rises 1404 → 1150 with the camera (the soft requests copy below stays soft;
 *          band x 72–1008, y 1300–1450 mean luma ≈ 47, std 12 at rest, v3 13 / 4).
 *  45–105  drift 1.00 → 1.02 (linear) about (489, 1062), the sheet's centre column at the Approve row.
 *  54–63 / 60–69  lime-tint Highlighters on note line 1 / line 2.
 *  69      finger dot; 75 TapRipple on `Approve` at (670, 1085): below-right of the label centre + press .97 75–81
 *          (bar 9). No after-state. 78 chip strike + ✓.
 *  90–105  wipe from-left (transition).
 * Presses are same-pixel UiTile crops of the button (+ a margin of flat sheet colour) scaled .97 about their centre,
 * mounted only around the tap. Rows 0–1835 of the payment file are night (no test name, player ID, partner or venue
 * exists in it), and nothing here draws them.
 */

type ApproveSceneProps = {
  readonly chipSender?: string;
  readonly chipText?: string;
  readonly headline1?: string;
  readonly headline2?: string;
  /** v1 leftover (the composition no longer passes it); unused. */
  readonly rookieCupSrc?: string;
  /** rookie-cup-requests-safe.png (props.screens.rookieCupRequests): 1170x2187 derived crop. */
  readonly requestsSrc?: string;
  /** request-payment-safe.png (props.screens.requestPayment): the payment sheet after the Review tap. */
  readonly paymentSrc?: string;
  readonly colors?: RallyoColors;
};

/** Uniform push `p` about canvas point (cx, cy), applied on top of an existing camera transform. */
const pushOn = (t: CameraTransform, p: number, cx: number, cy: number): CameraTransform => ({
  scale: t.scale * p,
  translateX: p * t.translateX + (1 - p) * cx,
  translateY: p * t.translateY + (1 - p) * cy,
});

const ApproveSceneInner: React.FC<ApproveSceneProps> = ({
  chipSender = "RC",
  chipText = "Joining! Cash or GCash?",
  headline1 = "STRAIGHT",
  headline2 = "TO YOU.",
  requestsSrc = "rallyo/screens/mobile/rookie-cup-requests-safe.png",
  paymentSrc = "rallyo/screens/mobile/request-payment-safe.png",
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  const phone = phonePlacement();
  // Camera A: the whole request card (k .843). Camera B: the payment sheet (k .82, paper top at y 600).
  const cardShot = rectToTransform({ x: 30, y: 0, w: 1110, h: 246 }, { x: 62, y: 640, w: 936, h: 207 }, phone, "width");
  const sheetShot = rectToTransform({ x: 0, y: 783, w: 1170, h: 700 }, { x: 10, y: 600, w: 959.4, h: 574 }, phone, "width");
  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: colors.night }} />
      <Stage name="Stage" clipTop={570} color={colors.night}>
        <CameraRig
          name="Camera"
          screen={phone}
          shutter={0.35}
          moves={[
            { start: 0, end: 0, transform: cardShot },
            { start: 0, end: 33, transform: pushOn(cardShot, 1.02, 490, 722), ease: "linear" },
            { start: 33, end: 45, transform: sheetShot, ease: "inOut", blur: 3 },
            { start: 45, end: 105, transform: pushOn(sheetShot, 1.02, 489, 1062), ease: "linear" },
          ]}
        >
          <PhoneFrame name="Phone" screenX={131} screenY={600} screenW={720} island={false} screenColor={colors.night}>
            {/* The page behind the sheet, in soft focus under the rail (su 1580–1829; canvas ≈ 1253–1458 at rest). */}
            <Interactive.Div
              name="Soft requests page"
              style={{
                position: "absolute",
                left: 0,
                top: 1580,
                width: 1170,
                height: 249,
                maskImage: "linear-gradient(180deg, transparent 0px, black 48px)",
              }}
            >
              <UiTile
                name="Soft request card"
                src={requestsSrc}
                crop={{ x: 0, y: 0, w: 1170, h: 249 }}
                sourceW={1170}
                sourceH={2187}
                zoom={1}
                radius={0}
                borderWidth={0}
                shadow="none"
                fillColor={colors.night}
                style={{ filter: "blur(12px)" }}
              />
              <Interactive.Div name="Soft page tint" style={{ position: "absolute", inset: 0, backgroundColor: colors.night, opacity: 0.75 }} />
            </Interactive.Div>
            {/* The request page: card, Review press and the Review veil leave together (33–38), before the card reaches the
                stage clip. */}
            <Interactive.Div
              name="Request layer"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 1170,
                height: 783,
                opacity: interpolate(frame, [33, 38], [1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              <ScreenImage name="Join request" src={requestsSrc} sourceW={1170} sourceH={2187} boxH={783} />
              {frame >= 29 && frame <= 37 ? (
                <UiTile
                  name="Review press"
                  src={requestsSrc}
                  crop={{ x: 398, y: 11, w: 220, h: 121 }}
                  sourceW={1170}
                  sourceH={2187}
                  zoom={1}
                  radius={0}
                  borderWidth={0}
                  shadow="none"
                  fillColor="#F6F7EF"
                  style={{
                    left: 398,
                    top: 11,
                    scale: interpolate(frame, [30, 33, 36], [1, 0.97, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                      output: "perceptual-scale",
                    }),
                  }}
                />
              ) : null}
              <Spotlight
                name="Focus Review"
                stops={[{ at: 0, rect: { x: 408, y: 21, w: 200, h: 102 } }]}
                fadeInAt={21}
                fade={9}
                veilOpacity={0.3}
                radius={26}
                padding={10}
                boxW={1170}
                boxH={783}
              />
            </Interactive.Div>
            {/* The payment sheet: payment-file coordinates inside (offset −1053 su), peeks 3–18, carried by the camera. */}
            <Interactive.Div
              name="Payment sheet"
              style={{
                position: "absolute",
                left: 0,
                top: -1053,
                width: 1170,
                height: 2532,
                opacity: interpolate(frame, [3, 12], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                translate: interpolate(frame, [3, 18], ["0px 160px", "0px 0px"], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }),
              }}
            >
              <UiTile
                name="Payment sheet paper"
                src={paymentSrc}
                crop={{ x: 0, y: 1836, w: 1170, h: 672 }}
                sourceW={1170}
                sourceH={2532}
                zoom={1}
                radius={0}
                borderWidth={0}
                shadow="none"
                fillColor="#EEEFE8"
                style={{ left: 0, top: 1836 }}
              />
              <Highlighter name="Highlight note line 1" rect={{ x: 102, y: 2134, w: 937, h: 37 }} at={54} frames={9} tone="tint" seed={3} />
              <Highlighter name="Highlight note line 2" rect={{ x: 102, y: 2194, w: 329, h: 37 }} at={60} frames={9} tone="tint" seed={5} />
              {frame >= 74 && frame <= 82 ? (
                <UiTile
                  name="Approve press"
                  src={paymentSrc}
                  crop={{ x: 430, y: 2308, w: 687, h: 171 }}
                  zoom={1}
                  radius={0}
                  borderWidth={0}
                  shadow="none"
                  fillColor="#EEEFE8"
                  style={{
                    left: 430,
                    top: 2308,
                    scale: interpolate(frame, [75, 78, 81], [1, 0.97, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                      output: "perceptual-scale",
                    }),
                  }}
                />
              ) : null}
              {/* The paper's blank bottom margin dissolves into the night screen (2 su under the buttons; above the
                  Approve press, so its paper margin never shows a light strip). It runs 18 su past the paper tile's
                  end (2508), so the tile's last row never leaves a bright 1 px seam at canvas y ≈ 1151. */}
              <Interactive.Div
                name="Sheet bottom feather"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 2466,
                  width: 1170,
                  height: 60,
                  backgroundImage: `linear-gradient(180deg, transparent 0px, ${colors.night} 42px)`,
                }}
              />
              {/* The opener's 30% veil on the peek (as v3); it holds through the fast part of the move (so the streak
                  never blooms white) and clears as the sheet lands (40–43). */}
              <Interactive.Div
                name="Peek dim"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 1836,
                  width: 1170,
                  height: 696,
                  backgroundColor: colors.night,
                  opacity: interpolate(frame, [21, 30, 40, 43], [0, 0.3, 0.3, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              />
            </Interactive.Div>
          </PhoneFrame>
        </CameraRig>
        {/* Focus falloff (as S6–S8): below the focal UI the stage is soft. Under the peek's rows in the opener (1404),
            rising with the camera to just under the sheet's feathered paper end (1150). */}
        <Interactive.Div
          name="Focus falloff"
          style={{
            position: "absolute",
            left: 0,
            top: interpolate(frame, [33, 45], [1404, 1150], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.83, 0, 0.17, 1),
            }),
            width: 1080,
            height: 900,
            backdropFilter: "blur(6px)",
            maskImage: "linear-gradient(180deg, transparent 0px, black 60px)",
          }}
        >
          <Interactive.Div name="Focus tint" style={{ position: "absolute", inset: 0, backgroundColor: colors.night, opacity: 0.3 }} />
        </Interactive.Div>
        <TapRipple
          name="Tap Review"
          x={490}
          y={722}
          at={30}
          dotLead={6}
          style={{
            opacity: interpolate(frame, [33, 36], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.7, 0, 0.84, 0),
            }),
          }}
        />
        <TapRipple name="Tap Approve" x={670} y={1085} at={75} dotLead={6} />
      </Stage>
      <ChaosChip name="Chip" sender={chipSender} text={chipText} enterAt={2} strikeAt={78} />
      <KineticText
        name="Headline line 1"
        from={21}
        text={headline1}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.fg }), position: "absolute", left: 72, top: 376 }}
      />
      <KineticText
        name="Headline line 2"
        from={23}
        text={headline2}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.lime }), position: "absolute", left: 72, top: 457 }}
      />
    </>
  );
};

const approveSceneSchema = {
  chipSender: { type: "string", default: "RC", description: "Chip initials" },
  chipText: { type: "string", default: "Joining! Cash or GCash?", description: "Chip message (quotes a hook bubble)" },
  headline1: { type: "string", default: "STRAIGHT", description: "Headline line 1" },
  headline2: { type: "string", default: "TO YOU.", description: "Headline line 2 (lime)" },
  rookieCupSrc: { type: "asset", assetType: "image", default: "rallyo/screens/mobile/host-event-rookie-cup.png", description: "Unused (v1 leftover)" },
  requestsSrc: { type: "asset", assetType: "image", default: "rallyo/screens/mobile/rookie-cup-requests-safe.png", description: "Requests crop" },
  paymentSrc: { type: "asset", assetType: "image", default: "rallyo/screens/mobile/request-payment-safe.png", description: "Payment sheet" },
} as const satisfies InteractivitySchema;

export const ApproveScene = Interactive.create({
  Component: ApproveSceneInner,
  layout: "absolute-fill",
  schema: approveSceneSchema,
});
