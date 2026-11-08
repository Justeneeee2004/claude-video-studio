import { measureText } from "@remotion/layout-utils";
import type React from "react";
import { Easing, Interactive, interpolate, useCurrentFrame, type InteractivitySchema } from "remotion";
import { RALLYO_COLORS, RALLYO_FONTS, rallyoFontsLoaded, useRallyoFontsReady, type RallyoColors } from "../theme/rallyo";

/**
 * ChapterRail: the lime chapter pill after the ChapterWipe hand-off (rail 01 abs 273–1020, rail 02 abs
 * 1053–1542, round 4). Top-level overlay, outside the TransitionSeries, timed with `from` / `durationInFrames` on the
 * instance; every frame prop here is LOCAL (local 0 = the hand-off frame).
 *
 * Geometry (brief 5.1): pill x 72 … 72 + railW, y railTop … railTop + 66, radius 33. Label in the chapter card's
 * face so the fly-to-rail hand-off matches glyph for glyph: Archivo 900 italic uppercase, stretch 70%, 44 px,
 * tracking 0, night ink, from x 100. Each space-separated token ("01", "·", "HOSTS") is set in its own 44 px
 * line-height-1 box at railTop + 11, x = 100 + the measured width of the prefix before it (`railLabelLayout`).
 * ChapterWipe lands its flying type on the very same numbers, so 272 → 273 (1052 → 1053) does not jump.
 *
 * Width: the pill uses `railW` (the composition passes the asserted timeline rect, 424 / 394, and ChapterWipe
 * collapses to the same value). After useRallyoFontsReady() the natural width 28 + label + (24 + dots) + 30 is
 * measured with measureText: > 480 throws; a mismatch with `railW` over 2 px warns once (the label or dot count
 * changed without the timeline).
 *
 * Dots: 14 px, 10 px gap (158 px for 7), right-aligned 30 px in. Unfilled = night ring 25% (fades in over local
 * 0–3, so the hand-off frame matches ChapterWipe, which draws no rings); filled = night, pops .6 → 1 over 6 f
 * (EASE.pop spring, perceptual) at each `dotsAt`.
 *
 * Backing tray (draft v2 plate, DEFECTS #6; draft v3 feathered, accuracy #5 / craft #8): the rail sits on live UI rows
 * in S3–S10, so a bare lime pill read like a sticker on the screenshot, and the v2 hard-edged plate (10 px, 80%) still
 * let half-covered glyphs and button edges peek out crisp beside it. `RailPlate` now sets the pill in a FEATHERED
 * tray (6 px backdrop blur, full strength to 10 px past the pill, then a 24 px feather to 0), so whatever UI meets
 * the rail sinks into a deliberate soft area instead of being cut by an edge. Draft v4 (v3 craft #4 / accuracy #6):
 * the tray ADAPTS to the UI under it. v3 laid a normal 70% night fill, which turned white or paper UI into a grey
 * capsule (white → ≈ 85; still ≈ 180 / 205 at the composition's .3 / .2). The tint is now night in soft-light blend
 * (dark UI and blurred glyphs sink toward night, white stays white, paper loses ≈ 6 levels), floored at night with a
 * lighten layer (the night stage stays untouched), and the pill gets a tight shadow (2 px down, 6 px blur, 40%) that
 * gives it a crisp edge on paper. `plateOpacity` (the composition's per-frame strength) scales the tint as (p / .7)².
 * This is the global safety net; scenes still frame the rail onto empty card space where they can.
 * ChapterWipe fades the same tray in under its collapsing panel (local 36–44), so the 272 → 273 (1052 → 1053)
 * hand-off shows no pop; the rail draws it at full from its local 0. The label boxes never move: rail text is
 * pixel-identical to v1 / v2.
 *
 * Exit (from `fadeOutAt`, −1 = never; draft v2, DEFECTS #8): pill and tray RETRACT into their left caps over 5 f
 * (clip from the right, round ends kept, cubic in; the tray fades with the share still shown). Every pixel is either solid
 * rail or scene, so the card text the S10 zoom pushes under it never double-exposes with a half-transparent label
 * (the v1 cross-fade did, at 1172–1176). Draft v4 (v3 accuracy #10): the label and dots fade out on the opaque pill
 * over the first 3 f of the exit, before the clip edge reaches them, so no frame shows a sliced `02 · PL`; rail 02
 * exits 1536–1542 (round 4).
 * Props never use from / to / name / style / width / height.
 */

