import type React from "react";
import { useId } from "react";
import { Easing, Img, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { Highlighter, RoughBox } from "../../elements/Annotate";
import { CameraRig, rectToTransform, type CameraMove, type CameraTransform } from "../../elements/CameraRig";
import { KineticText } from "../../elements/KineticText";
import { PhoneFrame, phonePlacement } from "../../elements/PhoneFrame";
import { TapRipple } from "../../elements/Pointer";
import { ScreenImage, ScreenSwipe } from "../../elements/ScreenMedia";
import { Stage } from "../../layers/Stage";
import { asset } from "../../lib/assets";
import { displayText, RALLYO_COLORS, uiText, type RallyoColors } from "../../theme/rallyo";

/**
 * S10c · Player ID: "NO APP. NO PASSWORD." + "Player ID in about 20 seconds." (abs 1200–1335, 135 f). Players spec
 * section 4 S10c. Local frame = abs − 1200. In: `wipe` from-left. Out: `whip` at local 120 (the drifts keep running
 * under it, so no frame freezes).
 *
 * Draft v5 (craft #2 / #5 / #6, accuracy #7): the proof lines are framed as large as the phone's width allows, the
 * lower stage is the sheets' own paper (no dark page under them), and the chooser dims with the tap.
 *
 * Rig 1 · the chooser (`id-chooser.png`, sourceH 912, window = file px), local 0–51
 * - 0      Opening framing (the v4 one, under the wipe): source x 40–1130, y 80–860 → frame x 92–890, y 590–1161
 *          (k .732).
 * - 0–15   Camera push (EASE.inOut, 3 motion-blur samples) to the `Create a Player ID` card: the line "Name, email and
 *          level. Takes about 20 seconds." (ink x 114–1014, y 743–777) → frame x 80–908, y 1066–1098 (k .92; final
 *          fix for v5 REVIEW #1, which found k .94 at x 54 cut both cards at x 0). Both cards' left border (file x 48)
 *          sits at x ≈ 19 (≈ 15 after the drift), so their rounded left corners are inside the frame under the side
 *          fade; the UI text starts at x ≥ 76 and the target line ends at x ≤ 910 (highlight band ≤ 915). `Takes about
 *          20 seconds.` ≈ 19.3 px x-height (21 su; v5 19.7, v4 15). In frame: the dark `I already have a Player ID`
 *          card (617–870) and the white card (916–1166); the sheet's `PLAYER ID` title and close button leave above
 *          the stage clip (the close button's bottom border, row 206, is at y ≈ 572 under the clip's top fade when
 *          the push lands). The sheet's right screen edge (x ≈ 1052) stays under the stage's right side fade, as in
 *          v5. 15–57 hold drift 1% about the tap (linear; ≤ .86% before the rig is gone at 51).
 * - 24–36  lime-tint Highlighter behind `Takes about 20 seconds.` (source x 549–1014, y 743–777 → frame ≈ x 480–908,
 *          y 1066–1098), 9 f after the push lands.
 * - 42 / 45 finger dot, then TapRipple on the white card at (600, 998) (v5 REVIEW #2): on the card's empty paper to
 *          the right of the `Create a Player ID` title (ink x 79–483, cap centre y ≈ 1006), so neither the 36 px dot
 *          (980–1016) nor the ring (radius ≈ 50 by 48, when the sheet takes over) touches a glyph; the ring stays above
 *          the `Takes about…` highlight (top ≈ 1062). The whole white card presses .97 about the tap over 45–51 (a
 *          same-pixel crop, x 10–1160, y 559–861, whose blank-paper margin is wider than the press travel on every
 *          side; it carries its own copy of the highlight).
 * - 42–48  the chooser's UI dims to 55% night (linear, with the finger dot; v5 REVIEW #3: it is fully dim when the
 *          sheet starts at 48). The dim is in-screen over chooser rows 0–950, feathered 855–950 across the top of the
 *          paper foot, whose own tint takes over, so the lower stage keeps its level and no light seam opens under the
 *          dimmed card. 48–51 the whole chooser rig (ripple included) dissolves on the sheet's own curve (EASE.out):
 *          ≈ 10% at 49 and ≈ 3% at 50, so no chooser text reads through the arriving sheet and no dimmed card band
 *          shows above it.
 *
 * Rig 2 · the sheet (`id-almost-in.png` → swipe → `id-card-games.png`), local 48–135
 * - 48–60  fade (48–51, EASE.out: the sheet is ≈ 90% opaque by 49, while the chooser under it is ≈ 10%, so nothing
 *          ghosts through) + 120 px rise (48–60, EASE.out), clipped to y ≥ 608 in its own space (the S5 v3 rig).
 *          Camera: page x 66–1104, y 2253–2859 (the consent row down to the sheet's end) → frame x 73–966, y 620–1141
 *          (k .86: the note line's full width inside the stage's clear area). The page is lifted inside the screen
 *          (window y = page y − 2170, a translate, because `ScreenImage` clamps cropY at 327), so its framed block sits
 *          where the card's framed block sits (window ≈ 83–689 vs 18–718) and the swipe stays a clean horizontal
 *          slide. In frame: the consent row (620–756), the `Join and create my Player ID` button (808–941, never
 *          tapped) and "No password, no app. We email you a code to open your ID anywhere." (1000–1081).
 *          60–81 hold drift 1% about the highlight (235, 1016). Integration: the frame sits 22 px right of
 *          the polish pass's x 51, so `No password, no app.` (ink and highlight band) starts at x ≥ 67 after the drift (the safe box is x 65–918).
 * - 69–78  lime-tint Highlighter behind `No password, no app.` (page x 66–444, y 2695–2732 → frame x 73–398,
 *          y 1000–1032), 9 f after the rise lands: ≈ 17 px x-height (v4 14). Mid-rise (49) the note's last line
 *          bottoms at ≈ 1159, above the rail pill.
 * - 81–93  ScreenSwipe from-right to the Player ID card; the clip opens 608 → 570. Camera to card source x 30–1140,
 *          y 18–718 → frame x 46–934, y 590–1150 (k .80; the card's full width fills the stage's clear area).
 *          93–135 hold drift 2% about the rating box (169, 1040), linear (1.3% by 120).
 * - 102–111 lime RoughBox (6 px stroke, 14 px padding) round `4.84` / `RATING` (ink x 89–278, y 506–656 → frame
 *          ≈ x 93–244, y 980–1100; `RATING` cap ≈ 18 px, v4 17). Not the spec's RoughRing: no ellipse fits that block
 *          between the card border and `45—11` (x 320) without crossing the `R` of `RATING`, and a callout never strikes
 *          what it celebrates. `CHECK-IN 7314` stays in frame (ends x ≈ 886), not boxed.
 *
 * Lower stage (TARGET: device imagery to ≈ 1450, rows y 1250–1600 mean luma > 30; v5 ≈ 66–67 on every hold frame,
 * v4 23 in the sheet phases):
 * - The Stage keeps the default 1290 / 1590 (.85) scrim for the whole scene.
 * - Both sheets are bottom sheets: in the app their paper runs to the screen's bottom. Each served file ends below its
 *   last line (chooser row 912, almost-in page 2859), so the sheet's own paper (#EEEFE8, the files' blank rows)
 *   carries on under it inside the same screen, as S10b's receipt paper does: a night tint deepening from the sheet's
 *   last blank rows (0) through .48 at 1250 to .64 at 1440, then a mask fade to night by 1500. No page sits under
 *   the sheets any more, so no hero glyph ghosts under the paper (craft #5); nothing in it is UI or text.
 * - Card phase: soft focus from source row 716, right under the card's bottom border (frame ≥ 1148; v4 started at 728
 *   with a 24 su feather, which left the hero glyph tops sharp at 1150–1160), with the v3 "Card soft tint" (night .88
 *   to row 908, then .30 by 978), blurred σ 20 canvas px (v4 12: the hero's `WHO'S GOT NEXT?` letterforms read through,
 *   craft #5), so the hero band, `Add background photo` and `Your games` run to ≈ 1450 as soft shapes.
 *
 * Player ID card (craft #16): the card's lighter vertical court band (x 549–716, (26, 38, 22)) is toned to the panel
 * (17, 27, 20) with a per-channel table remap that leaves every brighter pixel alone, so `2025`, `98%` and `SHOW-UP`
 * (which cross the band) keep their exact pixels. The court hairlines stay. The email is masked in the file; host names
 * and prices in `Your games` are blurred in the file and also sit in the soft focus.
 *
 * - 6 / 8 / 10 / 12 headline words → landed 21 · 16 … 26 support words → landed 35 (until 120 = abs 1320).
 */

type PlayersIdSceneProps = {
  /** `NO APP.` (fg). */
  readonly headline1?: string;
  /** `NO PASSWORD.` (lime). */
  readonly headline2?: string;
  /** `Player ID in about 20 seconds.` */
  readonly support?: string;
  /** players/id-chooser.png (1170x912). */
  readonly chooserSrc?: string;
  /** players/id-almost-in.png (1170x2859). */
  readonly almostInSrc?: string;
  /** players/id-card-games.png (1170x2609). */
  readonly cardSrc?: string;
  /**
   * mobile/home.png (props.screens.mobileHome). Draft v5: no longer drawn (the sheets' own paper carries the lower
   * stage); kept so the composition's props stay valid.
   */
  readonly pageSrc?: string;
  readonly colors?: RallyoColors;
};

const PHONE = phonePlacement(131, 600, 720);

/** Uniform push `p` of an existing framing about canvas point (cx, cy). */
const pushFraming = (t: CameraTransform, p: number, cx: number, cy: number): CameraTransform => ({
  scale: t.scale * p,
  translateX: p * t.translateX + (1 - p) * cx,
  translateY: p * t.translateY + (1 - p) * cy,
});

/** The sheets' blank paper (sampled from both files' empty rows). */
const SHEET_PAPER = "#EEEFE8";

// ---------------------------------------------------------------------------------------------
// Rig 1 · chooser
// ---------------------------------------------------------------------------------------------

/** Opening framing (v4), held through the wipe's arrival. */
const CHOOSER_SOURCE = { x: 40, y: 80, w: 1090, h: 780 };
const CHOOSER_FRAME = { x: 92, y: 590, w: 798, h: 571 };
/** `Name, email and level. Takes about 20 seconds.` ink in the chooser file. */
const CHOOSER_LINE = { x: 114, y: 743, w: 900, h: 34 };
/**
 * Final fix (v5 REVIEW #1): the line framed at k .92, x 80–908, foot at y 1098. Both cards' left border (file x 48,
 * 66 su left of the ink) lands at x ≈ 19 (≈ 15 after the drift), so each card keeps its rounded left corners inside
 * the frame (v5 k .94 at x 54 cut both at x 0), and the UI text starts at x ≥ 76. The sheet's left screen edge stays
 * off-canvas (x ≈ −25); its right screen edge sits at x ≈ 1052–1055, under the stage's right side fade as in v5.
 * The foot is 12 px higher than v5's 1110 so the close button's bottom border (file row 206) stays under the stage
 * clip's top fade (y ≈ 572 at local 15, clipped once the drift runs); the white card ends at y ≈ 1166.
 */
const CHOOSER_LINE_FRAME = { x: 80, y: 1066, w: 828, h: 32 };
const K_CHOOSER = 0.92;
const CHOOSER_TIGHT = rectToTransform(CHOOSER_LINE, CHOOSER_LINE_FRAME, PHONE, "width");
/** `Takes about 20 seconds.` in the chooser file. */
const CHOOSER_HIGHLIGHT = { x: 549, y: 743, w: 465, h: 34 };
/**
 * Tap point (canvas, v5 REVIEW #2): on the white card's empty paper to the right of the `Create a Player ID` title
 * (ink ends x ≈ 483, cap centre y ≈ 1006), 117 px clear of it. The 36 px dot (980–1016) and the ripple ring
 * (radius ≈ 50 at 48, when the sheet covers it) touch no glyph: the card top is y ≈ 916 and the `Takes about…`
 * highlighter top y ≈ 1062.
 */
const TAP = { x: 600, y: 998 };
/** The tap in chooser file px (the drift is about the tap, so the finger stays on this pixel): ≈ (679, 669). */
const TAP_SRC = {
  x: CHOOSER_LINE.x + (TAP.x - CHOOSER_LINE_FRAME.x) / K_CHOOSER,
  y: CHOOSER_LINE.y + CHOOSER_LINE.h / 2 + (TAP.y - (CHOOSER_LINE_FRAME.y + CHOOSER_LINE_FRAME.h / 2)) / K_CHOOSER,
};
/**
 * The white `Create a Player ID` card (x 48–1121, y 579–851) plus a blank-paper margin wider than the .97 press
 * travel about the tap (20 su left / 14 su right, 3.3 su top / 5.8 su bottom). It stops at row 861, above the paper
 * foot (862), so the press never shows a notch or a second border line.
 */
const CREATE_CARD_TILE = { x: 10, y: 559, w: 1150, h: 302 };
/**
 * The tap dim covers chooser rows 0 → 950, feathered over 855–950 (the card's border is row 851): the feather crosses
 * the paper foot's own tint ramp (0 at row 862 → .48 at canvas 1250, row ≈ 942), so the combined night stays ≈ .45–.55
 * from the card down and no light seam opens under the dimmed card (the v5 feather ended at 905, a bright band at
 * y ≈ 1195–1215 once the dim is full).
 */
const CHOOSER_DIM_FROM = 855;
const CHOOSER_DIM_TO = 950;
const CHOOSER_MOVES: readonly CameraMove[] = [
  { start: 0, end: 0, sourceRect: CHOOSER_SOURCE, frameRect: CHOOSER_FRAME },
  { start: 0, end: 15, sourceRect: CHOOSER_LINE, frameRect: CHOOSER_LINE_FRAME, fit: "width", blur: 3 },
  { start: 15, end: 57, transform: pushFraming(CHOOSER_TIGHT, 1.01, TAP.x, TAP.y), ease: "linear" },
];
/** Canvas y of chooser row `r` under the tight framing (before the drift). */
const chooserY = (r: number): number => CHOOSER_LINE_FRAME.y + CHOOSER_LINE_FRAME.h / 2 + (r - (CHOOSER_LINE.y + CHOOSER_LINE.h / 2)) * K_CHOOSER;

// ---------------------------------------------------------------------------------------------
// Rig 2 · almost-in sheet → Player ID card
// ---------------------------------------------------------------------------------------------

/**
 * Window y = page y − ALMOST_SHIFT. The sheet is lifted inside the screen so its framed block (page 2253–2859) sits at
 * window y 83–689, where the card's framed block also sits (file y 18–718): the 81–93 camera move is then a slight
 * zoom and the swipe stays a clean horizontal slide (with the spec's cropY 327 the outgoing sheet would rush ≈ 1400 px
 * down the screen during the swipe). Below the sheet the screen holds the sheet's paper foot, so no bezel reaches the
 * stage.
 */
const ALMOST_SHIFT = 2170;
const ALMOST_PAGE_H = 2859;
/** Consent row top (page 2253) to the sheet's end; x = the note line's ink (66–1104). */
const ALMOST_SOURCE = { x: 66, y: 2253 - ALMOST_SHIFT, w: 1038, h: ALMOST_PAGE_H - 2253 };
/** Draft v5 integration: x 73 (was 51), so the highlighted target starts inside the safe box (x ≥ 65) after the drift. */
const ALMOST_FRAME = { x: 73, y: 620, w: 893, h: 521 };
/** Almost-in camera k (width fit of ALMOST_SOURCE in ALMOST_FRAME). */
const K_ALMOST = 893 / 1038;
/** `No password, no app.` (page x 66–444, y 2695–2732) in window px. */
const ALMOST_HIGHLIGHT = { x: 66, y: 2695 - ALMOST_SHIFT, w: 378, h: 37 };
/** Canvas y of almost-in page row `p` at rest. */
const almostY = (p: number): number => ALMOST_FRAME.y + (p - 2253) * K_ALMOST;

const CARD_SOURCE = { x: 30, y: 18, w: 1110, h: 700 };
const CARD_FRAME = { x: 46, y: 590, w: 888, h: 560 };
const K_CARD = 0.8;

const SHEET_MOVES: readonly CameraMove[] = [
  { start: 0, end: 0, sourceRect: ALMOST_SOURCE, frameRect: ALMOST_FRAME, fit: "width" },
  {
    start: 60,
    end: 81,
    transform: pushFraming(rectToTransform(ALMOST_SOURCE, ALMOST_FRAME, PHONE, "width"), 1.01, 235, 1016),
    ease: "linear",
  },
  { start: 81, end: 93, sourceRect: CARD_SOURCE, frameRect: CARD_FRAME },
  { start: 93, end: 135, transform: pushFraming(rectToTransform(CARD_SOURCE, CARD_FRAME, PHONE), 1.02, 169, 1040), ease: "linear" },
];

/** Page under the Player ID card (site hero, `Add background photo`, `Your games`): soft from file row 716 (under the border). */
const CARD_SOFT_Y = 716;
/** `4.84` (x 89–278, y 506–614) + `RATING` (x 89–218, y 620–656) on the card: the ink block the box goes round. */
const RATING_RECT = { x: 89, y: 506, w: 189, h: 150 };
/** The card's lighter vertical court band (x 549–716, y 21–713). */
const CARD_BAND = { x: 549, y: 21, w: 168, h: 693 };

/**
 * Per-channel remap for the band: values ≤ panel stay, panel…band → panel, band…80 ramps back to identity, brighter
 * pixels (all text) are untouched. 256 entries, so every 8-bit input maps exactly.
 */
const bandTable = (panel: number, band: number, top = 80): string =>
  Array.from({ length: 256 }, (_, v) => {
    const o = v <= panel ? v : v <= band ? panel : v <= top ? panel + ((v - band) * (top - panel)) / (top - band) : v;
    return (o / 255).toFixed(4);
  }).join(" ");
const BAND_TABLE_R = bandTable(17, 26);
const BAND_TABLE_G = bandTable(27, 38);
const BAND_TABLE_B = bandTable(20, 22);

// ---------------------------------------------------------------------------------------------
// Paper foot under each sheet (the sheet's own paper carried on, deepening to night)
// ---------------------------------------------------------------------------------------------

/** Night tint over the paper foot, in canvas y (after the sheet's last blank rows, which start at alpha 0). */
const FOOT_TINT: readonly (readonly [number, number])[] = [
  [1250, 0.48],
  [1440, 0.64],
];
/** The foot fades out (mask) over canvas 1440 → 1500, into the Stage scrim and the night. */
const FOOT_FADE_FROM_Y = 1440;
const FOOT_FADE_TO_Y = 1500;

/** Rig 1: the foot starts on the paper 11 su under the white card's border (row 862, canvas ≈ 1176). */
const CHOOSER_FOOT_TOP = 862;
/** Rig 2: the foot starts 16 su under `anywhere.` (page 2805, window 635, canvas ≈ 1095). */
const ALMOST_FOOT_PAGE = 2805;

type PaperFootProps = {
  readonly label: string;
  /** Window y of the foot's top (su): a blank paper row of the sheet. */
  readonly boxTop: number;
  /** Canvas y of that row with the camera at rest. */
  readonly canvasTop: number;
  /** Camera k at rest (canvas px per su). */
  readonly k: number;
  readonly paper: string;
};

/** su offset from the foot's top for canvas y `y`. */
const footSu = (y: number, canvasTop: number, k: number): number => Math.max(0, (y - canvasTop) / k);

const PaperFoot: React.FC<PaperFootProps> = ({ label, boxTop, canvasTop, k, paper }) => {
  const boxH = footSu(FOOT_FADE_TO_Y, canvasTop, k) + 40;
  const stops = [
    "rgba(11, 19, 13, 0) 0px",
    ...FOOT_TINT.map(([y, a]) => `rgba(11, 19, 13, ${a}) ${footSu(y, canvasTop, k).toFixed(1)}px`),
    `rgba(11, 19, 13, ${FOOT_TINT[FOOT_TINT.length - 1][1]}) 100%`,
  ].join(", ");
  return (
    <Interactive.Div
      name={label}
      style={{
        position: "absolute",
        left: 0,
        top: boxTop,
        width: 1170,
        height: boxH,
        backgroundColor: paper,
        backgroundImage: `linear-gradient(180deg, ${stops})`,
        maskImage: `linear-gradient(180deg, black 0px, black ${footSu(FOOT_FADE_FROM_Y, canvasTop, k).toFixed(1)}px, transparent ${footSu(FOOT_FADE_TO_Y, canvasTop, k).toFixed(1)}px)`,
      }}
    />
  );
};

const PlayersIdSceneInner: React.FC<PlayersIdSceneProps> = ({
  headline1 = "NO APP.",
  headline2 = "NO PASSWORD.",
  support = "Player ID in about 20 seconds.",
  chooserSrc = "rallyo/screens/players/id-chooser.png",
  almostInSrc = "rallyo/screens/players/id-almost-in.png",
  cardSrc = "rallyo/screens/players/id-card-games.png",
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  const rawId = useId();
  const bandFilterId = `id-card-band-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundColor: colors.night }} />
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id={bandFilterId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="table" tableValues={BAND_TABLE_R} />
              <feFuncG type="table" tableValues={BAND_TABLE_G} />
              <feFuncB type="table" tableValues={BAND_TABLE_B} />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <Stage name="Stage" clipTop={570} color={colors.night}>
        {/* Rig 1: the chooser (push 0–15), highlight, tap + press; dims with the finger dot (42–48), then dissolves
            under the sheet on the sheet's own curve (48–51), so no chooser text reads through it (v5 REVIEW #3). */}
        {frame < 51 ? (
          <Interactive.Div
            name="Chooser rig"
            style={{
              position: "absolute",
              inset: 0,
              opacity: interpolate(frame, [48, 51], [1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            <CameraRig name="Chooser camera" screen={PHONE} moves={CHOOSER_MOVES}>
              <PhoneFrame name="Chooser phone" screenX={131} screenY={600} screenW={720} island={false}>
                <ScreenImage name="Player ID chooser" src={chooserSrc} sourceH={912} />
                <PaperFoot
                  label="Chooser paper foot"
                  boxTop={CHOOSER_FOOT_TOP}
                  canvasTop={chooserY(CHOOSER_FOOT_TOP)}
                  k={K_CHOOSER}
                  paper={SHEET_PAPER}
                />
                <Highlighter
                  name="Highlight takes about 20 seconds"
                  rect={CHOOSER_HIGHLIGHT}
                  at={24}
                  frames={12}
                  tone="tint"
                  seed={7}
                />
                {frame >= 44 && frame < 51 ? (
                  <Interactive.Div
                    name="Create card press"
                    style={{
                      position: "absolute",
                      left: CREATE_CARD_TILE.x,
                      top: CREATE_CARD_TILE.y,
                      width: CREATE_CARD_TILE.w,
                      height: CREATE_CARD_TILE.h,
                      overflow: "hidden",
                      backgroundColor: colors.paper,
                      transformOrigin: `${(TAP_SRC.x - CREATE_CARD_TILE.x).toFixed(1)}px ${(TAP_SRC.y - CREATE_CARD_TILE.y).toFixed(1)}px`,
                      scale: interpolate(frame, [45, 48, 51], [1, 0.97, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                        output: "perceptual-scale",
                      }),
                    }}
                  >
                    {chooserSrc ? (
                      <Img
                        name="Create card (same pixels)"
                        src={asset(chooserSrc)}
                        style={{
                          position: "absolute",
                          left: -CREATE_CARD_TILE.x,
                          top: -CREATE_CARD_TILE.y,
                          width: 1170,
                          height: 912,
                          maxWidth: "none",
                        }}
                      />
                    ) : null}
                    <Highlighter
                      name="Highlight copy (press)"
                      rect={{
                        x: CHOOSER_HIGHLIGHT.x - CREATE_CARD_TILE.x,
                        y: CHOOSER_HIGHLIGHT.y - CREATE_CARD_TILE.y,
                        w: CHOOSER_HIGHLIGHT.w,
                        h: CHOOSER_HIGHLIGHT.h,
                      }}
                      at={24}
                      frames={12}
                      tone="tint"
                      seed={7}
                    />
                  </Interactive.Div>
                ) : null}
                {/* In-screen dim over the sheet's UI: it feathers out across the top of the paper foot (whose own tint
                    takes over), so the lower stage keeps its level and no light seam shows under the dimmed card. */}
                <Interactive.Div
                  name="Chooser dim"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 1170,
                    height: CHOOSER_DIM_TO,
                    backgroundColor: colors.night,
                    maskImage: `linear-gradient(180deg, black 0px, black ${CHOOSER_DIM_FROM}px, transparent ${CHOOSER_DIM_TO}px)`,
                    opacity: interpolate(frame, [42, 48], [0, 0.55], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                  }}
                />
              </PhoneFrame>
            </CameraRig>
            <TapRipple name="Tap Create a Player ID" x={TAP.x} y={TAP.y} at={45} dotLead={3} />
          </Interactive.Div>
        ) : null}
        {/* Rig 2: the almost-in sheet (fade + 120 px rise, clipped to y ≥ 608), then the swipe to the Player ID card. */}
        {frame >= 48 ? (
          <Interactive.Div
            name="Sheet rig"
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `inset(${interpolate(frame, [81, 93], [608, 570], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.65, 0, 0.35, 1),
              })}px 0px 0px 0px)`,
              opacity: interpolate(frame, [48, 51], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [48, 60], ["0px 120px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            <CameraRig name="Sheet camera" screen={PHONE} moves={SHEET_MOVES}>
              <PhoneFrame name="Sheet phone" screenX={131} screenY={600} screenW={720} island={false}>
                <ScreenSwipe
                  name="Swipe to Player ID card"
                  at={81}
                  frames={12}
                  direction="from-right"
                  before={
                    <>
                      <ScreenImage
                        name="You're almost in sheet"
                        src={almostInSrc}
                        sourceH={ALMOST_PAGE_H}
                        style={{ translate: `0px ${-ALMOST_SHIFT}px` }}
                      />
                      <PaperFoot
                        label="Sheet paper foot"
                        boxTop={ALMOST_FOOT_PAGE - ALMOST_SHIFT}
                        canvasTop={almostY(ALMOST_FOOT_PAGE)}
                        k={K_ALMOST}
                        paper={SHEET_PAPER}
                      />
                      <Highlighter
                        name="Highlight no password, no app"
                        rect={ALMOST_HIGHLIGHT}
                        at={69}
                        frames={9}
                        tone="tint"
                        seed={9}
                      />
                    </>
                  }
                  after={
                    <>
                      <ScreenImage name="Player ID card" src={cardSrc} sourceH={2609} boxH={2532} />
                      {cardSrc ? (
                        <Interactive.Div
                          name="Card court band (toned)"
                          style={{
                            position: "absolute",
                            left: CARD_BAND.x,
                            top: CARD_BAND.y,
                            width: CARD_BAND.w,
                            height: CARD_BAND.h,
                            overflow: "hidden",
                          }}
                        >
                          <Img
                            name="Card band (remapped)"
                            src={asset(cardSrc)}
                            style={{
                              position: "absolute",
                              left: -CARD_BAND.x,
                              top: -CARD_BAND.y,
                              width: 1170,
                              height: 2609,
                              maxWidth: "none",
                              filter: `url(#${bandFilterId})`,
                            }}
                          />
                        </Interactive.Div>
                      ) : null}
                      <Interactive.Div
                        name="Card page soft focus"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: CARD_SOFT_Y,
                          width: 1170,
                          height: 2532 - CARD_SOFT_Y,
                          overflow: "hidden",
                        }}
                      >
                        {cardSrc ? (
                          <Img
                            name="Card page (soft)"
                            src={asset(cardSrc)}
                            style={{
                              position: "absolute",
                              left: 0,
                              top: -CARD_SOFT_Y,
                              width: 1170,
                              height: 2609,
                              maxWidth: "none",
                              filter: `blur(${(20 / K_CARD).toFixed(2)}px)`,
                            }}
                          />
                        ) : null}
                        <Interactive.Div
                          name="Card soft tint"
                          style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage:
                              "linear-gradient(180deg, rgba(5, 9, 6, 0.88) 0px, rgba(5, 9, 6, 0.88) 192px, rgba(5, 9, 6, 0.3) 262px, rgba(5, 9, 6, 0.3) 100%)",
                          }}
                        />
                      </Interactive.Div>
                      <RoughBox
                        name="Box rating"
                        rect={RATING_RECT}
                        at={102}
                        frames={9}
                        tone="lime"
                        strokeWidth={6 / K_CARD}
                        padding={14 / K_CARD}
                        seed={4}
                      />
                    </>
                  }
                />
              </PhoneFrame>
            </CameraRig>
          </Interactive.Div>
        ) : null}
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
        from={10}
        text={headline2}
        by="word"
        stagger={2}
        enter={9}
        style={{ ...displayText({ size: 88, color: colors.lime }), position: "absolute", left: 72, top: 377 }}
      />
      <KineticText
        name="Support"
        from={16}
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

const playersIdSceneSchema = {
  headline1: { type: "string", default: "NO APP.", description: "Headline line 1" },
  headline2: { type: "string", default: "NO PASSWORD.", description: "Headline line 2 (lime)" },
  support: { type: "string", default: "Player ID in about 20 seconds.", description: "Support line" },
  chooserSrc: { type: "asset", assetType: "image", default: "rallyo/screens/players/id-chooser.png", description: "Player ID chooser" },
  almostInSrc: { type: "asset", assetType: "image", default: "rallyo/screens/players/id-almost-in.png", description: "Almost-in sheet" },
  cardSrc: { type: "asset", assetType: "image", default: "rallyo/screens/players/id-card-games.png", description: "Player ID card" },
  pageSrc: {
    type: "asset",
    assetType: "image",
    default: "rallyo/screens/mobile/home.png",
    description: "Page under the sheets (unused since draft v5)",
  },
} as const satisfies InteractivitySchema;

export const PlayersIdScene = Interactive.create({
  Component: PlayersIdSceneInner,
  layout: "absolute-fill",
  schema: playersIdSceneSchema,
});
