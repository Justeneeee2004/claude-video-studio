import type React from "react";
import { Easing, Img, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { CameraRig, rectToTransform, sourceToCanvas, type CameraMove, type CameraTransform } from "../../elements/CameraRig";
import { KineticText } from "../../elements/KineticText";
import { PhoneFrame, phonePlacement } from "../../elements/PhoneFrame";
import { PinPulse } from "../../elements/PinPulse";
import { TapRipple } from "../../elements/Pointer";
import { ScreenImage, ScreenSwipe } from "../../elements/ScreenMedia";
import { UiTile } from "../../elements/UiTile";
import { Stage } from "../../layers/Stage";
import { asset } from "../../lib/assets";
import { displayText, RALLYO_COLORS, uiText, type RallyoColors } from "../../theme/rallyo";

/**
 * S10a · Find a game: "FIND A GAME." (abs 1020–1125, 105 f). Players spec (briefs/rallyo-players-chapter.md)
 * section 4 S10a. Local frame = abs − 1020. In: hard cut under ChapterWipe 02 (local 0–18 full lime cover). Out:
 * `slide` from-right (FRONT) at local 90 (the next scene arrives from the `→` direction).
 *
 * - 12–33  PhoneFrame (island off) floats in (translateY 180 → 0, −6° → 0, .94 → 1, EASE.out) on find-map.png.
 *          Camera A: source x 0–1170, y 220–1000 → frame x 92–890, y 600–1132 (k .682). The header with the sample
 *          player chip (source y ≤ 150) sits above the stage clip. Soft night map edges inside the screen: top 32 su
 *          (the cut `Santo Tomas` under the header), left 36 su, right 30 su (the cut terrain icons; the spec's 50 su
 *          would dim the last letter of `Maco` / `Mabini`, which end at x 1139).
 *          Lower stage: soft focus (σ 12 canvas px + 30% night) from source y 1064 (frame 1174; the spec's 1100 cut the
 *          `Mabini` label in half at the feather; both pins stay sharp), so the legend chip and the real
 *          `Leaflet │ © OpenStreetMap` strip are soft shapes; the soft legend chip gets an extra 45% night (craft #3:
 *          the rail rests on calm grey, never on a bright smear). Draft v5 (v4 craft #3, the darkest lower stage since
 *          the hook): under the file's end (frame 1350) the PAGE carries on, as the real event-map page does:
 *          `mobile/map.png` rows 1323–1843 in a wider blur (σ 28 canvas px, so the `EVENT MAP` heading is a glow, never
 *          letters; its `Try Matina · Jordan …` hint row, page y ≈ 1890, is never drawn), and both soft layers are
 *          lifted (brightness 1.25 / 1.45, lighter tint), so the lower stage reads as lit, soft device imagery. Band
 *          (x 72–1008, y 1300–1450) 37 / 21 at 1062 (v4 30 / 10); rows y 1250–1600 mean 34.5, rows > 30 down to 1475.
 *          Stage clip 560 (was 570): under Camera A it shows file rows ≥ 161 inside the fade, the header's night band.
 * - 24–30  OSM credit (Satoshi 500 26 px #8E988F, right-aligned at x 900). Draft v5: y 524–552, on the night above the
 *          stage's top edge (it was y 1206–1234 beside the rail; Camera P puts the card's foot and its pin in that
 *          band), fading in 6 f later than v4 (18–24) so its tail is never sliced by the collapsing CH02 panel. Held to
 *          the slide.
 * - 21 / 23 / 25  h1 words → landed 34 (slot B; the declared hand-off exception).
 * - 33–51  hold drift 1.2% about (491, 866).
 * - 42 / 45  PinPulse on the Carmen pin (source (333, 951), r 24 → 48 px) and the Tagum pin (source (837, 570),
 *          r 24 → 64 px), .9 → 0 over 18 f.
 * - 51–63  ScreenSwipe from-bottom map → preview (the card rises over the map; the screens travel 1780 su, so the
 *          card follows right behind the map). Draft v5 (v4 accuracy #3, the 1077 lower flash, band 21 → 86 → 24): the
 *          incoming page sits under a night veil (.55, up to .75 on 57 while its card crosses the lower stage, clear by
 *          60), and its header (with the sample chip) is covered, as the real header never moves on a row tap.
 *          Band over 1074–1081: 37 / 34 / 19 / 34 / 35 / 24 / 31 / 33, no spike (1076 is the night seam between the
 *          two pages at the whip's peak).
 *          Draft v5 (v4 craft #4, accuracy #4): ONE camera move, Camera A → Camera P, the whole card from its top edge:
 *          source x 153–1017, y 222–938 (card top to the foot of `See full details`) → frame x 227–892, y 586–1137
 *          (k .770; card foot 1200). No Camera C stop and no punch-in, so the scale goes .69 → .77 once (no pump, no
 *          one-frame pop) and from 1081 to the slide the hold reads `TOURNAMENT · NOV 9 8:30 AM`, `CITY OPEN SINGLES`,
 *          `Mon, Nov 9 · 8:30 AM`, [venue blur], `FORMAT Tournament · ₱600 / team`, `LEVEL Open`, `See full details`
 *          and `Request to join →` (label cap-to-descender 29 px, v4 30). The card's top edge is whole (no cut through
 *          the venue blur); `See full details` ends 33 px above the pill (clear of the tray's frost), the pill rests on
 *          the card's bottom-left margin, and the pin (frame x 521–598, y 1223–1300) hangs right of the pill. The camera
 *          lands with the swipe: 51–59 inOut, then 59–63 frame by frame riding 75% of the swipe's ease tail (TAIL_RIDE),
 *          so `See full details` never passes under the pill on the landing frames. Lower stage: soft focus from
 *          preview source y 1160 (`Pioneer`, the lower street labels, the real OSM strip), then the soft page under the
 *          file's end (frame 1451). Band 34 / 12, rows y 1250–1600 mean 31.8, rows > 30 down to 1545 (v4 27 / 7, none).
 * - 63–105 hold drift 1.0% about the tap point, so no frame freezes and the ripple and the label never part.
 * - 72 / 75  finger dot, then TapRipple on `Request to join →`, BELOW-RIGHT of the label (source (898, 962), frame
 *          (800, 1156): under the arrow, on the button's lower edge), so the whole label reads beside the 36 px dot
 *          (v4: it sat on `to`) + .97 press of the button (same-pixel UiTile) over 75–81.
 * - 90–105 slide out (transition).
 */

type PlayersFindSceneProps = {
  /** `FIND A` (fg). */
  readonly headline1?: string;
  /** `GAME.` (lime). */
  readonly headline2?: string;
  /** Map attribution drawn in frame (the real strip is in soft focus). */
  readonly osmCredit?: string;
  /** players/find-map.png (1170x1320). */
  readonly mapSrc?: string;
  /** players/find-map-preview.png (1170x1320, venue blurred). */
  readonly previewSrc?: string;
  /** mobile/map.png (1170x2532): the same event-map page; its rows under the map carry both files on in soft focus. */
  readonly pageSrc?: string;
  readonly colors?: RallyoColors;
};

/** Both map files are 1320 rows; the swipe box is 1780 su (the continuation's extent), so mid-swipe the incoming
 * screen follows right behind the outgoing one (a 2532 su travel left the whole stage empty over 1076–1078). */
const FILE_H = 1320;
const SWIPE_BOX_H = 1780;

/** Phone base: screen x 131, top y 600, w 720 → k = 720 / 1170 = .6154. */
const PHONE = phonePlacement(131, 600, 720);

const MAP_SOURCE = { x: 0, y: 220, w: 1170, h: 780 };
const MAP_FRAME = { x: 92, y: 600, w: 798, h: 532 };
/**
 * Camera P (draft v5): the whole card from its top edge (file y 222) to the foot of `See full details` (y 938) at
 * k .770: card frame x 227–892, y 586–1200. The card's top clears the stage fade (clip 560 → clear at 584); the link's
 * underline ends at y 1137, above the rail tray's frost (pill top 1170 − 34 px), and the pin hangs at x 522–598.
 */
const CARD_SOURCE = { x: 153, y: 222, w: 864, h: 716 };
const CARD_FRAME = { x: 227, y: 586, w: 665, h: 551 };
/** Tap point (file px): below-right of `Request to join →` (text x 601–916, y 890–938), under the arrow. */
const TAP_TARGET = { x: 898, y: 962 };

/** Uniform push `p` of an existing framing about canvas point (cx, cy). */
const pushFraming = (t: CameraTransform, p: number, cx: number, cy: number): CameraTransform => ({
  scale: t.scale * p,
  translateX: p * t.translateX + (1 - p) * cx,
  translateY: p * t.translateY + (1 - p) * cy,
});

const T_MAP = rectToTransform(MAP_SOURCE, MAP_FRAME, PHONE);
const T_CARD = rectToTransform(CARD_SOURCE, CARD_FRAME, PHONE);
/** Tap point under Camera P at rest: the drift pivots on it, so the ripple and the label never part. */
const TAP_CANVAS = sourceToCanvas(TAP_TARGET, PHONE, T_CARD);
const TAP_POINT = { x: Math.round(TAP_CANVAS.x), y: Math.round(TAP_CANVAS.y) };

/** The swipe (local 51–63) and its ease, as ScreenSwipe runs it (the incoming page's offset is boxH × (1 − ease)). */
const SWIPE_AT = 51;
const SWIPE_FRAMES = 12;
const SWIPE_EASE = Easing.bezier(0.83, 0, 0.17, 1);
/**
 * The swipe's ease leaves a long tail (the card is still 131 / 61 / 23 px low at 1079 / 1080 / 1081), which dragged
 * `See full details` under the pill on the landing frames. From local 59 the camera rides 75% of that tail: it holds
 * Camera P's scale and sits `TAIL_RIDE` × the remaining offset higher, so the card lands 33 / 15 / 6 px low instead
 * and the link never passes under the pill; the bezel's vertical drift is the only other thing that moves.
 */
const TAIL_RIDE = 0.75;
const swipeOffset = (f: number): number =>
  SWIPE_BOX_H * (1 - SWIPE_EASE(Math.min(1, Math.max(0, (f - SWIPE_AT) / SWIPE_FRAMES))));
const K_CANVAS = T_CARD.scale * PHONE.k;
const cardRiding = (f: number): CameraTransform => ({
  ...T_CARD,
  translateY: T_CARD.translateY - TAIL_RIDE * swipeOffset(f) * K_CANVAS,
});

const CAMERA_MOVES: readonly CameraMove[] = [
  { start: 0, end: 0, sourceRect: MAP_SOURCE, frameRect: MAP_FRAME },
  { start: 33, end: 51, transform: pushFraming(T_MAP, 1.012, 491, 866), ease: "linear" },
  // One move, Camera A → Camera P (riding the tail), with the swipe; then the tail, frame by frame. The only keys off
  // the 3 f grid (59–62): they track ScreenSwipe's own per-frame ease, so they cannot sit on it.
  { start: 51, end: 59, transform: cardRiding(59) },
  { start: 59, end: 60, transform: cardRiding(60), ease: "linear" },
  { start: 60, end: 61, transform: cardRiding(61), ease: "linear" },
  { start: 61, end: 62, transform: cardRiding(62), ease: "linear" },
  { start: 62, end: 63, transform: T_CARD, ease: "linear" },
  { start: 63, end: 105, transform: pushFraming(T_CARD, 1.01, TAP_POINT.x, TAP_POINT.y), ease: "linear" },
];

/** Camera k per framing (in-screen strokes / radii / blurs are canvas px ÷ k). */
const K_MAP = 0.682;
const K_CARD = 0.7696;

/** Map viewport (file rows 204–1320 under the header): soft night edges so no cut label or icon shows. */
const MAP_EDGE = { top: 204, bottom: 1320, left: 36, right: 30, topH: 32 };
/** `mobile/map.png`: its map ends at row 1322; row 1323 (the page's first night row) is drawn at file row 1320. */
const PAGE_ROW = 1323;
/**
 * Map soft focus (Camera A): from file row 1064 (spec 1100: its 24 su feather ends above `Mabini`, y 1090–1114, which
 * 1100 sliced in half), then the page under the file's end, opaque to su 1700 (frame ≈ 1609), clear at 1780.
 */
const MAP_SOFT = { y: 1064, end: SWIPE_BOX_H, feather: 80, tintFile: 0.3, tintPage: 0.08, lift: 1.25 };
/** The legend chip (x 48–522, y 1117–1247), padded: dimmed a further 45% inside the soft focus. */
const LEGEND = { x: 30, y: 1100, w: 510, h: 165 };
/**
 * Preview soft focus (open item 5): from file row 1160 (below the pin), then the page under the file's end (frame
 * ≈ 1451 under Camera P). The zoomed street map is darker than the region map, so its soft part is lifted more.
 */
const PREVIEW_SOFT = { y: 1160, end: SWIPE_BOX_H, feather: 80, tintFile: 0.1, tintPage: 0.08, lift: 1.45 };

/** The `Request to join →` button with a margin of the card's paper (press tile). */
const REQUEST_BUTTON = { x: 548, y: 851, w: 422, h: 127 };
const TAP_AT = 75;
/** Soft copies are drawn this far past both screen edges (then clipped), so their blurred edges stay opaque. */
const BLUR_MARGIN = 80;
/** The page continuation's blur (canvas px): its 85 su `EVENT MAP` heading must read as a glow, never as letters. */
const PAGE_SIGMA = 28;
/**
 * Stage clip (draft v5: 560, was 570), so Camera P's card top (586) sits clear of the 24 px fade. Under Camera A the
 * clip shows file rows ≥ 161: the header's night band (rows 168–203; the chip's outline ends at 166, inside the fade).
 */
const STAGE_CLIP = 560;
/** The incoming page's header (rows 0–204, with the sample chip): the real header stays put on a row tap. */
const HEADER_H = 206;

type SoftLowerProps = {
  readonly label: string;
  readonly src: string;
  /** The page the file was cut from (drawn under the file's end in its own, wider blur; both blurs meet on night). */
  readonly pageSrc: string;
  /** Soft layer extent in file rows: starts at `y` (24 su feather in), clear by `end` (`feather` su out). */
  readonly soft: {
    readonly y: number;
    readonly end: number;
    readonly feather: number;
    /** Night tint over the file's soft rows (the spec's 30%) and over the page continuation. */
    readonly tintFile: number;
    readonly tintPage: number;
    /** Brightness of the blurred copy (the dark map / page would otherwise read as flat night under the scrim). */
    readonly lift: number;
  };
  /** Camera k: σ 12 canvas px = 12 / k su. */
  readonly k: number;
  readonly children?: React.ReactNode;
};

/**
 * The lower-stage soft focus (players spec section 4; draft v5, v4 craft #3): an in-screen blurred copy of the file
 * (σ 12 canvas px) from `soft.y`, carried on under the file's end by the real page below the map (`mobile/map.png`
 * from row 1323: `EVENT MAP`, the lead line, the search field), in the same blur so no seam shows. The copy is lifted
 * (`lift`) and lightly tinted, so under the Stage scrim (clear at 1290 → 85% at 1590) it reads as lit, soft device
 * imagery rather than night; it feathers out to the phone's screen at `end`.
 */
const SoftLower: React.FC<SoftLowerProps> = ({ label, src, pageSrc, soft, k, children }) => {
  const h = soft.end - soft.y;
  const opaqueTo = h - soft.feather;
  const fileH = FILE_H - soft.y;
  return (
    <Interactive.Div
      name={`${label} soft focus`}
      style={{
        position: "absolute",
        left: 0,
        top: soft.y,
        width: 1170,
        height: h,
        overflow: "hidden",
        maskImage: `linear-gradient(180deg, transparent 0px, black 24px, black ${opaqueTo}px, transparent 100%)`,
      }}
    >
      {src ? (
        <Interactive.Div
          name={`${label} soft copy`}
          style={{
            position: "absolute",
            left: -BLUR_MARGIN,
            top: -soft.y,
            width: 1170 + 2 * BLUR_MARGIN,
            height: FILE_H + 120,
            // Opaque night, wider than the screen: the blur's edges never turn see-through (the sharp file under them
            // would show as a strip ending in a step at the file's end).
            backgroundColor: RALLYO_COLORS.night,
            filter: `blur(${(12 / k).toFixed(2)}px) brightness(${soft.lift.toFixed(2)})`,
          }}
        >
          <Img
            name={`${label} lower (soft)`}
            src={asset(src)}
            style={{ position: "absolute", left: BLUR_MARGIN, top: 0, width: 1170, height: FILE_H, maxWidth: "none" }}
          />
        </Interactive.Div>
      ) : null}
      {pageSrc ? (
        // The page below the map, in its own, wider blur (PAGE_SIGMA): its first 80 rows are night, so the two blurs
        // meet on night and no seam shows.
        <Interactive.Div
          name={`${label} page continuation`}
          style={{
            position: "absolute",
            left: -BLUR_MARGIN,
            top: fileH,
            width: 1170 + 2 * BLUR_MARGIN,
            height: soft.end + 60 - FILE_H,
            // Clips the page's own map rows (above PAGE_ROW): only the page under the map is drawn.
            overflow: "hidden",
            backgroundColor: RALLYO_COLORS.night,
            filter: `blur(${(PAGE_SIGMA / k).toFixed(2)}px) brightness(${soft.lift.toFixed(2)})`,
          }}
        >
          <Img
            name={`${label} page (soft)`}
            src={asset(pageSrc)}
            style={{ position: "absolute", left: BLUR_MARGIN, top: -PAGE_ROW, width: 1170, height: 2532, maxWidth: "none" }}
          />
        </Interactive.Div>
      ) : null}
      <Interactive.Div
        name={`${label} soft tint`}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(180deg, rgba(11, 19, 13, ${soft.tintFile}) 0px, rgba(11, 19, 13, ${soft.tintFile}) ${fileH - 40}px, rgba(11, 19, 13, ${soft.tintPage}) ${fileH + 40}px, rgba(11, 19, 13, ${soft.tintPage}) 100%)`,
        }}
      />
      {children}
    </Interactive.Div>
  );
};

const PlayersFindSceneInner: React.FC<PlayersFindSceneProps> = ({
  headline1 = "FIND A",
  headline2 = "GAME.",
  osmCredit = "© OpenStreetMap contributors",
  mapSrc = "rallyo/screens/players/find-map.png",
  previewSrc = "rallyo/screens/players/find-map-preview.png",
  pageSrc = "rallyo/screens/mobile/map.png",
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: colors.night }} />
      <Stage name="Stage" clipTop={STAGE_CLIP} color={colors.night}>
        <CameraRig name="Camera" screen={PHONE} moves={CAMERA_MOVES}>
          <PhoneFrame
            name="Phone"
            screenX={131}
            screenY={600}
            screenW={720}
            island={false}
            style={{
              translate: interpolate(frame, [12, 33], ["0px 180px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              rotate: interpolate(frame, [12, 33], ["-6deg", "0deg"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              scale: interpolate(frame, [12, 33], [0.94, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                output: "perceptual-scale",
              }),
            }}
          >
            <ScreenSwipe
              name="Swipe to preview"
              at={SWIPE_AT}
              frames={SWIPE_FRAMES}
              direction="from-bottom"
              boxH={SWIPE_BOX_H}
              before={
                <>
                  <ScreenImage name="Event map" src={mapSrc} sourceH={FILE_H} />
                  <Interactive.Div
                    name="Map edge left"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: MAP_EDGE.top,
                      width: MAP_EDGE.left,
                      height: MAP_EDGE.bottom - MAP_EDGE.top,
                      backgroundImage: `linear-gradient(90deg, ${colors.night} 0%, ${colors.night} 45%, rgba(11, 19, 13, 0) 100%)`,
                    }}
                  />
                  <Interactive.Div
                    name="Map edge right"
                    style={{
                      position: "absolute",
                      left: 1170 - MAP_EDGE.right,
                      top: MAP_EDGE.top,
                      width: MAP_EDGE.right,
                      height: MAP_EDGE.bottom - MAP_EDGE.top,
                      backgroundImage: `linear-gradient(270deg, ${colors.night} 0%, ${colors.night} 45%, rgba(11, 19, 13, 0) 100%)`,
                    }}
                  />
                  <Interactive.Div
                    name="Map edge top"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: MAP_EDGE.top - 8,
                      width: 1170,
                      height: MAP_EDGE.topH,
                      backgroundImage: `linear-gradient(180deg, ${colors.night} 0%, ${colors.night} 40%, rgba(11, 19, 13, 0) 100%)`,
                    }}
                  />
                  {/* Soft focus under the map: legend chip + real OSM strip as soft shapes, then the page below the map. */}
                  <SoftLower label="Map" src={mapSrc} pageSrc={pageSrc} soft={MAP_SOFT} k={K_MAP}>
                    {/* The soft legend chip is the brightest thing under the rail: a further 45% night, feathered. */}
                    <Interactive.Div
                      name="Legend soft dim"
                      style={{
                        position: "absolute",
                        left: LEGEND.x,
                        top: LEGEND.y - MAP_SOFT.y,
                        width: LEGEND.w,
                        height: LEGEND.h,
                        borderRadius: 60,
                        backgroundColor: colors.night,
                        opacity: 0.45,
                        filter: "blur(18px)",
                      }}
                    />
                  </SoftLower>
                  <PinPulse
                    name="Pin pulse Carmen"
                    x={333}
                    y={951}
                    at={42}
                    frames={18}
                    radiusStart={24 / K_MAP}
                    radiusEnd={48 / K_MAP}
                    ringWidth={4 / K_MAP}
                  />
                  <PinPulse
                    name="Pin pulse Tagum"
                    x={837}
                    y={570}
                    at={45}
                    frames={18}
                    radiusStart={24 / K_MAP}
                    radiusEnd={64 / K_MAP}
                    ringWidth={4 / K_MAP}
                  />
                </>
              }
              after={
                <>
                  <ScreenImage name="Map preview" src={previewSrc} sourceH={FILE_H} />
                  {/* Soft focus from source y 1160 (lower street labels, the real OSM strip), then the page below the
                      map under the file's end (frame ≈ 1451 under Camera P). */}
                  <SoftLower label="Preview" src={previewSrc} pageSrc={pageSrc} soft={PREVIEW_SOFT} k={K_CARD} />
                  {frame >= TAP_AT - 1 && frame <= TAP_AT + 7 ? (
                    <UiTile
                      name="Request to join press"
                      src={previewSrc}
                      crop={REQUEST_BUTTON}
                      sourceW={1170}
                      sourceH={FILE_H}
                      zoom={1}
                      radius={0}
                      borderWidth={0}
                      shadow="none"
                      fillColor={colors.paper}
                      style={{
                        left: REQUEST_BUTTON.x,
                        top: REQUEST_BUTTON.y,
                        scale: interpolate(frame, [75, 78, 81], [1, 0.97, 1], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                          easing: Easing.bezier(0.16, 1, 0.3, 1),
                          output: "perceptual-scale",
                        }),
                      }}
                    />
                  ) : null}
                  {/* Incoming veil (v4 accuracy #3): the white card crosses the lower stage on the whip frames (57 most),
                      so the incoming page stays under night until it is almost home, then clears by 60. */}
                  <Interactive.Div
                    name="Incoming veil"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: 1170,
                      height: SWIPE_BOX_H,
                      backgroundColor: colors.night,
                      opacity: interpolate(frame, [51, 54, 57, 60], [0.55, 0.55, 0.75, 0], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      }),
                    }}
                  />
                  {/* The header stays put on a row tap, so the incoming copy never swipes in (it streaked under the rail
                      over 1075–1080); at rest it sits above the stage clip anyway. */}
                  <Interactive.Div
                    name="Incoming header cover"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: 1170,
                      height: HEADER_H,
                      backgroundColor: colors.night,
                    }}
                  />
                </>
              }
            />
          </PhoneFrame>
        </CameraRig>
        <TapRipple name="Tap Request to join" x={TAP_POINT.x} y={TAP_POINT.y} at={TAP_AT} dotLead={3} />
      </Stage>
      {/* Map attribution (legal credit; exempt from the size and reading rules), held while any map shows. Draft v5: on
          the night above the stage's top edge, so the rail band is free for the card's foot and its pin. */}
      <Interactive.Div
        name="OSM credit"
        style={{
          position: "absolute",
          right: 1080 - 900,
          top: 524,
          display: "flex",
          justifyContent: "flex-end",
          opacity: interpolate(frame, [24, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <div
          style={{
            ...uiText(500, { size: 26, color: colors.senderGrey, lineHeight: 28 / 26 }),
            whiteSpace: "nowrap",
            textAlign: "right",
          }}
        >
          {osmCredit}
        </div>
      </Interactive.Div>
      <KineticText
        name="Headline line 1"
        from={21}
        text={headline1}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.fg }), position: "absolute", left: 72, top: 296 }}
      />
      <KineticText
        name="Headline line 2"
        from={25}
        text={headline2}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.lime }), position: "absolute", left: 72, top: 377 }}
      />
    </>
  );
};

const playersFindSceneSchema = {
  headline1: { type: "string", default: "FIND A", description: "Headline line 1" },
  headline2: { type: "string", default: "GAME.", description: "Headline line 2 (lime)" },
  osmCredit: { type: "string", default: "© OpenStreetMap contributors", description: "Map credit" },
  mapSrc: { type: "asset", assetType: "image", default: "rallyo/screens/players/find-map.png", description: "Event map" },
  previewSrc: { type: "asset", assetType: "image", default: "rallyo/screens/players/find-map-preview.png", description: "Map preview" },
  pageSrc: { type: "asset", assetType: "image", default: "rallyo/screens/mobile/map.png", description: "Page under the map (soft)" },
} as const satisfies InteractivitySchema;

export const PlayersFindScene = Interactive.create({
  Component: PlayersFindSceneInner,
  layout: "absolute-fill",
  schema: playersFindSceneSchema,
});