/** Rail geometry (brief 5.1), shared with ChapterWipe. */
export const RAIL = {
  x: 72,
  h: 66,
  radius: 33,
  padLeft: 28,
  padRight: 30,
  dotsGap: 24,
  dot: 14,
  dotGap: 10,
  fontSize: 44,
  maxW: 480,
} as const;

/** Top of the 44 px line-height-1 label box inside the 66 px pill (= a 66 px line box). */
export const RAIL_LABEL_INSET = (RAIL.h - RAIL.fontSize) / 2;

/**
 * Backing tray behind the rail (draft v3 geometry: full strength `pad` px past the pill, then feathered to 0 over
 * `feather` px; the UI under it blurred `blur` px). `opacity` is the default tray strength (the `plateOpacity` prop:
 * 0 = the v1 bare pill, .7 = full tint). Draft v4 (v3 craft #4 / accuracy #6) makes the tint LUMINANCE-ADAPTIVE; see
 * RailPlate. `shadow` is the tight pill shadow (y offset, blur, night alpha) that keeps the pill's edge crisp on paper.
 */
export const RAIL_PLATE = { pad: 10, feather: 24, blur: 6, opacity: 0.7, shadow: { y: 2, blur: 6, alpha: 0.4 } } as const;

/** #RRGGBB + alpha → #RRGGBBAA (other colour syntaxes pass through unchanged). */
const withAlpha = (color: string, a: number): string =>
  /^#[0-9a-f]{6}$/i.test(color)
    ? `${color}${Math.round(Math.min(1, Math.max(0, a)) * 255)
        .toString(16)
        .padStart(2, "0")}`
    : color;

/** Feather profile: alpha at distance `d` from the spine, smoothstep from 1 at `inner` to 0 at `inner + feather`. */
const FEATHER_T = [0, 0.15, 0.5, 0.85, 1] as const;
const featherProfile = (inner: number, feather: number): { d: number; a: number }[] =>
  FEATHER_T.map((t) => ({ d: inner + t * feather, a: 1 - t * t * (3 - 2 * t) }));
const black = (a: number): string => `rgba(0, 0, 0, ${a.toFixed(3)})`;

/**
 * Feathered CAPSULE mask for a box `w` x `h` (h = 2 × r): every point's alpha falls with its distance from the
 * capsule's spine (the horizontal segment between the two cap centres), full to `r − feather`, 0 at `r`. Three
 * adjacent layers (left cap radial, middle vertical linear, right cap radial; composite `add`), so the tray follows
 * the pill's round ends instead of reading as a soft rectangle. A box narrower than 2r (the last retract frames)
 * overlaps the caps, which `add` unions.
 */
const capsuleMask = (w: number, h: number, feather: number): { image: string; size: string; position: string } => {
  const r = h / 2;
  const profile = featherProfile(r - feather, feather);
  const radial = (cx: string) =>
    `radial-gradient(circle ${r}px at ${cx} 50%, ${profile.map((st) => `${black(st.a)} ${st.d.toFixed(1)}px`).join(", ")})`;
  const top = [...profile].reverse().map((st) => `${black(st.a)} ${(r - st.d).toFixed(1)}px`);
  const bottom = profile.map((st) => `${black(st.a)} ${(r + st.d).toFixed(1)}px`);
  const linear = `linear-gradient(to bottom, ${[...top, ...bottom].join(", ")})`;
  const midW = Math.max(0, w - 2 * r);
  const rightX = Math.max(0, w - r);
  return {
    image: `${radial(`${r}px`)}, ${linear}, ${radial("0px")}`,
    size: `${r}px ${h}px, ${midW}px ${h}px, ${r}px ${h}px`,
    position: `0px 0px, ${r}px 0px, ${rightX}px 0px`,
  };
};

type RailPlateProps = {
  readonly railW: number;
  readonly railTop: number;
  /** Night colour (#RRGGBB). */
  readonly color: string;
  /** 0–1 fade multiplier on the whole tray (ChapterWipe fades it in under its collapsing panel). */
  readonly strength: number;
  /** Px taken off the tray's right end (the rail exit retracts tray and pill together; 0 = none). */
  readonly retract?: number;
  /** Tray fill opacity (0 = no tray, the v1 bare pill). */
  readonly plateOpacity?: number;
};

