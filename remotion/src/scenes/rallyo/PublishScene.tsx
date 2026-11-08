import type React from "react";
import { Easing, Img, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { CameraRig, rectToTransform, type CameraRectMove, type ScreenPlacement } from "../../elements/CameraRig";
import { ChaosChip } from "../../elements/ChaosChip";
import { KineticText } from "../../elements/KineticText";
import { PhoneFrame } from "../../elements/PhoneFrame";
import { TapRipple } from "../../elements/Pointer";
import { ScrollShot } from "../../elements/ScreenMedia";
import { ScrollSmear } from "../../elements/ScrollSmear";
import { Spotlight } from "../../elements/Spotlight";
import { Stage } from "../../layers/Stage";
import { asset } from "../../lib/assets";
import { displayText, RALLYO_COLORS, type RallyoColors } from "../../theme/rallyo";

/**
 * S3 · 01 · Publish (abs 240–360, 120 f): "One form, published." Brief v2.2 section 6 S3, contract section 13.
 *
 * Screen: ScrollShot new-event-sheet-safe.png (1170x6573 page px, window 2532, maxScrollY 4041; the sign-up hint row is
 * painted out in the file). Local frame = abs − 240.
 *   0–18    under the CH01 full lime cover (the hard cut from S2 happens unseen at 0).
 *   9–33    PhoneFrame floats in (translateY 180 → 0, rotate −6° → 0, scale .94 → 1, EASE.out), revealed as the
 *           panel collapses into the rail (18–33). Camera A from 0 (draft v3, craft #4: the form sits 79 px lower):
 *           page x 40–1130, y 90–440 → frame x 92–890, y 719–975 (k .7314). The phone's top bezel shows at y ≈ 636,
 *           NEW EVENT y ≈ 734–803, tab bar (page y 276–420) y ≈ 855–960, Name field (549–687) y ≈ 1055–1156, the
 *           `Venue` label under rail 01, the whole Venue field (816–960) y ≈ 1250–1355, BELOW the rail's tray
 *           (1160–1246). The tray sits in the paper gap between the two fields (≈ 4 px each side, the most the
 *           real 129 px gap allows at this k; the tray's own frosted shadow softens both field edges).
 *   18–28   chip slides in (landed 268). 37 / 39 / 41 headline words (K1) → landed 50 (abs 290).
 *   24–30   Spotlight veil (draft v3, craft #11: night 40%, hole = the tab segment itself, clipped to the segmented
 *           control's rect page x 48–1122, y 276–420, radius 16, no padding, so it never overshoots the control)
 *           on `Open play`; hops land on the beats 45 `Tournament` and 60 `Court share`; the selected tab never
 *           changes, only the veil moves. Veil out 72–78.
 *   66–81   scroll whip 0 → 4041 (EASE.inOut) while the camera eases to Camera B: the night `Publish` button
 *           (measured page x 48–1122, y 6201–6357) mapped by width onto x 98–884, y 1012–1126 (k .7318, draft v3:
 *           was y 665–779), so the form's last rows fill the stage above it: `Notes for players` y ≈ 598–628,
 *           the notes field 641–842, the host row 885–968 (name + host id redacted), Publish 1012–1126, tap point
 *           (491, 1069) inside the brief's pushed-target window (y 590–1070).
 *           Smear on the CONTENT only: one vertical ScrollSmear on the page, gain = (scroll + camera pan) ÷ scroll,
 *           σ capped at 40 page px, brightness down to 70% at full smear; the phone body and bezel stay sharp.
 *   0–120   Stage clip 570, lower scrim at the reel default 1290 → 1590, plus a "Focus falloff" (backdrop blur
 *           8 px → 12 px with the whip, + 30% night, 48 px ramp, the S7/S8 treatment): under camera A its edge sits just under the Venue
 *           field (1362), so the One-day / Date / Start rows below ≈ 1410 are soft shapes, never readable
 *           (accuracy #13); it eases with the whip to 1130, just under the Publish button, so under camera B the
 *           caption and the phone's bottom bezel (≈ 1300) are the soft area rail 01 sits on (no live text under it).
 *   81–105  hold drift 1.00 → 1.02 about the Publish centre (491, 1069), continuing linearly under the cut.
 *   84 / 90 finger dot / TapRipple on Publish, the fingertip just under-right of the label (511, 1095), so the label
 *           stays readable (craft #7); press .97 90–93–96 (real pixels of the button, scaled). No toast.
 *   93      chip strike + ✓.
 *   105–120 T3 zoomThrough grows out of the button rect (98, 1012, 786x114) about (491, 1069), covers at 114.
 *
 * Draft v4 (v3 craft #3 / #9, accuracy #10):
 *   - the Venue placeholder ends on a whole word (VENUE_TRIM);
 *   - camera B tail: the phone body reflects below itself (REFLECT), so device imagery runs to ≈ y 1450 under the soft
 *     fade, and the Focus falloff's night tint eases .3 → .6 with the whip, so the blurred caption band under rail 01 is
 *     calm grey (≈ 40% luma or less) instead of a bright smear;
 *   - pre-zoom veil: the stage content fades to night over 105–108 while T3's night shape grows out of Publish, so no
 *     dimmed notes-field sliver shows above the giant `Publish` at 349.
 *
 * Draft v3 deviation from craft #4's tail numbers (Publish at y 1150–1265, bezel ≥ 1450): rail 01 (pill x 72–496,
 * y 1170–1236) would sit across the Publish label (x 429–553) and the tap would leave the brief's 590–1070 target
 * window, and the page ends 216 page px under the button, so the bezel can only pass 1450 with the button below the
 * rail. Camera B therefore puts the button as low as the target window allows; the stage reads to ≈ 1300.
 */

type PublishSceneProps = {
  readonly chipSender?: string;
  readonly chipText?: string;
  readonly headline1?: string;
  readonly headline2?: string;
  /** new-event-sheet-safe.png (props.screens.newEventSheet). */
  readonly sheetSrc?: string;
  readonly colors?: RallyoColors;
};

/** Phone base k (screen 720 / capture 1170). */
const K = 720 / 1170;
const SHEET_W = 1170;
const SHEET_H = 6573;
const WINDOW_H = 2532;
const SCROLL_END = 4041;

/** Measured page px (new-event-sheet-safe.png). */
const TAB_OPEN_PLAY = { x: 48, y: 276, w: 359, h: 143 };
const TAB_TOURNAMENT = { x: 407, y: 276, w: 357, h: 143 };
const TAB_COURT_SHARE = { x: 764, y: 276, w: 357, h: 143 };
const PUBLISH_BUTTON = { x: 48, y: 6201, w: 1074, h: 156 };
/** The segmented control's outer rect (border included): the spotlight hole never leaves it (craft #11). */
const SEGMENTED = { x: 48, y: 276, w: 1074, h: 144 };

const SCREEN_A: ScreenPlacement = { x: 131, y: 600, k: K };
/** Phone placement with the page scrolled to SCROLL_END (page px stay valid as source px). */
const SCREEN_B: ScreenPlacement = { x: 131, y: 600 - SCROLL_END * K, k: K };

const CAMERA_A: CameraRectMove = {
  start: 0,
  end: 0,
  sourceRect: { x: 40, y: 90, w: 1090, h: 350 },
  frameRect: { x: 92, y: 719, w: 798, h: 256 },
};
/** Publish button → the zoomThrough shape rect (98, 1012, 786x114), fitted by width (centre 491, 1069). */
const CAMERA_B: CameraRectMove = {
  start: 66,
  end: 81,
  screen: SCREEN_B,
  sourceRect: PUBLISH_BUTTON,
  frameRect: { x: 98, y: 1012, w: 786, h: 114 },
  fit: "width",
};

/** Canvas px the camera pans the phone up between A and B (same EASE.inOut as the scroll, same direction). */
const CAMERA_A_T = rectToTransform(CAMERA_A.sourceRect, CAMERA_A.frameRect, SCREEN_A);
const CAMERA_PAN = Math.abs(rectToTransform(CAMERA_B.sourceRect, CAMERA_B.frameRect, SCREEN_B, "width").translateY - CAMERA_A_T.translateY);
/**
 * Page smear gain: the content travels scroll + pan (≈ 4041 + 2036 page px), so the page streak is sized to what the
 * viewer sees while only the content is smeared (the bezel and the stage stay sharp).
 */
const WHIP_GAIN = (SCROLL_END + CAMERA_PAN / (CAMERA_A_T.scale * K)) / SCROLL_END;

/**
 * The host row ("Hosting as <test host> · <host id>   View Host ID", white card page x 52–1118, y 6032–6142) is in
 * frame under camera B (y ≈ 885–968). Measured ink: `Hosting as` x 96–282, the name + id x 296–751, y 6072–6111.
 * The name and id are painted out with the card's white (HOST_ID_MASK) and redacted with a soft rounded ink bar at
 * 12% (HOST_ID_BAR, the same treatment as the S4 venue), so the row reads `Hosting as ▬▬▬▬  View Host ID`:
 * deliberate, never a blank field or a smudge.
 */
const HOST_ID_MASK = { x: 290, y: 6060, w: 470, h: 60 };
const HOST_ID_BAR = { x: 296, y: 6074, w: 455, h: 34 };

/**
 * Venue placeholder trim (draft v4, v3 craft #9): the field clips its own placeholder mid-glyph (`…tap the pin to us|`,
 * ink x 238–1076, rows 871–916; the field's white interior ends at x 1118). A white patch over x 960–1118 (from just
 * after `pin`, ink ends 952) ends the line on a whole word: `Type a court name, or tap the pin`. A mask, no new text.
 */
const VENUE_TRIM = { x: 960, y: 860, w: 158, h: 70 };

/**
 * Floor reflection (draft v4, v3 craft #3): under camera B the page ends 216 page px below Publish, so the phone ends at
 * frame ≈ 1300 and the band below was flat night over 319–345. The phone body gets a -webkit-box-reflect: the mask is
 * set in the body's own (unflipped) box, so its bottom 12% (≈ 190 body px ≈ 226 frame px under camera B) is mirrored
 * under the phone at `alpha`, fading to 0. It sits under the Focus falloff (12 px blur + night tint) and the lower scrim,
 * so it reads as a soft grey sheen continuing the device to ≈ y 1450, never as mirrored text. Under camera A the phone's
 * bottom is far below the canvas, so the reflection only enters with the whip.
 */
const REFLECT = { alpha: 0.6, fade: 88 } as const;

const PublishSceneInner: React.FC<PublishSceneProps> = ({
  chipSender = "KT",
  chipText = "Who's in for Thursday?",
  headline1 = "ONE FORM,",
  headline2 = "PUBLISHED.",
  sheetSrc = "rallyo/screens/mobile/new-event-sheet-safe.png",
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  const pressing = frame >= 90 && frame <= 96;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: colors.night }} />
      {/* Draft v3: clip 570 and the reel's default lower fade (1290 → 1590), so the form runs down the stage; the
          Focus falloff below keeps every row under ≈ 1410 (camera A) / the caption (camera B) soft. */}
      <Stage name="Stage" clipTop={570} scrimTop={1290} scrimBottom={1590} color={colors.night}>
        {/* Hold drift 1.00 → 1.02 about the Publish tap point from the landing (81–105), continuing linearly into
            the zoomThrough, so camera B never freezes. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "491px 1069px",
            scale: interpolate(frame, [81, 105], [1, 1.02], { extrapolateLeft: "clamp", extrapolateRight: "extend" }),
          }}
        >
          <CameraRig name="Camera" screen={SCREEN_A} moves={[CAMERA_A, CAMERA_B]}>
            <PhoneFrame
              name="Phone"
              screenX={131}
              screenY={600}
              screenW={720}
              style={{
                translate: interpolate(frame, [9, 33], ["0px 180px", "0px 0px"], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }),
                rotate: interpolate(frame, [9, 33], ["-6deg", "0deg"], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                }),
                scale: interpolate(frame, [9, 33], [0.94, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                  output: "perceptual-scale",
                }),
                WebkitBoxReflect: `below 0px linear-gradient(180deg, rgba(0, 0, 0, 0) ${REFLECT.fade}%, rgba(0, 0, 0, ${REFLECT.alpha}) 100%)`,
              }}
            >
              <ScrollSmear
                name="Scroll whip smear"
                scrollMoves={[
                  { start: 0, end: 0, y: 0 },
                  { start: 66, end: 81, y: SCROLL_END },
                ]}
                maxScrollY={SCROLL_END}
                gain={WHIP_GAIN}
                maxSigma={40}
                dim={0.3}
                boxW={SHEET_W}
                boxH={WINDOW_H}
              >
                <ScrollShot
                  name="New event sheet"
                  src={sheetSrc}
                  imageW={SHEET_W}
                  imageH={SHEET_H}
                  windowH={WINDOW_H}
                  maxScrollY={SCROLL_END}
                  scrollMoves={[
                    { start: 0, end: 0, y: 0 },
                    { start: 66, end: 81, y: SCROLL_END },
                  ]}
                >
                  {/* Under the Spotlight veil, so it dims with the page. */}
                  <Interactive.Div
                    name="Venue placeholder trim"
                    style={{
                      position: "absolute",
                      left: VENUE_TRIM.x,
                      top: VENUE_TRIM.y,
                      width: VENUE_TRIM.w,
                      height: VENUE_TRIM.h,
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                  <Spotlight
                    name="Tab spotlight"
                    stops={[
                      { at: 30, rect: TAB_OPEN_PLAY },
                      { at: 45, rect: TAB_TOURNAMENT },
                      { at: 60, rect: TAB_COURT_SHARE },
                    ]}
                    fadeInAt={24}
                    fadeOutAt={72}
                    fade={6}
                    hop={6}
                    veilOpacity={0.4}
                    radius={16}
                    padding={0}
                    clip={SEGMENTED}
                    color={colors.night}
                    boxW={SHEET_W}
                    boxH={SHEET_H}
                  />
                  <Interactive.Div
                    name="Host id mask"
                    style={{
                      position: "absolute",
                      left: HOST_ID_MASK.x,
                      top: HOST_ID_MASK.y,
                      width: HOST_ID_MASK.w,
                      height: HOST_ID_MASK.h,
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                  <Interactive.Div
                    name="Host id redaction bar"
                    style={{
                      position: "absolute",
                      left: HOST_ID_BAR.x,
                      top: HOST_ID_BAR.y,
                      width: HOST_ID_BAR.w,
                      height: HOST_ID_BAR.h,
                      borderRadius: HOST_ID_BAR.h / 2,
                      backgroundColor: colors.ink,
                      opacity: 0.12,
                      filter: "blur(1.5px)",
                    }}
                  />
                  {pressing ? (
                    <>
                      {/* Press .97: the real button pixels, scaled about their centre over a paper backing. */}
                      <div
                        style={{
                          position: "absolute",
                          left: PUBLISH_BUTTON.x - 2,
                          top: PUBLISH_BUTTON.y - 2,
                          width: PUBLISH_BUTTON.w + 4,
                          height: PUBLISH_BUTTON.h + 4,
                          backgroundColor: colors.paper,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: PUBLISH_BUTTON.x - 2,
                          top: PUBLISH_BUTTON.y - 2,
                          width: PUBLISH_BUTTON.w + 4,
                          height: PUBLISH_BUTTON.h + 4,
                          overflow: "hidden",
                          scale: interpolate(frame, [90, 93, 96], [1, 0.97, 1], {
                            extrapolateLeft: "clamp",
                            extrapolateRight: "clamp",
                            easing: Easing.bezier(0.16, 1, 0.3, 1),
                            output: "perceptual-scale",
                          }),
                        }}
                      >
                        <Img
                          name="Publish button (press)"
                          src={asset(sheetSrc)}
                          style={{
                            position: "absolute",
                            left: -(PUBLISH_BUTTON.x - 2),
                            top: -(PUBLISH_BUTTON.y - 2),
                            width: SHEET_W,
                            height: SHEET_H,
                            maxWidth: "none",
                          }}
                        />
                      </div>
                    </>
                  ) : null}
                </ScrollShot>
              </ScrollSmear>
            </PhoneFrame>
          </CameraRig>
        </div>
        {/* Focus falloff (the S7/S8 treatment): soft focus + 30% night under the focal UI. Camera A: from just under
            the Venue field; it follows the whip (same EASE.inOut) to just under the Publish button for camera B. */}
        <Interactive.Div
          name="Focus falloff"
          style={{
            position: "absolute",
            left: 0,
            width: 1080,
            top: interpolate(frame, [66, 81], [1362, 1130], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.83, 0, 0.17, 1),
            }),
            height: 900,
            // 8 px under camera A; 12 px under camera B, where the caption sits under rail 01.
            backdropFilter: `blur(${interpolate(frame, [66, 81], [8, 12], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.83, 0, 0.17, 1),
            })}px)`,
            maskImage: "linear-gradient(180deg, transparent 0px, black 48px)",
          }}
        >
          {/* .3 under camera A; .6 under camera B (draft v4, craft #3), so the caption band under rail 01 is calm grey. */}
          <Interactive.Div
            name="Focus tint"
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: colors.night,
              opacity: interpolate(frame, [66, 81], [0.3, 0.6], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.83, 0, 0.17, 1),
              }),
            }}
          />
        </Interactive.Div>

        {/* Fingertip just under-right of the label centre (491, 1069), so `Publish` stays readable (craft #7). */}
        <TapRipple name="Tap Publish" x={511} y={1095} at={90} dotLead={6} />
      </Stage>
      {/* Pre-zoom veil (draft v4, accuracy #10): the stage goes to night over 105–108 (linear) while T3's night shape
          grows out of Publish (it covers the button from 346), so no dimmed notes-field sliver shows at 349. Drawn over
          the Stage from y 548 (22 px above its clip, 10 px under the headline's line box), not inside it: inside, the
          clip edge left a 1 px seam (≈ luma 48) once T3 scaled the scene. */}
      <Interactive.Div
        name="Pre-zoom veil"
        style={{
          position: "absolute",
          left: 0,
          top: 548,
          width: 1080,
          height: 1372,
          backgroundColor: colors.night,
          opacity: interpolate(frame, [105, 108], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
      <ChaosChip name="Chip" sender={chipSender} text={chipText} enterAt={18} strikeAt={93} />
      <KineticText
        name="Headline line 1"
        from={37}
        text={headline1}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.fg }), position: "absolute", left: 72, top: 376 }}
      />
      <KineticText
        name="Headline line 2"
        from={41}
        text={headline2}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.lime }), position: "absolute", left: 72, top: 457 }}
      />
    </>
  );
};

const publishSceneSchema = {
  chipSender: { type: "string", default: "KT", description: "Chip initials" },
  chipText: { type: "string", default: "Who's in for Thursday?", description: "Chip message (quotes a hook bubble)" },
  headline1: { type: "string", default: "ONE FORM,", description: "Headline line 1" },
  headline2: { type: "string", default: "PUBLISHED.", description: "Headline line 2 (lime)" },
  sheetSrc: { type: "asset", assetType: "image", default: "rallyo/screens/mobile/new-event-sheet-safe.png", description: "New-event sheet" },
} as const satisfies InteractivitySchema;

export const PublishScene = Interactive.create({
  Component: PublishSceneInner,
  layout: "absolute-fill",
  schema: publishSceneSchema,
});
