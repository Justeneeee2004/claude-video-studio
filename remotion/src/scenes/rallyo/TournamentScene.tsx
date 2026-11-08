import type React from "react";
import { Easing, Img, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { Connector, RoughBox, RoughRing, RowFlash } from "../../elements/Annotate";
import {
  CameraRig,
  IDENTITY,
  rectToTransform,
  sourceToCanvas,
  type CameraTransform,
  type Rect,
} from "../../elements/CameraRig";
import { ChaosChip } from "../../elements/ChaosChip";
import { KineticText } from "../../elements/KineticText";
import { LaptopFrame, laptopPlacement } from "../../elements/LaptopFrame";
import { Cursor } from "../../elements/Pointer";
import { ScreenImage, ScreenSwipe, ScrollShot } from "../../elements/ScreenMedia";
import { UiTile } from "../../elements/UiTile";
import { Stage } from "../../layers/Stage";
import { asset } from "../../lib/assets";
import { displayText, RALLYO_COLORS, type RallyoColors } from "../../theme/rallyo";

/**
 * S9 · Tournament day (abs 855–1020, 165 f): "Tournament? Auto-call on." → "Winners move up."
 * Brief v2.3 section 6 S9 + contract section 6 / 13. Local frame = abs − 855. In: T8 slide from-bottom (0–15).
 * Out: hard cut at 165 under ChapterWipe 02 (its panel rises over local 153–165).
 *
 * Draft v4 (residual-s9: v3 craft #2 / #8 / #15, accuracy #4 / #10). The two pointed-at labels now read at ≈ 20 px
 * x-height (source x-height 13.5 px for `Auto-call: on` and the bracket names, so k ≈ 1.45–1.48):
 *
 * Toolbar shot (local 0–60)
 * - 0: LaptopFrame base (screen x 71–911, top y 590, k .2917) on the console ScrollShot at scrollY 0. The venue
 *   line under the event title (source x 121–940, y 590–618) is blurred in place and never inside a push rect.
 * - 2–12: chip `BE` `Where's the bracket?` slides in (landed 12 = abs 867).
 * - 9–21: camera push (4 motion-blur samples) to three WHOLE toolbar buttons `Sign-off: Quick · Auto-call: on ·
 *   End tournament` (source x 1964–2712, y 154–226 → frame x 98–883, y 762–838, k 1.05), held 21–24. The bar's
 *   left buttons (`Share public page`, `Umpires`) are painted with the bar's flat lime; night patches cover the page
 *   left of the stats, the stats row in place and the page under the divider.
 * - Band ends (craft #8): canvas soft caps end the lime band inside x 36–1044 (full night at the frame edges, no
 *   olive stub, no hard screen edge at x 1066), and a canvas cover hides the lid bezel's dark rule at y 574–604.
 * - 24–36: push-in ×1.39 about the cursor tip (551, 815) (k 1.05 → 1.459; `Auto-call: on` x 298–610, x-height ≈ 19.7
 *   px → 19.9 with the 36–60 drift 1.01 about the same point). Rack focus over the same frames: `Sign-off: Quick`
 *   and `End tournament` go soft (σ ≈ 12 canvas px) and run into the caps and side fades as context, the pointed-at
 *   button stays sharp (a same-pixel crop on top), `Home` fades to night before the clip could cut it.
 * - 15–24: stats tile (`18 Teams · 5/23 Matches done · 4 Courts`, the console's own stats row at .8 of the page
 *   scale) fades in under the bar, centred on `Auto-call: on` (x 173–733, y 905–1069 at k 1.459), with a soft-focus
 *   copy of the console's court cards (blur + 55% night, feathered) under it to ≈ 1450, so the rail sits on a soft
 *   area (band y 1300–1450 luma ≈ 60 / σ 34, as v3). Both live INSIDE the screen (accuracy #10): they ride the push
 *   and leave with the swipe; nothing floats.
 * - 21 / 23 / 25: h1 `TOURNAMENT?` / `AUTO-CALL ON.` words (K1) → landed 34; exits 88–94 (K5).
 * - 21–33: cursor fades in at (880, 940) (right of the tile: it never crosses the stats), glides 24–33 onto the
 *   push's fixed point (551, 815), the tip just under the baseline of `on` (the label stays readable), hovers to 57
 *   (fades 57–63). It NEVER clicks.
 * - 45–54: night-ink RoughRing on `Auto-call: on` (abs 900, bar 15 downbeat), 9 f after the push-in lands.
 *
 * Bracket shot (local 60–165)
 * - 60–72: in-laptop ScreenSwipe from-bottom (smear dim .15) to the bracket, camera (3 motion-blur samples) to B1.
 *   The bracket is shifted inside the incoming box (BRACKET_SHIFT) so it arrives under the toolbar's window: a
 *   straight scroll, and the window crosses the swipe fill (soft court cards) on the way: stage luma (rail excluded)
 *   28 / 39 / 50 / 29 over abs 920–923 (v3: 22 / 13 / 14 / 16), peak ≤ 99, no white smear (craft #15, accuracy #10).
 * - B1 (72–90): the QUARTERFINALS column, k 1.431 → 1.445 (drift 1.01): `Diego A. / Marcus T.` card y 604–858 and the
 *   focal `Josh T. / Rico S.` card x 81–688, y 894–1147 (names ≈ 19.5 px x-height), 23 px above the rail. The
 *   SEMIFINALS column runs off the right edge in soft focus (σ ≈ 12 px + 20% night).
 * - 81–93: lime RoughBox on the QF card.
 * - 90–102: the camera follows the winner (3 motion-blur samples, with the connector 90–105): pan to B2, the SF card
 *   `Diego A. / Marcus T. · Josh T. / Rico S. · READY · WAITING FOR A COURT` x 196–803, y 748–1001; rack focus: the
 *   SF column sharpens, the QF column goes soft and leaves under the left fade (only its boxed right end and the
 *   connector lead in; the QF box eases to 35% over 93–105). FINAL · BO3 (x ≥ 1012) and SCORE LOG stay night.
 * - 94 / 96 / 98: h2 `WINNERS` / `MOVE UP.` words (K1) → landed 107, same slot A.
 * - 102–114: RowFlash lime on the SF row `Josh T. / Rico S.` (ding on bar 16 = local 105).
 * - 108–120: lime RoughBox around the WHOLE SF slot (padding 10 px): no stroke crosses a name.
 * - 102–165: drift 1.02 about (500, 1000) (SF card x 190–809 by 165, box ≤ x 822).
 * - Lower stage: the rows under the focal cards (Migs D., Luis M., the second SF slot) are an in-screen soft copy
 *   (σ ≈ 12 px + 10% night, 22 su ramp from source y 1068), so device imagery runs on to ≈ 1450 under the
 *   1290 → 1590 fade (band y 1300–1450 luma 26 / σ 9.4 at B1, 24 / 10.7 at B2) and the rail sits on soft shapes.
 * - 120: chip strike + ✓.
 * Annotation strokes and paddings inside the laptop are canvas px ÷ the camera k at their draw frame.
 */

type TournamentSceneProps = {
  readonly chipSender?: string;
  readonly chipText?: string;
  readonly headline1?: string;
  readonly headline2?: string;
  /** Second headline (swaps into slot A at local 94), line 1, e.g. "WINNERS". */
  readonly secondLine1?: string;
  /** Second headline line 2 (lime), e.g. "MOVE UP.". */
  readonly secondLine2?: string;
  readonly consoleSrc?: string;
  readonly bracketSrc?: string;
  readonly colors?: RallyoColors;
};

/** Laptop base: screen x 71, top y 590, w 840 → k = 840 / 2880 = .2917 (console at scrollY 0). */
const LAPTOP = laptopPlacement(71, 590, 840, 0);

/** Uniform push `p` of an existing framing about canvas point (cx, cy). */
const pushFraming = (t: CameraTransform, p: number, cx: number, cy: number): CameraTransform => ({
  scale: t.scale * p,
  translateX: p * t.translateX + (1 - p) * cx,
  translateY: p * t.translateY + (1 - p) * cy,
});

/** Same framing moved by (dx, dy) canvas px (a pure pan: CameraRig interpolates it linearly in translate). */
const panFraming = (t: CameraTransform, dx: number, dy: number): CameraTransform => ({
  scale: t.scale,
  translateX: t.translateX + dx,
  translateY: t.translateY + dy,
});

/**
 * Camera A (local 9–21): three whole toolbar buttons at k 1.05. Measured buttons: `Share public page` x 1494–1772,
 * `Umpires` 1788–1948, `Sign-off: Quick` 1964–2206, `Auto-call: on` 2222–2436, `End tournament` 2452–2712, all
 * y 154–226; lime bar y 130–250, flat #C8F23A across the whole capture (x 0–2880).
 */
const TOOLBAR_SOURCE = { x: 1964, y: 154, w: 748, h: 72 };
const TOOLBAR_FRAME = { x: 98, y: 762, w: 785, h: 76 };
const TOOLBAR = rectToTransform(TOOLBAR_SOURCE, TOOLBAR_FRAME, LAPTOP);

/** Cursor tip = source (2396, 204), 5 px under the baseline of `on`, at the k 1.05 framing: canvas (551, 815). */
const TIP_SOURCE = { x: 2396, y: 204 };
const TIP_RAW = sourceToCanvas(TIP_SOURCE, LAPTOP, TOOLBAR);
const TIP = { x: Math.round(TIP_RAW.x), y: Math.round(TIP_RAW.y) };

/** Push-in 24–36 ×1.39 about the tip: k 1.459 (`Auto-call: on` x-height 13.5 su → 19.7 px). */
const TOOLBAR_PUSH = pushFraming(TOOLBAR, 1.39, TIP.x, TIP.y);
/** Hold drift 36 → 60, linear: 1.01 about the tip (k 1.473 at 60), so the cursor stays on `on`. */
const TOOLBAR_DRIFT = pushFraming(TOOLBAR_PUSH, 1.01, TIP.x, TIP.y);

/**
 * The bracket capture sits in the swipe's incoming box shifted by (+1690, −626) box px, so its QF / SF cards arrive
 * under the toolbar's own window (box x ≈ 1790–2650, y ≈ 54–650): the 60–72 swipe is a straight vertical scroll with
 * a 270 su side drift (draft v3 panned ≈ 2000 su across dark patches, which emptied the stage over abs 920–923).
 * Everything inside the bracket layer keeps bracket px; only camera rects add the shift. Visible: bracket x 0–1190,
 * y 626–1800 (box x 1690–2880, y 0–1174); the rest of the box is night.
 */
const BRACKET_SHIFT = { x: 1690, y: -626 };
/**
 * B1 (local 72): the two QUARTERFINALS cards (bracket x 120–540, y 690–1066: `Diego A. / Marcus T.` and the focal
 * `Josh T. / Rico S.` card y 891–1066) → frame x 84–685, y 608–1146 (k 1.431; names 13.5 su → 19.3 px x-height).
 */
const B1_SOURCE = { x: 120 + BRACKET_SHIFT.x, y: 690 + BRACKET_SHIFT.y, w: 420, h: 376 };
const B1_FRAME = { x: 84, y: 608, w: 601, h: 538 };
const B1 = rectToTransform(B1_SOURCE, B1_FRAME, LAPTOP);
/** Hold drift 72 → 90, linear: 1.01 about the focal QF card centre (385, 1021). */
const B1_DRIFT = pushFraming(B1, 1.01, 385, 1021);
/** B2 (local 102): pan right along the connector so the SF card's left edge (source x 576) lands on canvas x 196. */
const B2 = panFraming(B1_DRIFT, 196 - sourceToCanvas({ x: 576 + BRACKET_SHIFT.x, y: 0 }, LAPTOP, B1_DRIFT).x, 0);
/** Hold drift 102 → 165, linear: 1.02 about (500, 1000) (the QF box's tail stays ≥ 12 px above the rail). */
const B2_DRIFT = pushFraming(B2, 1.02, 500, 1000);

/** Camera k at the draw frames (strokes / paddings inside the laptop are canvas px ÷ k). */
const K_RING = 1.465;
const K_QF = 1.44;
const K_SF = 1.45;

/** The console's venue line in full-image px (measured: x 121–940, y 590–618), padded. */
const VENUE = { x: 100, y: 574, w: 880, h: 60 };

/**
 * Console night patch for the toolbar shot (full-image px): everything left of the stats from below the lime bar to
 * above the divider (title, venue, division chips, court chips; the stats start at x 2332, the divider is at y 952).
 */
const PAGE_PATCH = { x: 0, y: 300, w: 2010, h: 630 };
/**
 * Everything under the divider (y 952): the EQUAL GP panel, the `All courts are playing` strip, the IN GAME / UP NEXT
 * / STANDINGS headings, court cards and the standings dropdown: night (never in a framing; mid-swipe the window
 * crosses the soft fill below instead).
 */
const LOWER_PATCH = { x: 0, y: 930, w: 2880, h: 870 };
/** `Share public page` + `Umpires` (x 1494–1948, y 154–226), painted with the bar's flat lime for the push. */
const BAR_PATCH = { x: 1470, y: 146, w: 487, h: 88 };
/** The stats row in place (`18 Teams · 5/23 Matches done · 4 Courts`, x 2332–2760, y 790–895): shown as a tile. */
const STATS_PATCH = { x: 2290, y: 760, w: 520, h: 160 };
/** `Home` (x 2528–2712, y 24–104): night from 24, so the push-in never leaves it cut by the stage clip. */
const HOME_PATCH = { x: 2512, y: 12, w: 216, h: 104 };
/**
 * Rack focus on the bar's neighbours (24–36): a blurred copy of the bar from x 1950 (Umpires is already lime) to
 * the capture's edge. In the blurred source `Umpires` and `Auto-call: on` are flat lime and the band runs on 40 su
 * above and below, so the soft copy meets the sharp bar seamlessly; the pointed-at button is a sharp crop on top.
 */
const BAR_SOFT = { x: 1950, y: 130, w: 930, h: 120 };
const AUTOCALL_CROP = { x: 2216, y: 146, w: 226, h: 88 };
/** Stats tile: the console's stats crop at .8 of the page scale, centred on `Auto-call: on` (x 2329), under the bar. */
const STATS_CROP = { x: 2304, y: 770, w: 480, h: 142 };
const STATS_TILE_ZOOM = 0.8;
const STATS_TILE_AT = { x: 2329 - (STATS_CROP.w * STATS_TILE_ZOOM) / 2, y: 266 };
/**
 * Soft backdrop under the tile (in-screen, source px): the console's own lower page from the IN GAME row (source
 * x 120–2760, y 1640–2700: court cards, MATCH HISTORY, UP NEXT, standings) scaled to 892 su wide at x 1939–2831,
 * y 434–792 (canvas y 1041–1417 at k 1.05; 1150–1672 at k 1.46, so the band under the rail carries soft cards, not
 * the dark EQUAL GP panel), blurred, 40% night, feathered. Nothing in it is readable.
 */
const CONSOLE_SOFT_SOURCE = { x: 120, y: 1640, w: 2640, h: 1060 };
const CONSOLE_SOFT_AT = { x: 1939, y: 434, w: 892 };
const K_CONSOLE_SOFT = CONSOLE_SOFT_AT.w / CONSOLE_SOFT_SOURCE.w;
/**
 * Swipe fill (craft #15 / accuracy #10): the bottom of the console box (x 1800–2880, y 996–1800) is what the window
 * crosses at abs 921–922. It carries a soft copy of the console's own IN GAME row (source x 120–1110, y 1500–2240:
 * the court strip, the headings and the two court cards, which meet the incoming bracket) at 1.08, blur + 55% night,
 * so the stage streams soft imagery instead of dipping to empty night. Below canvas y 1950 at k 1.46: never seen at
 * rest.
 */
const CONSOLE_FILL_SOURCE = { x: 120, y: 1500, w: 990, h: 740 };
const CONSOLE_FILL_AT = { x: 1800, y: 996 };
const K_CONSOLE_FILL = 1.08;

/** Bracket SCORE LOG panel (measured x 120–2759, y 1518–1639), patched to night under the bracket. */
const SCORE_LOG_PATCH = { x: 100, y: 1504, w: 2700, h: 150 };
/** FINAL · BO3 column (label x 1032–1187 y 645–663, card x 1032–1452 y 991–1164): night, never a cut card. */
const FINAL_PATCH = { x: 1012, y: 545, w: 1868, h: 960 };
/** Column soft focus above the rows (rack focus 90–102): QUARTERFINALS x 100–558, SEMIFINALS x 558–1012. */
const QF_COLUMN_SOFT = { x: 100, y: 600, w: 458, h: 468 };
const SF_COLUMN_SOFT = { x: 558, y: 600, w: 454, h: 468 };
/**
 * Soft focus under the focal cards (the Josh T. QF card ends at y 1066, the Migs D. card starts at 1090): the Migs D.
 * and Luis M. QF cards and the second SF slot blur from y 1068 (22 su ramp), so the rail band sits on soft shapes.
 */
const BRACKET_SOFT = { x: 100, y: 1068, w: 912, h: 436 };
const BRACKET_SOFT_RAMP = 22;
/** Bracket soft-focus sigma: ≈ 12 canvas px at k 1.45 (players-chapter treatment). */
const BRACKET_BLUR = 8.3;

type SoftFill = { readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly color: string };

/**
 * In-screen soft copy of a capture region (source px): the capture (plus optional flat fills, painted BEFORE the
 * blur so they never bleed dark edges) blurred by `blurPx` inside a box padded by 3σ, then clipped to `region`,
 * under a night `tint`. Same pixels as the capture, so it rides the camera and every swipe.
 */
const SoftCopy: React.FC<{
  readonly label: string;
  readonly src: string;
  readonly imageW: number;
  readonly imageH: number;
  readonly region: Rect;
  readonly blurPx: number;
  readonly tint: number;
  readonly tintColor: string;
  readonly fills?: readonly SoftFill[];
  readonly mask?: string;
  readonly opacity?: number;
}> = ({ label, src, imageW, imageH, region, blurPx, tint, tintColor, fills = [], mask, opacity = 1 }) => {
  const m = Math.ceil(blurPx * 3);
  const ox = region.x - m;
  const oy = region.y - m;
  return (
    <Interactive.Div
      name={label}
      style={{
        position: "absolute",
        left: region.x,
        top: region.y,
        width: region.w,
        height: region.h,
        overflow: "hidden",
        maskImage: mask,
        opacity,
      }}
    >
      <Interactive.Div
        name={`${label} · blur`}
        style={{
          position: "absolute",
          left: -m,
          top: -m,
          width: region.w + 2 * m,
          height: region.h + 2 * m,
          overflow: "hidden",
          filter: `blur(${blurPx.toFixed(2)}px)`,
        }}
      >
        {src ? (
          <Img
            name={`${label} · capture`}
            src={asset(src)}
            style={{ position: "absolute", left: -ox, top: -oy, width: imageW, height: imageH, maxWidth: "none" }}
          />
        ) : null}
        {fills.map((f, i) => (
          <Interactive.Div
            key={`${label}-fill-${f.x}-${f.y}`}
            name={`${label} · fill ${i + 1}`}
            style={{ position: "absolute", left: f.x - ox, top: f.y - oy, width: f.w, height: f.h, backgroundColor: f.color }}
          />
        ))}
      </Interactive.Div>
      {tint > 0 ? (
        <Interactive.Div
          name={`${label} · tint`}
          style={{ position: "absolute", inset: 0, backgroundColor: tintColor, opacity: tint }}
        />
      ) : null}
    </Interactive.Div>
  );
};

const TournamentSceneInner: React.FC<TournamentSceneProps> = ({
  chipSender = "BE",
  chipText = "Where's the bracket?",
  headline1 = "TOURNAMENT?",
  headline2 = "AUTO-CALL ON.",
  secondLine1 = "WINNERS",
  secondLine2 = "MOVE UP.",
  consoleSrc = "rallyo/screens/desktop/host-tournament-console-davao-fall-classic-full.png",
  bracketSrc = "rallyo/screens/desktop/demo-tournament-bracket-mhi.png",
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: colors.night }} />
      {/* Lower scrim: the standard soft fade (clear to 1290, full NIGHT by 1590), so the soft rows run to ≈ 1450 while
          the console foot and the laptop deck never show, and no grey base line crosses the frame. */}
      <Stage name="Stage" clipTop={570} color={colors.night} scrimTop={1290} scrimBottom={1590} scrimOpacity={1}>
        <CameraRig
          name="Camera"
          screen={LAPTOP}
          moves={[
            { start: 0, end: 0, transform: IDENTITY },
            { start: 9, end: 21, sourceRect: TOOLBAR_SOURCE, frameRect: TOOLBAR_FRAME, blur: 4 },
            { start: 24, end: 36, transform: TOOLBAR_PUSH },
            { start: 36, end: 60, transform: TOOLBAR_DRIFT, ease: "linear" },
            { start: 60, end: 72, sourceRect: B1_SOURCE, frameRect: B1_FRAME, blur: 3 },
            { start: 72, end: 90, transform: B1_DRIFT, ease: "linear" },
            { start: 90, end: 102, transform: B2, blur: 3 },
            { start: 102, end: 165, transform: B2_DRIFT, ease: "linear" },
          ]}
        >
          <LaptopFrame name="Laptop" screenX={71} screenY={590} screenW={840}>
            <ScreenSwipe
              name="Swipe to bracket"
              at={60}
              frames={12}
              direction="from-bottom"
              maxSmear={0.008}
              dim={0.15}
              boxW={2880}
              boxH={1800}
              before={
                <ScrollShot
                  name="Tournament console"
                  src={consoleSrc}
                  imageW={2880}
                  imageH={3118}
                  windowH={1800}
                  maxScrollY={1318}
                  scrollMoves={[{ start: 0, end: 0, y: 0 }]}
                >
                  {/* Venue line blurred in place (hygiene): the same capture, blurred, inside a clip. */}
                  <SoftCopy
                    label="Venue blur"
                    src={consoleSrc}
                    imageW={2880}
                    imageH={3118}
                    region={VENUE}
                    blurPx={11}
                    tint={0}
                    tintColor={colors.night}
                  />
                  {/* Toolbar shot: the page left of the stats fades to its own flat night as the camera pushes, so the
                      frame edge never cuts the giant title or a chip. */}
                  <Interactive.Div
                    name="Page patch (title, chips)"
                    style={{
                      position: "absolute",
                      left: PAGE_PATCH.x,
                      top: PAGE_PATCH.y,
                      width: PAGE_PATCH.w,
                      height: PAGE_PATCH.h,
                      backgroundColor: colors.night,
                      opacity: interpolate(frame, [9, 15], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                      }),
                    }}
                  />
                  <Interactive.Div
                    name="Lower page patch"
                    style={{
                      position: "absolute",
                      left: LOWER_PATCH.x,
                      top: LOWER_PATCH.y,
                      width: LOWER_PATCH.w,
                      height: LOWER_PATCH.h,
                      backgroundColor: colors.night,
                      opacity: interpolate(frame, [9, 15], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                      }),
                    }}
                  />
                  {/* The stats row moves into the tile (below); in place it would sit far below the frame. */}
                  <Interactive.Div
                    name="Stats patch (in place)"
                    style={{
                      position: "absolute",
                      left: STATS_PATCH.x,
                      top: STATS_PATCH.y,
                      width: STATS_PATCH.w,
                      height: STATS_PATCH.h,
                      backgroundColor: colors.night,
                      opacity: interpolate(frame, [9, 15], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                      }),
                    }}
                  />
                  {/* Whole buttons only: the two left buttons dissolve into the bar's own flat lime during the push. */}
                  <Interactive.Div
                    name="Bar patch (Share, Umpires)"
                    style={{
                      position: "absolute",
                      left: BAR_PATCH.x,
                      top: BAR_PATCH.y,
                      width: BAR_PATCH.w,
                      height: BAR_PATCH.h,
                      backgroundColor: colors.lime,
                      opacity: interpolate(frame, [9, 15], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                      }),
                    }}
                  />
                  <Interactive.Div
                    name="Home patch"
                    style={{
                      position: "absolute",
                      left: HOME_PATCH.x,
                      top: HOME_PATCH.y,
                      width: HOME_PATCH.w,
                      height: HOME_PATCH.h,
                      backgroundColor: colors.night,
                      opacity: interpolate(frame, [24, 30], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                      }),
                    }}
                  />
                  {/* Rack focus 24–36: the neighbours go soft while the camera pushes in on `Auto-call: on`. */}
                  <SoftCopy
                    label="Bar neighbours (soft)"
                    src={consoleSrc}
                    imageW={2880}
                    imageH={3118}
                    region={BAR_SOFT}
                    blurPx={8}
                    tint={0}
                    tintColor={colors.night}
                    fills={[
                      { x: 1440, y: 130, w: 517, h: 120, color: colors.lime },
                      { x: 2212, y: 130, w: 234, h: 120, color: colors.lime },
                      { x: 1440, y: 90, w: 1440, h: 40, color: colors.lime },
                      { x: 1440, y: 250, w: 1440, h: 40, color: colors.lime },
                    ]}
                    opacity={interpolate(frame, [24, 36], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.bezier(0.83, 0, 0.17, 1),
                    })}
                  />
                  <Interactive.Div
                    name="Auto-call (sharp)"
                    style={{
                      position: "absolute",
                      left: AUTOCALL_CROP.x,
                      top: AUTOCALL_CROP.y,
                      width: AUTOCALL_CROP.w,
                      height: AUTOCALL_CROP.h,
                      overflow: "hidden",
                    }}
                  >
                    {consoleSrc ? (
                      <Img
                        name="Auto-call crop"
                        src={asset(consoleSrc)}
                        style={{
                          position: "absolute",
                          left: -AUTOCALL_CROP.x,
                          top: -AUTOCALL_CROP.y,
                          width: 2880,
                          height: 3118,
                          maxWidth: "none",
                        }}
                      />
                    ) : null}
                  </Interactive.Div>
                  {/* Soft console backdrop under the stats tile (in-screen: rides the push and leaves with the swipe). */}
                  <Interactive.Div
                    name="Console soft backdrop"
                    style={{
                      position: "absolute",
                      left: CONSOLE_SOFT_AT.x,
                      top: CONSOLE_SOFT_AT.y,
                      width: CONSOLE_SOFT_AT.w,
                      height: CONSOLE_SOFT_SOURCE.h * K_CONSOLE_SOFT,
                      overflow: "hidden",
                      maskImage:
                        "linear-gradient(180deg, transparent 0px, black 46px, black calc(100% - 91px), transparent 100%), linear-gradient(90deg, transparent 0px, black 23px, black calc(100% - 23px), transparent 100%)",
                      maskComposite: "intersect",
                      opacity: interpolate(frame, [15, 24], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                      }),
                      translate: interpolate(frame, [15, 24], ["0px 23px", "0px 0px"], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                      }),
                    }}
                  >
                    {consoleSrc ? (
                      <Img
                        name="Console lower page (soft)"
                        src={asset(consoleSrc)}
                        style={{
                          position: "absolute",
                          left: -CONSOLE_SOFT_SOURCE.x * K_CONSOLE_SOFT,
                          top: -CONSOLE_SOFT_SOURCE.y * K_CONSOLE_SOFT,
                          width: 2880 * K_CONSOLE_SOFT,
                          height: 3118 * K_CONSOLE_SOFT,
                          maxWidth: "none",
                          filter: "blur(8.6px)",
                        }}
                      />
                    ) : null}
                    <Interactive.Div
                      name="Console soft tint"
                      style={{ position: "absolute", inset: 0, backgroundColor: colors.night, opacity: 0.55 }}
                    />
                  </Interactive.Div>
                  {/* Swipe fill: soft court cards in the box the window crosses mid-swipe (never seen at rest). */}
                  <Interactive.Div
                    name="Console swipe fill"
                    style={{
                      position: "absolute",
                      left: CONSOLE_FILL_AT.x,
                      top: CONSOLE_FILL_AT.y,
                      width: 2880 - CONSOLE_FILL_AT.x,
                      height: CONSOLE_FILL_SOURCE.h * K_CONSOLE_FILL,
                      overflow: "hidden",
                      maskImage:
                        "linear-gradient(180deg, transparent 0px, black 60px, black calc(100% - 80px), transparent 100%), linear-gradient(90deg, transparent 0px, black 40px)",
                      maskComposite: "intersect",
                      opacity: interpolate(frame, [36, 42], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      }),
                    }}
                  >
                    {consoleSrc ? (
                      <Img
                        name="Console court cards (soft)"
                        src={asset(consoleSrc)}
                        style={{
                          position: "absolute",
                          left: -CONSOLE_FILL_SOURCE.x * K_CONSOLE_FILL,
                          top: -CONSOLE_FILL_SOURCE.y * K_CONSOLE_FILL,
                          width: 2880 * K_CONSOLE_FILL,
                          height: 3118 * K_CONSOLE_FILL,
                          maxWidth: "none",
                          filter: "blur(9px)",
                        }}
                      />
                    ) : null}
                    <Interactive.Div
                      name="Console fill tint"
                      style={{ position: "absolute", inset: 0, backgroundColor: colors.night, opacity: 0.55 }}
                    />
                  </Interactive.Div>
                  {/* Stats cut-out tile: the console's own stats row, right under the toolbar, centred on Auto-call. */}
                  <UiTile
                    name="Stats tile"
                    src={consoleSrc}
                    crop={STATS_CROP}
                    sourceW={2880}
                    sourceH={3118}
                    zoom={STATS_TILE_ZOOM}
                    radius={14}
                    borderWidth={1.5}
                    borderColor={colors.graphite}
                    shadow="0 16px 40px rgba(0, 0, 0, 0.55)"
                    style={{
                      left: STATS_TILE_AT.x,
                      top: STATS_TILE_AT.y,
                      opacity: interpolate(frame, [15, 24], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                      }),
                      translate: interpolate(frame, [15, 24], ["0px 23px", "0px 0px"], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                      }),
                    }}
                  />
                  <RoughRing
                    name="Ring Auto-call"
                    rect={{ x: 2222, y: 145, w: 213, h: 90 }}
                    at={45}
                    frames={9}
                    tone="ink"
                    strokeWidth={6 / K_RING}
                    padding={4 / K_RING}
                    spread={1.13}
                    spreadY={1.12}
                    seed={3}
                  />
                </ScrollShot>
              }
              after={
                <>
                  {/* The incoming box (night, clipped): the shifted bracket never shows outside it, so its page top
                      (nav, white court card, white standings) never streaks through the swipe. */}
                  <Interactive.Div
                    name="Bracket box"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: 2880,
                      height: 1800,
                      overflow: "hidden",
                      backgroundColor: colors.night,
                    }}
                  >
                    <Interactive.Div
                      name="Bracket (shifted)"
                      style={{
                        position: "absolute",
                        left: BRACKET_SHIFT.x,
                        top: BRACKET_SHIFT.y,
                        width: 2880,
                        height: 1800,
                      }}
                    >
                      <ScreenImage name="Bracket" src={bracketSrc} sourceW={2880} sourceH={1800} />
                      {/* Soft focus under the focal cards: an in-screen blurred copy (rides the camera and the swipe). */}
                      <SoftCopy
                        label="Bracket rows (soft)"
                        src={bracketSrc}
                        imageW={2880}
                        imageH={1800}
                        region={BRACKET_SOFT}
                        blurPx={BRACKET_BLUR}
                        tint={0.1}
                        tintColor={colors.night}
                        mask={`linear-gradient(180deg, transparent 0px, black ${BRACKET_SOFT_RAMP}px)`}
                      />
                      {/* Rack focus 90–102: the camera follows the winner, focus moves from QUARTERFINALS to SEMIFINALS. */}
                      <SoftCopy
                        label="QF column (soft)"
                        src={bracketSrc}
                        imageW={2880}
                        imageH={1800}
                        region={QF_COLUMN_SOFT}
                        blurPx={BRACKET_BLUR}
                        tint={0.2}
                        tintColor={colors.night}
                        opacity={interpolate(frame, [90, 102], [0, 1], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                          easing: Easing.bezier(0.83, 0, 0.17, 1),
                        })}
                      />
                      <SoftCopy
                        label="SF column (soft)"
                        src={bracketSrc}
                        imageW={2880}
                        imageH={1800}
                        region={SF_COLUMN_SOFT}
                        blurPx={BRACKET_BLUR}
                        tint={0.2}
                        tintColor={colors.night}
                        opacity={interpolate(frame, [90, 102], [1, 0], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                          easing: Easing.bezier(0.83, 0, 0.17, 1),
                        })}
                      />
                      <Interactive.Div
                        name="FINAL column patch"
                        style={{
                          position: "absolute",
                          left: FINAL_PATCH.x,
                          top: FINAL_PATCH.y,
                          width: FINAL_PATCH.w,
                          height: FINAL_PATCH.h,
                          backgroundColor: colors.night,
                        }}
                      />
                      <Interactive.Div
                        name="Score log patch"
                        style={{
                          position: "absolute",
                          left: SCORE_LOG_PATCH.x,
                          top: SCORE_LOG_PATCH.y,
                          width: SCORE_LOG_PATCH.w,
                          height: SCORE_LOG_PATCH.h,
                          backgroundColor: colors.night,
                        }}
                      />
                      <RoughBox
                        name="Box QF winner card"
                        rect={{ x: 120, y: 891, w: 420, h: 175 }}
                        at={81}
                        frames={12}
                        tone="lime"
                        strokeWidth={5 / K_QF}
                        padding={6 / K_QF}
                        seed={5}
                        style={{
                          opacity: interpolate(frame, [93, 105], [1, 0.35], {
                            extrapolateLeft: "clamp",
                            extrapolateRight: "clamp",
                            easing: Easing.bezier(0.83, 0, 0.17, 1),
                          }),
                        }}
                      />
                      <Connector
                        name="Connector QF to SF"
                        d="M 540.7 922.4 C 563.2 922.4 558.7 887.5 581.3 887.5"
                        at={90}
                        frames={15}
                        strokeWidth={5 / K_SF}
                        boxW={2880}
                        boxH={1800}
                      />
                      <RowFlash
                        name="Flash SF row"
                        rect={{ x: 576, y: 857, w: 420, h: 60 }}
                        at={102}
                        frames={12}
                        tone="lime"
                        radius={8}
                        outline={3 / K_SF}
                      />
                      <RoughBox
                        name="Box SF slot"
                        rect={{ x: 576, y: 790, w: 420, h: 175 }}
                        at={108}
                        frames={12}
                        tone="lime"
                        strokeWidth={5 / K_SF}
                        padding={10 / K_SF}
                        seed={9}
                      />
                    </Interactive.Div>
                  </Interactive.Div>
                </>
              }
            />
          </LaptopFrame>
        </CameraRig>
        {/* Band ends (craft #8): soft caps end the lime band inside x 36–1044 (full night at the frame edges), so no
            olive stub or hard screen edge shows under the side fades. Toolbar shot only. */}
        <Interactive.Div
          name="Band cap left"
          style={{
            position: "absolute",
            left: 0,
            top: 600,
            width: 84,
            height: 300,
            backgroundImage: `linear-gradient(90deg, ${colors.night} 0px, ${colors.night} 36px, transparent 84px)`,
            opacity: interpolate(frame, [12, 18, 60, 66], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: [Easing.bezier(0.16, 1, 0.3, 1), Easing.linear, Easing.bezier(0.7, 0, 0.84, 0)],
            }),
          }}
        />
        <Interactive.Div
          name="Band cap right"
          style={{
            position: "absolute",
            left: 996,
            top: 600,
            width: 84,
            height: 300,
            backgroundImage: `linear-gradient(90deg, transparent 0px, ${colors.night} 48px, ${colors.night} 84px)`,
            opacity: interpolate(frame, [12, 18, 60, 66], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: [Easing.bezier(0.16, 1, 0.3, 1), Easing.linear, Easing.bezier(0.7, 0, 0.84, 0)],
            }),
          }}
        />
        {/* The lid bezel's dark rule (y 574–604 at k 1.05, craft #8) merges into the night above the toolbar. */}
        <Interactive.Div
          name="Bezel cover"
          style={{
            position: "absolute",
            left: 0,
            top: 570,
            width: 1080,
            height: 48,
            backgroundImage: `linear-gradient(180deg, ${colors.night} 0px, ${colors.night} 34px, transparent 48px)`,
            opacity: interpolate(frame, [9, 15, 60, 66], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: [Easing.bezier(0.16, 1, 0.3, 1), Easing.linear, Easing.bezier(0.7, 0, 0.84, 0)],
            }),
          }}
        />
        <Cursor
          name="Cursor (hover only, never clicks)"
          path={[
            { at: 24, x: 880, y: 940 },
            { at: 33, x: TIP.x, y: TIP.y },
            { at: 57, x: TIP.x, y: TIP.y },
          ]}
          pressAt={[]}
          fadeIn={3}
          style={{
            opacity: interpolate(frame, [57, 63], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.7, 0, 0.84, 0),
            }),
          }}
        />
      </Stage>
      <ChaosChip name="Chip" sender={chipSender} text={chipText} enterAt={2} strikeAt={120} />
      <KineticText
        name="Headline line 1"
        from={21}
        durationInFrames={73}
        text={headline1}
        by="word"
        stagger={2}
        enter={9}
        style={{
          ...displayText({ size: 88, color: colors.fg }),
          position: "absolute",
          left: 72,
          top: 376,
          opacity: interpolate(frame, [88, 94], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.7, 0, 0.84, 0),
          }),
          translate: interpolate(frame, [88, 94], ["0px 0px", "0px -24px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.7, 0, 0.84, 0),
          }),
        }}
      />
      <KineticText
        name="Headline line 2"
        from={23}
        durationInFrames={71}
        text={headline2}
        by="word"
        stagger={2}
        enter={9}
        style={{
          ...displayText({ size: 88, color: colors.lime }),
          position: "absolute",
          left: 72,
          top: 457,
          opacity: interpolate(frame, [88, 94], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.7, 0, 0.84, 0),
          }),
          translate: interpolate(frame, [88, 94], ["0px 0px", "0px -24px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.7, 0, 0.84, 0),
          }),
        }}
      />
      <KineticText
        name="Headline 2 line 1"
        from={94}
        text={secondLine1}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.fg }), position: "absolute", left: 72, top: 376 }}
      />
      <KineticText
        name="Headline 2 line 2"
        from={96}
        text={secondLine2}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.lime }), position: "absolute", left: 72, top: 457 }}
      />
    </>
  );
};

const tournamentSceneSchema = {
  chipSender: { type: "string", default: "BE", description: "Chip initials" },
  chipText: { type: "string", default: "Where's the bracket?", description: "Chip message (quotes a hook bubble)" },
  headline1: { type: "string", default: "TOURNAMENT?", description: "Headline 1 line 1" },
  headline2: { type: "string", default: "AUTO-CALL ON.", description: "Headline 1 line 2 (lime)" },
  secondLine1: { type: "string", default: "WINNERS", description: "Headline 2 line 1" },
  secondLine2: { type: "string", default: "MOVE UP.", description: "Headline 2 line 2 (lime)" },
  consoleSrc: {
    type: "asset",
    assetType: "image",
    default: "rallyo/screens/desktop/host-tournament-console-davao-fall-classic-full.png",
    description: "Console (tall)",
  },
  bracketSrc: { type: "asset", assetType: "image", default: "rallyo/screens/desktop/demo-tournament-bracket-mhi.png", description: "Bracket" },
} as const satisfies InteractivitySchema;

export const TournamentScene = Interactive.create({
  Component: TournamentSceneInner,
  layout: "absolute-fill",
  schema: tournamentSceneSchema,
});