/**
 * The feathered tray under a rail rect. Shared by ChapterRail and ChapterWipe (same pixels at the hand-off).
 * Three sibling boxes, `pad + feather` px past the pill on every side, all shaped by the same capsule feather mask
 * (solid around the pill, soft at the rim), plus a tight pill shadow:
 * 1. Frost: backdrop blur only (no fill), so whatever UI meets the rail sinks into a soft area at its own brightness.
 * 2. Tint: night with mix-blend-mode soft-light at (`plateOpacity` / .7)². Soft-light darkens by (1 − 2·night)·B·(1 − B):
 *    white and paper stay (paper .93 → .87 at full strength, white unchanged), mid tones (blurred glyphs) and dark
 *    UI sink toward night. Draft v3 used a NORMAL 70% night fill, which turned white UI into a grey (≈ 85) capsule:
 *    the halo of v3 craft #4 / accuracy #6; at the composition's .3 / .2 it was still ≈ 180 / 205 on white.
 * 3. Floor: night with mix-blend-mode lighten (max(B, night)), so the tint never digs below the stage's own night:
 *    on the night stage the tray stays invisible, as in v3.
 * 4. Pill shadow: a pill-shaped night box under the pill (`RAIL_PLATE.shadow`, 2 px down, 6 px blur, 40%), which
 *    reads only on light UI and gives the lime pill a crisp edge on paper instead of a wide grey smudge.
 * The blend layers are siblings (never wrapped in a box with opacity / mask / filter, which would isolate them from
 * the scene). On a retract every box narrows from the right (its right feather moves with the pill's retracting end)
 * and fades with the share still shown.
 */
export const RailPlate: React.FC<RailPlateProps> = ({ railW, railTop, color, strength, retract = 0, plateOpacity = RAIL_PLATE.opacity }) => {
  if (strength <= 0 || plateOpacity <= 0) {
    return null;
  }
  const out = RAIL_PLATE.pad + RAIL_PLATE.feather;
  const w = railW + 2 * out;
  const shown = Math.max(0, 1 - retract / railW);
  if (shown <= 0) {
    return null;
  }
  const boxW = Math.max(0, w - retract);
  const boxH = RAIL.h + 2 * out;
  const mask = capsuleMask(boxW, boxH, RAIL_PLATE.feather);
  // Squared, so the composition's light-UI strengths (.3 / .2 → .18 / .08) barely touch mid-grey (veiled) paper.
  const tint = Math.min(1, plateOpacity / RAIL_PLATE.opacity) ** 2;
  // Retract by narrowing the boxes, not by clip-path: Chrome does not clip a backdrop-filter with clip-path, so a
  // clipped tray left a blurred "ghost" capsule at full width (draft v2 test stills 1172-1174).
  const box = {
    position: "absolute",
    left: RAIL.x - out,
    top: railTop - out,
    width: boxW,
    height: boxH,
    pointerEvents: "none",
    maskImage: mask.image,
    WebkitMaskImage: mask.image,
    maskSize: mask.size,
    WebkitMaskSize: mask.size,
    maskPosition: mask.position,
    WebkitMaskPosition: mask.position,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  } as const;
  const sh = RAIL_PLATE.shadow;
  return (
    <>
      <Interactive.Div
        name="Rail tray frost"
        style={{
          ...box,
          backdropFilter: `blur(${RAIL_PLATE.blur}px)`,
          WebkitBackdropFilter: `blur(${RAIL_PLATE.blur}px)`,
          opacity: strength * shown,
        }}
      />
      <Interactive.Div
        name="Rail tray tint"
        style={{ ...box, backgroundColor: color, mixBlendMode: "soft-light", opacity: strength * shown * tint }}
      />
      <Interactive.Div name="Rail tray floor" style={{ ...box, backgroundColor: color, mixBlendMode: "lighten", opacity: strength * shown }} />
      <Interactive.Div
        name="Rail pill shadow"
        style={{
          position: "absolute",
          left: RAIL.x,
          top: railTop,
          width: Math.max(0, railW - retract),
          height: RAIL.h,
          borderRadius: RAIL.radius,
          pointerEvents: "none",
          backgroundColor: color,
          boxShadow: `0px ${sh.y}px ${sh.blur}px ${withAlpha(color, sh.alpha)}`,
          opacity: strength * shown,
        }}
      />
    </>
  );
};

/**
 * Width of `text` in the display face (Archivo 900 italic, stretch 70%, uppercase, tracking 0) at `fontSize`.
 * Measured with measureText once the Rallyo faces are loaded (measureText caches, so never before); before that
 * an estimate that is never captured (useRallyoFontsReady holds the frame until the faces load).
 */
export const measureDisplay = (text: string, fontSize: number): number => {
  if (!text) {
    return 0;
  }
  if (typeof document !== "undefined" && rallyoFontsLoaded()) {
    return measureText({
      text,
      fontFamily: RALLYO_FONTS.display,
      fontSize,
      fontWeight: 900,
      textTransform: "uppercase",
      additionalStyles: { fontStyle: "italic", fontStretch: "70%" },
      validateFontIsLoaded: true,
    }).width;
  }
  return Array.from(text).length * fontSize * 0.4;
};

export type DisplayToken = {
  readonly text: string;
  /** Left edge relative to the line start, px (= the measured prefix, trailing space included). */
  readonly x: number;
  /** Token width, px. */
  readonly w: number;
};

/** Space-separated tokens of one display line with their measured x offsets at `fontSize`. */
export const displayTokens = (line: string, fontSize: number): DisplayToken[] => {
  const words = line.split(" ").filter((w) => w.length > 0);
  return words.map((text, i) => ({
    text,
    x: i === 0 ? 0 : measureDisplay(`${words.slice(0, i).join(" ")} `, fontSize),
    w: measureDisplay(text, fontSize),
  }));
};

export type RailLabelLayout = {
  /** Canvas x of the label start (72 + 28 = 100). */
  readonly left: number;
  /** Canvas y of the 44 px label boxes (railTop + 11). */
  readonly top: number;
  /** Tokens with x relative to `left`. */
  readonly tokens: DisplayToken[];
  /** Measured label width, px. */
  readonly labelW: number;
};

/** Where the rail sets each label token, in canvas px. ChapterRail and ChapterWipe both use this. */
export const railLabelLayout = (label: string, railTop: number): RailLabelLayout => ({
  left: RAIL.x + RAIL.padLeft,
  top: railTop + RAIL_LABEL_INSET,
  tokens: displayTokens(label, RAIL.fontSize),
  labelW: measureDisplay(label, RAIL.fontSize),
});

/** 28 + label + (24 + dots) + 30 (brief 5.1); no dot gap without dots. */
export const railNaturalWidth = (labelW: number, dotCount: number): number =>
  RAIL.padLeft +
  labelW +
  (dotCount > 0 ? RAIL.dotsGap + dotCount * RAIL.dot + (dotCount - 1) * RAIL.dotGap : 0) +
  RAIL.padRight;

const warned = new Set<string>();

type ChapterRailProps = {
  /** Rail label, e.g. "01 · HOSTS". */
  readonly label?: string;
  /** Pill width, px (≤ 480). */
  readonly railW?: number;
  /** Pill top, px (1170; fallback band 1100, open item e). */
  readonly railTop?: number;
  /** Local frames at which each progress dot fills (one dot per entry; [] = no dots). */
  readonly dotsAt?: readonly number[];
  /** Local frame the rail starts its 6 f exit (retract + plate fade); -1 = none (unmounts with its Sequence). */
  readonly fadeOutAt?: number;
  /** Night tray fill opacity (0 = the v1 bare pill). */
  readonly plateOpacity?: number;
  readonly colors?: RallyoColors;
};

const ChapterRailInner: React.FC<ChapterRailProps> = ({
  label = "01 · HOSTS",
  railW = 424,
  railTop = 1170,
  dotsAt = [],
  fadeOutAt = -1,
  plateOpacity = RAIL_PLATE.opacity,
  colors = RALLYO_COLORS,
}) => {
  const frame = useCurrentFrame();
  const ready = useRallyoFontsReady();
  const layout = railLabelLayout(label, railTop);
  if (ready) {
    const natural = railNaturalWidth(layout.labelW, dotsAt.length);
    if (natural > RAIL.maxW) {
      throw new Error(`ChapterRail "${label}": natural width ${natural.toFixed(1)} px > ${RAIL.maxW} (brief 5.1)`);
    }
    const key = `${label}|${dotsAt.length}|${railW}`;
    if (Math.abs(natural - railW) > 2 && !warned.has(key)) {
      warned.add(key);
      console.warn(`ChapterRail "${label}": measured width ${natural.toFixed(1)} px vs railW ${railW} (update the timeline rect)`);
    }
  }
  const dotsW = dotsAt.length > 0 ? dotsAt.length * RAIL.dot + (dotsAt.length - 1) * RAIL.dotGap : 0;
  const dotsLeft = railW - RAIL.padRight - dotsW;
  // Exit: px clipped off the right end of the pill AND its plate (0 → railW over 5 f, cubic in: 99 / 94 / 78 / 49 / 0%
  // shown on local 1–5, so the last frame of the 6 f window is clean); none without a fadeOutAt.
  const retract =
    fadeOutAt >= 0
      ? interpolate(frame, [fadeOutAt, fadeOutAt + 5], [0, railW], {
          easing: Easing.in(Easing.cubic),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;
  // Exit content (draft v4, v3 accuracy #10): the label and dots fade out over the first 3 f of the exit, so the
  // retracting clip never slices a glyph (v3 showed `02 · PL` at 1173-1175, round 4 1540). The clip edge is still
  // right of the label end (x 100 + labelW) and of the last dot on local +2 (shown 94%) and +3 (78%), where the
  // content is already gone; the pill alone finishes the retract.
  const content =
    fadeOutAt >= 0
      ? interpolate(frame, [fadeOutAt, fadeOutAt + 3], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : 1;

  return (
    <>
      <RailPlate
        railW={railW}
        railTop={railTop}
        color={colors.night}
        plateOpacity={plateOpacity}
        strength={1}
        retract={retract}
      />
      <div
        style={{
          position: "absolute",
          left: RAIL.x,
          top: railTop,
          width: railW,
          height: RAIL.h,
          borderRadius: RAIL.radius,
          backgroundColor: colors.lime,
          clipPath: `inset(0px ${retract}px 0px 0px round ${RAIL.radius}px)`,
          opacity: retract >= railW ? 0 : 1,
        }}
      >
        {layout.tokens.map((tok, i) => (
          <div
            key={`label-${i}-${tok.text}`}
            style={{
              position: "absolute",
              left: RAIL.padLeft + tok.x,
              top: RAIL_LABEL_INSET,
              fontFamily: RALLYO_FONTS.display,
              fontWeight: 900,
              fontStyle: "italic",
              fontStretch: "70%",
              textTransform: "uppercase",
              letterSpacing: 0,
              fontSize: 44,
              lineHeight: 1,
              whiteSpace: "pre",
              color: colors.night,
              opacity: content,
            }}
          >
            {tok.text}
          </div>
        ))}
        {dotsAt.map((at, i) => (
          <div
            key={`dot-${i}-${at}`}
            style={{
              position: "absolute",
              left: dotsLeft + i * (RAIL.dot + RAIL.dotGap),
              top: (RAIL.h - RAIL.dot) / 2,
              width: RAIL.dot,
              height: RAIL.dot,
              opacity: content,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                boxSizing: "border-box",
                border: `2px solid ${colors.night}40`,
                opacity: interpolate(frame, [0, 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                backgroundColor: colors.night,
                opacity: frame >= at ? 1 : 0,
                scale: interpolate(frame, [at, at + 6], [0.6, 1], {
                  easing: Easing.spring({ damping: 14, stiffness: 160 }),
                  output: "perceptual-scale",
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
};

const chapterRailSchema = {
  label: { type: "string", default: "01 · HOSTS", description: "Rail label" },
  railW: { type: "number", default: 424, min: 200, max: 480, step: 1, integer: true, description: "Rail width (px)", hiddenFromList: false },
  railTop: { type: "number", default: 1170, min: 1100, max: 1170, step: 70, integer: true, description: "Rail top (px)", hiddenFromList: false },
  fadeOutAt: { type: "number", default: -1, min: -1, max: 900, step: 3, integer: true, description: "Exit start (local f, -1 = none)", hiddenFromList: false },
  plateOpacity: { type: "number", default: 0.7, min: 0, max: 1, step: 0.02, description: "Backing tray opacity", hiddenFromList: false },
} as const satisfies InteractivitySchema;

export const ChapterRail = Interactive.create({
  Component: ChapterRailInner,
  layout: "absolute-fill",
  schema: chapterRailSchema,
});
